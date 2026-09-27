/** Correspondance des routes entre les deux langues du site. */

export const ROUTES = {
  home: { fr: "/fr", en: "/en" },
  download: { fr: "/fr/telecharger", en: "/en/download" },
  landing: { fr: "/fr/sophia-culture-generale", en: "/en/sophia-general-knowledge" },
  courses: { fr: "/fr/cours", en: "/en/lessons" },
  legal: { fr: "/fr/mentions-legales", en: "/en/legal-notice" },
  privacy: { fr: "/fr/confidentialite", en: "/en/privacy" },
  apply: { fr: "/fr/devenir-professeur", en: "/en/become-a-teacher" },
  careers: { fr: "/fr/careers", en: "/en/careers" },
  creators: { fr: "/fr/createurs", en: "/en/creators" },
  creatorsUgc: { fr: "/fr/createurs/ugc", en: "/en/creators/ugc" },
  creatorsSlideshow: { fr: "/fr/createurs/slideshow", en: "/en/creators/slideshow" },
  creatorsUgcApply: { fr: "/fr/candidature-ugc", en: "/en/ugc-application" },
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

/** Chemin d'un cours dans une langue donnée. */
export function coursePath(lang: Lang, slug: string): string {
  return `${ROUTES.courses[lang]}/${slug}`;
}

/** Route TanStack d'une page de cours (utilisée avec `params={{ slug }}`). */
export function courseRoute(lang: Lang): "/fr/cours/$slug" | "/en/lessons/$slug" {
  return lang === "fr" ? "/fr/cours/$slug" : "/en/lessons/$slug";
}

/** Route TanStack d'une page d'auteur. */
export function authorRoute(lang: Lang): "/fr/auteurs/$slug" | "/en/authors/$slug" {
  return lang === "fr" ? "/fr/auteurs/$slug" : "/en/authors/$slug";
}

/** Base des pages d'auteur (hors ROUTES : il n'existe pas de page d'index). */
export const AUTHOR_BASE = { fr: "/fr/auteurs", en: "/en/authors" } as const;

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
  if (clean.startsWith(`${ROUTES.courses.fr}/`) || clean.startsWith(`${ROUTES.courses.en}/`)) {
    return "courses";
  }
  return "home";
}

export function langFromPath(pathname: string): Lang {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "fr";
}

/** Pays dont les visiteurs reçoivent le site en français par défaut. */
export const FRANCOPHONE_COUNTRIES = new Set([
  "FR", "BE", "CH", "LU", "MC", "CA",
  "SN", "CI", "CM", "MA", "TN", "DZ", "ML", "BF", "NE", "GN",
  "BJ", "TG", "MG", "CD", "CG", "GA", "TD", "RW", "BI", "HT",
]);
