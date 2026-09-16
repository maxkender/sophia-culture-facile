/** Shared types and helpers for the AI first pass. Safe on the client. */

export type LengthFlag = "ok" | "short" | "long" | "empty";

export type AiReviewResult = {
  length: {
    screens: { screen: number; words: number; flag: LengthFlag }[];
    total: { words: number; flag: LengthFlag };
  };
  structure: { check: string; verdict: "pass" | "flag"; note: string }[];
  register: { screen: number; quote: string; issue: string; rewrite: string }[];
  accessibility: {
    screen: number;
    kind: "unexplained_term" | "hard_sentence" | "too_many_figures";
    quote: string;
    note: string;
  }[];
  claims: { screen: number; claim: string; why: string; source_coverage: string }[];
  overall: string;
};

export type AiReviewRow = {
  id: string;
  course_id: string;
  content_hash: string;
  model: string;
  result: AiReviewResult;
  shared_with_author: boolean;
  created_at: string;
};

/**
 * Fingerprint of the text a review was run on. Same algorithm on the server, so the
 * admin panel can tell a current review from one written before the author revised.
 */
export function courseContentHash(input: {
  title: string;
  subtitle: string | null;
  screens: { screen_number: number; screen_title: string | null; body: string | null }[];
}): string {
  const text = [
    input.title,
    input.subtitle ?? "",
    ...[...input.screens]
      .sort((a, b) => a.screen_number - b.screen_number)
      .map((screen) => `${screen.screen_number}|${screen.screen_title ?? ""}|${screen.body ?? ""}`),
  ].join("\u0001");
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export const ACCESSIBILITY_LABEL: Record<AiReviewResult["accessibility"][number]["kind"], string> = {
  unexplained_term: "Term used without explanation",
  hard_sentence: "Sentence needs re-reading",
  too_many_figures: "More than two figures on one screen",
};
