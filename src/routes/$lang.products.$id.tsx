import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Phone, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMessages, isLocale, useLocale, useT } from "@/i18n";
import { useImageUrls } from "@/lib/images";
import { formatPrice } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { SaveProductButton } from "@/components/SaveProductButton";
import { StoreLocationButton } from "@/components/StoreLocationButton";

export const Route = createFileRoute("/$lang/products/$id")({
  head: ({ params }) => {
    const t = getMessages(isLocale(params.lang) ? params.lang : "mn");
    const title = `${t.dashboard.productTitle} — ${t.brand}`;
    return {
      meta: [
        { title },
        { name: "description", content: t.home.subtitle },
        { property: "og:title", content: title },
        { property: "og:description", content: t.home.subtitle },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const t = useT();
  const lang = useLocale();
  const { id } = Route.useParams();
  const [active, setActive] = useState(0);
  useEffect(() => {
    const key = `viewed:${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    supabase.rpc("record_product_view", { _product_id: id }).then(() => undefined);
  }, [id]);
  const product = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, stores(*), categories(*)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const p = product.data;
  const store = p?.stores;
  const urls = useImageUrls([...(p?.images ?? []), ...(store?.logo_url ? [store.logo_url] : [])]);

  if (product.isLoading) return <p className="mx-auto max-w-6xl px-4 py-14 text-muted-foreground">{t.browse.loading}</p>;
  if (!p) return <p className="mx-auto max-w-6xl px-4 py-14 text-muted-foreground">{t.browse.notFound}</p>;

  const main = p.images[active] ? urls.data?.[p.images[active]] : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/$lang/browse" params={{ lang }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" /> {t.browse.back}
      </Link>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl bg-secondary">
            {main && <img src={main} alt={p.title} className="size-full object-cover" />}
          </div>
          {p.images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {p.images.map((img, i) => (
                <button key={img} type="button" onClick={() => setActive(i)} className={`aspect-square overflow-hidden rounded-md border-2 bg-secondary ${i === active ? "border-primary" : "border-transparent"}`}>
                  {urls.data?.[img] && <img src={urls.data[img]} alt="" className="size-full object-cover" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          {p.categories && (
            <Link to="/$lang/browse" params={{ lang }} search={{ category: p.categories.slug }} className="text-sm uppercase tracking-wider text-accent-foreground/70 hover:text-primary">
              {lang === "zh" ? p.categories.name_zh : p.categories.name_mn}
            </Link>
          )}
          <h1 className="mt-2 font-display text-3xl font-semibold">{p.title}</h1>
          <p className="mt-3 text-3xl font-bold text-primary">{formatPrice(p.price)}</p>
          {p.is_published && <div className="mt-5"><SaveProductButton productId={p.id} /></div>}
          {p.description && <p className="mt-6 whitespace-pre-line text-foreground/85">{p.description}</p>}

          {store && (
            <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-card">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.browse.seller}</p>
              <div className="mt-3 flex items-center gap-3">
                {store.logo_url && urls.data?.[store.logo_url] ? (
                  <img src={urls.data[store.logo_url]} alt="" className="size-12 rounded-lg object-cover" />
                ) : (
                  <div className="grid size-12 place-items-center rounded-lg bg-secondary"><Store className="size-5 text-muted-foreground" /></div>
                )}
                <p className="font-medium">{store.name}</p>
              </div>
              <div className="mt-3"><StoreLocationButton name={store.name} address={store.address} lat={store.lat} lng={store.lng} /></div>
              <div className="mt-4 flex flex-wrap gap-2">
                {store.phone && (
                  <Button asChild><a href={`tel:${store.phone}`}><Phone className="size-4" /> {store.phone}</a></Button>
                )}
                <Button asChild variant="outline">
                  <Link to="/$lang/stores/$id" params={{ lang, id: store.id }}>{t.browse.viewStore}</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
