import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ExternalLink, MessageSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  COURSE_STATUSES,
  COURSE_WORDS_MAX,
  COURSE_WORDS_MIN,
  SCREEN_NUMBERS,
  STATUS_LABEL,
  WORDS_MAX,
  WORDS_MIN,
  WORDS_WARN,
  type CourseStatus,
} from "@/config/portal";
import { countWords, formatDate, type Course, type Source } from "@/lib/portal";
import { usePortalProfile } from "./usePortal";
import { useMarkNotifications, useNotifications } from "./useNotifications";
import { ExamplesLockNotice } from "./CourseCards";
import { OpenThreadButton } from "./OpenThreadButton";
import { Banner, BoldText, ConfirmButton, PageTitle, PortalCard, StatusPill } from "./ui";
import { AiSuggestions } from "./AiSuggestions";
import { CopyCourseButton } from "./CopyCourseButton";
import { DeleteCourseButton } from "./admin/DeleteCourseButton";

type ScreenDraft = { id: string | null; screen_title: string; body: string; image_idea: string };

const EMPTY_SCREEN: ScreenDraft = { id: null, screen_title: "", body: "", image_idea: "" };

export function CourseEditor({ courseId, admin = false }: { courseId: string; admin?: boolean }) {
  const queryClient = useQueryClient();
  const { data: me } = usePortalProfile();
  const { data: notifications = [] } = useNotifications(admin ? null : me?.profile?.id);
  const markNotifications = useMarkNotifications(me?.profile?.id);

  // Opening the course counts as having seen the change request; the desk reads this back.
  useEffect(() => {
    if (admin) return;
    const unread = notifications
      .filter((item) => item.course_id === courseId && !item.read_at)
      .map((item) => item.id);
    if (unread.length > 0) markNotifications.mutate(unread);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, courseId, notifications]);

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
  const liveStatus = (course?.status ?? "assigned") as CourseStatus;
  const lockedForAuthor = liveStatus === "submitted" || liveStatus === "accepted" || liveStatus === "published";
  const readOnly = admin ? false : lockedForAuthor;

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [meta, setMeta] = useState({ lot_code: "", subject_area: "", brief_note: "", due_date: "", status: "assigned" as CourseStatus });
  const [screens, setScreens] = useState<ScreenDraft[]>(SCREEN_NUMBERS.map(() => ({ ...EMPTY_SCREEN })));
  const [sourceRows, setSourceRows] = useState<Source[]>([]);
  const [didYouKnow, setDidYouKnow] = useState<string[]>([]);
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
    setMeta({
      lot_code: data.course.lot_code ?? "",
      subject_area: data.course.subject_area ?? "",
      brief_note: data.course.brief_note ?? "",
      due_date: data.course.due_date ?? "",
      status: (data.course.status ?? "assigned") as CourseStatus,
    });
    setSourceRows(data.sources);
    setDidYouKnow((data.course.did_you_know ?? []).slice(0, 3));
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

  async function save(options: { silent?: boolean } = {}) {
    if (!course || readOnly || saving) return;
    setSaving(true);
    try {
      const base = {
        title: title.trim() || course.title,
        subtitle: subtitle.trim() || null,
        did_you_know: didYouKnow.map((fact) => fact.trim()).filter(Boolean).slice(0, 3),
      };
      const patch = admin
        ? {
            ...base,
            lot_code: meta.lot_code.trim() || null,
            subject_area: meta.subject_area.trim() || null,
            brief_note: meta.brief_note.trim() || null,
            due_date: meta.due_date || null,
            status: meta.status,
          }
        : liveStatus === "assigned"
          ? { ...base, status: "in_progress" as const }
          : base;

      const { error: courseError } = await supabase.from("courses").update(patch).eq("id", course.id);
      if (courseError) throw courseError;

      for (const [index, screen] of screens.entries()) {
        const payload = {
          course_id: course.id,
          screen_number: index + 1,
          screen_title: screen.screen_title,
          body: screen.body,
          image_idea: screen.image_idea || null,
        };
        if (screen.id) {
          const { error } = await supabase.from("screens").update(payload).eq("id", screen.id);
          if (error) throw error;
        } else if (screen.screen_title.trim() || screen.body.trim()) {
          const { data: inserted, error } = await supabase.from("screens").insert(payload).select("id").single();
          if (error) throw error;
          if (inserted) {
            setScreens((current) =>
              current.map((item, itemIndex) => (itemIndex === index ? { ...item, id: inserted.id } : item)),
            );
          }
        }
      }
      setSavedAt(new Date());
      dirty.current = false;
      await queryClient.invalidateQueries({ queryKey: ["portal", "admin"] });
      if (!options.silent) toast.success("Saved.");
    } catch {
      if (!options.silent) toast.error("The course could not be saved.");
      else toast.error("Autosave failed. Use Save now.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!hydrated.current || readOnly || !dirty.current) return;
    const timer = window.setTimeout(() => void save({ silent: true }), 2000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, subtitle, screens, meta, didYouKnow, readOnly]);

  function patchScreen(index: number, patch: Partial<ScreenDraft>) {
    dirty.current = true;
    setScreens((current) => current.map((screen, i) => (i === index ? { ...screen, ...patch } : screen)));
  }

  async function addSource() {
    if (!course) return;
    const { data: inserted, error } = await supabase
      .from("sources")
      .insert({ course_id: course.id, claim: "", reference: "", page: "" })
      .select("*")
      .single();
    if (error) {
      toast.error("The source could not be added.");
      return;
    }
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
    await save({ silent: true });
    const { error } = await supabase
      .from("courses")
      .update({ status: "submitted", submitted_at: new Date().toISOString(), review_comment: null })
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
      comment: course.title,
    });
    await queryClient.invalidateQueries({ queryKey: ["portal"] });
    toast.success("Course submitted for review.");
  }

  if (isLoading) return <PortalCard><p className="text-sm text-brand-navySoft">Loading…</p></PortalCard>;
  if (!course) return <Banner tone="error" title="Course not found">It may have been deleted by the editorial desk.</Banner>;

  // The examples are a gate: no author opens an editor before reading them.
  if (!admin && me?.profile && !me.profile.examples_reviewed_at) {
    return (
      <div>
        <Link to="/auteurs/courses" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-portal-accent">
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to your courses
        </Link>
        <PageTitle title={course.title} lead={`${course.lot_code ?? "—"} · ${course.subject_area ?? "—"}`} />
        <ExamplesLockNotice />
      </div>
    );
  }

  return (
    <div>
      {admin ? (
        <Link
          to="/auteurs/admin/authors"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-portal-accent"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Authors
        </Link>
      ) : (
        <Link to="/auteurs" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-portal-accent">
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to your courses
        </Link>
      )}

      {liveStatus === "changes_requested" && course.review_comment ? (
        <div className="sticky top-16 z-20 mb-6 rounded-portal border-2 border-portal-amber bg-portal-amber/15 p-5 shadow-portal backdrop-blur">
          <p className="flex items-center gap-2 text-base font-extrabold text-brand-navy">
            <AlertTriangle className="size-5 text-portal-amber" aria-hidden="true" />
            Changes requested by the editorial desk
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-navy">{course.review_comment}</p>
        </div>
      ) : null}

      <PageTitle
        title={course.title}
        lead={`${course.lot_code ?? "—"} · ${course.subject_area ?? "—"} · due ${formatDate(course.due_date)}`}
        action={
          <div className="flex items-center gap-3">
            <StatusPill status={liveStatus} />
            <CopyCourseButton
              title={title || course.title}
              subtitle={subtitle}
              authorName={admin ? null : (me?.profile?.display_name ?? me?.profile?.full_name)}
              lotCode={meta.lot_code || course.lot_code}
              subjectArea={meta.subject_area || course.subject_area}
              screens={screens.map((screen, index) => ({
                screen_number: index + 1,
                screen_title: screen.screen_title,
                body: screen.body,
              }))}
              sources={sourceRows}
            />
            <Button asChild variant="pillSecondary" size="pillSm">
              <a href="/auteurs/examples" target="_blank" rel="noreferrer noopener">
                <ExternalLink className="size-4" aria-hidden="true" />
                See the examples
              </a>
            </Button>
            <Button type="button" variant="pillSecondary" size="pillSm" onClick={() => setPreview((v) => !v)}>
              {preview ? "Edit" : "Preview"}
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {admin ? (
          <Banner tone="info" title="Editing as the editorial desk">
            Your changes overwrite the author's text. The author keeps access according to the status you set here.
          </Banner>
        ) : null}
        {!admin && (liveStatus === "submitted" || liveStatus === "accepted" || liveStatus === "published") ? (
          <Banner tone="info" title="This course is read-only">
            It is with the editorial desk. If changes are requested it reopens automatically.
          </Banner>
        ) : null}

        {!admin ? <AiSuggestions courseId={courseId} /> : null}


        {admin ? (
          <PortalCard className="space-y-4">
            <h2 className="text-lg font-extrabold text-brand-navy">Commission</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="c-lot">Lot code</Label>
                <Input id="c-lot" value={meta.lot_code} className="h-11" onChange={(e) => { dirty.current = true; setMeta({ ...meta, lot_code: e.target.value }); }} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-subject">Subject area</Label>
                <Input id="c-subject" value={meta.subject_area} className="h-11" onChange={(e) => { dirty.current = true; setMeta({ ...meta, subject_area: e.target.value }); }} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-due">Due date</Label>
                <Input id="c-due" type="date" value={meta.due_date} className="h-11" onChange={(e) => { dirty.current = true; setMeta({ ...meta, due_date: e.target.value }); }} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-status">Status</Label>
                <Select value={meta.status} onValueChange={(value) => { dirty.current = true; setMeta({ ...meta, status: value as CourseStatus }); }}>
                  <SelectTrigger id="c-status" className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COURSE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>{STATUS_LABEL[status as CourseStatus]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="c-brief">Brief note</Label>
                <Textarea id="c-brief" rows={3} value={meta.brief_note} onChange={(e) => { dirty.current = true; setMeta({ ...meta, brief_note: e.target.value }); }} />
              </div>
            </div>
          </PortalCard>
        ) : course.brief_note ? (
          <PortalCard className="border-l-4 border-portal-accent">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Brief from the editorial desk</p>
            <p className="mt-2 text-sm leading-relaxed text-brand-navy">{course.brief_note}</p>
          </PortalCard>
        ) : null}

        <PortalCard className="flex flex-wrap items-center justify-between gap-4 bg-portal-bg shadow-none ring-1 ring-brand-line">
          <div className="min-w-0">
            <p className="text-sm font-bold text-brand-navy">
              {admin ? "Talk to the author about this course" : "Message us about this course"}
            </p>
            <p className="mt-1 text-sm text-brand-navySoft">
              {admin
                ? "Opens the thread attached to this course."
                : "A question on the angle, a source or the deadline. It opens the thread for this course."}
            </p>
          </div>
          {admin ? (
            course.author_id ? (
              <OpenThreadButton profileId={course.author_id} courseId={course.id} label="Open the thread" />
            ) : (
              <span className="text-sm text-brand-navySoft">No author assigned yet.</span>
            )
          ) : (
            <Button asChild variant="pillSecondary" size="pillSm">
              <Link to="/auteurs/messages" search={{ course: course.id }}>
                <MessageSquare className="size-4" aria-hidden="true" /> Open the thread
              </Link>
            </Button>
          )}
        </PortalCard>

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
              <p className="text-sm text-brand-navySoft">
                No source yet. Add one for every factual claim a reader could challenge.
              </p>
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
                    <ConfirmButton
                      label="Remove source"
                      title="Remove this source?"
                      description="The claim, reference and page will be deleted."
                      confirmLabel="Remove"
                      onConfirm={() => removeSource(row.id)}
                      trigger={
                        <Button type="button" variant="ghost" size="icon" aria-label="Remove source">
                          <Trash2 className="size-4" />
                        </Button>
                      }
                    />
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
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="pillSecondary" size="pillSm" disabled={saving} onClick={() => save()}>
                Save now
              </Button>
              {!admin ? (
                <Button type="button" variant="pill" size="pillSm" disabled={!complete} onClick={submit}>
                  Submit for review
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
        {!admin && !complete && !readOnly ? (
          <p className="text-right text-xs text-brand-navySoft">
            Every screen needs a title and a body before you can submit.
          </p>
        ) : null}
        {admin ? (
          <div className="pt-6 text-right">
            <DeleteCourseButton
              courseId={courseId}
              title={course.title}
              status={liveStatus}
              redirectTo="/auteurs/admin/courses"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
