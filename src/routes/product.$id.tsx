import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getProduct } from "@/lib/products";
import { Play, Check, Clock } from "lucide-react";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => {
    const product = getProduct(params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.title ?? "Sản phẩm"} — Minim` },
      { name: "description", content: loaderData?.product.description ?? "" },
    ],
  }),
  component: ProductDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-5 py-32 text-center">
      <h1 className="text-3xl font-semibold">Không tìm thấy sản phẩm</h1>
      <Link to="/" className="mt-6 inline-block text-sm underline">Về trang chủ</Link>
    </div>
  ),
});

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const lessons = product.lessons ?? [];

  return (
    <article className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-20">
      <nav className="mb-8 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Trang chủ</Link>
        <span className="mx-2">/</span>
        <span>{product.categoryLabel}</span>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium">
            {product.categoryLabel}
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">{product.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{product.description}</p>

          <div className="mt-10 overflow-hidden rounded-2xl bg-foreground">
            <div className="relative aspect-video bg-foreground">
              <img
                src={product.image}
                alt={product.title}
                width={1280}
                height={720}
                className="h-full w-full object-cover opacity-70"
              />
              <button
                aria-label="Phát video bài giảng mẫu"
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lift transition-transform hover:scale-105">
                  <Play className="ml-1 h-7 w-7 fill-current" />
                </span>
              </button>
              <span className="absolute bottom-4 left-4 rounded-full bg-background/85 px-3 py-1 text-xs font-medium backdrop-blur">
                Bài giảng mẫu · 04:32
              </span>
            </div>
          </div>

          <section className="mt-12">
            <h2 className="text-xl font-semibold tracking-tight">Bạn sẽ nhận được</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                "Truy cập trọn đời các bài học",
                "Bộ template và checklist đi kèm",
                "Cộng đồng học viên riêng tư",
                "Cập nhật miễn phí mọi phiên bản mới",
              ].map((b) => (
                <li key={b} className="flex items-start gap-3 rounded-xl bg-secondary/60 p-4 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Giá</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">{product.price}</div>
            <Link
              to="/checkout/$slug"
              params={{ slug: product.id }}
              className="btn-glow mt-6 flex h-12 w-full items-center justify-center rounded-xl text-sm font-medium"
            >
              Đăng ký ngay
            </Link>
            <Link
              to="/checkout/$slug"
              params={{ slug: product.id }}
              search={{ bump: true }}
              className="btn-outline-brand mt-3 flex h-12 w-full items-center justify-center rounded-xl text-sm font-medium"
            >
              Mua kèm bộ template
            </Link>

          </div>

          {lessons.length > 0 && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold">Lộ trình bài học</h3>
              <p className="mt-1 text-xs text-muted-foreground">{lessons.length} bài · Học theo nhịp của bạn</p>
              <ol className="mt-5 space-y-1">
                {lessons.map((l: { title: string; duration: string }, i: number) => (
                  <li
                    key={l.title}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition hover:bg-secondary/70"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 truncate">{l.title}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {l.duration}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
