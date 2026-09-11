/** Correspondance des routes entre les deux langues du site. */

export const ROUTES = {
  home: { fr: "/", en: "/en" },
  download: { fr: "/telecharger", en: "/en/download" },
  landing: { fr: "/sophia-culture-generale", en: "/en/sophia-general-knowledge" },
  legal: { fr: "/mentions-legales", en: "/en/legal-notice" },
  privacy: { fr: "/confidentialite", en: "/en/privacy" },
} as const;

export type RouteKey = keyof typeof ROUTES;
export type Lang = "fr" | "en";

export type LocalePath = (typeof ROUTES)[RouteKey][Lang];

export function pathFor(key: RouteKey, lang: Lang): LocalePath {
  return ROUTES[key][lang];
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
