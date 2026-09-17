import { useState } from "react";
import { Check, ClipboardCopy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { countWords } from "@/lib/portal";

type CopyScreen = { screen_number?: number; screen_title: string | null; body: string | null };
type CopySource = { claim: string | null; reference: string | null; page: string | null };

/**
 * Copies a whole course to the clipboard as plain text, ready to paste into a
 * document or an email. The author's **bold** markup is kept verbatim.
 */
export function CopyCourseButton({
  title,
  subtitle,
  authorName,
  lotCode,
  subjectArea,
  screens,
  sources,
  didYouKnow = [],
}: {
  title: string;
  subtitle?: string | null;
  authorName?: string | null | undefined;
  lotCode?: string | null;
  subjectArea?: string | null;
  screens: CopyScreen[];
  sources: CopySource[];
  didYouKnow?: string[];
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const ordered = [...screens].sort((a, b) => (a.screen_number ?? 0) - (b.screen_number ?? 0));
    const blocks: string[] = [];

    const header = [title.trim()];
    if (subtitle?.trim()) header.push(subtitle.trim());
    blocks.push(header.join("\n"));

    const meta = [authorName?.trim() || null, lotCode?.trim() || null, subjectArea?.trim() || null]
      .filter(Boolean)
      .join(" · ");
    if (meta) blocks.push(meta);

    ordered.forEach((screen, index) => {
      const number = screen.screen_number ?? index + 1;
      const body = (screen.body ?? "").trim();
      blocks.push(`SCREEN ${number} — ${(screen.screen_title ?? "").trim() || "Untitled"}${body ? `\n${body}` : ""}`);
    });

    const sourceLines = sources
      .map((source) => {
        const parts = [source.claim?.trim(), source.reference?.trim()]
          .filter(Boolean)
          .join(" — ");
        const page = source.page?.trim();
        return page ? `${parts}${parts ? ", " : ""}p. ${page}` : parts;
      })
      .filter(Boolean);
    if (sourceLines.length > 0) blocks.push(["SOURCES", ...sourceLines].join("\n"));

    const totalWords = ordered.reduce((sum, screen) => sum + countWords(screen.body), 0);
    blocks.push(`Total: ${totalWords} words`);

    try {
      await navigator.clipboard.writeText(blocks.join("\n\n"));
    } catch {
      toast.error("The course could not be copied.");
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="pillSecondary" size="pillSm" onClick={copy} aria-label="Copy the whole course as plain text">
      {copied ? <Check className="size-4" aria-hidden="true" /> : <ClipboardCopy className="size-4" aria-hidden="true" />}
      {copied ? "Copied" : "Copy course"}
    </Button>
  );
}
