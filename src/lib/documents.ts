import type { Database } from "@/integrations/supabase/types";

export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentVersionRow = Database["public"]["Tables"]["document_versions"]["Row"];

export type DocumentSlug = "guide" | "contract" | "creator-agreement" | "creator-guide";

export const DOCUMENT_LABEL: Record<DocumentSlug, string> = {
  guide: "Writing guide",
  contract: "Author contract",
  "creator-agreement": "Creator Account Agreement",
  "creator-guide": "Creator brief guide",
};

export type CalloutTone = "red" | "blue";

export type DocBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "table"; header: [string, string]; rows: [string, string][] }
  | { type: "callout"; tone: CalloutTone; title: string; body: string };

export const BLOCK_LABEL: Record<DocBlock["type"], string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  bullets: "Bullet list",
  table: "Table",
  callout: "Callout",
};

export function emptyBlock(type: DocBlock["type"]): DocBlock {
  switch (type) {
    case "heading":
      return { type: "heading", level: 2, text: "" };
    case "bullets":
      return { type: "bullets", items: [""] };
    case "table":
      return { type: "table", header: ["", ""], rows: [["", ""]] };
    case "callout":
      return { type: "callout", tone: "blue", title: "", body: "" };
    default:
      return { type: "paragraph", text: "" };
  }
}

/** Reads the JSONB column back into typed blocks, discarding anything unknown. */
export function parseBlocks(value: unknown): DocBlock[] {
  if (!Array.isArray(value)) return [];
  const blocks: DocBlock[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const text = typeof item["text"] === "string" ? item["text"] : "";
    switch (item["type"]) {
      case "heading":
        blocks.push({ type: "heading", level: item["level"] === 3 ? 3 : 2, text });
        break;
      case "paragraph":
        blocks.push({ type: "paragraph", text });
        break;
      case "bullets":
        blocks.push({
          type: "bullets",
          items: Array.isArray(item["items"]) ? item["items"].map((entry) => String(entry)) : [],
        });
        break;
      case "table": {
        const header = Array.isArray(item["header"]) ? item["header"].map((entry) => String(entry)) : [];
        const rows = Array.isArray(item["rows"]) ? item["rows"] : [];
        blocks.push({
          type: "table",
          header: [header[0] ?? "", header[1] ?? ""],
          rows: rows.map((row) => {
            const cells = Array.isArray(row) ? row.map((cell) => String(cell)) : [];
            return [cells[0] ?? "", cells[1] ?? ""] as [string, string];
          }),
        });
        break;
      }
      case "callout":
        blocks.push({
          type: "callout",
          tone: item["tone"] === "red" ? "red" : "blue",
          title: typeof item["title"] === "string" ? item["title"] : "",
          body: typeof item["body"] === "string" ? item["body"] : "",
        });
        break;
      default:
        break;
    }
  }
  return blocks;
}

/** Merge fields the contract may use. The admin editor shows them raw; the author page shows them filled. */
export const MERGE_TOKENS = [
  "author_name",
  "author_title",
  "author_institution",
  "author_country",
  "course_count",
  "fee",
  "today",
  "legal_name",
  "country",
  "email",
  "track",
] as const;

export type MergeToken = (typeof MERGE_TOKENS)[number];

export type MergeValues = Partial<Record<MergeToken, string | null>>;

/** What is shown when the profile has nothing for a field. */
export const MERGE_PLACEHOLDER: Record<MergeToken, string> = {
  author_name: "full name not provided",
  author_title: "title not provided",
  author_institution: "institution not provided",
  author_country: "country not provided",
  course_count: "no courses assigned",
  fee: "fee not set",
  today: "date not available",
  legal_name: "legal name not provided",
  country: "country not provided",
  email: "email not provided",
  track: "track not set",
};

export type InlinePart = { text: string; bold?: boolean; italic?: boolean; token?: MergeToken };

/** Splits a string on **bold**, *italic* markers and {{merge_field}} tokens. */
export function inlineParts(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|\{\{\s*([a-z_]+)\s*\}\}/g;
  let last = 0;
  let match = regex.exec(text);
  while (match) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    if (match[1] !== undefined) parts.push({ text: match[1], bold: true });
    else if (match[2] !== undefined) parts.push({ text: match[2], italic: true });
    else {
      const name = match[3] as MergeToken;
      if ((MERGE_TOKENS as readonly string[]).includes(name)) parts.push({ text: match[0], token: name });
      else parts.push({ text: match[0] });
    }
    last = match.index + match[0].length;
    match = regex.exec(text);
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

function partText(part: InlinePart, merge?: MergeValues): string {
  if (!part.token) return part.text;
  if (!merge) return part.text;
  const value = merge[part.token];
  return value && String(value).trim() ? String(value) : `[${MERGE_PLACEHOLDER[part.token]}]`;
}

export function stripMarkers(text: string, merge?: MergeValues): string {
  return inlineParts(text)
    .map((part) => partText(part, merge))
    .join("");
}

/** Replaces every token in a set of blocks, for exports such as the PDF. */
export function applyMerge(blocks: DocBlock[], merge: MergeValues): DocBlock[] {
  const fill = (text: string) => stripMarkersKeepingStyle(text, merge);
  return blocks.map((block) => {
    switch (block.type) {
      case "heading":
        return { ...block, text: fill(block.text) };
      case "paragraph":
        return { ...block, text: fill(block.text) };
      case "bullets":
        return { ...block, items: block.items.map(fill) };
      case "table":
        return {
          ...block,
          rows: block.rows.map(([left, right]) => [fill(left), fill(right)] as [string, string]),
        };
      case "callout":
        return { ...block, title: fill(block.title), body: fill(block.body) };
      default:
        return block;
    }
  });
}

/** Replaces tokens only, leaving bold and italic markers in place. */
function stripMarkersKeepingStyle(text: string, merge: MergeValues): string {
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (raw, name: string) => {
    if (!(MERGE_TOKENS as readonly string[]).includes(name)) return raw;
    const token = name as MergeToken;
    const value = merge[token];
    return value && String(value).trim() ? String(value) : `[${MERGE_PLACEHOLDER[token]}]`;
  });
}

export function documentPlainText(title: string, blocks: DocBlock[]): string {
  const lines: string[] = [title, ""];
  for (const block of blocks) {
    switch (block.type) {
      case "heading":
        lines.push(stripMarkers(block.text).toUpperCase(), "");
        break;
      case "paragraph":
        lines.push(stripMarkers(block.text), "");
        break;
      case "bullets":
        for (const item of block.items) lines.push(`- ${stripMarkers(item)}`);
        lines.push("");
        break;
      case "table":
        lines.push(`${block.header[0]} | ${block.header[1]}`);
        for (const [left, right] of block.rows) lines.push(`${stripMarkers(left)} | ${stripMarkers(right)}`);
        lines.push("");
        break;
      case "callout":
        lines.push(stripMarkers(block.title).toUpperCase(), stripMarkers(block.body), "");
        break;
    }
  }
  return lines.join("\n");
}

export function documentFilename(slug: string, version: number, extension: string): string {
  return `sophia-${slug}-v${version}.${extension}`;
}
