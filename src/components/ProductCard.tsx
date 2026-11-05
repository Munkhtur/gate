import { Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { useLocale } from "@/i18n";
import { SaveProductButton } from "@/components/SaveProductButton";
import { Skeleton } from "@/components/ui/skeleton";

export function formatPrice(n: number) {
  return `₮${Number(n).toLocaleString()}`;
}

export function ProductCard({
  product,
  imageUrl,
  storeName,
}: {
  product: Tables<"products">;
  imageUrl?: string | undefined;
  storeName?: string | undefined;
}) {
  const lang = useLocale();
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:shadow-lg">
      <Link
        to="/$lang/products/$id"
        params={{ lang, id: product.id }}
        className="block flex-shrink-0"
      >
        <div className="aspect-square bg-muted/50 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid size-full place-items-center text-muted-foreground">
              <Package className="size-8" />
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link to="/$lang/products/$id" params={{ lang, id: product.id }} className="block flex-1">
          <h3 className="line-clamp-2 font-medium text-foreground group-hover:text-primary">
            {product.title}
          </h3>
          <p className="mt-2 text-xl font-bold text-primary">{formatPrice(product.price)}</p>
          {storeName && <p className="mt-1 truncate text-sm text-muted-foreground">{storeName}</p>}
        </Link>
      </div>
      <div className="absolute right-2 top-2 z-10">
        <SaveProductButton productId={product.id} compact />
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="aspect-square bg-muted animate-pulse" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </article>
  );
}
