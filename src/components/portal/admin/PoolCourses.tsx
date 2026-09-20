import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SUBJECT_AREAS, subjectLabel } from "@/config/subjects";
import { formatDate, formatDateTime, type Course, type Profile } from "@/lib/portal";
import { usePortalProfile } from "../usePortal";
import { EmptyState, PageTitle, PortalCard } from "../ui";
import { DeleteCourseButton } from "./DeleteCourseButton";

type RequestRow = {
  id: string;
  course_id: string;
  profile_id: string;
  note: string;
  status: string;
  created_at: string;
  decided_at: string | null;
  decline_reason: string | null;
};

type ProposalRow = {
  id: string;
  profile_id: string;
  title: string;
  subtitle: string | null;
  subject_area: string | null;
  reveal: string;
  status: string;
  decline_reason: string | null;
  created_at: string;
};

export function PoolCourses() {
  const queryClient = useQueryClient();
  const { data: me } = usePortalProfile();
  const [subject, setSubject] = useState("all");
  const [authorFilter, setAuthorFilter] = useState("all");
  const [bulk, setBulk] = useState("");
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    subject_area: "",
    lot_code: "",
    brief_note: "",
  });

  const { data } = useQuery({
    queryKey: ["portal", "admin", "pool"],
    queryFn: async () => {
      const [{ data: courses }, { data: requests }, { data: profiles }, { data: allCourses }, { data: proposals }] =
        await Promise.all([
          supabase.from("courses").select("*").eq("status", "unassigned").order("created_at", { ascending: false }),
          supabase.from("course_requests").select("*").order("created_at", { ascending: false }),
          supabase.from("profiles").select("*").eq("role", "author"),
          supabase.from("courses").select("id, author_id, status"),
          supabase.from("course_proposals").select("*").order("created_at", { ascending: false }),
        ]);
      return {
        pool: (courses ?? []) as Course[],
        requests: (requests ?? []) as RequestRow[],
        authors: (profiles ?? []) as Profile[],
        workload: (allCourses ?? []) as { id: string; author_id: string | null; status: string }[],
        proposals: (proposals ?? []) as ProposalRow[],
      };
    },
  });

  const pool = data?.pool ?? [];
  const requests = data?.requests ?? [];
  const pending = requests.filter((request) => request.status === "pending");
  const authorsById = new Map((data?.authors ?? []).map((author) => [author.id, author]));
  const courseById = new Map(pool.map((course) => [course.id, course]));
  const proposals = data?.proposals ?? [];
  const pendingProposals = proposals.filter((row) => row.status === "pending");

  async function decideProposal(
    row: ProposalRow,
    mode: "assign" | "pool" | "decline",
    reason = "",
  ) {
    const now = new Date().toISOString();
    const author = authorsById.get(row.profile_id);
    let courseId: string | null = null;

    if (mode !== "decline") {
      const { data: created, error } = await supabase
        .from("courses")
        .insert({
          title: row.title.trim(),
          subtitle: row.subtitle?.trim() || null,
          subject_area: row.subject_area,
          brief_note:
            mode === "assign"
              ? row.reveal
              : `${row.reveal}\n\nProposed by ${author?.full_name ?? "an author"}.`,
          author_id: mode === "assign" ? row.profile_id : null,
          status: mode === "assign" ? "assigned" : "unassigned",
        })
        .select("id")
        .single();
      if (error || !created) {
        toast.error("The course could not be created.");
        return;
      }
      courseId = created.id;
    }

    const { error: updateError } = await supabase
      .from("course_proposals")
      .update({
        status:
          mode === "assign" ? "approved_assigned" : mode === "pool" ? "approved_to_pool" : "declined",
        decline_reason: mode === "decline" ? reason.trim() || null : null,
        course_id: courseId,
        decided_at: now,
        decided_by: me?.profile?.id ?? null,
      })
      .eq("id", row.id);
    if (updateError) {
      toast.error("The decision could not be saved.");
      return;
    }

    await supabase.from("activity_log").insert({
      actor_id: me?.profile?.id ?? null,
      entity: "course_proposal",
      entity_id: row.id,
      action: mode === "decline" ? "proposal_declined" : "proposal_approved",
      comment: `${row.title} — proposed by ${author?.full_name ?? "an author"}`,
    });

    await refresh();
    toast.success(
      mode === "assign"
        ? "Course created and assigned to that author."
        : mode === "pool"
          ? "Course added to the pool."
          : "Proposal declined.",
    );
  }

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["portal"] });
  }

  async function addCourse(event: FormEvent) {
    event.preventDefault();
    const { error } = await supabase.from("courses").insert({
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      subject_area: form.subject_area.trim() || null,
      lot_code: form.lot_code.trim() || null,
      brief_note: form.brief_note.trim() || null,
      status: "unassigned",
    });
    if (error) {
      toast.error("The course could not be added to the pool.");
      return;
    }
    setForm({ title: "", subtitle: "", subject_area: "", lot_code: "", brief_note: "" });
    await refresh();
    toast.success("Course added to the pool.");
  }

  async function addBulk() {
    const lines = bulk.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const rows = lines.map((line) => {
      const [lot, subjectArea, title, subtitle, brief] = line.split(";").map((part) => part?.trim() ?? "");
      return {
        lot_code: lot || null,
        subject_area: subjectArea || null,
        title: title || lot || "Untitled course",
        subtitle: subtitle || null,
        brief_note: brief || null,
        status: "unassigned" as const,
      };
    });
    const { error } = await supabase.from("courses").insert(rows);
    if (error) {
      toast.error("Some rows could not be added. Check the format.");
      return;
    }
    setBulk("");
    await refresh();
    toast.success(`${rows.length} courses added to the pool.`);
  }

  async function approve(request: RequestRow) {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("courses")
      .update({ author_id: request.profile_id, status: "assigned" })
      .eq("id", request.course_id);
    if (error) {
      toast.error("The course could not be assigned.");
      return;
    }
    await supabase
      .from("course_requests")
      .update({ status: "approved", decided_at: now, decided_by: me?.profile?.id ?? null })
      .eq("id", request.id);
    // Every other author waiting on this course is answered at the same time.
    await supabase
      .from("course_requests")
      .update({
        status: "declined",
        decided_at: now,
        decided_by: me?.profile?.id ?? null,
        decline_reason: "This course has been assigned to another author.",
      })
      .eq("course_id", request.course_id)
      .eq("status", "pending");
    await supabase.from("activity_log").insert({
      actor_id: me?.profile?.id ?? null,
      entity: "course",
      entity_id: request.course_id,
      action: "request_approved",
      comment: `Assigned to ${authorsById.get(request.profile_id)?.full_name ?? "an author"}`,
    });
    await refresh();
    toast.success("Course assigned to that author.");
  }

  async function decline(request: RequestRow, reason: string) {
    const { error } = await supabase
      .from("course_requests")
      .update({
        status: "declined",
        decided_at: new Date().toISOString(),
        decided_by: me?.profile?.id ?? null,
        decline_reason: reason.trim() || null,
      })
      .eq("id", request.id);
    if (error) {
      toast.error("The request could not be declined.");
      return;
    }
    await refresh();
    toast.success("Request declined.");
  }

  const visiblePool = pool.filter((course) => subject === "all" || course.subject_area === subject);
  const visibleRequests = pending.filter((request) => {
    const course = courseById.get(request.course_id);
    if (subject !== "all" && course?.subject_area !== subject) return false;
    if (authorFilter !== "all" && request.profile_id !== authorFilter) return false;
    return true;
  });

  function workloadOf(profileId: string) {
    const rows = (data?.workload ?? []).filter((row) => row.author_id === profileId);
    const submitted = rows.filter((row) =>
      ["submitted", "accepted", "published"].includes(row.status),
    ).length;
    return `already has ${rows.length} course${rows.length === 1 ? "" : "s"}, ${submitted} submitted`;
  }

  return (
    <div>
      <PageTitle
        title="Unassigned courses"
        lead="Courses waiting for an author, and the authors asking to write them."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Label htmlFor="pool-subject" className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">
          Subject area
        </Label>
        <select
          id="pool-subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="h-10 rounded-full border border-brand-line bg-card px-4 text-sm font-semibold text-brand-navy"
        >
          <option value="all">All subjects</option>
          {SUBJECT_AREAS.map((area) => (
            <option key={area} value={area}>
              {subjectLabel(area)}
            </option>
          ))}
        </select>
      </div>

      <Tabs defaultValue="pool">
        <TabsList>
          <TabsTrigger value="pool">The pool ({pool.length})</TabsTrigger>
          <TabsTrigger value="requests">Requests ({pending.length})</TabsTrigger>
          <TabsTrigger value="proposals">Proposals ({pendingProposals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pool" className="mt-6 space-y-6">
          {visiblePool.length === 0 ? (
            <EmptyState title="The pool is empty" text="Add courses below and authors will be able to ask for them." />
          ) : (
            <PortalCard className="overflow-x-auto p-0">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-b border-brand-line text-xs font-bold uppercase tracking-wide text-brand-navySoft">
                    <th className="px-6 py-4">Course</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Brief note</th>
                    <th className="px-6 py-4">Requests</th>
                    <th className="px-6 py-4">Added</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line">
                  {visiblePool.map((course) => (
                    <tr key={course.id}>
                      <td className="px-6 py-4 align-top">
                        <p className="font-bold text-brand-navy">{course.title}</p>
                        {course.subtitle ? (
                          <p className="mt-1 text-xs text-brand-navySoft">{course.subtitle}</p>
                        ) : null}
                        {course.lot_code ? (
                          <p className="mt-1 text-xs text-brand-navySoft">{course.lot_code}</p>
                        ) : null}
                        {course.released_from ? (
                          <p className="mt-1 text-xs italic text-brand-navySoft">
                            Previously assigned to{" "}
                            {authorsById.get(course.released_from)?.full_name ?? "a former author"}
                            {course.released_at ? `, released ${formatDate(course.released_at)}` : ""}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 align-top text-brand-navySoft">
                        {subjectLabel(course.subject_area)}
                      </td>
                      <td className="max-w-sm px-6 py-4 align-top text-brand-navySoft">
                        {course.brief_note ?? "—"}
                      </td>
                      <td className="px-6 py-4 align-top font-bold text-brand-navy">
                        {pending.filter((request) => request.course_id === course.id).length}
                      </td>
                      <td className="px-6 py-4 align-top text-brand-navySoft">{formatDate(course.created_at)}</td>
                      <td className="px-6 py-4 align-top text-right">
                        <DeleteCourseButton
                          courseId={course.id}
                          title={course.title}
                          authorName={null}
                          status={course.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PortalCard>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <PortalCard>
              <h3 className="text-lg font-extrabold text-brand-navy">Add a course to the pool</h3>
              <form onSubmit={addCourse} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pool-title">Title</Label>
                  <Input
                    id="pool-title"
                    required
                    className="h-11"
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pool-subtitle">Subtitle</Label>
                  <Input
                    id="pool-subtitle"
                    className="h-11"
                    value={form.subtitle}
                    onChange={(event) => setForm({ ...form, subtitle: event.target.value })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pool-area">Subject area</Label>
                    <select
                      id="pool-area"
                      value={form.subject_area}
                      onChange={(event) => setForm({ ...form, subject_area: event.target.value })}
                      className="h-11 w-full rounded-xl border border-brand-line bg-card px-3 text-sm text-brand-navy"
                    >
                      <option value="">Not set</option>
                      {SUBJECT_AREAS.map((area) => (
                        <option key={area} value={area}>
                          {subjectLabel(area)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pool-lot">Lot code (optional)</Label>
                    <Input
                      id="pool-lot"
                      className="h-11"
                      value={form.lot_code}
                      onChange={(event) => setForm({ ...form, lot_code: event.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2 rounded-2xl bg-brand-surface p-4">
                  <Label htmlFor="pool-brief" className="text-base font-bold text-brand-navy">
                    Brief note
                  </Label>
                  <p className="text-xs text-brand-navySoft">
                    This is what authors read before asking for the course. Say what it should actually cover, not
                    just the theme.
                  </p>
                  <Textarea
                    id="pool-brief"
                    rows={5}
                    value={form.brief_note}
                    onChange={(event) => setForm({ ...form, brief_note: event.target.value })}
                  />
                </div>
                <Button type="submit" variant="pill" size="pillSm">
                  Add to the pool
                </Button>
              </form>
            </PortalCard>

            <PortalCard>
              <h3 className="text-lg font-extrabold text-brand-navy">Paste several courses</h3>
              <p className="mt-2 text-sm text-brand-navySoft">
                One course per line: lot code; subject area; title; subtitle; brief note.
              </p>
              <Textarea
                rows={12}
                className="mt-4"
                value={bulk}
                onChange={(event) => setBulk(event.target.value)}
                aria-label="Bulk pool list"
              />
              <Button type="button" variant="pillSecondary" size="pillSm" className="mt-4" onClick={addBulk}>
                Add all
              </Button>
            </PortalCard>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Label htmlFor="pool-author" className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">
              Author
            </Label>
            <select
              id="pool-author"
              value={authorFilter}
              onChange={(event) => setAuthorFilter(event.target.value)}
              className="h-10 rounded-full border border-brand-line bg-card px-4 text-sm font-semibold text-brand-navy"
            >
              <option value="all">All authors</option>
              {(data?.authors ?? []).map((author) => (
                <option key={author.id} value={author.id}>
                  {author.full_name}
                </option>
              ))}
            </select>
          </div>

          {visibleRequests.length === 0 ? (
            <EmptyState title="No pending request" text="Nothing is waiting for a decision." />
          ) : (
            visibleRequests.map((request) => (
              <RequestRowCard
                key={request.id}
                request={request}
                course={courseById.get(request.course_id) ?? null}
                author={authorsById.get(request.profile_id) ?? null}
                workload={workloadOf(request.profile_id)}
                onApprove={() => approve(request)}
                onDecline={(reason) => decline(request, reason)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequestRowCard({
  request,
  course,
  author,
  workload,
  onApprove,
  onDecline,
}: {
  request: RequestRow;
  course: Course | null;
  author: Profile | null;
  workload: string;
  onApprove: () => void;
  onDecline: (reason: string) => void;
}) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <PortalCard>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">
            {subjectLabel(course?.subject_area)} · asked {formatDateTime(request.created_at)}
          </p>
          <p className="mt-1 text-lg font-bold text-brand-navy">{course?.title ?? "Course removed"}</p>
          {course?.subtitle ? <p className="text-sm text-brand-navySoft">{course.subtitle}</p> : null}

          <div className="mt-4">
            {author ? (
              <Link
                to="/auteurs/admin/authors/$authorId"
                params={{ authorId: author.id }}
                className="text-sm font-bold text-portal-accent hover:underline"
              >
                {author.display_name ?? author.full_name}
              </Link>
            ) : (
              <span className="text-sm font-bold text-brand-navy">Unknown author</span>
            )}
            <p className="text-xs text-brand-navySoft">{author?.display_title ?? "Byline to confirm"}</p>
            <p className="text-xs text-brand-navySoft">{workload}</p>
          </div>

          <p className="mt-4 rounded-2xl bg-brand-surface p-4 text-sm italic leading-relaxed text-brand-navy">
            “{request.note}”
          </p>
        </div>

        <div className="w-full max-w-xs space-y-3">
          <Button type="button" variant="pill" size="pillSm" className="w-full" onClick={onApprove}>
            Approve
          </Button>
          {declining ? (
            <div className="space-y-3">
              <Textarea
                rows={3}
                placeholder="Short reason (optional), shown to the author"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="pillSecondary"
                  size="pillSm"
                  onClick={() => {
                    onDecline(reason);
                    setDeclining(false);
                    setReason("");
                  }}
                >
                  Confirm decline
                </Button>
                <Button type="button" variant="pillSecondary" size="pillSm" onClick={() => setDeclining(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="pillSecondary"
              size="pillSm"
              className="w-full"
              onClick={() => setDeclining(true)}
            >
              Decline
            </Button>
          )}
        </div>
      </div>
    </PortalCard>
  );
}
