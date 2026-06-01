import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Đăng ký — BinhTrinhAcademy" },
      { name: "description", content: "Tạo tài khoản học viên BinhTrinhAcademy." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Mật khẩu cần ít nhất 6 ký tự");
      return;
    }
    setSubmitting(true);
    const redirectUrl = `${window.location.origin}/my-courses`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName, phone },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message || "Đăng ký thất bại");
      return;
    }
    toast.success("Đăng ký thành công! Vui lòng kiểm tra email xác nhận (nếu có).");
    navigate({ to: "/login" });
  };

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
        <h1 className="text-2xl font-semibold tracking-tight">Tạo tài khoản</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bắt đầu hành trình học kỹ năng thực chiến.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field label="Họ và tên" value={fullName} onChange={setFullName} required />
          <Field label="Số điện thoại" value={phone} onChange={setPhone} type="tel" />
          <Field label="Email" value={email} onChange={setEmail} type="email" required autoComplete="email" />
          <Field label="Mật khẩu" value={password} onChange={setPassword} type="password" required autoComplete="new-password" />
          <button
            type="submit"
            disabled={submitting}
            className="btn-glow h-11 w-full rounded-xl text-sm font-medium disabled:opacity-60"
          >
            {submitting ? "Đang tạo tài khoản…" : "Đăng ký"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-medium text-foreground hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </section>
  );
}

function Field({
  label, value, onChange, type = "text", required, autoComplete,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; autoComplete?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-brand"
      />
    </div>
  );
}
