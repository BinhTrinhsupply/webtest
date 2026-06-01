import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

const stats = [
  { value: "12.000+", label: "Học viên" },
  { value: "24", label: "Khóa học" },
  { value: "06", label: "Sách xuất bản" },
  { value: "18", label: "Ebooks" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 pt-20 pb-16 lg:px-8 lg:pt-32 lg:pb-24">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Nền tảng học kỹ năng thực chiến
          </span>
          <h1 className="mt-8 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            Học Kỹ Năng Thực Chiến
            <br />
            <span className="text-muted-foreground">Từ Chuyên Gia</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Bộ sưu tập khóa học, ebook và công cụ được tinh chế dành cho người làm nghề chuyên nghiệp.
            Học một lần, dùng cả sự nghiệp.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/courses"
              className="btn-glow inline-flex h-12 items-center justify-center gap-2 rounded-xl px-7 text-sm font-medium"
            >
              Khám phá khóa học
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/coaching"
              className="btn-outline-brand inline-flex h-12 items-center justify-center rounded-xl px-7 text-sm font-medium"
            >
              Coaching 1-1
            </Link>
          </div>

        </div>

        <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-background px-6 py-7 text-center">
              <div className="text-2xl font-semibold tracking-tight md:text-3xl">{s.value}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
