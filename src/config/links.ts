/**
 * Liens externes de Sophia — Culture générale.
 * Point unique de configuration des URLs de stores.
 */

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=app.rork.sophia";

/**
 * TO REPLACE — remplacer par l'URL réelle de la fiche App Store
 * dès que l'application est publiée sur l'App Store d'Apple.
 */
export const APP_STORE_URL = "https://apps.apple.com/app/id0000000000";

// Lien intelligent qui redirige déjà vers le bon store.
export const SMART_LINK = "https://taap.it/sophia.culture";
// Mettre à false pour router via la page /telecharger du site.
export const USE_SMART_LINK = true;

/** Vrai tant que l'URL App Store est le placeholder à remplacer. */
export const APP_STORE_PENDING = APP_STORE_URL.includes("id0000000000");

/** Lien App Store réel, ou lien intelligent tant que la fiche iOS n'existe pas. */
export function appStoreHref(): string {
  return APP_STORE_PENDING ? SMART_LINK : APP_STORE_URL;
}

/** Destination unique de tous les CTA de téléchargement du site. */
export function downloadHref(): string {
  return USE_SMART_LINK ? SMART_LINK : "/telecharger";
}

/** Vrai si la destination est un lien externe (donc un <a>, pas un <Link>). */
export const IS_EXTERNAL_DOWNLOAD = USE_SMART_LINK;

export const CONTACT_EMAIL = "contact@vikstudios.fr"; // TO REPLACE

export const COMPANY = "Vik Studios SAS";

export const SITE_NAME = "Sophia — Culture générale";
