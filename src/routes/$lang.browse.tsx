import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMessages, isLocale, useLocale, useT } from "@/i18n";
import { useImageUrls } from "@/lib/images";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Sort = "new" | "price_asc" | "price_desc";
type BrowseSearch = { q?: string | undefined; category?: string | undefined; min?: number | undefined; max?: number | undefined; sort?: Sort | undefined };

const num = (v: unknown) => {
  const n = Number(v);
  return v === undefined || v === "" || isNaN(n) ? undefined : n;
};

export const Route = createFileRoute("/$lang/browse")({
  validateSearch: (s: { q?: unknown; category?: unknown; min?: unknown; max?: unknown; sort?: unknown }): BrowseSearch => ({
    q: typeof s.q === "string" && s.q ? s.q : undefined,
    category: typeof s.category === "string" && s.category ? s.category : undefined,
    min: num(s.min),
    max: num(s.max),
    sort: s.sort === "price_asc" || s.sort === "price_desc" ? s.sort : undefined,
  }),
  head: ({ params }) => {
    const t = getMessages(isLocale(params.lang) ? params.lang : "mn");
    const title = `${t.browse.title} — ${t.brand}`;
    return {
      meta: [
        { title },
        { name: "description", content: t.home.subtitle },
        { property: "og:title", content: title },
        { property: "og:description", content: t.home.subtitle },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Browse,
});

function Browse() {
  const t = useT();
  const lang = useLocale();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort");
      if (error) throw error;
      return data;
    },
  });

  const categoryId = categories.data?.find((c) => c.slug === search.category)?.id;
  const ready = !search.category || !!categories.data;

  const products = useQuery({
    queryKey: ["browse", search, categoryId],
    enabled: ready,
    queryFn: async () => {
      let q = supabase.from("products").select("*, stores(name)").eq("is_published", true).limit(60);
      if (search.q) {
        const term = search.q.replace(/[%,()]/g, " ").trim();
        if (term) q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      }
      if (search.category) q = q.eq("category_id", categoryId ?? "00000000-0000-0000-0000-000000000000");
      if (search.min !== undefined) q = q.gte("price", search.min);
      if (search.max !== undefined) q = q.lte("price", search.max);
      q = search.sort === "price_asc" ? q.order("price") : search.sort === "price_desc" ? q.order("price", { ascending: false }) : q.order("created_at", { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const covers = (products.data ?? []).map((p) => p.images[0]).filter(Boolean) as string[];
  const urls = useImageUrls(covers);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    navigate({
      search: (prev) => ({ ...prev, q: String(f.get("q") || "").trim() || undefined, min: num(f.get("min")), max: num(f.get("max")) }),
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">{t.browse.title}</h1>

      <form key={JSON.stringify(search)} onSubmit={onSubmit} className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-card md:grid-cols-[1fr_120px_120px_auto]">
        <Input name="q" defaultValue={search.q} placeholder={t.home.searchPlaceholder} aria-label={t.home.search} />
        <Input name="min" type="number" min={0} defaultValue={search.min} placeholder={t.browse.minPrice} aria-label={t.browse.minPrice} />
        <Input name="max" type="number" min={0} defaultValue={search.max} placeholder={t.browse.maxPrice} aria-label={t.browse.maxPrice} />
        <Button type="submit"><Search className="size-4" /> {t.browse.apply}</Button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Chip active={!search.category} onClick={() => navigate({ search: (p) => ({ ...p, category: undefined }) })}>{t.browse.all}</Chip>
        {categories.data?.map((c) => (
          <Chip key={c.id} active={search.category === c.slug} onClick={() => navigate({ search: (p) => ({ ...p, category: c.slug }) })}>
            {lang === "zh" ? c.name_zh : c.name_mn}
          </Chip>
        ))}
        <select
          aria-label={t.browse.sort}
          value={search.sort ?? "new"}
          onChange={(e) => navigate({ search: (p) => ({ ...p, sort: e.target.value === "new" ? undefined : (e.target.value as Sort) }) })}
          className="ml-auto h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="new">{t.browse.newest}</option>
          <option value="price_asc">{t.browse.priceAsc}</option>
          <option value="price_desc">{t.browse.priceDesc}</option>
        </select>
        <Button variant="ghost" size="sm" onClick={() => navigate({ search: {} })}>{t.browse.reset}</Button>
      </div>

      {products.isLoading ? (
        <p className="mt-10 text-muted-foreground">{t.browse.loading}</p>
      ) : products.data?.length === 0 ? (
        <p className="mt-10 text-muted-foreground">{t.browse.noResults}</p>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted-foreground">{products.data?.length} {t.browse.results}</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.data?.map((p) => (
              <ProductCard key={p.id} product={p} imageUrl={p.images[0] ? urls.data?.[p.images[0]] : undefined} storeName={p.stores?.name} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"}`}
    >
      {children}
    </button>
  );
}
