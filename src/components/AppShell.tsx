import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, Menu, Store, User, X, LogOut, Clapperboard, BellRing } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import {
  LOCALES,
  LOCALE_LABELS,
  LOCALE_STORAGE_KEY,
  swapLocaleInPath,
  useLocale,
  useT,
  type Locale,
} from "@/i18n";
import { Button } from "@/components/ui/button";

function LanguageSwitcher({ onSwitch }: { onSwitch?: () => void }) {
  const locale = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const t = useT();
  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className="inline-flex rounded-full border border-border bg-card p-0.5 text-sm"
    >
      {LOCALES.map((l: Locale) => (
        <a
          key={l}
          href={swapLocaleInPath(location.pathname, l) + (location.searchStr ?? "")}
          onClick={(e) => {
            e.preventDefault();
            localStorage.setItem(LOCALE_STORAGE_KEY, l);
            onSwitch?.();
            navigate({ href: swapLocaleInPath(location.pathname, l) + (location.searchStr ?? "") });
          }}
          aria-current={l === locale ? "true" : undefined}
          className={
            "rounded-full px-3 py-1 transition-colors " +
            (l === locale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {LOCALE_LABELS[l]}
        </a>
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const t = useT();
  const lang = useLocale();
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/$lang/auth", params: { lang }, replace: true });
  }

  function closeMenu() {
    setOpen(false);
  }

  const navLinks = (
    <>
      <Link
        to="/$lang"
        params={{ lang }}
        activeOptions={{ exact: true }}
        className="hover:text-primary"
        activeProps={{ className: "text-primary font-semibold" }}
        onClick={closeMenu}
      >
        {t.nav.home}
      </Link>
      <Link
        to="/$lang/browse"
        params={{ lang }}
        className="hover:text-primary"
        activeProps={{ className: "text-primary font-semibold" }}
        onClick={closeMenu}
      >
        {t.nav.browse}
      </Link>
      <Link
        to="/$lang/stores"
        params={{ lang }}
        activeOptions={{ exact: true }}
        className="hover:text-primary"
        activeProps={{ className: "text-primary font-semibold" }}
        onClick={closeMenu}
      >
        {t.nav.stores}
      </Link>
      <Link
        to="/$lang/wishlist"
        params={{ lang }}
        className="inline-flex items-center gap-1.5 hover:text-primary"
        activeProps={{ className: "text-primary font-semibold" }}
        onClick={closeMenu}
      >
        <Heart className="size-4" /> {t.nav.wishlist}
      </Link>
      <Link
        to="/$lang/following"
        params={{ lang }}
        className="inline-flex items-center gap-1.5 hover:text-primary"
        activeProps={{ className: "text-primary font-semibold" }}
        onClick={closeMenu}
      >
        <BellRing className="size-4" />
        {t.follow.title}
      </Link>
      <Link
        to="/$lang/shorts"
        params={{ lang }}
        className="inline-flex items-center gap-1.5 hover:text-primary"
        activeProps={{ className: "text-primary font-semibold" }}
        onClick={closeMenu}
      >
        <Clapperboard className="size-4" />
        {t.posts.title}
      </Link>
      <Link
        to="/$lang/dashboard"
        params={{ lang }}
        className="inline-flex items-center gap-1.5 hover:text-primary"
        activeProps={{ className: "text-primary font-semibold" }}
        onClick={closeMenu}
      >
        <Store className="size-4" /> {t.nav.dashboard}
      </Link>
    </>
  );

  const authControls = session ? (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link to="/$lang/account" params={{ lang }} onClick={closeMenu}>
          <User className="size-4" /> {t.nav.account}
        </Link>
      </Button>
      <Button variant="outline" size="sm" onClick={signOut}>
        <LogOut className="size-4" /> {t.nav.signOut}
      </Button>
    </div>
  ) : (
    <Button asChild size="sm" onClick={closeMenu}>
      <Link to="/$lang/auth" params={{ lang }}>
        {t.nav.signIn}
      </Link>
    </Button>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-6xl items-center gap-4 px-4">
          <Link
            to="/$lang"
            params={{ lang }}
            className="font-display text-xl font-bold tracking-tight text-primary flex items-center gap-2"
          >
            <img src="/logo.jpg" alt="{t.brand}" className="h-15 w-auto rounded" />
            {/* {t.brand} */}
          </Link>
          <nav className="hidden items-center gap-2 text-sm md:flex">{navLinks}</nav>
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <LanguageSwitcher />
            {authControls}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto md:hidden"
            aria-label={t.nav.menu}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </Button>
        </div>
        {open && (
          <div className="border-t border-border bg-background px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-2 text-base">{navLinks}</nav>
            <div className="mt-4 flex flex-col items-start gap-3">
              <LanguageSwitcher onSwitch={closeMenu} />
              {authControls}
            </div>
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-6 text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="{t.brand}" className="h-6 w-auto rounded" />
            <span className="font-display text-primary">{t.brand}</span>
          </div>
          <span>
            © {new Date().getFullYear()} {t.brand}. {t.footer.rights}
          </span>
        </div>
      </footer>
    </div>
  );
}
