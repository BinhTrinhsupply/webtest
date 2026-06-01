import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getOrder } from "@/lib/checkout.functions";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Copy, Loader2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/checkout/pay/$id")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login", search: { redirect: location.href } });
  },
  component: PayPage,
});

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function PayPage() {
  const { id } = Route.useParams();
  const fetchOrder = useServerFn(getOrder);

  const { data } = useQuery({
    queryKey: ["order", id],
    queryFn: () => fetchOrder({ data: { id } }),
    refetchInterval: (q) => (q.state.data?.order.status === "completed" ? false : 3000),
  });

  if (!data) return <div className="mx-auto max-w-2xl px-5 py-32 text-center text-muted-foreground">Đang tải đơn hàng…</div>;

  const { order, items, settings, course } = data;
  const shortId = order.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const content = `DH${shortId}`;
  const amount = Number(order.total_amount);
  const bank = settings?.sepay_bank || "MBBank";
  const account = settings?.sepay_account_number || "";
  const name = settings?.sepay_account_name || "";

  const qrUrl = account
    ? `https://img.vietqr.io/image/${encodeURIComponent(bank)}-${encodeURIComponent(account)}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(name)}`
    : null;

  if (order.status === "completed") {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-9 w-9 text-primary" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Thanh toán thành công</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Đơn hàng <span className="font-mono">{content}</span> đã được kích hoạt. Email xác nhận đang được gửi đến bạn.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/my-courses" className="btn-glow inline-flex h-11 items-center rounded-xl px-6 text-sm font-medium">
            Vào học ngay
          </Link>
          {course && (
            <Link to="/product/$id" params={{ id: course.slug }} className="btn-outline-brand inline-flex h-11 items-center rounded-xl px-6 text-sm font-medium">
              Xem khóa học
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-4xl px-5 py-12 lg:py-20">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Trang chủ</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Thanh toán đơn {content}</span>
      </nav>

      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Quét QR để thanh toán</h1>
      <p className="mt-2 text-sm text-muted-foreground">Mở ứng dụng ngân hàng → Quét QR → Giữ nguyên nội dung chuyển khoản.</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          {qrUrl ? (
            <img src={qrUrl} alt="QR thanh toán" className="mx-auto w-full max-w-[280px] rounded-xl border border-border" />
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              Chưa cấu hình thông tin ngân hàng
            </div>
          )}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Đang chờ xác nhận thanh toán…
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold">Thông tin chuyển khoản</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <CopyRow label="Ngân hàng" value={bank} />
              <CopyRow label="Số tài khoản" value={account} />
              <CopyRow label="Chủ tài khoản" value={name} />
              <CopyRow label="Số tiền" value={formatVND(amount)} highlight />
              <CopyRow label="Nội dung CK" value={content} highlight />
            </dl>
            <p className="mt-5 rounded-lg bg-secondary/60 px-4 py-3 text-xs text-muted-foreground">
              ⚠️ Vui lòng <strong>giữ nguyên nội dung chuyển khoản</strong> để hệ thống tự động kích hoạt khóa học.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold">Chi tiết đơn hàng</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {items.map((it, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{it.title}</span>
                  <span>{formatVND(Number(it.amount))}</span>
                </li>
              ))}
              <li className="mt-3 flex justify-between gap-3 border-t border-border pt-3 font-semibold">
                <span>Tổng cộng</span>
                <span>{formatVND(amount)}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}

function CopyRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-2">
        <span className={highlight ? "font-mono text-base font-semibold" : "font-mono text-sm"}>{value}</span>
        <button onClick={copy} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Sao chép">
          <Copy className="h-3.5 w-3.5" />
        </button>
        {copied && <span className="text-xs text-primary">Đã chép</span>}
      </dd>
    </div>
  );
}
