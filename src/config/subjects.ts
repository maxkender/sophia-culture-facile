/** Les six domaines de cours, tels qu'affichés sur le site public. */

export const SUBJECT_AREAS = [
  "Histoire",
  "Sciences",
  "Litterature",
  "Art",
  "Mythologie",
  "Comprendre le monde actuel",
] as const;

export type SubjectArea = (typeof SUBJECT_AREAS)[number];

const LABELS: Record<string, string> = {
  Histoire: "Histoire",
  Sciences: "Sciences",
  Litterature: "Littérature",
  Art: "Art",
  Mythologie: "Mythologie",
  "Comprendre le monde actuel": "Comprendre le monde actuel",
};

export function subjectLabel(value: string | null | undefined): string {
  if (!value) return "Culture générale";
  return LABELS[value] ?? value;
}
