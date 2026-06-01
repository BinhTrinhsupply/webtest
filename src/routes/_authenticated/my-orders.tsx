import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft } from "lucide-react";

import { getMyOrders } from "@/lib/student.functions";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/my-orders")({
  head: () => ({ meta: [{ title: "Lịch sử mua — BinhTrinhAcademy" }] }),
  component: MyOrdersPage,
});

const statusLabel: Record<string, { text: string; cls: string }> = {
  pending: { text: "Chờ thanh toán", cls: "bg-amber-100 text-amber-800" },
  completed: { text: "Đã thanh toán", cls: "bg-emerald-100 text-emerald-700" },
  cancelled: { text: "Đã hủy", cls: "bg-zinc-100 text-zinc-700" },
  failed: { text: "Thất bại", cls: "bg-rose-100 text-rose-700" },
};

function MyOrdersPage() {
  const { user } = useAuth();
  const fetchOrders = useServerFn(getMyOrders);
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => fetchOrders(),
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-6 lg:px-8">
          <Link to="/my-courses" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold">Lịch sử mua hàng</h1>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Đang tải…</p>
        ) : !data?.orders.length ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Bạn chưa có đơn hàng nào.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Sản phẩm</th>
                  <th className="px-4 py-3 text-right">Số tiền</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Ngày</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.orders.map((o) => {
                  const st = statusLabel[o.status] ?? { text: o.status, cls: "bg-zinc-100" };
                  return (
                    <tr key={o.id}>
                      <td className="px-4 py-3 font-medium">{o.course?.title ?? "—"}</td>
                      <td className="px-4 py-3 text-right">{Number(o.total_amount).toLocaleString("vi-VN")}đ</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>
                          {st.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {o.status === "pending" ? (
                          <Link
                            to="/checkout/pay/$id"
                            params={{ id: o.id }}
                            className="text-sm font-semibold text-emerald-600 hover:underline"
                          >
                            Thanh toán →
                          </Link>
                        ) : o.status === "completed" && o.course ? (
                          <Link
                            to="/my-courses"
                            className="text-sm font-semibold text-emerald-600 hover:underline"
                          >
                            Vào học →
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
