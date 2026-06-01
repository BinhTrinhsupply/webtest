import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listCoupons, upsertCoupon, deleteCoupon } from "@/lib/admin-coupons.functions";
import { Loader2, Plus, Trash2, Edit3 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  component: AdminCouponsPage,
});

type Coupon = {
  id?: string;
  code?: string;
  discount_type?: "percent" | "amount";
  discount_value?: number;
  expires_at?: string | null;
  is_active?: boolean;
  created_at?: string;
};

function AdminCouponsPage() {
  const fetchCoupons = useServerFn(listCoupons);
  const save = useServerFn(upsertCoupon);
  const remove = useServerFn(deleteCoupon);
  const { data, refetch, isLoading } = useQuery({ queryKey: ["admin-coupons"], queryFn: () => fetchCoupons() });

  const [editing, setEditing] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSave = async () => {
    if (!editing) return;
    setSaving(true); setErr(null);
    try {
      await save({
        data: {
          id: editing.id,
          code: (editing.code ?? "").trim(),
          discount_type: editing.discount_type ?? "percent",
          discount_value: Number(editing.discount_value ?? 0),
          expires_at: editing.expires_at || null,
          is_active: editing.is_active ?? true,
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
          <h1 className="text-3xl font-semibold tracking-tight">Mã giảm giá & Ưu đãi</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tạo mã coupon, thiết lập phần trăm giảm giá cho khóa học.</p>
        </div>
        <button
          onClick={() => setEditing({ code: "", discount_type: "percent", discount_value: 10, is_active: true })}
          className="btn-glow inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Tạo mã mới
        </button>
      </div>

      {isLoading && <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải…</div>}

      <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Mã</th>
              <th className="px-4 py-3 text-left">Loại</th>
              <th className="px-4 py-3 text-left">Giá trị</th>
              <th className="px-4 py-3 text-left">Hết hạn</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              <th className="px-4 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(data?.coupons ?? []).map((c) => (
              <tr key={c.id} className="hover:bg-secondary/20">
                <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                <td className="px-4 py-3">{c.discount_type === "percent" ? "Phần trăm" : "Số tiền"}</td>
                <td className="px-4 py-3">
                  {c.discount_type === "percent"
                    ? `${Number(c.discount_value)}%`
                    : `${Number(c.discount_value).toLocaleString("vi-VN")}₫`}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString("vi-VN") : "Không"}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${c.is_active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {c.is_active ? "Hoạt động" : "Tắt"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setEditing(c as Coupon)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs hover:bg-secondary">
                      <Edit3 className="h-3 w-3" /> Sửa
                    </button>
                    <button
                      onClick={async () => { if (confirm("Xoá mã này?")) { await remove({ data: { id: c.id } }); refetch(); } }}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-destructive/30 px-2.5 text-xs text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" /> Xoá
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data?.coupons.length === 0 && !isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">Chưa có mã nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">{editing.id ? "Sửa mã giảm giá" : "Tạo mã giảm giá"}</h2>
            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Tên mã (vd: WELCOME10)</span>
                <input
                  value={editing.code ?? ""}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm uppercase outline-none focus:border-primary"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Loại giảm giá</span>
                  <select
                    value={editing.discount_type ?? "percent"}
                    onChange={(e) => setEditing({ ...editing, discount_type: e.target.value as "percent" | "amount" })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  >
                    <option value="percent">Phần trăm (%)</option>
                    <option value="amount">Số tiền (VNĐ)</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Giá trị</span>
                  <input
                    type="number"
                    value={editing.discount_value ?? 0}
                    onChange={(e) => setEditing({ ...editing, discount_value: Number(e.target.value) })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Ngày hết hạn (để trống nếu không)</span>
                <input
                  type="date"
                  value={editing.expires_at ? editing.expires_at.slice(0, 10) : ""}
                  onChange={(e) => setEditing({ ...editing, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                Đang hoạt động
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
