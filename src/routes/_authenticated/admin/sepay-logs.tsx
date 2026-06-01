import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listSepayLogs, approveSepayLog, listPendingOrdersBrief } from "@/lib/admin-sepay-logs.functions";
import { Loader2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/sepay-logs")({
  component: AdminSepayLogsPage,
});

function AdminSepayLogsPage() {
  const fetchLogs = useServerFn(listSepayLogs);
  const fetchOrders = useServerFn(listPendingOrdersBrief);
  const approve = useServerFn(approveSepayLog);

  const logsQ = useQuery({ queryKey: ["admin-sepay-logs"], queryFn: () => fetchLogs() });
  const ordersQ = useQuery({ queryKey: ["admin-orders-brief"], queryFn: () => fetchOrders() });

  const [pickFor, setPickFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fmt = (n: number) => Number(n || 0).toLocaleString("vi-VN") + "₫";

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Lịch sử Webhook SePay</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tất cả giao dịch SePay đổ về. Với giao dịch sai cú pháp, dùng nút <b>Kích hoạt bằng tay</b> để gán đơn và mở khóa học cho học viên.
      </p>

      {logsQ.isLoading && <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải…</div>}

      <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Thời gian</th>
              <th className="px-4 py-3 text-left">Mã GD</th>
              <th className="px-4 py-3 text-left">Số tiền</th>
              <th className="px-4 py-3 text-left">Nội dung</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              <th className="px-4 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(logsQ.data?.logs ?? []).map((l) => (
              <tr key={l.id} className="align-top hover:bg-secondary/20">
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("vi-VN")}</td>
                <td className="px-4 py-3 font-mono text-xs">{l.ref || "—"}</td>
                <td className="px-4 py-3 font-medium">{fmt(Number(l.amount))}</td>
                <td className="px-4 py-3 max-w-[280px] truncate text-xs" title={l.content ?? ""}>{l.content || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    l.status === "matched" || l.status === "approved" ? "bg-primary/15 text-primary" :
                    l.status === "pending" ? "bg-yellow-500/15 text-yellow-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {l.status === "pending" ? "Chờ xử lý" :
                     l.status === "matched" ? "Đã khớp" :
                     l.status === "approved" ? "Duyệt thủ công" :
                     l.status === "ignored" ? "Bỏ qua" : l.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {(l.status === "pending" || l.status === "ignored") && (
                      <button
                        onClick={() => setPickFor(l.id)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-primary/40 px-2.5 text-xs text-primary hover:bg-primary/10"
                      >
                        <CheckCircle2 className="h-3 w-3" /> Kích hoạt bằng tay
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {logsQ.data?.logs.length === 0 && !logsQ.isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">Chưa có giao dịch nào ghi nhận.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pickFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPickFor(null)}>
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Chọn đơn hàng để kích hoạt</h2>
            <p className="mt-1 text-xs text-muted-foreground">Chọn đơn tương ứng với giao dịch này. Hệ thống sẽ đánh dấu đơn hoàn thành và mở khóa học cho học viên.</p>
            <div className="mt-5 divide-y divide-border rounded-xl border border-border">
              {(ordersQ.data?.orders ?? []).map((o) => (
                <button
                  key={o.id}
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await approve({ data: { log_id: pickFor!, order_id: o.id } });
                      setPickFor(null);
                      logsQ.refetch();
                      ordersQ.refetch();
                    } catch (e) {
                      alert(e instanceof Error ? e.message : "Lỗi");
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-secondary/40 disabled:opacity-60"
                >
                  <div>
                    <div className="font-medium">{o.customer_name || "—"} · {o.customer_email || "—"}</div>
                    <div className="text-xs text-muted-foreground">#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString("vi-VN")} · {o.status}</div>
                  </div>
                  <div className="font-medium">{fmt(Number(o.total_amount))}</div>
                </button>
              ))}
              {ordersQ.data?.orders.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">Không có đơn nào.</p>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={() => setPickFor(null)} className="h-10 rounded-xl border border-border px-5 text-sm">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
