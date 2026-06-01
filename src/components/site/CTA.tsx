import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-8 py-20 text-center md:px-16 md:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--brand-glow)_22%,transparent),transparent_70%)]" />
        <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
          Sẵn sàng bắt đầu hành trình học tập?
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-sm text-muted-foreground md:text-base">
          Hơn 12.000 học viên đã thay đổi cách họ làm việc. Đến lượt bạn.
        </p>
        <div className="mt-10">
          <Link
            to="/courses"
            className="btn-glow inline-flex h-12 items-center justify-center gap-2 rounded-xl px-7 text-sm font-medium"
          >
            Khám phá khóa học ngay
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>

  );
}
