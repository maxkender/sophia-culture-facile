import { countryCodeOf, countryOptions } from "@/config/countries";

/** Only recognized ISO countries may prefill the application. */
export function slideshowCountrySelection(code: string | null | undefined, locale: "fr" | "en"): string {
  const iso = countryCodeOf(code);
  if (!iso) return "";
  return countryOptions(locale, locale).find((option) => countryCodeOf(option.value) === iso)?.value ?? "";
}

export function slideshowApplyWithCountry(href: string, country: string): string {
  const [path, search = ""] = href.split("?");
  const params = new URLSearchParams(search);
  const iso = countryCodeOf(country);
  if (iso) params.set("country", iso);
  const query = params.toString();
  return `${path}${query ? `?${query}` : ""}`;
}