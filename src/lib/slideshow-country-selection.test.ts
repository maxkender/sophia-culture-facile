import { describe, expect, it } from "vitest";
import { slideshowApplyWithCountry, slideshowCountrySelection } from "./slideshow-country-selection";

describe("country selected before application", () => {
  it("carries the selected country into the form without losing the app", () => {
    expect(slideshowApplyWithCountry("/fr/candidature-slideshow?app=unswipe", "France")).toBe("/fr/candidature-slideshow?app=unswipe&country=FR");
  });
  it("prefills the localized country from its ISO code", () => {
    expect(slideshowCountrySelection("DE", "fr")).toBe("Allemagne");
    expect(slideshowCountrySelection("DE", "en")).toBe("Germany");
  });
  it("does not prefill an unknown country", () => {
    expect(slideshowCountrySelection("XX", "en")).toBe("");
  });
});