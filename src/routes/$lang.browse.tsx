import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMessages, isLocale, useLocale, useT } from "@/i18n";
import { useImageUrls } from "@/lib/images";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
        if (term) q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%,stores.name.ilike.%${term}%`);
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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">{t.browse.title}</h1>
        <p className="mt-1 text-muted-foreground">{t.home.subtitle}</p>
      </div>

      <form key={JSON.stringify(search)} onSubmit={onSubmit} className="mb-6 rounded-xl border border-input bg-card p-4 sm:p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-[1fr_140px_140px_auto] sm:items-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input name="q" defaultValue={search.q} placeholder={t.home.searchPlaceholder} className="pl-10 h-11" aria-label={t.home.search} />
          </div>
          <Input name="min" type="number" min={0} defaultValue={search.min} placeholder={t.browse.minPrice} aria-label={t.browse.minPrice} className="h-11" />
          <Input name="max" type="number" min={0} defaultValue={search.max} placeholder={t.browse.maxPrice} aria-label={t.browse.maxPrice} className="h-11" />
          <Button type="submit" className="h-11 bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap"><Search className="size-4 mr-2" /> {t.browse.apply}</Button>
        </div>
      </form>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Chip active={!search.category} onClick={() => navigate({ search: (p) => ({ ...p, category: undefined }) })}>{t.browse.all}</Chip>
          {categories.data?.map((c) => (
            <Chip key={c.id} active={search.category === c.slug} onClick={() => navigate({ search: (p) => ({ ...p, category: c.slug }) })}>
              {lang === "zh" ? c.name_zh : c.name_mn}
            </Chip>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground hidden sm:block">
            {products.data?.length ?? 0} {t.browse.results}
          </p>
          <Select
            value={search.sort ?? "new"}
            onValueChange={(v) => navigate({ search: (p) => ({ ...p, sort: v === "new" ? undefined : (v as Sort) }) })}
          >
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder={t.browse.sort} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">{t.browse.newest}</SelectItem>
              <SelectItem value="price_asc">{t.browse.priceAsc}</SelectItem>
              <SelectItem value="price_desc">{t.browse.priceDesc}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate({ search: {} })} aria-label={t.browse.reset}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {products.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products.data?.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          {t.browse.noResults}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.data?.map((p) => (
            <ProductCard key={p.id} product={p} imageUrl={p.images[0] ? urls.data?.[p.images[0]] : undefined} storeName={p.stores?.name} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-input bg-white hover:bg-secondary"}`}
    >
      {children}
    </button>
  );
}
