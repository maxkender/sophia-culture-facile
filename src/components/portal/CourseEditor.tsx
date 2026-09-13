import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COURSE_WORDS_MAX, COURSE_WORDS_MIN, SCREEN_NUMBERS, WORDS_MAX, WORDS_MIN, WORDS_WARN, type CourseStatus } from "@/config/portal";
import { countWords, formatDate, type Course, type Source } from "@/lib/portal";
import { usePortalProfile } from "./usePortal";
import { Banner, BoldText, PageTitle, PortalCard, StatusPill } from "./ui";

type ScreenDraft = { id: string | null; screen_title: string; body: string; image_idea: string };

const EMPTY_SCREEN: ScreenDraft = { id: null, screen_title: "", body: "", image_idea: "" };

export function CourseEditor({ courseId }: { courseId: string }) {
  const queryClient = useQueryClient();
  const { data: me } = usePortalProfile();
  const signed = Boolean(me?.signedAt);

  const { data, isLoading } = useQuery({
    queryKey: ["portal", "course", courseId],
    queryFn: async () => {
      const [{ data: course, error: courseError }, { data: screens }, { data: sources }] = await Promise.all([
        supabase.from("courses").select("*").eq("id", courseId).maybeSingle(),
        supabase.from("screens").select("*").eq("course_id", courseId).order("screen_number"),
        supabase.from("sources").select("*").eq("course_id", courseId).order("created_at"),
      ]);
      if (courseError) throw courseError;
      return { course: (course ?? null) as Course | null, screens: screens ?? [], sources: (sources ?? []) as Source[] };
    },
  });

  const course = data?.course ?? null;
  const status = (course?.status ?? "assigned") as CourseStatus;
  const readOnly = !signed || status === "submitted" || status === "accepted" || status === "published";

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [screens, setScreens] = useState<ScreenDraft[]>(SCREEN_NUMBERS.map(() => ({ ...EMPTY_SCREEN })));
  const [sourceRows, setSourceRows] = useState<Source[]>([]);
  const [preview, setPreview] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const hydrated = useRef(false);
  const dirty = useRef(false);

  useEffect(() => {
    if (!data?.course || hydrated.current) return;
    hydrated.current = true;
    setTitle(data.course.title ?? "");
    setSubtitle(data.course.subtitle ?? "");
    setSourceRows(data.sources);
    setScreens(
      SCREEN_NUMBERS.map((number) => {
        const existing = data.screens.find((screen) => screen.screen_number === number);
        return existing
          ? {
              id: existing.id,
              screen_title: existing.screen_title ?? "",
              body: existing.body ?? "",
              image_idea: existing.image_idea ?? "",
            }
          : { ...EMPTY_SCREEN };
      }),
    );
  }, [data]);

  const totalWords = useMemo(() => screens.reduce((sum, screen) => sum + countWords(screen.body), 0), [screens]);
  const complete = screens.every((screen) => screen.screen_title.trim() && screen.body.trim());

  async function save() {
    if (!course || readOnly) return;
    setSaving(true);
    try {
      await supabase
        .from("courses")
        .update({
          title: title.trim() || course.title,
          subtitle: subtitle.trim() || null,
          status: status === "assigned" ? "in_progress" : status,
        })
        .eq("id", course.id);

      for (const [index, screen] of screens.entries()) {
        const payload = {
          course_id: course.id,
          screen_number: index + 1,
          screen_title: screen.screen_title,
          body: screen.body,
          image_idea: screen.image_idea || null,
        };
        if (screen.id) {
          await supabase.from("screens").update(payload).eq("id", screen.id);
        } else {
          const { data: inserted } = await supabase.from("screens").insert(payload).select("id").single();
          if (inserted) {
            setScreens((current) =>
              current.map((item, itemIndex) => (itemIndex === index ? { ...item, id: inserted.id } : item)),
            );
          }
        }
      }
      setSavedAt(new Date());
      dirty.current = false;
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!hydrated.current || readOnly || !dirty.current) return;
    const timer = window.setTimeout(() => void save(), 2000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, subtitle, screens, readOnly]);

  function patchScreen(index: number, patch: Partial<ScreenDraft>) {
    dirty.current = true;
    setScreens((current) => current.map((screen, i) => (i === index ? { ...screen, ...patch } : screen)));
  }

  async function addSource() {
    if (!course) return;
    const { data: inserted } = await supabase
      .from("sources")
      .insert({ course_id: course.id, claim: "", reference: "", page: "" })
      .select("*")
      .single();
    if (inserted) setSourceRows((current) => [...current, inserted as Source]);
  }

  async function updateSource(id: string, patch: Partial<Source>) {
    setSourceRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    await supabase.from("sources").update(patch).eq("id", id);
  }

  async function removeSource(id: string) {
    setSourceRows((current) => current.filter((row) => row.id !== id));
    await supabase.from("sources").delete().eq("id", id);
  }

  async function submit() {
    if (!course || !complete) return;
    await save();
    const { error } = await supabase
      .from("courses")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", course.id);
    if (error) {
      toast.error("The course could not be submitted.");
      return;
    }
    await supabase.from("activity_log").insert({
      actor_id: me?.profile?.id ?? null,
      entity: "course",
      entity_id: course.id,
      action: "submitted",
    });
    await queryClient.invalidateQueries({ queryKey: ["portal"] });
    toast.success("Course submitted for review.");
  }

  if (isLoading) return <PortalCard><p className="text-sm text-brand-navySoft">Loading…</p></PortalCard>;
  if (!course) return <Banner tone="error" title="Course not found" />;

  return (
    <div>
      <Link to="/auteurs" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-portal-accent">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to your courses
      </Link>

      <PageTitle
        title={course.title}
        lead={`${course.lot_code ?? "—"} · ${course.subject_area ?? "—"} · due ${formatDate(course.due_date)}`}
        action={
          <div className="flex items-center gap-3">
            <StatusPill status={status} />
            <Button type="button" variant="pillSecondary" size="pillSm" onClick={() => setPreview((v) => !v)}>
              {preview ? "Edit" : "Preview"}
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {status === "changes_requested" && course.review_comment ? (
          <Banner tone="warning" title="Changes requested">{course.review_comment}</Banner>
        ) : null}
        {!signed ? (
          <Banner tone="warning" title="Sign the author agreement to start writing">
            Your course stays visible and read-only until the agreement is signed.{" "}
            <Link to="/auteurs/contract" className="font-bold text-portal-accent underline-offset-4 hover:underline">
              Read and sign
            </Link>
            .
          </Banner>
        ) : null}
        {signed && (status === "submitted" || status === "accepted" || status === "published") ? (
          <Banner tone="info" title="This course is read-only">
            It is with the editorial desk. If changes are requested it reopens automatically.
          </Banner>
        ) : null}

        {course.brief_note ? (
          <PortalCard className="border-l-4 border-portal-accent">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Brief from the editorial desk</p>
            <p className="mt-2 text-sm leading-relaxed text-brand-navy">{course.brief_note}</p>
          </PortalCard>
        ) : null}

        <PortalCard className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course-title">Title</Label>
            <Input
              id="course-title"
              value={title}
              disabled={readOnly}
              maxLength={160}
              onChange={(event) => {
                dirty.current = true;
                setTitle(event.target.value);
              }}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course-subtitle">Subtitle</Label>
            <Input
              id="course-subtitle"
              value={subtitle}
              disabled={readOnly}
              maxLength={200}
              onChange={(event) => {
                dirty.current = true;
                setSubtitle(event.target.value);
              }}
              className="h-11"
            />
          </div>
        </PortalCard>

        {screens.map((screen, index) => {
          const words = countWords(screen.body);
          const over = words > WORDS_WARN;
          return (
            <PortalCard key={index} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-brand-navy">Screen {index + 1}</h2>
                <span className={`text-sm font-semibold ${over ? "text-portal-amber" : "text-brand-navySoft"}`}>
                  {words} words · target {WORDS_MIN}–{WORDS_MAX}
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`screen-title-${index}`}>Screen title</Label>
                <Input
                  id={`screen-title-${index}`}
                  value={screen.screen_title}
                  disabled={readOnly}
                  maxLength={120}
                  onChange={(event) => patchScreen(index, { screen_title: event.target.value })}
                  className="h-11"
                />
              </div>
              {preview ? (
                <div className="rounded-xl bg-portal-bg p-5 text-sm leading-7 whitespace-pre-wrap text-brand-navy">
                  <BoldText text={screen.body || "Nothing written yet."} />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor={`screen-body-${index}`}>Body</Label>
                  <Textarea
                    id={`screen-body-${index}`}
                    value={screen.body}
                    disabled={readOnly}
                    rows={7}
                    onChange={(event) => patchScreen(index, { body: event.target.value })}
                  />
                  <p className="text-xs text-brand-navySoft">Use **double asterisks** for bold. No other formatting.</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor={`screen-image-${index}`}>Image idea (optional)</Label>
                <Input
                  id={`screen-image-${index}`}
                  value={screen.image_idea}
                  disabled={readOnly}
                  maxLength={200}
                  onChange={(event) => patchScreen(index, { image_idea: event.target.value })}
                  className="h-11"
                />
              </div>
            </PortalCard>
          );
        })}

        <PortalCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-brand-navy">Sources</h2>
              <p className="mt-1 text-sm text-brand-navySoft">Optional, but strongly encouraged for factual claims.</p>
            </div>
            {!readOnly ? (
              <Button type="button" variant="pillSecondary" size="pillSm" onClick={addSource}>
                <Plus className="size-4" /> Add source
              </Button>
            ) : null}
          </div>
          <div className="mt-5 space-y-3">
            {sourceRows.length === 0 ? (
              <p className="text-sm text-brand-navySoft">No sources yet.</p>
            ) : (
              sourceRows.map((row) => (
                <div key={row.id} className="grid gap-3 md:grid-cols-[2fr_2fr_100px_auto]">
                  <Input
                    aria-label="Claim"
                    placeholder="Claim"
                    disabled={readOnly}
                    value={row.claim ?? ""}
                    onChange={(event) => updateSource(row.id, { claim: event.target.value })}
                    className="h-11"
                  />
                  <Input
                    aria-label="Reference"
                    placeholder="Reference"
                    disabled={readOnly}
                    value={row.reference ?? ""}
                    onChange={(event) => updateSource(row.id, { reference: event.target.value })}
                    className="h-11"
                  />
                  <Input
                    aria-label="Page"
                    placeholder="Page"
                    disabled={readOnly}
                    value={row.page ?? ""}
                    onChange={(event) => updateSource(row.id, { page: event.target.value })}
                    className="h-11"
                  />
                  {!readOnly ? (
                    <Button type="button" variant="ghost" size="icon" aria-label="Remove source" onClick={() => removeSource(row.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </PortalCard>

        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-4 rounded-portal bg-card p-5 shadow-portal">
          <p className="text-sm text-brand-navySoft">
            {totalWords} words in total · target {COURSE_WORDS_MIN}–{COURSE_WORDS_MAX}
            {readOnly ? "" : saving ? " · Saving…" : savedAt ? ` · Saved at ${savedAt.toLocaleTimeString("en-GB")}` : ""}
          </p>
          {!readOnly ? (
            <Button type="button" variant="pill" size="pillSm" disabled={!complete} onClick={submit}>
              Submit for review
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
