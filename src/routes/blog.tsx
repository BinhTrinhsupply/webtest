import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "./courses";

export const Route = createFileRoute("/blog")({
  head: () => ({ meta: [{ title: "Blog — Minim" }] }),
  component: () => (
    <>
      <PageHeader title="Blog" subtitle="Bài viết ngắn, súc tích về kỹ năng, tư duy và công cụ làm nghề." />
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <p className="text-sm text-muted-foreground">Bài viết mới đang được biên tập. Quay lại sớm nhé.</p>
      </div>
    </>
  ),
});
