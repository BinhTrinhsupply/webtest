import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listCourses, upsertCourse, deleteCourse } from "@/lib/admin-courses.functions";
import { Loader2, Trash2, Plus, Edit3 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/courses")({
  component: AdminCoursesPage,
});

type CourseRow = {
  id: string; slug: string; title: string; price: number; sale_price: number | null;
  is_published: boolean; category: string | null; short_description: string | null;
  long_description: string | null; thumbnail_url: string | null;
};

function AdminCoursesPage() {
  const fetchCourses = useServerFn(listCourses);
  const save = useServerFn(upsertCourse);
  const remove = useServerFn(deleteCourse);
  const { data, refetch, isLoading } = useQuery({ queryKey: ["admin-courses"], queryFn: () => fetchCourses() });

  const [editing, setEditing] = useState<Partial<CourseRow> | null>(null);

  const onSave = async () => {
    if (!editing) return;
    await save({
      data: {
        id: editing.id,
        slug: editing.slug ?? "",
        title: editing.title ?? "",
        short_description: editing.short_description ?? null,
        long_description: editing.long_description ?? null,
        category: editing.category ?? null,
        price: Number(editing.price ?? 0),
        sale_price: editing.sale_price != null ? Number(editing.sale_price) : null,
        thumbnail_url: editing.thumbnail_url ?? null,
        is_published: editing.is_published ?? true,
      },
    });
    setEditing(null);
    refetch();
  };

  const onDelete = async (id: string) => {
    if (!confirm("Xoá khóa học này? Tất cả chapter & lesson cũng sẽ bị xoá.")) return;
    await remove({ data: { id } });
    refetch();
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Quản lý Khóa học</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tạo / sửa / xoá khóa học. Nhấn Sửa để vào quản lý chương & bài học.</p>
        </div>
        <button
          onClick={() => setEditing({ slug: "", title: "", price: 0, is_published: true })}
          className="btn-glow inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Khóa học mới
        </button>
      </div>

      {isLoading && <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải…</div>}

      <div className="mt-8 grid gap-4">
        {(data?.courses ?? []).map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-semibold">{c.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${c.is_published ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {c.is_published ? "Đã xuất bản" : "Nháp"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                /{c.slug} · {Number(c.price).toLocaleString("vi-VN")}₫
                {c.sale_price != null && <> · Sale {Number(c.sale_price).toLocaleString("vi-VN")}₫</>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/admin/courses/$id" params={{ id: c.id }} className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-medium hover:bg-secondary">
                Chương & Bài học
              </Link>
              <button onClick={() => setEditing(c as CourseRow)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-medium hover:bg-secondary">
                <Edit3 className="h-3.5 w-3.5" /> Sửa
              </button>
              <button onClick={() => onDelete(c.id)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-destructive/30 px-3 text-xs font-medium text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5" /> Xoá
              </button>
            </div>
          </div>
        ))}
        {data?.courses.length === 0 && !isLoading && <p className="text-sm text-muted-foreground">Chưa có khóa học nào.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">{editing.id ? "Sửa khóa học" : "Thêm khóa học"}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Slug (URL)" value={editing.slug ?? ""} onChange={(v) => setEditing({ ...editing, slug: v })} />
              <Field label="Tiêu đề" value={editing.title ?? ""} onChange={(v) => setEditing({ ...editing, title: v })} />
              <Field label="Danh mục (vd: course, ebook, tool)" value={editing.category ?? ""} onChange={(v) => setEditing({ ...editing, category: v })} />
              <Field label="Ảnh thumbnail URL" value={editing.thumbnail_url ?? ""} onChange={(v) => setEditing({ ...editing, thumbnail_url: v })} />
              <Field label="Giá gốc (VNĐ)" type="number" value={String(editing.price ?? 0)} onChange={(v) => setEditing({ ...editing, price: Number(v) })} />
              <Field label="Giá sale (VNĐ — để trống nếu không)" type="number" value={editing.sale_price != null ? String(editing.sale_price) : ""} onChange={(v) => setEditing({ ...editing, sale_price: v === "" ? null : Number(v) })} />
              <div className="sm:col-span-2">
                <Field label="Mô tả ngắn" value={editing.short_description ?? ""} onChange={(v) => setEditing({ ...editing, short_description: v })} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Mô tả chi tiết</label>
                <textarea
                  rows={5}
                  value={editing.long_description ?? ""}
                  onChange={(e) => setEditing({ ...editing, long_description: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <label className="sm:col-span-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!editing.is_published} onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} />
                Đã xuất bản
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="h-10 rounded-xl border border-border px-5 text-sm">Huỷ</button>
              <button onClick={onSave} className="btn-glow h-10 rounded-xl px-5 text-sm font-medium">Lưu</button>
            </div>
          </div>
        </div>
      )}
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
