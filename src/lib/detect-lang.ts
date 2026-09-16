/**
 * Détection de la langue d'un visiteur, sans dépendance au framework :
 * cookie explicite → en-têtes de langue du navigateur → pays → anglais.
 */

import { FRANCOPHONE_COUNTRIES, LANG_COOKIE, type Lang } from "@/i18n/routes";

export function langFromCookieHeader(cookieHeader: string | null | undefined): Lang | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${LANG_COOKIE}=(fr|en)`));
  return (match?.[1] as Lang | undefined) ?? null;
}

export function langFromAcceptLanguage(header: string | null | undefined): Lang | null {
  if (!header) return null;
  const tags = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.split("=")[1]) : 1 };
    })
    .filter((item) => item.tag && !Number.isNaN(item.q))
    .sort((a, b) => b.q - a.q);
  for (const { tag } of tags) {
    if (tag.startsWith("fr")) return "fr";
    if (tag.startsWith("en")) return "en";
  }
  return null;
}

export function langFromCountry(country: string | null | undefined): Lang | null {
  if (!country) return null;
  return FRANCOPHONE_COUNTRIES.has(country.toUpperCase()) ? "fr" : null;
}

/** Ordre imposé : choix explicite, langue du navigateur, pays, anglais. */
export function detectLangFromHeaders(headers: Headers): Lang {
  return (
    langFromCookieHeader(headers.get("cookie")) ??
    langFromAcceptLanguage(headers.get("accept-language")) ??
    langFromCountry(
      headers.get("cf-ipcountry") ??
        headers.get("x-vercel-ip-country") ??
        headers.get("x-country-code"),
    ) ??
    "en"
  );
}

/** Détection côté navigateur, pour une navigation client vers « / ». */
export function detectLangInBrowser(): Lang {
  if (typeof document === "undefined") return "en";
  const stored = langFromCookieHeader(document.cookie);
  if (stored) return stored;
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of languages) {
    const lower = (tag ?? "").toLowerCase();
    if (lower.startsWith("fr")) return "fr";
    if (lower.startsWith("en")) return "en";
  }
  return "en";
}

/** Écrit le choix du visiteur pour un an. */
export function rememberLang(lang: Lang) {
  if (typeof document === "undefined") return;
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
}
