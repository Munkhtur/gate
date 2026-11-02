import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, isLocale, getMessages } from "@/i18n";

// "/" sends first-time visitors to Mongolian; returning visitors go to their saved language.
export const Route = createFileRoute("/")({
  head: () => {
    const t = getMessages(DEFAULT_LOCALE);
    const title = `${t.brand} — ${t.tagline}`;
    return { meta: [{ title }, { name: "description", content: t.home.subtitle },
      { property: "og:title", content: title }, { property: "og:description", content: t.home.subtitle },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
  },
  beforeLoad: () => {
    let lang = DEFAULT_LOCALE as string;
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isLocale(saved)) lang = saved;
    }
    throw redirect({ to: "/$lang", params: { lang } });
  },
});
