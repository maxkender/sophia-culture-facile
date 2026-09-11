/**
 * Chiffres de preuve sociale (données réelles).
 * Les nombres sont formatés selon la locale à l'affichage.
 */

/** Nombre total de téléchargements de l'application. */
export const STAT_DOWNLOADS = 200000;

/** Note moyenne sur l'App Store (la note Play Store n'est pas encore affichable). */
export const STAT_RATING = 4.8;

/** Classement de l'application dans la catégorie Éducation de l'App Store. */
export const STAT_RANK = 3;

/** Pays où le classement a été constaté — qualifie la revendication. */
export const STAT_RANK_COUNTRY = "France";

/** Année où le classement a été constaté — qualifie la revendication. */
export const STAT_RANK_YEAR = "2026";

/** 200 000 en français, 200,000 en anglais. */
export function formatDownloads(lang: "fr" | "en") {
  return new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US").format(STAT_DOWNLOADS);
}

/** 4,8 en français, 4.8 en anglais. */
export function formatRating(lang: "fr" | "en") {
  return new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(STAT_RATING);
}
