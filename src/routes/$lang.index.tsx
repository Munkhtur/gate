import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search, Smartphone, Shirt, Sofa, Sparkles, Bike, Apple, Car, Package, Play, Clapperboard } from "lucide-react";
import { getMessages, isLocale, useLocale, useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import { mostLikedOptions } from "@/lib/wishlist";
import { latestPostsOptions, usePostUrls, type Post } from "@/lib/posts";
import { useImageUrls } from "@/lib/images";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/$lang/")({
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(mostLikedOptions());
    void context.queryClient.ensureQueryData(latestPostsOptions());
  },
  head: ({ params }) => {
    const t = getMessages(isLocale(params.lang) ? params.lang : "mn");
    return {
      meta: [
        { title: `${t.brand} — ${t.tagline}` },
        { name: "description", content: t.home.subtitle },
        { property: "og:title", content: `${t.brand} — ${t.tagline}` },
        { property: "og:description", content: t.home.subtitle },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: Home,
});

const CATS = [
  ["electronics", Smartphone],
  ["clothing", Shirt],
  ["home", Sofa],
  ["beauty", Sparkles],
  ["sports", Bike],
  ["food", Apple],
  ["vehicles", Car],
  ["other", Package],
] as const;

function Home() {
  const t = useT();
  const lang = useLocale();
  const navigate = useNavigate();
  return (
    <>
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20 lg:py-28">
          <p className="text-sm uppercase tracking-[0.2em] text-accent">{t.home.eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl xl:text-6xl">{t.home.title}</h1>
          <p className="mt-4 max-w-xl text-base sm:text-lg opacity-85">{t.home.subtitle}</p>
          <form className="mt-6 flex max-w-xl gap-2 rounded-xl bg-card p-2 shadow-card" onSubmit={(e) => { e.preventDefault(); const q = String(new FormData(e.currentTarget).get("q") || "").trim(); navigate({ to: "/$lang/browse", params: { lang }, search: q ? { q } : {} }); }}>
            <Input name="q" placeholder={t.home.searchPlaceholder} className="border-0 bg-transparent text-foreground shadow-none focus-visible:ring-0 flex-1 min-w-0" />
            <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90 whitespace-nowrap">
              <Search className="size-4" /> {t.home.search}
            </Button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <h2 className="font-display text-xl sm:text-2xl font-semibold">{t.home.categoriesTitle}</h2>
          <Link to="/$lang/browse" params={{ lang }} className="text-sm text-primary hover:underline whitespace-nowrap">{t.browse.title} →</Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATS.map(([key, Icon]) => (
            <Link key={key} to="/$lang/browse" params={{ lang }} search={{ category: key }} className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 sm:p-4 shadow-card transition hover:-translate-y-0.5">
              <span className="grid size-9 sm:size-10 place-items-center rounded-md bg-secondary text-primary group-hover:bg-accent group-hover:text-accent-foreground">
                <Icon className="size-5" />
              </span>
              <span className="text-sm font-medium">{t.categories[key]}</span>
            </Link>
          ))}
        </div>
      </section>

      <MostLiked />
      <NewestPosts />

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:pb-20">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-secondary p-6 sm:p-8">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-semibold">{t.home.ownerTitle}</h2>
            <p className="mt-1 text-muted-foreground">{t.home.ownerText}</p>
          </div>
          <Button asChild>
            <Link to="/$lang/dashboard" params={{ lang }}>{t.home.ownerCta}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function MostLiked() {
  const t = useT();
  const lang = useLocale();
  const { data: products } = useSuspenseQuery(mostLikedOptions());
  const covers = products.map((p) => p.images?.[0]).filter((p): p is string => !!p);
  const urls = useImageUrls(covers);
  if (!products.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 pb-12 sm:pb-16">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h2 className="font-display text-xl sm:text-2xl font-semibold">{t.home.mostLiked}</h2>
        <Link to="/$lang/browse" params={{ lang }} className="text-sm text-primary hover:underline whitespace-nowrap">{t.home.viewAll} →</Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product as Tables<"products">} imageUrl={product.images?.[0] ? urls.data?.[product.images[0]] : undefined} storeName={product.stores?.name ?? undefined} />
        ))}
      </div>
    </section>
  );
}

function NewestPosts() {
  const t = useT();
  const lang = useLocale();
  const { data: posts } = useSuspenseQuery(latestPostsOptions());
  const urls = usePostUrls(posts.map((p) => p.media_path));
  if (!posts.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 pb-12 sm:pb-16">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h2 className="font-display text-xl sm:text-2xl font-semibold">{t.home.newestPosts}</h2>
        <Link to="/$lang/shorts" params={{ lang }} className="text-sm text-primary hover:underline whitespace-nowrap">{t.home.viewAll} →</Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {posts.map((post) => <PostTile key={post.id} post={post} url={urls.data?.[post.media_path]} />)}
      </div>
    </section>
  );
}

function PostTile({ post, url }: { post: Post; url: string | undefined }) {
  const lang = useLocale();
  return (
    <Link to="/$lang/shorts" params={{ lang }} search={{ post: post.id }} className="group relative block overflow-hidden rounded-xl border border-border bg-cinema shadow-card transition hover:-translate-y-0.5">
      <div className="aspect-[9/16]">
        {url ? (
          post.media_type === "image" ? (
            <img src={url} alt={post.caption} loading="lazy" className="size-full object-cover" />
          ) : (
            <video src={url} muted playsInline preload="metadata" className="size-full object-cover" />
          )
        ) : (
          <div className="grid size-full place-items-center text-cinema-foreground"><Clapperboard className="size-8" /></div>
        )}
      </div>
      {post.media_type === "video" && (
        <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-cinema/70 text-cinema-foreground"><Play className="size-4" /></span>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cinema/90 to-transparent p-3 pt-8 text-cinema-foreground">
        <p className="truncate text-xs font-medium">{post.stores?.name}</p>
        {post.caption && <p className="mt-0.5 line-clamp-2 text-xs opacity-80">{post.caption}</p>}
      </div>
    </Link>
  );
}
