import { createFileRoute } from "@tanstack/react-router";
import { ProductHub } from "@/components/site/ProductHub";
import { PageHeader } from "./courses";

export const Route = createFileRoute("/ebooks")({
  head: () => ({ meta: [{ title: "Ebook — Minim" }] }),
  component: () => (
    <>
      <PageHeader title="Sách & Ebooks" subtitle="Cẩm nang đúc kết hàng nghìn giờ kinh nghiệm thực tế, đọc một lần dùng cả đời." />
      <ProductHub initialFilter="ebook" />
    </>
  ),
});
