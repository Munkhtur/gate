import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMessages, isLocale, useLocale, useT } from "@/i18n";
import { useImageUrls } from "@/lib/images";

export const Route = createFileRoute("/$lang/stores/")({
  head: ({ params }) => {
    const t = getMessages(isLocale(params.lang) ? params.lang : "mn");
    const title = `${t.browse.storesTitle} — ${t.brand}`;
    return {
      meta: [
        { title },
        { name: "description", content: t.home.ownerText },
        { property: "og:title", content: title },
        { property: "og:description", content: t.home.ownerText },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Stores,
});

function Stores() {
  const t = useT();
  const lang = useLocale();
  const stores = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stores").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
  const logos = (stores.data ?? []).map((s) => s.logo_url).filter(Boolean) as string[];
  const urls = useImageUrls(logos);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">{t.browse.storesTitle}</h1>
      {stores.isLoading ? (
        <p className="mt-8 text-muted-foreground">{t.browse.loading}</p>
      ) : stores.data?.length === 0 ? (
        <p className="mt-8 text-muted-foreground">{t.browse.noStores}</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.data?.map((s) => (
            <Link key={s.id} to="/$lang/stores/$id" params={{ lang, id: s.id }} className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5">
              {s.logo_url && urls.data?.[s.logo_url] ? (
                <img src={urls.data[s.logo_url]} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-secondary"><Store className="size-6 text-muted-foreground" /></div>
              )}
              <div className="min-w-0">
                <h2 className="font-medium">{s.name}</h2>
                {s.address && <p className="mt-1 flex items-center gap-1 truncate text-sm text-muted-foreground"><MapPin className="size-3.5 shrink-0" /> {s.address}</p>}
                {s.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
