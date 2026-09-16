import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { runAiReview } from "@/lib/aiReview.functions";
import { ACCESSIBILITY_LABEL, courseContentHash, type AiReviewRow } from "@/lib/aiReview";
import { formatDateTime, type Course, type Screen } from "@/lib/portal";
import { PortalCard } from "../ui";

function useLatestReview(courseId: string) {
  return useQuery({
    queryKey: ["portal", "ai-review", courseId],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_reviews")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data ?? null) as AiReviewRow | null;
    },
  });
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-brand-line pt-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">{title}</h3>
      {hint ? <p className="mt-1 text-xs text-brand-navySoft">{hint}</p> : null}
      <div className="mt-3 space-y-3 text-sm text-brand-navy">{children}</div>
    </section>
  );
}

const FLAG_CLASS: Record<string, string> = {
  ok: "text-portal-green",
  short: "text-portal-amber",
  long: "text-portal-amber",
  empty: "text-portal-red",
};

/** Read-only sections an author may see, if the desk shares the review. */
export function AiReviewShareable({ review }: { review: AiReviewRow }) {
  const { register, accessibility } = review.result;
  return (
    <div className="space-y-5">
      <Section title="Wording" hint="Phrases that sit outside the house voice.">
        {register.length === 0 ? (
          <p className="text-brand-navySoft">Nothing flagged.</p>
        ) : (
          register.map((item, index) => (
            <div key={index} className="rounded-portal bg-portal-bg p-3">
              <p className="text-xs font-semibold text-brand-navySoft">Screen {item.screen}</p>
              <p className="mt-1 italic">“{item.quote}”</p>
              <p className="mt-1 text-brand-navySoft">{item.issue}</p>
              <p className="mt-1">Suggested: {item.rewrite}</p>
            </div>
          ))
        )}
      </Section>
      <Section title="Readability" hint="Where a reader with no background may stall.">
        {accessibility.length === 0 ? (
          <p className="text-brand-navySoft">Nothing flagged.</p>
        ) : (
          accessibility.map((item, index) => (
            <div key={index} className="rounded-portal bg-portal-bg p-3">
              <p className="text-xs font-semibold text-brand-navySoft">
                Screen {item.screen} · {ACCESSIBILITY_LABEL[item.kind] ?? item.kind}
              </p>
              {item.quote ? <p className="mt-1 italic">“{item.quote}”</p> : null}
              <p className="mt-1 text-brand-navySoft">{item.note}</p>
            </div>
          ))
        )}
      </Section>
    </div>
  );
}

export function AiReviewPanel({ course, screens }: { course: Course; screens: Screen[] }) {
  const queryClient = useQueryClient();
  const { data: review, isLoading } = useLatestReview(course.id);
  const run = useServerFn(runAiReview);
  const [busy, setBusy] = useState(false);

  const currentHash = courseContentHash({ title: course.title, subtitle: course.subtitle, screens });
  const stale = review ? review.content_hash !== currentHash : false;

  async function go(force: boolean) {
    setBusy(true);
    try {
      await run({ data: { courseId: course.id, force } });
      await queryClient.invalidateQueries({ queryKey: ["portal", "ai-review", course.id] });
      toast.success("AI review ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The review could not be run.");
    } finally {
      setBusy(false);
    }
  }

  async function share(value: boolean) {
    if (!review) return;
    const { error } = await supabase.from("ai_reviews").update({ shared_with_author: value }).eq("id", review.id);
    if (error) {
      toast.error("The setting could not be saved.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["portal", "ai-review", course.id] });
  }

  return (
    <PortalCard>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-brand-navy">
          <Sparkles className="size-4 text-portal-accent" />
          AI first pass
        </h2>
        <Button
          type="button"
          variant={review ? "pillSecondary" : "pill"}
          size="pillSm"
          disabled={busy}
          onClick={() => void go(Boolean(review))}
        >
          {busy ? "Reading…" : review ? "Run again" : "Run AI review"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-brand-navySoft">
        Guidance for you, not a verdict. It never changes the status, never reaches the author on its own, and never
        blocks acceptance.
      </p>

      {isLoading ? <p className="mt-4 text-sm text-brand-navySoft">Loading…</p> : null}

      {!isLoading && !review ? (
        <p className="mt-4 text-sm text-brand-navySoft">No review yet for this course.</p>
      ) : null}

      {review ? (
        <div className="mt-5 space-y-5">
          <p className="text-xs text-brand-navySoft">
            {formatDateTime(review.created_at)} · {review.model}
            {stale ? " · the course has changed since — run again" : ""}
          </p>

          <Section title="Length">
            <ul className="space-y-1">
              {review.result.length.screens.map((item) => (
                <li key={item.screen} className="flex justify-between">
                  <span>Screen {item.screen}</span>
                  <span className={FLAG_CLASS[item.flag] ?? ""}>
                    {item.words} words{item.flag === "ok" ? "" : ` · ${item.flag}`}
                  </span>
                </li>
              ))}
              <li className="flex justify-between border-t border-brand-line pt-1 font-bold">
                <span>Total</span>
                <span className={FLAG_CLASS[review.result.length.total.flag] ?? ""}>
                  {review.result.length.total.words} words
                  {review.result.length.total.flag === "ok" ? "" : ` · ${review.result.length.total.flag}`}
                </span>
              </li>
            </ul>
          </Section>

          <Section title="Structure">
            <ul className="space-y-2">
              {review.result.structure.map((item, index) => (
                <li key={index}>
                  <span className={item.verdict === "pass" ? "text-portal-green" : "text-portal-amber"}>
                    {item.verdict === "pass" ? "Pass" : "Flag"}
                  </span>{" "}
                  — <span className="font-semibold">{item.check}.</span> {item.note}
                </li>
              ))}
            </ul>
          </Section>

          <AiReviewShareable review={review} />

          <Section
            title="Claims to verify"
            hint="Pointers for a human check. The model does not verify facts and never says a claim is wrong. Never shared with the author."
          >
            {review.result.claims.length === 0 ? (
              <p className="text-brand-navySoft">Nothing flagged.</p>
            ) : (
              review.result.claims.map((item, index) => (
                <div key={index} className="rounded-portal border border-portal-amber/30 bg-portal-amber/5 p-3">
                  <p className="text-xs font-semibold text-brand-navySoft">Screen {item.screen}</p>
                  <p className="mt-1 font-semibold">{item.claim}</p>
                  <p className="mt-1 text-brand-navySoft">{item.why}</p>
                  <p className="mt-1 text-xs text-brand-navySoft">Author's sources: {item.source_coverage}</p>
                </div>
              ))
            )}
          </Section>

          <Section title="Overall">
            <p className="leading-relaxed">{review.result.overall}</p>
          </Section>

          <div className="flex items-start justify-between gap-4 border-t border-brand-line pt-4">
            <div>
              <p className="text-sm font-semibold text-brand-navy">Share with author</p>
              <p className="mt-1 text-xs text-brand-navySoft">
                Shows the wording and readability notes on the author's course page, labelled as automated
                suggestions. The claims to verify are never shared.
              </p>
            </div>
            <Switch
              checked={review.shared_with_author}
              onCheckedChange={(value) => void share(value)}
              aria-label="Share the AI suggestions with the author"
            />
          </div>
        </div>
      ) : null}
    </PortalCard>
  );
}

/** Compact runner for the review queue. */
export function AiReviewQueueButton({ courseId }: { courseId: string }) {
  const queryClient = useQueryClient();
  const run = useServerFn(runAiReview);
  const [busy, setBusy] = useState(false);
  const { data: review } = useLatestReview(courseId);

  async function go() {
    setBusy(true);
    try {
      await run({ data: { courseId, force: false } });
      await queryClient.invalidateQueries({ queryKey: ["portal", "ai-review", courseId] });
      toast.success("AI review ready — open the course to read it.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The review could not be run.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="pillSecondary" size="pillSm" disabled={busy} onClick={() => void go()}>
      <Sparkles className="size-4" />
      {busy ? "Reading…" : review ? "AI review ready" : "Run AI review"}
    </Button>
  );
}
