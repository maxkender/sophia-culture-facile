import type { DocBlock } from "./documents";

export type CreatorVariant = "ugc" | "slideshow";

/**
 * One text, two variants. The slideshow variant drops clause 5 (image rights)
 * and renumbers every later clause, including the survival cross-reference.
 */
export function creatorAgreementBlocks(blocks: DocBlock[], variant: CreatorVariant): DocBlock[] {
  if (variant === "ugc") return blocks;
  const out: DocBlock[] = [];
  let skipping = false;
  for (const block of blocks) {
    if (block.type === "heading" && block.level === 3) {
      const n = Number(block.text.match(/^(\d+)\./)?.[1] ?? NaN);
      if (n === 5) { skipping = true; continue; }
      skipping = false;
      if (n > 5) { out.push({ ...block, text: block.text.replace(/^\d+\./, `${n - 1}.`) }); continue; }
    }
    if (skipping) continue;
    if (block.type === "paragraph") {
      out.push({ ...block, text: block.text.replace("Clauses 2, 4, 5, 7 and 10 survive.", "Clauses 2, 4, 6 and 9 survive.").replace("per the rate communicated at acceptance, monthly,", "per the weekly rate of their pay zone communicated at acceptance, every week,") });
      continue;
    }
    out.push(block);
  }
  return out;
}

export const TRACK_LABEL: Record<CreatorVariant, string> = { ugc: "UGC creator", slideshow: "Slideshow creator" };
