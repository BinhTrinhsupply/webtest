import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "./courses";

export const Route = createFileRoute("/coaching")({
  head: () => ({ meta: [{ title: "Coaching 1-1 — Minim" }] }),
  component: () => (
    <>
      <PageHeader title="Coaching 1-1" subtitle="Chương trình huấn luyện cá nhân hóa, đồng hành 1-1 cùng chuyên gia trong 8 tuần." />
      <div className="mx-auto max-w-3xl px-5 py-20 lg:px-8">
        <p className="text-base leading-relaxed text-muted-foreground">
          Mỗi tháng chỉ nhận tối đa 6 học viên. Đăng ký tư vấn để được đánh giá phù hợp trước khi bắt đầu.
        </p>
        <Link
          to="/product/$id"
          params={{ id: "coaching-1-1" }}
          className="btn-glow mt-8 inline-flex h-12 items-center justify-center rounded-xl px-7 text-sm font-medium"
        >
          Xem chi tiết chương trình
        </Link>
      </div>
    </>
  ),
});
