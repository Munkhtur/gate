import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Heart, Clapperboard } from "lucide-react";
import { getMessages, isLocale, useLocale, useT } from "@/i18n";
import { ProductCard } from "@/components/ProductCard";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { useImageUrls } from "@/lib/images";
import { usePostUrls } from "@/lib/posts";
import { wishlistOptions, likedPostsOptions } from "@/lib/wishlist";

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
  return <p className="mx-auto max-w-6xl px-4 py-10 text-muted-foreground">{t.browse.loading}</p>;
}

function WishlistError({ reset }: { reset: () => void }) {
  const t = useT();
  return <div className="mx-auto max-w-6xl px-4 py-10"><p role="alert">{t.auth.genericError}</p><Button className="mt-4" onClick={reset}>{t.wishlist.retry}</Button></div>;
}

function Wishlist() {
  const t = useT();
  const lang = useLocale();
  const { user } = Route.useRouteContext();
  const { data: products } = useSuspenseQuery(wishlistOptions(user.id));
  const { data: likedPosts } = useSuspenseQuery(likedPostsOptions(user.id));

  // Get signed URLs for product images (listing-images bucket)
  const productImages = products.flatMap((p) => p.images[0] ? [p.images[0]] : []);
  const productUrls = useImageUrls(productImages);

  // Get signed URLs for post media (post-media bucket)
  const postMedia = likedPosts.flatMap((p) => p.media_path ? [p.media_path] : []);
  const postUrls = usePostUrls(postMedia);

  const hasContent = products.length > 0 || likedPosts.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold">{t.wishlist.title}</h1>
      {!hasContent ? (
        <div className="mt-8 flex flex-col items-center gap-4 py-8 text-center">
          <Heart className="size-8 text-primary" />
          <p className="text-muted-foreground">{t.wishlist.empty}</p>
          <Button asChild variant="outline"><Link to="/$lang/browse" params={{ lang }}>{t.wishlist.browse}</Link></Button>
        </div>
      ) : (
        <>
          {products.length > 0 && (
            <>
              <h2 className="mt-8 mb-4 flex items-center gap-2 text-lg font-semibold text-muted-foreground">
                <Heart className="size-5 text-primary" />
                {t.wishlist.savedProducts || "Saved Products"}
              </h2>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => <ProductCard key={p.id} product={p} storeName={p.stores?.name} imageUrl={p.images[0] ? productUrls.data?.[p.images[0]] : undefined} />)}
              </div>
            </>
          )}
          {likedPosts.length > 0 && (
            <>
              <h2 className="mt-8 mb-4 flex items-center gap-2 text-lg font-semibold text-muted-foreground">
                <Clapperboard className="size-5 text-primary" />
                {t.wishlist.likedPosts || "Liked Posts"}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {likedPosts.map((post) => (
                  <div key={post.id}>
                    <PostCard
                      post={post}
                      url={post.media_path ? postUrls.data?.[post.media_path] : undefined}
                      loading={postUrls.isPending}
                      lang={lang}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}