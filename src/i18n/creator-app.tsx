import { useEffect, useState, type ReactNode } from "react";
import { CREATOR_APP_DICT } from "./creator-app-dict";

/** Creator-space language (FR/EN). Strings are keyed by their source text; the dictionary holds both languages. */
export type CreatorLang = "fr" | "en";
let current: CreatorLang = "en";
const listeners = new Set<(l: CreatorLang) => void>();
const STORE = "creator-lang";

export const creatorLang = () => current;
/** Translate a creator-space string into the current language. Unknown keys fall back to the source text. */
export function t(key: string): string {
  const e = CREATOR_APP_DICT[key];
  return e ? e[current] : key;
}

const FR_COUNTRIES = new Set(["FR", "BE", "CH", "LU", "MC", "CA", "SN", "CI", "MA", "TN", "DZ", "CM", "RE", "GP", "MQ", "GF", "YT", "PF", "NC"]);
export function guessCreatorLang(language?: string | null, country?: string | null): CreatorLang {
  const l = (language ?? "").toLowerCase();
  if (l.startsWith("fr")) return "fr";
  if (l.startsWith("en")) return "en";
  if (country && FR_COUNTRIES.has(country.toUpperCase())) return "fr";
  if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("fr")) return "fr";
  return "en";
}

export function setCreatorLang(l: CreatorLang) {
  current = l;
  try { localStorage.setItem(STORE, l); } catch { /* ignore */ }
  if (typeof document !== "undefined") document.documentElement.lang = l;
  listeners.forEach((f) => f(l));
}
export function storedCreatorLang(): CreatorLang | null {
  try { const v = localStorage.getItem(STORE); return v === "fr" || v === "en" ? v : null; } catch { return null; }
}

export function useCreatorLang() {
  const [l, setL] = useState(current);
  useEffect(() => { listeners.add(setL); return () => { listeners.delete(setL); }; }, []);
  return l;
}

/** Wraps the creator space: picks the language (saved choice → creator language → country → browser) and re-renders on switch. */
let inited = false;
/** Call at the top of a creator page render so the very first paint is already in the right language. */
export function initCreatorLang(language?: string | null, country?: string | null) {
  if (inited || typeof window === "undefined") return;
  inited = true; current = storedCreatorLang() ?? guessCreatorLang(language, country);
  document.documentElement.lang = current;
}

export function CreatorLangProvider({ language, country, children }: { language?: string | null | undefined; country?: string | null | undefined; children: ReactNode }) {
  initCreatorLang(language, country);
  const l = useCreatorLang();
  useEffect(() => () => { current = "en"; inited = false; }, []);
  return <div key={l} lang={l} className="contents">{children}</div>;
}

export function CreatorLangSwitch() {
  const l = useCreatorLang();
  return (
    <div role="group" aria-label="Langue / Language" className="inline-flex rounded-full bg-portal-bg p-1">
      {(["fr", "en"] as const).map((x) => (
        <button key={x} type="button" aria-pressed={l === x} onClick={() => setCreatorLang(x)} className={`min-h-9 rounded-full px-4 text-sm font-bold ${l === x ? "bg-brand-navy text-card" : "text-brand-navy"}`}>{x.toUpperCase()}</button>
      ))}
    </div>
  );
}
