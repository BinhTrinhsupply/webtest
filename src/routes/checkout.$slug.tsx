import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { getCheckoutData, createOrder } from "@/lib/checkout.functions";
import { supabase } from "@/integrations/supabase/client";
import { Check, Loader2 } from "lucide-react";

export const Route = createFileRoute("/checkout/$slug")({
  validateSearch: z.object({ bump: z.coerce.boolean().optional() }),
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: CheckoutPage,
});

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function CheckoutPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const fetchData = useServerFn(getCheckoutData);
  const submitOrder = useServerFn(createOrder);

  const { data, isLoading } = useQuery({
    queryKey: ["checkout", slug],
    queryFn: () => fetchData({ data: { slug } }),
  });

  const [includeBump, setIncludeBump] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: u }) => {
      if (u.user?.email) setForm((f) => ({ ...f, email: u.user!.email! }));
    });
  }, []);

  if (isLoading || !data) {
    return <div className="mx-auto max-w-2xl px-5 py-32 text-center text-muted-foreground">Đang tải…</div>;
  }

  const course = data.course;
  const bump = data.bump;
  const coursePrice = Number(course.sale_price ?? course.price);
  const bumpPrice = bump ? Number(bump.sale_price ?? bump.price) : 0;
  const total = coursePrice + (includeBump ? bumpPrice : 0);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const res = await submitOrder({
        data: {
          courseSlug: slug,
          includeBump,
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          customerEmail: form.email.trim(),
        },
      });
      navigate({ to: "/checkout/pay/$id", params: { id: res.orderId } });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
      setSubmitting(false);
    }
  };

  return (
    <article className="mx-auto max-w-5xl px-5 py-12 lg:py-20">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Trang chủ</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Thanh toán</span>
      </nav>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Hoàn tất đăng ký</h1>
      <p className="mt-2 text-sm text-muted-foreground">Kiểm tra thông tin và xác nhận để nhận hướng dẫn thanh toán.</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold">Thông tin học viên</h2>
            <div className="mt-4 grid gap-4">
              <Field label="Họ và tên" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
              <Field label="Số điện thoại" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
            </div>
          </div>

          {bump && (
            <label className="flex cursor-pointer items-start gap-4 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-5 transition hover:bg-primary/10">
              <input
                type="checkbox"
                checked={includeBump}
                onChange={(e) => setIncludeBump(e.target.checked)}
                className="mt-1 h-5 w-5 accent-primary"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">⚡ Thêm: {bump.title}</span>
                  <span className="text-sm font-semibold text-primary">+{formatVND(bumpPrice)}</span>
                </div>
                {bump.description && <p className="mt-1 text-xs text-muted-foreground">{bump.description}</p>}
                {bump.sale_price != null && (
                  <p className="mt-1 text-xs text-muted-foreground line-through">{formatVND(Number(bump.price))}</p>
                )}
              </div>
            </label>
          )}

          {err && <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{err}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-glow flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Tạo đơn — Thanh toán {formatVND(total)}
          </button>
        </form>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold">Đơn hàng</h3>
            <div className="mt-4 space-y-3 text-sm">
              <Row label={course.title} value={formatVND(coursePrice)} />
              {includeBump && bump && <Row label={bump.title} value={formatVND(bumpPrice)} />}
              <div className="my-3 border-t border-border" />
              <Row label={<span className="font-semibold">Tổng cộng</span>} value={<span className="text-lg font-semibold">{formatVND(total)}</span>} />
            </div>
            <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              Kích hoạt tự động ngay khi nhận được thanh toán
            </p>
          </div>
        </aside>
      </div>
    </article>
  );
}

function Field({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
