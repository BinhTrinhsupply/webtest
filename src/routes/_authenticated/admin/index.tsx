import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Users, Receipt, Settings, FileText, Ticket, Webhook } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Quản trị — BinhTrinhAcademy" }] }),
  component: AdminHome,
});

const items = [
  { to: "/admin/courses", title: "Quản lý Khóa học", desc: "Tạo/sửa khóa học, chương & bài học", Icon: BookOpen },
  { to: "/admin/students", title: "Quản lý Học viên", desc: "Cấp khóa, khoá tài khoản", Icon: Users },
  { to: "/admin/orders", title: "Đơn hàng & Doanh thu", desc: "Xác nhận đơn, xem doanh thu", Icon: Receipt },
  { to: "/admin/blog", title: "Quản lý Bài viết", desc: "Viết bài chia sẻ kiến thức khoa học, quản lý danh mục blog", Icon: FileText },
  { to: "/admin/coupons", title: "Mã giảm giá & Ưu đãi", desc: "Tạo mã coupon, thiết lập phần trăm giảm giá cho khóa học", Icon: Ticket },
  { to: "/admin/sepay-logs", title: "Lịch sử Webhook SePay", desc: "Xem & duyệt thủ công giao dịch chuyển khoản sai cú pháp", Icon: Webhook },
  { to: "/admin/settings", title: "Cấu hình SePay & Tracking", desc: "Ngân hàng, webhook, Pixel/GA", Icon: Settings },
] as const;


function AdminHome() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">BinhTrinhAcademy — quản trị viên</p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map(({ to, title, desc, Icon }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-[0_0_30px_-10px] hover:shadow-primary/40"
          >
            <Icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 text-base font-semibold group-hover:text-primary">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
