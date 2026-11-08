import { Fragment } from "react";
import { ImageIcon, Lightbulb, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { inlineSpans, type Block, type StudioCourseContent } from "@/lib/studio/course-format";

/** Reader labels follow the course language (French for fr, English otherwise). */
function labels(lang: string) {
  return lang === "fr"
    ? { fact: "Le saviez-vous ?", take: "À retenir", free: "Gratuit", sources: "Sources" }
    : { fact: "Did you know?", take: "Key takeaway", free: "Free", sources: "Sources" };
}

export function Inline({ text }: { text: string }) {
  return (
    <>
      {inlineSpans(text).map((s, i) => {
        const node = s.term ? (
          <span className="underline decoration-portal-accent decoration-dotted decoration-2 underline-offset-4">{s.text}</span>
        ) : (
          s.text
        );
        return s.bold ? <strong key={i} className="font-bold text-brand-navy">{node}</strong> : <Fragment key={i}>{node}</Fragment>;
      })}
    </>
  );
}

function PreviewBlock({ b, l }: { b: Block; l: ReturnType<typeof labels> }) {
  switch (b.type) {
    case "paragraph":
      return <p className="text-[15px] leading-relaxed text-brand-navySoft"><Inline text={b.text} /></p>;
    case "heading":
      return <h4 className="pt-1 text-base font-extrabold text-brand-navy">{b.text}</h4>;
    case "image":
      return (
        <figure className={cn(b.fullBleed && "-mx-5")}>
          {b.image_url ? (
            <img src={b.image_url} alt={b.caption ?? ""} loading="lazy" className={cn("w-full object-cover", !b.fullBleed && "rounded-xl")} />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl bg-brand-surfaceStrong text-brand-navySoft"><ImageIcon className="size-6" /></div>
          )}
          {b.caption || b.credit?.author ? (
            <figcaption className="mt-1.5 text-xs text-brand-navySoft">
              {b.caption}
              {b.credit?.author ? <span className="opacity-70"> · {b.credit.author}{b.credit.license ? `, ${b.credit.license}` : ""}</span> : null}
            </figcaption>
          ) : null}
        </figure>
      );
    case "timeline":
      return (
        <ol className="relative ml-2 space-y-3 border-l-2 border-brand-line pl-4">
          {(b.events ?? []).map((e, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[23px] top-1 size-3 rounded-full border-2 border-card bg-portal-accent" />
              <p className="text-xs font-bold uppercase tracking-wide text-portal-accent">{e.date}</p>
              <p className="text-sm font-bold text-brand-navy">{e.title}</p>
              {e.detail ? <p className="text-sm text-brand-navySoft">{e.detail}</p> : null}
            </li>
          ))}
        </ol>
      );
    case "funFact":
      return (
        <div className="rounded-xl bg-portal-amber/12 p-4">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-brand-navy"><Lightbulb className="size-4 text-portal-amber" />{l.fact}</p>
          <p className="text-sm leading-relaxed text-brand-navy"><Inline text={b.text} /></p>
        </div>
      );
    case "takeaway":
      return (
        <div className="rounded-xl bg-brand-navy p-4 text-brand-onNavy">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide"><Sparkles className="size-4" />{l.take}</p>
          <p className="text-sm font-semibold leading-relaxed [&_strong]:text-brand-onNavy">{inlineSpans(b.text).map((s, i) => (s.bold ? <strong key={i}>{s.text}</strong> : <span key={i} className={s.term ? "underline decoration-dotted underline-offset-4" : ""}>{s.text}</span>))}</p>
        </div>
      );
    case "quote":
      return (
        <blockquote className="border-l-4 border-brand-pink pl-4">
          <p className="text-[15px] italic leading-relaxed text-brand-navy"><Inline text={b.text} /></p>
          {b.attribution ? <footer className="mt-1 text-xs font-semibold text-brand-navySoft">{b.attribution}</footer> : null}
        </blockquote>
      );
  }
}

/** The course as the app reader shows it. */
export function StudioPreview({ content, lang, className }: { content: StudioCourseContent; lang: string; className?: string }) {
  const l = labels(lang);
  return (
    <div className={cn("space-y-3 bg-portal-bg p-3", className)} dir={lang === "ar" || lang === "he" ? "rtl" : undefined}>
      <div className="overflow-hidden rounded-2xl bg-card shadow-portal">
        {content.hero?.image_url ? (
          <img src={content.hero.image_url} alt="" className="aspect-video w-full object-cover" />
        ) : (
          <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-brand-navy to-brand-blue text-brand-onNavy/70"><ImageIcon className="size-7" /></div>
        )}
        <div className="space-y-1.5 p-5">
          {content.subtitle ? <p className="text-xs font-bold uppercase tracking-wide text-portal-accent">{content.subtitle}</p> : null}
          <h2 className="text-xl font-extrabold leading-tight text-brand-navy">{content.title || "…"}</h2>
          {content.hero?.hook ? <p className="text-sm font-semibold text-brand-navy">{content.hero.hook}</p> : null}
          {content.description ? <p className="text-sm text-brand-navySoft"><Inline text={content.description} /></p> : null}
        </div>
      </div>
      {content.sections.map((s, i) => (
        <section key={s._key ?? i} className="space-y-3 rounded-2xl bg-card p-5 shadow-portal">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-extrabold leading-snug text-brand-navy">{s.title || "…"}</h3>
            {i === 0 ? <span className="shrink-0 rounded-full bg-portal-green/10 px-2 py-0.5 text-[10px] font-bold uppercase text-portal-green">{l.free}</span> : null}
          </div>
          {s.blocks.map((b, j) => <PreviewBlock key={b._key ?? j} b={b} l={l} />)}
        </section>
      ))}
      {content.sources.length ? (
        <div className="rounded-2xl bg-card p-5 shadow-portal">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-brand-navy">{l.sources}</p>
          <ul className="space-y-1 text-xs text-brand-navySoft">{content.sources.map((s, i) => <li key={i}>{s.text}</li>)}</ul>
        </div>
      ) : null}
    </div>
  );
}
