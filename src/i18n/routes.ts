/** Correspondance des routes entre les deux langues du site. */

export const ROUTES = {
  home: { fr: "/fr", en: "/en" },
  legal: { fr: "/fr/mentions-legales", en: "/en/legal-notice" },
  privacy: { fr: "/fr/confidentialite", en: "/en/privacy" },
  creatorsSlideshow: { fr: "/fr/createurs/slideshow", en: "/en/creators/slideshow" },
  creatorsSlideshowApply: { fr: "/fr/candidature-slideshow", en: "/en/slideshow-application" },
} as const;

export type RouteKey = keyof typeof ROUTES;
export type Lang = "fr" | "en";

export type LocalePath = (typeof ROUTES)[RouteKey][Lang];

export const LANGS: Lang[] = ["fr", "en"];

/** Nom du cookie qui mémorise le choix explicite du visiteur. */
export const LANG_COOKIE = "sophia_lang";

export function pathFor(key: RouteKey, lang: Lang): LocalePath {
  return ROUTES[key][lang];
}

/** Chemin d'un cours (utilisé par l'API de l'app mobile). */
export function coursePath(lang: Lang, slug: string): string {
  return `${lang === "fr" ? "/fr/cours" : "/en/lessons"}/${slug}`;
}

const AUTHOR_BASE = { fr: "/fr/auteurs", en: "/en/authors" } as const;

/** Chemin d'une page d'auteur. */
export function authorPath(lang: Lang, slug: string): string {
  return `${AUTHOR_BASE[lang]}/${slug}`;
}

/** Retrouve la clé de route à partir d'un chemin (les deux langues). */
export function routeKeyFromPath(pathname: string): RouteKey {
  const clean = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  for (const key of Object.keys(ROUTES) as RouteKey[]) {
    if (ROUTES[key].fr === clean || ROUTES[key].en === clean) return key;
  }
  return "home";
}

export function langFromPath(pathname: string): Lang {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "fr";
}

/** Territoire français (métropole et outre-mer) : site en français par défaut. */
export const FRANCOPHONE_COUNTRIES = new Set([
  "FR", "GP", "MQ", "GF", "RE", "YT", "PM", "BL", "MF", "WF", "PF", "NC", "TF",
]);
