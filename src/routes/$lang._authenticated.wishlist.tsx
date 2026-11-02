import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { getMessages, isLocale, useLocale, useT } from "@/i18n";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useImageUrls } from "@/lib/images";
import { wishlistOptions } from "@/lib/wishlist";

export const Route = createFileRoute("/$lang/_authenticated/wishlist")({
  loader: ({ context }) => context.queryClient.ensureQueryData(wishlistOptions(context.user.id)),
  head: ({ params }) => {
    const t = getMessages(isLocale(params.lang) ? params.lang : "mn");
    const title = `${t.wishlist.title} — ${t.brand}`;
    return { meta: [
      { title }, { name: "robots", content: "noindex" },
      { name: "description", content: t.wishlist.description },
      { property: "og:title", content: title },
      { property: "og:description", content: t.wishlist.description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ] };
  },
  pendingComponent: () => <WishlistLoading />,
  errorComponent: ({ reset }) => <WishlistError reset={reset} />,
  component: Wishlist,
});

function WishlistLoading() {
  const t = useT();
  return <p className="mx-auto max-w-6xl px-4 py-14 text-muted-foreground">{t.browse.loading}</p>;
}

function WishlistError({ reset }: { reset: () => void }) {
  const t = useT();
  return <div className="mx-auto max-w-6xl px-4 py-14"><p role="alert">{t.auth.genericError}</p><Button className="mt-4" onClick={reset}>{t.wishlist.retry}</Button></div>;
}

function Wishlist() {
  const t = useT();
  const lang = useLocale();
  const { user } = Route.useRouteContext();
  const { data: products } = useSuspenseQuery(wishlistOptions(user.id));
  const urls = useImageUrls(products.flatMap((p) => p.images[0] ? [p.images[0]] : []));
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="font-display text-3xl font-semibold">{t.wishlist.title}</h1>
      {products.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-4 py-10 text-center">
          <Heart className="size-8 text-primary" />
          <p className="text-muted-foreground">{t.wishlist.empty}</p>
          <Button asChild variant="outline"><Link to="/$lang/browse" params={{ lang }}>{t.wishlist.browse}</Link></Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} product={p} storeName={p.stores?.name} imageUrl={p.images[0] ? urls.data?.[p.images[0]] : undefined} />)}
        </div>
      )}
    </div>
  );
}
