import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/products";
import { ArrowUpRight } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="card-lift group flex flex-col overflow-hidden rounded-2xl bg-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          width={800}
          height={600}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
          {product.categoryLabel}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <h3 className="text-base font-semibold leading-snug tracking-tight">
          {product.title}
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-medium">{product.price}</span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
            Xem chi tiết
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
