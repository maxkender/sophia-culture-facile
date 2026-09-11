/**
 * À REMPLIR AVEC DE VRAIS CHIFFRES.
 *
 * Ces valeurs sont volontairement laissées à « XX » : aucun chiffre plausible
 * ne doit être inventé. Le site ne doit pas être publié tant que ces trois
 * constantes n'ont pas été remplacées par des données réelles et vérifiables.
 */

export const STAT_DOWNLOADS = "XX 000"; // À REMPLIR — nombre réel de téléchargements
export const STAT_RATING = "X,X/5"; // À REMPLIR — note moyenne réelle des stores
export const STAT_COURSES = "XX"; // À REMPLIR — nombre réel de cours disponibles

export const SOCIAL_PROOF = [
  { value: STAT_DOWNLOADS, label: "téléchargements" },
  { value: STAT_RATING, label: "note moyenne" },
  { value: STAT_COURSES, label: "cours disponibles" },
] as const;
