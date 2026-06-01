import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listOrders, setOrderStatus } from "@/lib/admin-orders.functions";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  const fetchOrders = useServerFn(listOrders);
  const updateStatus = useServerFn(setOrderStatus);
  const { data, refetch, isLoading } = useQuery({ queryKey: ["admin-orders"], queryFn: () => fetchOrders() });

  const stats = data?.stats;
  const fmt = (n: number) => n.toLocaleString("vi-VN") + "₫";

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Đơn hàng & Doanh thu</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Tổng đơn", value: stats?.total ?? 0 },
          { label: "Đang chờ", value: stats?.pending ?? 0 },
          { label: "Đã hoàn thành", value: stats?.completed ?? 0 },
          { label: "Doanh thu", value: fmt(stats?.revenue ?? 0) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {isLoading && <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải…</div>}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Khách hàng</th>
              <th className="px-4 py-3 text-left">Khóa học</th>
              <th className="px-4 py-3 text-left">Số tiền</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              <th className="px-4 py-3 text-left">Ngày tạo</th>
              <th className="px-4 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(data?.orders ?? []).map((o) => (
              <tr key={o.id} className="hover:bg-secondary/20">
                <td className="px-4 py-3">
                  <div className="font-medium">{o.customer_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{o.customer_email || "—"} · {o.customer_phone || "—"}</div>
                </td>
                <td className="px-4 py-3">{o.course_title}</td>
                <td className="px-4 py-3 font-medium">{fmt(Number(o.total_amount))}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    o.status === "completed" ? "bg-primary/15 text-primary" :
                    o.status === "pending" ? "bg-yellow-500/15 text-yellow-700" :
                    "bg-destructive/15 text-destructive"
                  }`}>{o.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("vi-VN")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {o.status !== "completed" && (
                      <button
                        onClick={async () => { await updateStatus({ data: { id: o.id, status: "completed" } }); refetch(); }}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-primary/40 px-2.5 text-xs text-primary hover:bg-primary/10"
                      ><CheckCircle2 className="h-3 w-3" /> Xác nhận</button>
                    )}
                    {o.status !== "cancelled" && (
                      <button
                        onClick={async () => { if (confirm("Huỷ đơn này?")) { await updateStatus({ data: { id: o.id, status: "cancelled" } }); refetch(); } }}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-destructive/30 px-2.5 text-xs text-destructive hover:bg-destructive/10"
                      ><XCircle className="h-3 w-3" /> Huỷ</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {data?.orders.length === 0 && !isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">Chưa có đơn hàng nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
