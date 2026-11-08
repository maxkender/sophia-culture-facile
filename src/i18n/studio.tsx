import { useEffect, useState } from "react";
import { STUDIO_DICT } from "./studio-dict";

/** Studio v2 UI language (EN default, FR when the browser or the profile says so). Keyed by English source text. */
export type StudioLang = "fr" | "en";
const STORE = "studio-lang";
let current: StudioLang = "en";
const listeners = new Set<(l: StudioLang) => void>();

export function st(key: string): string {
  if (current === "en") return key;
  return STUDIO_DICT[key] ?? key;
}
/** Inline pair for strings with variables. */
export const SL = (en: string, fr: string) => (current === "fr" ? fr : en);
export const studioLang = () => current;

export function setStudioLang(l: StudioLang, persist = true) {
  current = l;
  if (persist) try { localStorage.setItem(STORE, l); } catch { /* ignore */ }
  listeners.forEach((f) => f(l));
}

export function guessStudioLang(profileLang?: string | null): StudioLang {
  try { const s = localStorage.getItem(STORE); if (s === "fr" || s === "en") return s; } catch { /* ignore */ }
  if (profileLang) return profileLang.toLowerCase().startsWith("fr") ? "fr" : "en";
  if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("fr")) return "fr";
  return "en";
}

export function useStudioLang(profileLang?: string | null) {
  const [l, setL] = useState(current);
  useEffect(() => {
    listeners.add(setL);
    setStudioLang(guessStudioLang(profileLang), false);
    return () => { listeners.delete(setL); };
  }, [profileLang]);
  return l;
}

export function StudioLangSwitch() {
  const [l, setL] = useState(current);
  useEffect(() => { listeners.add(setL); return () => { listeners.delete(setL); }; }, []);
  return (
    <div role="group" aria-label="Language / Langue" className="inline-flex rounded-full bg-portal-bg p-1">
      {(["en", "fr"] as const).map((x) => (
        <button key={x} type="button" aria-pressed={l === x} onClick={() => setStudioLang(x)} className={`min-h-8 rounded-full px-3 text-xs font-bold ${l === x ? "bg-brand-navy text-card" : "text-brand-navy"}`}>{x.toUpperCase()}</button>
      ))}
    </div>
  );
}
