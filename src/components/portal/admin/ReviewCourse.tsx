import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { countWords, formatDate, formatDateTime, type Course, type Profile, type Screen, type Source } from "@/lib/portal";
import { SeenBadge, useChangeRequestSeen } from "../SeenStatus";
import { SCREEN_NUMBERS } from "@/config/portal";
import { usePortalProfile } from "../usePortal";
import { Banner, BoldText, PageTitle, PortalCard } from "../ui";
import { PublishControls } from "./PublishControls";
import { AiReviewPanel } from "./AiReviewPanel";
import { CopyCourseButton } from "../CopyCourseButton";
import { DeleteCourseButton } from "./DeleteCourseButton";

export function ReviewCourse({ courseId }: { courseId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: me } = usePortalProfile();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["portal", "admin", "review", courseId],
    queryFn: async () => {
      const [{ data: course }, { data: screens }, { data: sources }] = await Promise.all([
        supabase.from("courses").select("*").eq("id", courseId).maybeSingle(),
        supabase.from("screens").select("*").eq("course_id", courseId).order("screen_number"),
        supabase.from("sources").select("*").eq("course_id", courseId).order("created_at"),
      ]);
      const typedCourse = (course ?? null) as Course | null;
      let author: Profile | null = null;
      if (typedCourse?.author_id) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", typedCourse.author_id).maybeSingle();
        author = (profile ?? null) as Profile | null;
      }
      return { course: typedCourse, screens: (screens ?? []) as Screen[], sources: (sources ?? []) as Source[], author };
    },
  });

  const course = data?.course ?? null;
  const { data: seen } = useChangeRequestSeen(course?.status === "changes_requested" ? [course.id] : []);

  /**
   * A decision can also be reversed: an acceptance clicked by mistake can be reopened
   * with notes, and notes sent by mistake can be turned into an acceptance. The author
   * is notified automatically by the database trigger on the status change.
   */
  async function decide(
    action: "accepted" | "changes_requested",
    kind: "decision" | "reopened" | "accepted_after_changes" = "decision",
  ) {
    if (!course) return;
    if (action === "changes_requested" && comment.trim().length < 3) {
      toast.error("Add a comment explaining the changes.");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("courses")
      .update({
        status: action,
        review_comment: action === "changes_requested" ? comment.trim() : null,
      })
      .eq("id", course.id);
    if (error) {
      setBusy(false);
      toast.error("The decision could not be saved.");
      return;
    }
    const logAction =
      kind === "reopened"
        ? "Reopened after acceptance"
        : kind === "accepted_after_changes"
          ? "Accepted after changes were requested"
          : action;
    await supabase.from("activity_log").insert({
      actor_id: me?.profile?.id ?? null,
      entity: "course",
      entity_id: course.id,
      action: logAction,
      comment: action === "changes_requested" ? comment.trim() : null,
    });
    await queryClient.invalidateQueries({ queryKey: ["portal"] });
    setBusy(false);
    toast.success(action === "accepted" ? "Course accepted." : "Changes requested.");
    await navigate({ to: "/auteurs/admin/review" });
  }

  if (!course) return <Banner tone="error" title="Course not found" />;

  const totalWords = (data?.screens ?? []).reduce((sum, screen) => sum + countWords(screen.body), 0);

  return (
    <div>
      <Link to="/auteurs/admin/review" className="mb-6 inline-block text-sm font-semibold text-portal-accent">
        ← Review queue
      </Link>
      <PageTitle
        title={course.title}
        lead={`${data?.author?.full_name ?? "Unassigned"} · ${course.lot_code ?? "—"} · ${course.subject_area ?? "—"} · due ${formatDate(course.due_date)}`}
        action={
          <CopyCourseButton
            title={course.title}
            subtitle={course.subtitle}
            authorName={data?.author?.full_name}
            lotCode={course.lot_code}
            subjectArea={course.subject_area}
            screens={data?.screens ?? []}
            sources={data?.sources ?? []}
            didYouKnow={course.did_you_know ?? []}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          {course.subtitle ? <p className="text-base text-brand-navySoft">{course.subtitle}</p> : null}
          {SCREEN_NUMBERS.map((number) => {
            const screen = (data?.screens ?? []).find((item) => item.screen_number === number);
            return (
              <PortalCard key={number}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Screen {number}</p>
                  <p className="text-xs text-brand-navySoft">{countWords(screen?.body)} words</p>
                </div>
                <h2 className="mt-2 text-lg font-extrabold text-brand-navy">{screen?.screen_title || "Untitled"}</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-brand-navy">
                  <BoldText text={screen?.body ?? ""} />
                </p>
                {screen?.image_idea ? (
                  <p className="mt-3 text-xs italic text-brand-navySoft">Image idea: {screen.image_idea}</p>
                ) : null}
              </PortalCard>
            );
          })}

          {(course.did_you_know ?? []).length > 0 ? (
            <PortalCard className="bg-portal-bg shadow-none ring-1 ring-brand-line">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Did you know?</p>
              <ul className="mt-3 space-y-2">
                {(course.did_you_know ?? []).map((fact, index) => (
                  <li key={index} className="text-sm leading-relaxed text-brand-navy">
                    <BoldText text={fact} />
                  </li>
                ))}
              </ul>
            </PortalCard>
          ) : null}
        </div>

        <div className="space-y-5">
          <PublishControls course={course} />

          <AiReviewPanel course={course} screens={data?.screens ?? []} />

          {course.status === "changes_requested" ? (
            <PortalCard>
              <h2 className="text-sm font-bold text-brand-navy">Change request</h2>
              <p className="mt-2 text-xs text-brand-navySoft">
                Sent {formatDateTime(seen?.[course.id]?.created_at ?? null)}
              </p>
              <p className="mt-2">
                <SeenBadge info={seen?.[course.id]} />
              </p>
            </PortalCard>
          ) : null}

          <PortalCard>
            <h2 className="text-sm font-bold text-brand-navy">Course total</h2>
            <p className="mt-2 text-3xl font-extrabold text-brand-navy">{totalWords} words</p>
          </PortalCard>

          <PortalCard>
            <h2 className="text-sm font-bold text-brand-navy">Sources</h2>
            {(data?.sources ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-brand-navySoft">No sources provided.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {(data?.sources ?? []).map((source) => (
                  <li key={source.id} className="text-sm">
                    <p className="font-semibold text-brand-navy">{source.claim}</p>
                    <p className="text-brand-navySoft">
                      {source.reference}
                      {source.page ? `, p. ${source.page}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </PortalCard>

          <PortalCard>
            <h2 className="text-sm font-bold text-brand-navy">Decision</h2>
            {course.status === "published" ? (
              <p className="mt-3 text-sm text-brand-navySoft">
                This course is published. Unpublish it first to change the decision.
              </p>
            ) : (
              <>
                <Textarea
                  rows={5}
                  className="mt-3"
                  placeholder="Comment for the author (required to request changes)"
                  aria-label="Review comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  {course.status === "accepted" ? (
                    <Button
                      type="button"
                      variant="pillSecondary"
                      size="pillSm"
                      disabled={busy}
                      onClick={() => decide("changes_requested", "reopened")}
                    >
                      Reopen for changes
                    </Button>
                  ) : course.status === "changes_requested" ? (
                    <Button
                      type="button"
                      variant="pill"
                      size="pillSm"
                      disabled={busy}
                      onClick={() => decide("accepted", "accepted_after_changes")}
                    >
                      Accept anyway
                    </Button>
                  ) : (
                    <>
                      <Button type="button" variant="pill" size="pillSm" disabled={busy} onClick={() => decide("accepted")}>
                        Accept
                      </Button>
                      <Button
                        type="button"
                        variant="pillSecondary"
                        size="pillSm"
                        disabled={busy}
                        onClick={() => decide("changes_requested")}
                      >
                        Request changes
                      </Button>
                    </>
                  )}
                </div>
                {course.status === "accepted" ? (
                  <p className="mt-3 text-xs text-brand-navySoft">
                    The author is notified, your notes appear at the top of their course, and the activity log
                    records who reopened it.
                  </p>
                ) : null}
              </>
            )}
          </PortalCard>

          <div className="pt-2 text-right">
            <DeleteCourseButton
              courseId={course.id}
              title={course.title}
              authorName={data?.author?.full_name ?? null}
              status={course.status}
              redirectTo="/auteurs/admin/review"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
