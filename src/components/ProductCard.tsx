import { Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { useLocale } from "@/i18n";
import { SaveProductButton } from "@/components/SaveProductButton";

export function formatPrice(n: number) {
  return `₮${Number(n).toLocaleString()}`;
}

export function ProductCard({ product, imageUrl, storeName }: { product: Tables<"products">; imageUrl?: string | undefined; storeName?: string | undefined }) {
  const lang = useLocale();
  return (
    <article className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-card transition hover:-translate-y-0.5">
    <Link
      to="/$lang/products/$id"
      params={{ lang, id: product.id }}
      className="block"
    >
      <div className="aspect-[4/3] bg-secondary">
        {imageUrl ? (
          <img src={imageUrl} alt={product.title} loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground"><Package className="size-8" /></div>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 font-medium group-hover:text-primary">{product.title}</h3>
        <p className="mt-1 text-lg font-semibold text-primary">{formatPrice(product.price)}</p>
        {storeName && <p className="mt-1 truncate text-sm text-muted-foreground">{storeName}</p>}
      </div>
    </Link>
    <div className="absolute right-2 top-2"><SaveProductButton productId={product.id} compact /></div>
    </article>
  );
}
