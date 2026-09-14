export const PUBLISHER = {
  name: "VIK STUDIOS",
  legalForm: "SAS",
  capital: "2 EUR",
  siren: "103372421",
  siret: "10337242100018",
  vat: "FR30103372421",
  rcsCity: "Paris",
  address: "30 Boulevard de Sebastopol, 75004 Paris, France",
  director: "Maximilien Kender",
} as const;


export const COURSE_STATUSES = [
  "unassigned",
  "assigned",
  "in_progress",
  "submitted",
  "changes_requested",
  "accepted",
  "published",
] as const;

export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const STATUS_LABEL: Record<CourseStatus, string> = {
  unassigned: "In the pool",
  assigned: "Assigned",
  in_progress: "In progress",
  submitted: "Submitted",
  changes_requested: "Changes requested",
  accepted: "Accepted",
  published: "Published",
};

/** Flat fee paid per commissioned course, in US dollars. */
export const COURSE_FEE_USD = 20;

export const SCREEN_NUMBERS = [1, 2, 3, 4, 5] as const;
export const WORDS_MIN = 100;
export const WORDS_MAX = 140;
export const WORDS_WARN = 160;
export const COURSE_WORDS_MIN = 500;
export const COURSE_WORDS_MAX = 700;
