import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LOCALES, LOCALE_LABELS, getMessages, isLocale, useLocale, useT, type Locale } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/$lang/_authenticated/account")({
  head: ({ params }) => {
    const t = getMessages(isLocale(params.lang) ? params.lang : "mn");
    const title = `${t.account.title} — ${t.brand}`;
    return { meta: [{ title }, { name: "robots", content: "noindex" },
      { name: "description", content: t.account.subtitle }, { property: "og:title", content: title },
      { property: "og:description", content: t.account.subtitle }, { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" }] };
  },
  component: Account,
});

function Account() {
  const t = useT();
  const lang = useLocale();
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const [name, setName] = useState("");
  const [pref, setPref] = useState<Locale>(lang);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("display_name, preferred_locale")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setName(data?.display_name ?? "");
        if (isLocale(data?.preferred_locale)) setPref(data.preferred_locale);
        setLoaded(true);
      });
  }, [user.id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: name.trim().slice(0, 80), preferred_locale: pref });
    setBusy(false);
    if (error) { toast.error(t.auth.genericError); return; }
    toast.success(getSaved(pref));
    if (pref !== lang) navigate({ to: "/$lang/account", params: { lang: pref } });
  }

  const getSaved = (_l: Locale) => t.account.saved;

  return (
    <div className="mx-auto max-w-xl px-4 py-14">
      <h1 className="font-display text-3xl font-semibold">{loaded && !name ? t.account.setupTitle : t.account.title}</h1>
      <p className="mt-2 text-muted-foreground">{t.account.subtitle}</p>
      <form onSubmit={save} className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="space-y-1.5">
          <Label>{t.auth.email}</Label>
          <Input value={user.email ?? ""} disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dn">{t.auth.displayName}</Label>
          <Input id="dn" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required disabled={!loaded} />
        </div>
        <div className="space-y-1.5">
          <Label>{t.account.preferredLanguage}</Label>
          <div className="flex gap-2">
            {LOCALES.map((l) => (
              <Button key={l} type="button" variant={pref === l ? "default" : "outline"} onClick={() => setPref(l)}>
                {LOCALE_LABELS[l]}
              </Button>
            ))}
          </div>
        </div>
        <Button type="submit" disabled={busy || !loaded}>{t.account.save}</Button>
      </form>
    </div>
  );
}
