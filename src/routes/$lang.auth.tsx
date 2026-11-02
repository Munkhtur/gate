import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { getMessages, isLocale, useLocale, useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "signin" | "signup" | "forgot";

export const Route = createFileRoute("/$lang/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => {
    const r = s["redirect"];
    // Only same-origin relative paths
    return typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? { redirect: r } : {};
  },
  head: ({ params }) => {
    const t = getMessages(isLocale(params.lang) ? params.lang : "mn");
    return {
      meta: [
        { title: `${t.auth.signInTitle} — ${t.brand}` },
        { name: "description", content: t.home.subtitle },
        { property: "og:title", content: `${t.auth.signInTitle} — ${t.brand}` },
        { property: "og:description", content: t.home.subtitle },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: AuthPage,
});

function AuthPage() {
  const t = useT();
  const lang = useLocale();
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const goNext = () => navigate({ href: redirect ?? `/${lang}/account`, replace: true });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    if (mode !== "forgot" && password.length < 8) { toast.error(t.auth.minPassword); return; }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        goNext();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/${lang}/account`,
            data: { display_name: name, locale: lang },
          },
        });
        if (error) throw error;
        if (data.session) goNext();
        else setNotice(t.auth.checkEmail);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/${lang}/reset-password`,
        });
        if (error) throw error;
        setNotice(t.auth.resetSent);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.auth.genericError);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error(t.auth.genericError); return; }
    if (result.redirected) return;
    goNext();
  }

  const title = mode === "signin" ? t.auth.signInTitle : mode === "signup" ? t.auth.signUpTitle : t.auth.forgotTitle;

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:py-16">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
        <h1 className="font-display text-xl sm:text-2xl font-semibold">{title}</h1>

        {mode !== "forgot" && (
          <div className="mt-5 grid grid-cols-2 rounded-lg bg-muted p-1 text-sm">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={"rounded-md py-2.5 " + (mode === m ? "bg-card font-semibold shadow-sm" : "text-muted-foreground")}
              >
                {m === "signin" ? t.auth.signInTab : t.auth.signUpTab}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">{t.auth.displayName}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <Label htmlFor="password">{t.auth.password}</Label>
              <Input id="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          )}
          {notice && <p className="rounded-md bg-secondary p-3 text-sm">{notice}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === "signin" ? t.auth.submitSignIn : mode === "signup" ? t.auth.submitSignUp : t.auth.submitForgot}
          </Button>
        </form>

        {mode === "signin" && (
          <button type="button" className="mt-3 text-sm text-primary hover:underline" onClick={() => setMode("forgot")}>
            {t.auth.forgot}
          </button>
        )}
        {mode === "forgot" && (
          <button type="button" className="mt-3 text-sm text-primary hover:underline" onClick={() => setMode("signin")}>
            {t.auth.backToSignIn}
          </button>
        )}

        {mode !== "forgot" && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {t.auth.or}
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={google}>
              {t.auth.google}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}