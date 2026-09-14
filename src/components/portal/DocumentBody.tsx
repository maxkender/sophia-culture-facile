import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { inlineParts, MERGE_PLACEHOLDER, type DocBlock, type MergeValues } from "@/lib/documents";

/** Undefined means "show the raw tokens", i.e. the admin editor. */
const MergeContext = createContext<MergeValues | undefined>(undefined);

export function RichText({ text }: { text: string }) {
  const merge = useContext(MergeContext);
  return (
    <>
      {inlineParts(text).map((part, index) => {
        if (part.token) {
          if (!merge) {
            return (
              <span key={index} className="rounded bg-portal-accent/10 px-1 font-mono text-[0.85em] text-portal-accent">
                {part.text}
              </span>
            );
          }
          const value = merge[part.token];
          if (value && String(value).trim()) return <span key={index}>{String(value)}</span>;
          return (
            <span key={index} className="text-brand-navySoft/60 italic">
              [{MERGE_PLACEHOLDER[part.token]}]
            </span>
          );
        }
        if (part.bold) return <strong key={index}>{part.text}</strong>;
        if (part.italic) return <em key={index}>{part.text}</em>;
        return <span key={index}>{part.text}</span>;
      })}
    </>
  );
}

function Callout({ block }: { block: Extract<DocBlock, { type: "callout" }> }) {
  const tone =
    block.tone === "red"
      ? "border-portal-red bg-portal-red/5"
      : "border-portal-accent bg-portal-accent/5";
  const titleTone = block.tone === "red" ? "text-portal-red" : "text-portal-accent";
  return (
    <div className={cn("rounded-portal border-2 p-5", tone)} role={block.tone === "red" ? "alert" : undefined}>
      {block.title ? (
        <p className={cn("text-sm font-extrabold uppercase tracking-wide", titleTone)}>
          <RichText text={block.title} />
        </p>
      ) : null}
      {block.body
        .split(/\n{2,}/)
        .filter(Boolean)
        .map((paragraph, index) => (
          <p key={index} className="mt-2 text-sm leading-7 text-brand-navy">
            <RichText text={paragraph} />
          </p>
        ))}
    </div>
  );
}

/**
 * Renders document blocks exactly as an author sees them. Shared by the author pages and the admin preview.
 * Pass `merge` to fill the {{tokens}}; omit it to show them raw, as the admin editor does.
 */
export function DocumentBody({
  blocks,
  className,
  merge,
}: {
  blocks: DocBlock[];
  className?: string;
  merge?: MergeValues;
}) {
  return (
    <MergeContext.Provider value={merge}>
    <div className={cn("max-w-3xl space-y-5", className)}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return block.level === 3 ? (
              <h4 key={index} className="pt-2 text-sm font-bold uppercase tracking-wide text-brand-navySoft">
                <RichText text={block.text} />
              </h4>
            ) : (
              <h3 key={index} className="pt-4 text-lg font-extrabold text-brand-navy">
                <RichText text={block.text} />
              </h3>
            );
          case "paragraph":
            return (
              <p key={index} className="text-sm leading-7 text-brand-navySoft">
                <RichText text={block.text} />
              </p>
            );
          case "bullets":
            return (
              <ul key={index} className="list-disc space-y-2 pl-5 text-sm leading-7 text-brand-navySoft">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <RichText text={item} />
                  </li>
                ))}
              </ul>
            );
          case "table":
            return (
              <div key={index} className="overflow-x-auto">
                <table className="w-full min-w-lg border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-brand-line">
                      {block.header.map((cell, cellIndex) => (
                        <th key={cellIndex} className="py-3 pr-6 text-xs font-bold uppercase tracking-wide text-brand-navySoft">
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-line">
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="py-3 pr-6 align-top font-semibold text-brand-navy">
                          <RichText text={row[0]} />
                        </td>
                        <td className="py-3 align-top leading-7 text-brand-navySoft">
                          <RichText text={row[1]} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "callout":
            return <Callout key={index} block={block} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
