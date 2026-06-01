import { createFileRoute } from "@tanstack/react-router";
import { ProductHub } from "@/components/site/ProductHub";
import { CTA } from "@/components/site/CTA";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "Khóa học — Minim" },
      { name: "description", content: "Khóa học thực chiến dành cho người làm nghề chuyên nghiệp." },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Khóa học" subtitle="Lộ trình thực chiến, giảng dạy bởi chuyên gia có kinh nghiệm triển khai thật." />
      <ProductHub initialFilter="course" />
      <CTA />
    </>
  ),
});

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="border-b border-border/60">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">{title}</h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">{subtitle}</p>
      </div>
    </section>
  );
}
