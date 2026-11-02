import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { LOCALE_STORAGE_KEY, isLocale } from "@/i18n";

export const Route = createFileRoute("/$lang")({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.lang)) throw notFound();
  },
  component: LocaleLayout,
});

function LocaleLayout() {
  const { lang } = Route.useParams();
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "mn";
    localStorage.setItem(LOCALE_STORAGE_KEY, lang);
  }, [lang]);
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
