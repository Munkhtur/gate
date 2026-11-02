import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Phone, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMessages, isLocale, useLocale, useT } from "@/i18n";
import { useImageUrls } from "@/lib/images";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { StoreLocationButton } from "@/components/StoreLocationButton";
import { FollowStoreButton } from "@/components/FollowStoreButton";
import { PostFeed } from "@/components/PostFeed";

export const Route = createFileRoute("/$lang/stores/$id")({
  head: ({ params }) => {
    const t = getMessages(isLocale(params.lang) ? params.lang : "mn");
    const title = `${t.browse.viewStore} — ${t.brand}`;
    return {
      meta: [
        { title },
        { name: "description", content: t.home.ownerText },
        { property: "og:title", content: title },
        { property: "og:description", content: t.home.ownerText },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: StorePage,
});

function StorePage() {
  const t = useT();
  const lang = useLocale();
  const { id } = Route.useParams();
  const store = useQuery({
    queryKey: ["store", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("stores").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const products = useQuery({
    queryKey: ["store-products", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("store_id", id).eq("is_published", true).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const s = store.data;
  const paths = [...(products.data ?? []).map((p) => p.images[0]).filter(Boolean), ...(s?.logo_url ? [s.logo_url] : [])] as string[];
  const urls = useImageUrls(paths);

  if (store.isLoading) return <p className="mx-auto max-w-6xl px-4 py-14 text-muted-foreground">{t.browse.loading}</p>;
  if (!s) return <p className="mx-auto max-w-6xl px-4 py-14 text-muted-foreground">{t.browse.notFound}</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/$lang/stores" params={{ lang }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" /> {t.browse.back}
      </Link>
      <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-card md:flex-row md:items-center">
        {s.logo_url && urls.data?.[s.logo_url] ? (
          <img src={urls.data[s.logo_url]} alt="" className="size-20 rounded-xl object-cover" />
        ) : (
          <div className="grid size-20 place-items-center rounded-xl bg-secondary"><Store className="size-8 text-muted-foreground" /></div>
        )}
        <div className="flex-1">
          <h1 className="font-display text-3xl font-semibold">{s.name}</h1>
          <div className="mt-2"><StoreLocationButton name={s.name} address={s.address} lat={s.lat} lng={s.lng} /></div>
          {s.description && <p className="mt-3 whitespace-pre-line text-foreground/85">{s.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <FollowStoreButton storeId={s.id} />
          {s.phone && <Button asChild variant="outline"><a href={`tel:${s.phone}`}><Phone className="size-4" /> {s.phone}</a></Button>}
        </div>
      </div>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-2xl font-semibold">{t.posts.manage}</h2>
        <PostFeed storeId={s.id} />
      </section>

      <h2 className="mt-10 font-display text-2xl font-semibold">{t.browse.storeProducts}</h2>
      {products.data?.length === 0 && <p className="mt-6 text-muted-foreground">{t.browse.noResults}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.data?.map((p) => (
          <ProductCard key={p.id} product={p} imageUrl={p.images[0] ? urls.data?.[p.images[0]] : undefined} />
        ))}
      </div>
    </div>
  );
}
