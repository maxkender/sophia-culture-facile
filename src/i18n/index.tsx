import { Link, useRouterState } from "@tanstack/react-router";
import { fr, type Dict } from "./fr";
import { en } from "./en";
import {
  langFromPath,
  pathFor,
  routeKeyFromPath,
  type Lang,
  type RouteKey,
} from "./routes";

export const DICTS: Record<Lang, Dict> = { fr, en };
export type { Dict, Lang };

/** Langue déduite de la route courante (/en… = anglais, sinon français). */
export function useLang(): Lang {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return langFromPath(pathname);
}

/** Clé de la page courante, indépendante de la langue. */
export function useRouteKey(): RouteKey {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return routeKeyFromPath(pathname);
}

export function useI18n() {
  const lang = useLang();
  return { lang, t: DICTS[lang] };
}

/** Chemin localisé d'une page dans la langue courante. */
export function useLocalePath(key: RouteKey) {
  const lang = useLang();
  return pathFor(key, lang);
}

/** Remplace {company} et consorts dans une chaîne traduite. */
export function fill(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (acc, [key, val]) => acc.replaceAll(`{${key}}`, val),
    template,
  );
}

/** Sélecteur de langue : conserve la page courante. */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const lang = useLang();
  const key = useRouteKey();
  const other: Lang = lang === "fr" ? "en" : "fr";
  const t = DICTS[lang];

  return (
    <Link
      to={pathFor(key, other)}
      hrefLang={other}
      aria-label={t.langSwitchAria}
      className={`rounded-full border border-brand-line px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-navy transition-colors hover:bg-brand-navy/5 ${className}`}
    >
      {t.langLabel}
    </Link>
  );
}
