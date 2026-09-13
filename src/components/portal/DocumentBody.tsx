import { cn } from "@/lib/utils";
import { inlineParts, type DocBlock } from "@/lib/documents";

export function RichText({ text }: { text: string }) {
  return (
    <>
      {inlineParts(text).map((part, index) => {
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

/** Renders document blocks exactly as an author sees them. Shared by the author pages and the admin preview. */
export function DocumentBody({ blocks, className }: { blocks: DocBlock[]; className?: string }) {
  return (
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
