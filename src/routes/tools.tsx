import { createFileRoute } from "@tanstack/react-router";
import { ProductHub } from "@/components/site/ProductHub";
import { PageHeader } from "./courses";

export const Route = createFileRoute("/tools")({
  head: () => ({ meta: [{ title: "Công cụ — Minim" }] }),
  component: () => (
    <>
      <PageHeader title="Công cụ" subtitle="Bộ template, dashboard và phần mềm hỗ trợ bạn làm việc nhanh hơn, gọn hơn." />
      <ProductHub initialFilter="guide" />
    </>
  ),
});
