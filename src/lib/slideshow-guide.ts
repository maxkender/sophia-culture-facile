import type { DocBlock } from "./documents";

export type ZoneFigures = { trial_amount: number; monthly_amount: number; posts_per_day: number };

export const GUIDE_PDF_NAME = "Sophia - Creator Guide.pdf";

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/** Fills {trial_amount}, {monthly_amount}, {posts_per_day}. Runs server-side so no other zone's figures ever reach the reader. */
export function mergeGuideText(text: string, f: ZoneFigures): string {
  return text
    .replaceAll("{trial_amount}", fmt(f.trial_amount))
    .replaceAll("{monthly_amount}", fmt(f.monthly_amount))
    .replaceAll("{posts_per_day}", String(f.posts_per_day));
}

export function mergeGuideBlocks(blocks: DocBlock[], f: ZoneFigures): DocBlock[] {
  const m = (t: string) => mergeGuideText(t, f);
  return blocks.map((b) => {
    switch (b.type) {
      case "heading":
      case "paragraph":
        return { ...b, text: m(b.text) };
      case "bullets":
        return { ...b, items: b.items.map(m) };
      case "table":
        return { ...b, header: [m(b.header[0]), m(b.header[1])], rows: b.rows.map(([l, r]) => [m(l), m(r)] as [string, string]) };
      case "callout":
        return { ...b, title: m(b.title), body: m(b.body) };
    }
  });
}

export const ZONE_BADGE: Record<string, string> = {
  A: "bg-portal-green/10 text-portal-green",
  B: "bg-portal-accent/10 text-portal-accent",
  C: "bg-portal-amber/15 text-portal-amber",
};
