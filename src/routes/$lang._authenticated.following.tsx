import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Store } from "lucide-react";
import { getMessages, isLocale, useLocale, useT } from "@/i18n";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useImageUrls } from "@/lib/images";
import { followingFeedOptions } from "@/lib/follows";

export const Route = createFileRoute("/$lang/_authenticated/following")({
  loader: ({ context }) => context.queryClient.ensureQueryData(followingFeedOptions(context.user.id)),
  head: ({ params }) => {
    const t = getMessages(isLocale(params.lang) ? params.lang : "mn");
    const title = `${t.follow.title} — ${t.brand}`;
    return { meta: [
      { title }, { name: "robots", content: "noindex" },
      { name: "description", content: t.follow.description },
      { property: "og:title", content: title },
      { property: "og:description", content: t.follow.description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ] };
  },
  pendingComponent: () => { const t = useT(); return <p className="mx-auto max-w-6xl px-4 py-14 text-muted-foreground">{t.browse.loading}</p>; },
  errorComponent: ({ reset }) => { const t = useT(); return <div className="mx-auto max-w-6xl px-4 py-14"><p role="alert">{t.auth.genericError}</p><Button className="mt-4" onClick={reset}>{t.wishlist.retry}</Button></div>; },
  component: Following,
});

function Following() {
  const t = useT();
  const lang = useLocale();
  const { user } = Route.useRouteContext();
  const { data } = useSuspenseQuery(followingFeedOptions(user.id));
  const paths = [...data.products.map((p) => p.images[0]), ...data.stores.map((s) => s.logo_url)].filter(Boolean) as string[];
  const urls = useImageUrls(paths);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">{t.follow.title}</h1>
      <p className="mt-2 text-muted-foreground">{t.follow.description}</p>
      {data.stores.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">{t.follow.empty}</p>
          <Button asChild className="mt-4"><Link to="/$lang/stores" params={{ lang }}>{t.nav.stores}</Link></Button>
        </div>
      ) : (
        <>
          <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
            {data.stores.map((s) => (
              <Link key={s.id} to="/$lang/stores/$id" params={{ lang, id: s.id }}
                className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-4 hover:border-primary">
                {s.logo_url && urls.data?.[s.logo_url]
                  ? <img src={urls.data[s.logo_url]} alt="" className="size-8 rounded-full object-cover" />
                  : <span className="grid size-8 place-items-center rounded-full bg-secondary"><Store className="size-4" /></span>}
                <span className="text-sm font-medium">{s.name}</span>
              </Link>
            ))}
          </div>
          <h2 className="mt-8 font-display text-2xl font-semibold">{t.follow.latest}</h2>
          {data.products.length === 0 && <p className="mt-4 text-muted-foreground">{t.browse.noResults}</p>}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.products.map((p) => (
              <ProductCard key={p.id} product={p} imageUrl={p.images[0] ? urls.data?.[p.images[0]] : undefined} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
