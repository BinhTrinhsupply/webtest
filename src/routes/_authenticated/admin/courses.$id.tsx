import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  getCourseTree, upsertChapter, deleteChapter,
  upsertLesson, deleteLesson,
} from "@/lib/admin-courses.functions";
import { ArrowLeft, Plus, Trash2, Edit3, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/courses/$id")({
  component: CourseEditorPage,
});

type Lesson = {
  id: string; chapter_id: string; title: string;
  content_type: "video" | "text" | "file";
  video_url: string | null; text_content: string | null; attachment_url: string | null;
  tags: string[]; order_index: number; is_preview: boolean;
};

function CourseEditorPage() {
  const { id } = Route.useParams();
  const fetchTree = useServerFn(getCourseTree);
  const saveChapter = useServerFn(upsertChapter);
  const removeChapter = useServerFn(deleteChapter);
  const saveLesson = useServerFn(upsertLesson);
  const removeLesson = useServerFn(deleteLesson);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["admin-course-tree", id],
    queryFn: () => fetchTree({ data: { id } }),
  });

  const [editingChapter, setEditingChapter] = useState<{ id?: string; title: string; order_index: number } | null>(null);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> & { chapter_id: string } | null>(null);

  const onSaveChapter = async () => {
    if (!editingChapter) return;
    await saveChapter({ data: { ...editingChapter, course_id: id } });
    setEditingChapter(null);
    refetch();
  };

  const onDelChapter = async (cid: string) => {
    if (!confirm("Xoá chương + tất cả bài học bên trong?")) return;
    await removeChapter({ data: { id: cid } });
    refetch();
  };

  const onSaveLesson = async () => {
    if (!editingLesson) return;
    await saveLesson({
      data: {
        id: editingLesson.id,
        chapter_id: editingLesson.chapter_id,
        title: editingLesson.title ?? "",
        content_type: (editingLesson.content_type ?? "video") as "video" | "text" | "file",
        video_url: editingLesson.video_url ?? null,
        text_content: editingLesson.text_content ?? null,
        attachment_url: editingLesson.attachment_url ?? null,
        tags: editingLesson.tags ?? [],
        order_index: editingLesson.order_index ?? 0,
        is_preview: editingLesson.is_preview ?? false,
      },
    });
    setEditingLesson(null);
    refetch();
  };

  const onDelLesson = async (lid: string) => {
    if (!confirm("Xoá bài học?")) return;
    await removeLesson({ data: { id: lid } });
    refetch();
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <Link to="/admin/courses" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Danh sách khóa học
      </Link>

      {isLoading && <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải…</div>}

      {data?.course && (
        <>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{data.course.title}</h1>
          <p className="text-sm text-muted-foreground">/{data.course.slug}</p>

          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Chương học</h2>
            <button
              onClick={() => setEditingChapter({ title: "", order_index: (data.chapters?.length ?? 0) + 1 })}
              className="btn-glow inline-flex h-9 items-center gap-2 rounded-lg px-4 text-xs font-medium"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm chương
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {(data.chapters ?? []).map((ch) => {
              const chapterLessons = (data.lessons ?? []).filter((l) => l.chapter_id === ch.id);
              return (
                <div key={ch.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold">{ch.order_index}. {ch.title}</h3>
                      <p className="text-xs text-muted-foreground">{chapterLessons.length} bài học</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingLesson({ chapter_id: ch.id, content_type: "video", order_index: chapterLessons.length + 1, is_preview: false, tags: [] })} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs hover:bg-secondary">
                        <Plus className="h-3 w-3" /> Bài học
                      </button>
                      <button onClick={() => setEditingChapter(ch)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs hover:bg-secondary">
                        <Edit3 className="h-3 w-3" /> Sửa
                      </button>
                      <button onClick={() => onDelChapter(ch.id)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-destructive/30 px-2.5 text-xs text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {chapterLessons.length > 0 && (
                    <ul className="mt-4 divide-y divide-border/60 rounded-lg border border-border/60">
                      {chapterLessons.map((l) => (
                        <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{l.order_index}.</span>
                              <span className="truncate text-sm font-medium">{l.title}</span>
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">{l.content_type}</span>
                              {l.is_preview && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] uppercase text-primary">Preview</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setEditingLesson(l as Lesson)} className="rounded-md p-1.5 hover:bg-secondary"><Edit3 className="h-3.5 w-3.5" /></button>
                            <button onClick={() => onDelLesson(l.id)} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
            {data.chapters?.length === 0 && <p className="text-sm text-muted-foreground">Chưa có chương nào.</p>}
          </div>
        </>
      )}

      {editingChapter && (
        <Modal onClose={() => setEditingChapter(null)} title={editingChapter.id ? "Sửa chương" : "Thêm chương"}>
          <Field label="Tiêu đề chương" value={editingChapter.title} onChange={(v) => setEditingChapter({ ...editingChapter, title: v })} />
          <Field label="Thứ tự" type="number" value={String(editingChapter.order_index)} onChange={(v) => setEditingChapter({ ...editingChapter, order_index: Number(v) })} />
          <ModalActions onCancel={() => setEditingChapter(null)} onSave={onSaveChapter} />
        </Modal>
      )}

      {editingLesson && (
        <Modal onClose={() => setEditingLesson(null)} title={editingLesson.id ? "Sửa bài học" : "Thêm bài học"}>
          <Field label="Tiêu đề bài học" value={editingLesson.title ?? ""} onChange={(v) => setEditingLesson({ ...editingLesson, title: v })} />
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Loại nội dung</span>
            <select
              value={editingLesson.content_type ?? "video"}
              onChange={(e) => setEditingLesson({ ...editingLesson, content_type: e.target.value as Lesson["content_type"] })}
              className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="video">Video (YouTube / Vimeo / Bunny iframe URL)</option>
              <option value="text">Bài viết</option>
              <option value="file">File đính kèm</option>
            </select>
          </label>
          {(editingLesson.content_type ?? "video") === "video" && (
            <Field label="Video URL (embed)" value={editingLesson.video_url ?? ""} onChange={(v) => setEditingLesson({ ...editingLesson, video_url: v })} />
          )}
          {editingLesson.content_type === "text" && (
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Nội dung văn bản</span>
              <textarea rows={6} value={editingLesson.text_content ?? ""} onChange={(e) => setEditingLesson({ ...editingLesson, text_content: e.target.value })} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </label>
          )}
          {editingLesson.content_type === "file" && (
            <Field label="URL file đính kèm" value={editingLesson.attachment_url ?? ""} onChange={(v) => setEditingLesson({ ...editingLesson, attachment_url: v })} />
          )}
          <Field label="Thẻ (tags, ngăn cách bằng dấu phẩy)" value={(editingLesson.tags ?? []).join(", ")} onChange={(v) => setEditingLesson({ ...editingLesson, tags: v.split(",").map((s) => s.trim()).filter(Boolean) })} />
          <Field label="Thứ tự" type="number" value={String(editingLesson.order_index ?? 0)} onChange={(v) => setEditingLesson({ ...editingLesson, order_index: Number(v) })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!editingLesson.is_preview} onChange={(e) => setEditingLesson({ ...editingLesson, is_preview: e.target.checked })} />
            Cho phép xem thử (preview public)
          </label>
          <ModalActions onCancel={() => setEditingLesson(null)} onSave={onSaveLesson} />
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button onClick={onCancel} className="h-10 rounded-xl border border-border px-5 text-sm">Huỷ</button>
      <button onClick={onSave} className="btn-glow h-10 rounded-xl px-5 text-sm font-medium">Lưu</button>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
    </label>
  );
}
