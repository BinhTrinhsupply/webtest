import { useState } from "react";
import { categoryFilters, products, type Category } from "@/lib/products";
import { ProductCard } from "./ProductCard";

type FilterId = "all" | Category;

export function ProductHub({ initialFilter = "all" as FilterId }: { initialFilter?: FilterId }) {
  const [active, setActive] = useState<FilterId>(initialFilter);
  const filtered = active === "all" ? products : products.filter((p) => p.category === active);

  return (
    <section id="products" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Bộ sưu tập</span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
            Khóa học, Sách, Ebooks &amp; Phần mềm nổi bật
          </h2>
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Tuyển chọn những sản phẩm số được học viên đánh giá cao nhất, cập nhật mỗi tháng.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        {categoryFilters.map((f) => {
          const isActive = active === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className={
                "h-10 rounded-full px-5 text-sm transition-all " +
                (isActive
                  ? "btn-glow font-medium"
                  : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground")
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div
        key={active}
        className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {filtered.map((p, i) => (
          <div
            key={p.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
