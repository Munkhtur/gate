import { useParams } from "@tanstack/react-router";
import { mn, type Messages } from "./locales/mn";
import { zh } from "./locales/zh";

export const LOCALES = ["mn", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "mn";
export const LOCALE_LABELS: Record<Locale, string> = { mn: "Монгол", zh: "中文" };
export const LOCALE_STORAGE_KEY = "locale";

const dictionaries: Record<Locale, Messages> = { mn, zh };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}

/** Swap the leading locale segment of a pathname, keeping the rest. */
export function swapLocaleInPath(pathname: string, next: Locale): string {
  const parts = pathname.split("/");
  if (isLocale(parts[1])) parts[1] = next;
  else parts.splice(1, 0, next);
  const joined = parts.join("/");
  return joined.endsWith("/") && joined.length > 1 ? joined.slice(0, -1) : joined;
}

export function useLocale(): Locale {
  const params = useParams({ strict: false }) as { lang?: string };
  return isLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
}

export function useT(): Messages {
  return getMessages(useLocale());
}
