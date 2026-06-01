import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getAdminSettings, updateAdminSettings } from "@/lib/admin-settings.functions";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettingsPage,
});

export default function AdminSettingsPage() {
  const fetchSettings = useServerFn(getAdminSettings);
  const save = useServerFn(updateAdminSettings);
  const { data, refetch } = useQuery({ queryKey: ["admin-settings"], queryFn: () => fetchSettings() });
  const [form, setForm] = useState({
    sepay_bank: "", sepay_account_number: "", sepay_account_name: "",
    sepay_webhook_secret: "", facebook_pixel_id: "", google_analytics_id: "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (data?.settings) {
      const s = data.settings;
      setForm({
        sepay_bank: s.sepay_bank ?? "",
        sepay_account_number: s.sepay_account_number ?? "",
        sepay_account_name: s.sepay_account_name ?? "",
        sepay_webhook_secret: s.sepay_webhook_secret ?? "",
        facebook_pixel_id: s.facebook_pixel_id ?? "",
        google_analytics_id: s.google_analytics_id ?? "",
      });
    }
  }, [data]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving"); setErr(null);
    try {
      await save({ data: {
        sepay_bank: form.sepay_bank || null,
        sepay_account_number: form.sepay_account_number || null,
        sepay_account_name: form.sepay_account_name || null,
        sepay_webhook_secret: form.sepay_webhook_secret,
        facebook_pixel_id: form.facebook_pixel_id || null,
        google_analytics_id: form.google_analytics_id || null,
      }});
      setStatus("saved");
      refetch();
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Lỗi"); setStatus("error");
    }
  };

  const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/public/sepay-webhook` : "";

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Cấu hình hệ thống</h1>
      <p className="mt-2 text-sm text-muted-foreground">Thông tin tài khoản nhận tiền và webhook SePay.</p>

      <form onSubmit={onSave} className="mt-8 space-y-6">
        <Section title="SePay — Tài khoản nhận tiền">
          <Field label="Ngân hàng (vd: MBBank, Vietcombank, Techcombank)" value={form.sepay_bank} onChange={(v) => setForm({ ...form, sepay_bank: v })} />
          <Field label="Số tài khoản" value={form.sepay_account_number} onChange={(v) => setForm({ ...form, sepay_account_number: v })} />
          <Field label="Tên chủ tài khoản (không dấu)" value={form.sepay_account_name} onChange={(v) => setForm({ ...form, sepay_account_name: v })} />
        </Section>

        <Section title="SePay — Webhook">
          <div>
            <label className="text-xs font-medium text-muted-foreground">URL Webhook (dán vào SePay)</label>
            <input readOnly value={webhookUrl} className="mt-1.5 h-11 w-full rounded-lg border border-border bg-secondary/50 px-3 font-mono text-sm" />
          </div>
          <Field
            label="API Key (Authorization secret — đặt giống ở SePay)"
            value={form.sepay_webhook_secret}
            onChange={(v) => setForm({ ...form, sepay_webhook_secret: v })}
          />
          <p className="text-xs text-muted-foreground">
            Trong SePay → Cấu hình webhook: HTTP Method <strong>POST</strong>, Authorization <strong>Apikey</strong>, dán giá trị API key ở trên.
          </p>
        </Section>

        <Section title="Tracking (tùy chọn)">
          <Field label="Facebook Pixel ID" value={form.facebook_pixel_id} onChange={(v) => setForm({ ...form, facebook_pixel_id: v })} />
          <Field label="Google Analytics ID (G-XXXXXXX)" value={form.google_analytics_id} onChange={(v) => setForm({ ...form, google_analytics_id: v })} />
        </Section>

        {err && <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{err}</div>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={status === "saving"} className="btn-glow inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-medium">
            {status === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
            Lưu cấu hình
          </button>
          {status === "saved" && <span className="text-sm text-primary">✓ Đã lưu</span>}
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
