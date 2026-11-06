import data from "./slideshow-pages.json";

/** Copy of the public slideshow landing + application form, 30 languages (final, do not edit the JSON). */
export type SlideshowLanguage = { code: string; urlCode: string; htmlLang: string; dir: "ltr" | "rtl"; nativeName: string };
type En = (typeof data.strings)["en"];
export type SlideshowStrings = { landing: En["landing"]; apply: En["apply"]; footer: En["footer"] };

export const SLIDESHOW_LANGUAGES = data.languages as SlideshowLanguage[];
const STRINGS = data.strings as unknown as Record<string, SlideshowStrings>;

export const findSlideshowLanguage = (urlCode: string) => SLIDESHOW_LANGUAGES.find((l) => l.urlCode === urlCode);
export const slideshowLanguage = (code: string) => {
  const l = SLIDESHOW_LANGUAGES.find((x) => x.code === code);
  if (!l) throw new Error(`Unknown slideshow language: ${code}`);
  return l;
};

/** Strings of one language. In dev, any key missing compared with English throws (no silent fallback). */
export function slideshowStrings(code: string): SlideshowStrings {
  const s = STRINGS[code];
  if (!s) throw new Error(`Missing slideshow strings for ${code}`);
  if (import.meta.env.DEV) {
    const en = STRINGS["en"] as SlideshowStrings;
    for (const sec of ["landing", "apply", "footer"] as const) {
      for (const k of Object.keys(en[sec])) {
        const v = (s[sec] as Record<string, unknown>)[k];
        if (v === undefined || v === null || v === "") throw new Error(`Missing slideshow key ${code}.${sec}.${k}`);
      }
    }
  }
  return s;
}

/** Landing / form URL of a language (EN/FR keep their historic URLs). */
export function slideshowPath(urlCode: string, page: "landing" | "apply"): string {
  if (urlCode === "en") return page === "landing" ? "/en/creators/slideshow" : "/en/slideshow-application";
  if (urlCode === "fr") return page === "landing" ? "/fr/createurs/slideshow" : "/fr/candidature-slideshow";
  return `/${urlCode}/creators/slideshow${page === "apply" ? "/apply" : ""}`;
}

/** Language of a slideshow page from its pathname (null if not a slideshow page). */
export function slideshowPageFromPath(pathname: string): { lang: SlideshowLanguage; page: "landing" | "apply" } | null {
  const p = pathname.replace(/\/$/, "");
  for (const l of SLIDESHOW_LANGUAGES) {
    if (p === slideshowPath(l.urlCode, "landing")) return { lang: l, page: "landing" };
    if (p === slideshowPath(l.urlCode, "apply")) return { lang: l, page: "apply" };
  }
  if (p === "/en/creators/unswipe/slideshow") return { lang: slideshowLanguage("en"), page: "landing" };
  if (p === "/fr/createurs/unswipe/slideshow") return { lang: slideshowLanguage("fr"), page: "landing" };
  return null;
}

/** Replaces {name} {min} {max} {weekly} {first}. */
export function fillSlideshow(t: string, v: Record<string, string | number>): string {
  return t.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));
}
