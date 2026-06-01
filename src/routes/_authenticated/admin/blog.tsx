import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listBlogPosts, upsertBlogPost, deleteBlogPost } from "@/lib/admin-blog.functions";
import { Loader2, Plus, Edit3, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/blog")({
  component: AdminBlogPage,
});

type Post = {
  id?: string;
  slug?: string;
  title?: string;
  category?: string | null;
  thumbnail_url?: string | null;
  excerpt?: string | null;
  content?: string | null;
  is_published?: boolean;
  created_at?: string;
};

function AdminBlogPage() {
  const fetchPosts = useServerFn(listBlogPosts);
  const save = useServerFn(upsertBlogPost);
  const remove = useServerFn(deleteBlogPost);
  const { data, refetch, isLoading } = useQuery({ queryKey: ["admin-blog"], queryFn: () => fetchPosts() });
  const [editing, setEditing] = useState<Post | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSave = async () => {
    if (!editing) return;
    setSaving(true); setErr(null);
    try {
      await save({
        data: {
          id: editing.id,
          slug: (editing.slug ?? "").trim(),
          title: (editing.title ?? "").trim(),
          category: editing.category ?? null,
          thumbnail_url: editing.thumbnail_url ?? null,
          excerpt: editing.excerpt ?? null,
          content: editing.content ?? null,
          is_published: editing.is_published ?? true,
        },
      });
      setEditing(null);
      refetch();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Quản lý Bài viết</h1>
          <p className="mt-1 text-sm text-muted-foreground">Viết bài chia sẻ kiến thức khoa học, quản lý danh mục blog.</p>
        </div>
        <button
          onClick={() => setEditing({ slug: "", title: "", is_published: true })}
          className="btn-glow inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Thêm bài viết mới
        </button>
      </div>

      {isLoading && <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải…</div>}

      <div className="mt-8 grid gap-3">
        {(data?.posts ?? []).map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-semibold">{p.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${p.is_published ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {p.is_published ? "Xuất bản" : "Nháp"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">/{p.slug} · {p.category ?? "—"} · {new Date(p.created_at).toLocaleDateString("vi-VN")}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(p)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-medium hover:bg-secondary">
                <Edit3 className="h-3.5 w-3.5" /> Sửa
              </button>
              <button
                onClick={async () => { if (confirm("Xoá bài viết này?")) { await remove({ data: { id: p.id } }); refetch(); } }}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-destructive/30 px-3 text-xs font-medium text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> Xoá
              </button>
            </div>
          </div>
        ))}
        {data?.posts.length === 0 && !isLoading && <p className="text-sm text-muted-foreground">Chưa có bài viết nào.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">{editing.id ? "Sửa bài viết" : "Thêm bài viết mới"}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Tiêu đề" value={editing.title ?? ""} onChange={(v) => setEditing({ ...editing, title: v })} />
              <Field label="Slug (URL, vd: bai-viet-1)" value={editing.slug ?? ""} onChange={(v) => setEditing({ ...editing, slug: v })} />
              <Field label="Danh mục" value={editing.category ?? ""} onChange={(v) => setEditing({ ...editing, category: v })} />
              <Field label="Ảnh đại diện (URL)" value={editing.thumbnail_url ?? ""} onChange={(v) => setEditing({ ...editing, thumbnail_url: v })} />
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Tóm tắt ngắn</label>
                <textarea
                  rows={2}
                  value={editing.excerpt ?? ""}
                  onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Nội dung bài viết</label>
                <textarea
                  rows={10}
                  value={editing.content ?? ""}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <label className="sm:col-span-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!editing.is_published} onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} />
                Đã xuất bản
              </label>
            </div>
            {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="h-10 rounded-xl border border-border px-5 text-sm">Huỷ</button>
              <button disabled={saving} onClick={onSave} className="btn-glow h-10 rounded-xl px-5 text-sm font-medium disabled:opacity-60">
                {saving ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
    </label>
  );
}
