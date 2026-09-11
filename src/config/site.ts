/**
 * Configuration du domaine du site.
 * Toute URL absolue doit être construite à partir de SITE_URL.
 */

export const SITE_URL = "https://sophia-culture.com";

/** Construit une URL absolue à partir d'un chemin de route. */
export function absUrl(path: string): string {
  if (!path || path === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Image de partage (Open Graph / Twitter), 1200x630. */
export const OG_IMAGE_URL = absUrl("/og-image.jpg");

/**
 * TO REPLACE — identifiant numérique de l'app sur l'App Store
 * (visible dans App Store Connect), utilisé par la Smart App Banner iOS.
 */
export const APPLE_ITUNES_APP_ID = "0000000000";
