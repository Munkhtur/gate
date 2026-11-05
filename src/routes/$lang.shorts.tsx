import { createFileRoute } from "@tanstack/react-router";
import { getMessages, isLocale, useT, useLocale } from "@/i18n";
import { PostFeed } from "@/components/PostFeed";
import { Store } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useImageUrls } from "@/lib/images";

export const Route = createFileRoute("/$lang/shorts")({
  head: ({ params }) => {
    const t = getMessages(isLocale(params.lang) ? params.lang : "mn");
    const title = `${t.posts.title} — ${t.brand}`;
    return {
      meta: [
        { title },
        { name: "description", content: t.posts.description },
        { property: "og:title", content: title },
        { property: "og:description", content: t.posts.description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: Shorts,
});

function Shorts() {
  const t = useT();
  const lang = useLocale();

  // Fetch suggested stores for right sidebar
  const { data: suggestedStores } = useQuery({
    queryKey: ["suggested-stores", lang],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, logo_url")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  // Get signed URLs for store logos
  const storeLogos = (suggestedStores ?? []).map((s) => s.logo_url).filter(Boolean) as string[];
  const logoUrls = useImageUrls(storeLogos);

  // Fetch categories for left sidebar
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr_280px]">
          {/* Left Sidebar - Desktop only */}
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] overflow-y-auto space-y-6">
            {/* Feed Navigation */}
            <Card className="p-4 shadow-sm space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                {t.nav.menu}
              </h3>
              <Link
                to="/$lang/shorts"
                params={{ lang }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
                {t.posts.title}
              </Link>
              <Link
                to="/$lang/browse"
                params={{ lang }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                <svg
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                {t.browse.title}
              </Link>
              <Link
                to="/$lang/stores"
                params={{ lang }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                <Store className="size-5" />
                {t.nav.stores}
              </Link>
            </Card>

            {/* Categories */}
            {categories && categories.length > 0 && (
              <Card className="p-4 shadow-sm space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  {t.browse.all}
                </h3>
                <Link
                  to="/$lang/browse"
                  params={{ lang }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-secondary"
                >
                  <svg
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7h18M3 12h18M3 17h18"
                    />
                  </svg>
                  {t.browse.all}
                </Link>
                {categories.slice(0, 8).map((c) => (
                  <Link
                    key={c.id}
                    to="/$lang/browse"
                    params={{ lang }}
                    search={{ category: c.slug }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary"
                  >
                    <span className="text-base">{lang === "zh" ? c.name_zh : c.name_mn}</span>
                  </Link>
                ))}
              </Card>
            )}
          </aside>

          {/* Center Column - Main Feed */}
          <main className="min-w-0">
            <header className="mb-6">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold">{t.posts.title}</h1>
              <p className="mt-1 text-muted-foreground">{t.posts.description}</p>
            </header>

            <PostFeed />
          </main>

          {/* Right Sidebar - Desktop only */}
          <aside className="hidden xl:block xl:sticky xl:top-24 xl:max-h-[calc(100vh-8rem)] overflow-y-auto space-y-6">
            {/* Suggested Stores */}
            {suggestedStores && suggestedStores.length > 0 && (
              <Card className="p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    {t.posts.suggestedStores}
                  </h3>
                  <Link
                    to="/$lang/stores"
                    params={{ lang }}
                    className="text-xs text-primary hover:underline"
                  >
                    {t.browse.viewStore}
                  </Link>
                </div>
                {suggestedStores.map((store) => (
                  <Link
                    key={store.id}
                    to="/$lang/stores/$id"
                    params={{ lang, id: store.id }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-secondary transition-colors group"
                  >
                    {store.logo_url ? (
                      <img
                        src={logoUrls.data?.[store.logo_url]}
                        alt=""
                        className="size-10 rounded-full object-cover group-hover:ring-2 group-hover:ring-primary"
                      />
                    ) : (
                      <div className="grid size-10 place-items-center rounded-full bg-secondary">
                        <Store className="size-5 text-muted-foreground" />
                      </div>
                    )}
                    <span className="truncate text-sm font-medium">{store.name}</span>
                  </Link>
                ))}
              </Card>
            )}

            {/* Popular Categories */}
            {categories && categories.length > 0 && (
              <Card className="p-4 shadow-sm space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  {t.posts.popularCategories}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categories.slice(0, 10).map((c) => (
                    <Link
                      key={c.id}
                      to="/$lang/browse"
                      params={{ lang }}
                      search={{ category: c.slug }}
                      className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary hover:border-primary transition-colors"
                    >
                      {lang === "zh" ? c.name_zh : c.name_mn}
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}