"use client";

import { ExternalLinkIcon, ShoppingCartIcon, StarIcon } from "lucide-react";
import type { Product } from "@/lib/ai/tools/search-products";

type ProductSearchResult = {
  query: string;
  category: string;
  products: Product[];
  searchMoreUrl: string;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={
            star <= Math.round(rating)
              ? "size-3 fill-amber-400 text-amber-400"
              : "size-3 fill-muted text-muted"
          }
        />
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <a
      href={product.searchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 rounded-xl border border-border/50 bg-card p-3 transition-all hover:border-border hover:shadow-sm"
    >
      {/* Image placeholder with gradient */}
      <div className="shrink-0 size-16 rounded-lg bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center overflow-hidden">
        <ShoppingCartIcon className="size-6 text-muted-foreground/40" />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-1">
          <span className="font-medium text-[13px] leading-snug text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </span>
          {product.badge && (
            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary uppercase tracking-wide">
              {product.badge}
            </span>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
          <div className="flex items-center gap-1.5">
            <StarRating rating={product.rating} />
            <span className="text-[11px] text-muted-foreground">
              {product.rating} ({product.reviewCount.toLocaleString()})
            </span>
          </div>
          <div className="flex items-center gap-1 text-[13px] font-semibold text-foreground">
            {product.price}
            <ExternalLinkIcon className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </a>
  );
}

export function ProductList({ result }: { result: ProductSearchResult }) {
  return (
    <div className="w-full max-w-[520px] rounded-2xl border border-border/60 bg-card/50 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <ShoppingCartIcon className="size-3.5 text-muted-foreground" />
          <span className="font-medium text-[13px] text-foreground">
            Best picks for &quot;{result.query}&quot;
          </span>
        </div>
        <a
          href={result.searchMoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          See all
          <ExternalLinkIcon className="size-3" />
        </a>
      </div>

      {/* Product cards */}
      <div className="flex flex-col gap-2 p-3">
        {result.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 px-3 py-2 text-[11px] text-muted-foreground text-center">
        Prices and availability may vary. Click any product to view on Amazon.
      </div>
    </div>
  );
}
