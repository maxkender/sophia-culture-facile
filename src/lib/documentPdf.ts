import { documentFilename, inlineParts, stripMarkers, type DocBlock } from "@/lib/documents";

const MARGIN = 56;
const PAGE_WIDTH = 595.28; // A4 portrait, points
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const NAVY: [number, number, number] = [27, 48, 84];
const GREY: [number, number, number] = [78, 96, 124];
const RED: [number, number, number] = [179, 38, 30];
const BLUE: [number, number, number] = [37, 99, 235];

/** Exports a document's blocks as a PDF. jsPDF is loaded on demand so it stays out of the main bundle. */
export async function downloadDocumentPdf(options: {
  slug: string;
  title: string;
  subtitle: string;
  version: number;
  blocks: DocBlock[];
  filename?: string;
}) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  let y = MARGIN;

  const ensureRoom = (needed: number) => {
    if (y + needed <= PAGE_HEIGHT - MARGIN) return;
    pdf.addPage();
    y = MARGIN;
  };

  const writeText = (
    text: string,
    opts: { size: number; style?: "normal" | "bold" | "italic"; color?: [number, number, number]; indent?: number; gap?: number },
  ) => {
    const indent = opts.indent ?? 0;
    const lineHeight = opts.size * 1.55;
    pdf.setFont("helvetica", opts.style ?? "normal");
    pdf.setFontSize(opts.size);
    pdf.setTextColor(...(opts.color ?? GREY));
    const lines = pdf.splitTextToSize(stripMarkers(text), CONTENT_WIDTH - indent) as string[];
    for (const line of lines) {
      ensureRoom(lineHeight);
      pdf.text(line, MARGIN + indent, y);
      y += lineHeight;
    }
    y += opts.gap ?? 8;
  };

  writeText(options.title, { size: 20, style: "bold", color: NAVY, gap: 4 });
  writeText(options.subtitle, { size: 10, gap: 18 });

  for (const block of options.blocks) {
    switch (block.type) {
      case "heading":
        ensureRoom(40);
        y += 8;
        writeText(block.text, { size: block.level === 3 ? 11 : 14, style: "bold", color: NAVY, gap: 6 });
        break;
      case "paragraph":
        writeText(block.text, { size: 10.5 });
        break;
      case "bullets":
        for (const item of block.items) {
          const lineHeight = 10.5 * 1.55;
          ensureRoom(lineHeight);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10.5);
          pdf.setTextColor(...GREY);
          pdf.text("•", MARGIN, y);
          writeText(item, { size: 10.5, indent: 16, gap: 2 });
        }
        y += 8;
        break;
      case "table":
        writeText(`${block.header[0]} / ${block.header[1]}`, { size: 9, style: "bold", color: NAVY, gap: 4 });
        for (const [left, right] of block.rows) {
          writeText(left, { size: 10.5, style: "bold", color: NAVY, gap: 2 });
          writeText(right, { size: 10.5, indent: 16, gap: 8 });
        }
        break;
      case "callout": {
        const tone = block.tone === "red" ? RED : BLUE;
        ensureRoom(60);
        y += 6;
        const top = y - 12;
        if (block.title) writeText(block.title.toUpperCase(), { size: 10.5, style: "bold", color: tone, indent: 14, gap: 4 });
        for (const paragraph of block.body.split(/\n{2,}/).filter(Boolean)) {
          writeText(paragraph, { size: 10.5, color: NAVY, indent: 14, gap: 4 });
        }
        pdf.setDrawColor(...tone);
        pdf.setLineWidth(3);
        pdf.line(MARGIN, top, MARGIN, Math.min(y, PAGE_HEIGHT - MARGIN));
        y += 10;
        break;
      }
    }
  }

  pdf.save(options.filename ?? documentFilename(options.slug, options.version, "pdf"));
}

/** Kept for the plain-text fallback used in tests and copy actions. */
export function hasFormatting(text: string): boolean {
  return inlineParts(text).some((part) => part.bold || part.italic);
}
