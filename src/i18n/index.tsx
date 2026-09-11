import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DICTS, type Dict, type Lang } from "./dict";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: Dict };

const I18nContext = createContext<Ctx>({ lang: "fr", setLang: () => {}, t: DICTS.fr });

const STORAGE_KEY = "sophia-lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  // Le rendu serveur part toujours du français (langue par défaut du site).
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "fr") {
      setLangState(stored);
      return;
    }
    if (!navigator.language.toLowerCase().startsWith("fr")) setLangState("en");
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const value = useMemo(() => ({ lang, setLang, t: DICTS[lang] }), [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

/** Remplace {company} et consorts dans une chaîne traduite. */
export function fill(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (acc, [key, val]) => acc.replaceAll(`{${key}}`, val),
    template,
  );
}

/** Bouton de bascule FR / EN. */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "fr" ? "en" : "fr")}
      aria-label={lang === "fr" ? "Switch to English" : "Passer en français"}
      className={`rounded-full border border-brand-line px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-navy transition-colors hover:bg-brand-navy/5 ${className}`}
    >
      {t.langLabel}
    </button>
  );
}
