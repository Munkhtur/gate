import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getMessages, isLocale, useLocale, useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/$lang/reset-password")({
  head: ({ params }) => {
    const t = getMessages(isLocale(params.lang) ? params.lang : "mn");
    return {
      meta: [
        { title: `${t.auth.forgotTitle} — ${t.brand}` },
        { name: "description", content: t.auth.forgotTitle },
        { property: "og:title", content: `${t.auth.forgotTitle} — ${t.brand}` },
        { property: "og:description", content: t.auth.forgotTitle },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: ResetPassword,
});

function ResetPassword() {
  const t = useT();
  const lang = useLocale();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data: d }) => setReady(isRecovery || !!d.session));
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error(t.auth.minPassword); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t.auth.passwordUpdated);
    navigate({ to: "/$lang/account", params: { lang }, replace: true });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
        <h1 className="font-display text-xl sm:text-2xl font-semibold">{t.auth.forgotTitle}</h1>
        {ready === false ? (
          <p className="mt-4 text-muted-foreground">{t.auth.invalidLink}</p>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pw">{t.auth.newPassword}</Label>
              <Input id="pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={busy || !ready}>
              {t.auth.savePassword}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
