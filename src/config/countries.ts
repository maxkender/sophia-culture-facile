/** ISO 3166-1 alpha-2 codes; names come from Intl so nothing is hand-typed. */
const CODES =
  "AF AX AL DZ AS AD AO AI AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BA BW BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR XK KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG MK NO OM PK PW PS PA PG PY PE PH PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TC TV UG UA AE GB US UY UZ VU VA VE VN VG VI YE ZM ZW".split(
    " ",
  );

const cache: Partial<Record<"fr" | "en", string[]>> = {};

/** Country names sorted in the requested language. */
export function countryNames(locale: "fr" | "en" = "en"): string[] {
  const cached = cache[locale];
  if (cached) return cached;
  let names: string[];
  try {
    const dn = new Intl.DisplayNames([locale], { type: "region" });
    names = CODES.map((c) => dn.of(c) ?? c);
  } catch {
    names = CODES;
  }
  const sorted = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, locale));
  cache[locale] = sorted;
  return sorted;
}

/** Country options for a picker: `value` is the fr/en name (what we store), `label` the name in `displayLocale`. */
export function countryOptions(valueLocale: "fr" | "en", displayLocale: string): { value: string; label: string }[] {
  let dv: Intl.DisplayNames | null = null;
  let dl: Intl.DisplayNames | null = null;
  try { dv = new Intl.DisplayNames([valueLocale], { type: "region" }); } catch { /* Intl unavailable */ }
  try { dl = new Intl.DisplayNames([displayLocale, "en"], { type: "region" }); } catch { dl = dv; }
  const seen = new Set<string>();
  const out: { value: string; label: string }[] = [];
  for (const c of CODES) {
    const value = dv?.of(c) ?? c;
    if (seen.has(value)) continue;
    seen.add(value);
    out.push({ value, label: dl?.of(c) ?? value });
  }
  return out.sort((a, b) => a.label.localeCompare(b.label, displayLocale));
}

/** Resolves a typed or picked country name (French or English) or a 2-letter code to its ISO code. */
export function countryCodeOf(value: string | null | undefined): string | null {
  const v = (value ?? "").trim().toLowerCase();
  if (!v) return null;
  if (/^[a-z]{2}$/.test(v) && CODES.includes(v.toUpperCase())) return v.toUpperCase();
  for (const locale of ["en", "fr", "es", "it", "pt", "de"]) {
    try {
      const dn = new Intl.DisplayNames([locale], { type: "region" });
      const hit = CODES.find((c) => (dn.of(c) ?? "").toLowerCase() === v);
      if (hit) return hit;
    } catch { /* Intl unavailable */ }
  }
  return null;
}

export type ApplicantLang = "fr" | "en" | "es" | "it" | "pt" | "de";
const LANG_BY_CODE: Record<string, ApplicantLang> = {
  FR: "fr", BE: "fr", LU: "fr", CH: "fr", MC: "fr", MA: "fr", SN: "fr", CI: "fr", TN: "fr", DZ: "fr", CM: "fr",
  ES: "es", MX: "es", CO: "es", AR: "es", CL: "es", UY: "es", PE: "es", EC: "es", VE: "es", BO: "es", PY: "es", CR: "es", GT: "es", DO: "es",
  IT: "it", SM: "it", PT: "pt", BR: "pt", AO: "pt", MZ: "pt", DE: "de", AT: "de", LI: "de",
};
export const APPLICANT_LANGS: ApplicantLang[] = ["fr", "en", "es", "it", "pt", "de"];
export function langOfCountry(value: string | null | undefined): ApplicantLang {
  const c = countryCodeOf(value);
  return (c && LANG_BY_CODE[c]) || "en";
}
