import { useMemo, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SUBJECT_AREAS, subjectLabel } from "@/config/subjects";
import { formatDate, type Course } from "@/lib/portal";
import { usePortalProfile } from "./usePortal";
import { EmptyState, PageTitle, PortalCard } from "./ui";

const MAX_PENDING = 3;
const NOTE_MAX = 150;
const REVEAL_MAX = 300;

export type ProposalRow = {
  id: string;
  title: string;
  subtitle: string | null;
  subject_area: string | null;
  reveal: string;
  status: string;
  decline_reason: string | null;
  created_at: string;
};

const PROPOSAL_LABEL: Record<string, string> = {
  pending: "Pending",
  approved_assigned: "Approved — assigned to you",
  approved_to_pool: "Approved — added to the pool",
  declined: "Declined",
};

type MyRequest = {
  id: string;
  course_id: string;
  note: string;
  status: string;
  created_at: string;
  decline_reason: string | null;
  course: { title: string } | null;
};

export function OpenCourses() {
  const queryClient = useQueryClient();
  const { data: me } = usePortalProfile();
  const profile = me?.profile ?? null;
  const [showAll, setShowAll] = useState(false);
  const [asking, setAsking] = useState<Course | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [proposal, setProposal] = useState({ title: "", subtitle: "", subject_area: "", reveal: "" });
  const [proposing, setProposing] = useState(false);

  const { data } = useQuery({
    queryKey: ["portal", "open-courses", profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const [{ data: pool }, { data: mine }, { data: requests }, { data: proposals }] = await Promise.all([
        supabase.from("courses").select("*").eq("status", "unassigned").order("created_at", { ascending: false }),
        supabase.from("courses").select("subject_area").eq("author_id", profile!.id),
        supabase
          .from("course_requests")
          .select("*, course:courses(title)")
          .eq("profile_id", profile!.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("course_proposals")
          .select("*")
          .eq("profile_id", profile!.id)
          .order("created_at", { ascending: false }),
      ]);
      return {
        pool: (pool ?? []) as Course[],
        mySubjects: [...new Set((mine ?? []).map((row) => row.subject_area).filter(Boolean))] as string[],
        requests: (requests ?? []) as unknown as MyRequest[],
        proposals: (proposals ?? []) as ProposalRow[],
      };
    },
  });

  const pool = data?.pool ?? [];
  const requests = data?.requests ?? [];
  const proposals = data?.proposals ?? [];
  const pendingProposals = proposals.filter((row) => row.status === "pending").length;
  const proposalCapped = pendingProposals >= MAX_PENDING;

  async function submitProposal(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setProposing(true);
    const { error } = await supabase.from("course_proposals").insert({
      profile_id: profile.id,
      title: proposal.title.trim(),
      subtitle: proposal.subtitle.trim() || null,
      subject_area: proposal.subject_area || null,
      reveal: proposal.reveal.trim(),
    });
    setProposing(false);
    if (error) {
      toast.error(
        error.message.includes("Three proposals")
          ? "You already have three proposals pending."
          : "Your proposal could not be sent.",
      );
      return;
    }
    setProposal({ title: "", subtitle: "", subject_area: "", reveal: "" });
    await queryClient.invalidateQueries({ queryKey: ["portal"] });
    toast.success("Your proposal has been sent to the editorial desk.");
  }
  const pendingCount = requests.filter((request) => request.status === "pending").length;
  const capped = pendingCount >= MAX_PENDING;
  const requestByCourse = useMemo(
    () => new Map(requests.map((request) => [request.course_id, request])),
    [requests],
  );

  const mySubjects = data?.mySubjects ?? [];
  const near = pool.filter((course) => course.subject_area && mySubjects.includes(course.subject_area));
  const visible = showAll || mySubjects.length === 0 || near.length === 0 ? pool : near;

  async function submitRequest() {
    if (!asking || !profile) return;
    setSaving(true);
    const { error } = await supabase.from("course_requests").insert({
      course_id: asking.id,
      profile_id: profile.id,
      note: note.trim(),
    });
    setSaving(false);
    if (error) {
      toast.error(
        error.message.includes("Three requests")
          ? "You already have three requests pending."
          : "Your request could not be sent.",
      );
      return;
    }
    setAsking(null);
    setNote("");
    await queryClient.invalidateQueries({ queryKey: ["portal"] });
    toast.success("Your request has been sent to the editorial desk.");
  }

  return (
    <div>
      <PageTitle
        title="Open courses"
        lead="Courses waiting for an author. Ask for the ones you genuinely know something about."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-portal bg-card p-5 shadow-portal">
        <p className="text-sm text-brand-navySoft">
          We are showing subjects close to what you already write. You can see everything.
        </p>
        <div className="flex items-center gap-3">
          <Switch id="show-all" checked={showAll} onCheckedChange={setShowAll} />
          <Label htmlFor="show-all" className="text-sm font-semibold text-brand-navy">
            Show all subjects
          </Label>
        </div>
      </div>

      {capped ? (
        <p className="mb-6 rounded-portal border border-portal-amber/40 bg-portal-amber/10 p-4 text-sm font-semibold text-brand-navy">
          You have three requests pending. Wait for an answer before asking for more.
        </p>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          title="Nothing open right now"
          text="New courses appear here as soon as the editorial desk adds them."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((course) => {
            const existing = requestByCourse.get(course.id);
            return (
              <PortalCard key={course.id}>
                <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">
                  {subjectLabel(course.subject_area)}
                </p>
                <p className="mt-2 text-lg font-bold leading-snug text-brand-navy">{course.title}</p>
                {course.subtitle ? <p className="mt-1 text-sm text-brand-navySoft">{course.subtitle}</p> : null}
                {course.brief_note ? (
                  <p className="mt-4 text-sm leading-relaxed text-brand-navySoft">{course.brief_note}</p>
                ) : null}
                <div className="mt-5">
                  {existing ? (
                    <p className="text-sm font-bold text-brand-navy">
                      Requested {formatDate(existing.created_at)}
                    </p>
                  ) : (
                    <Button
                      type="button"
                      variant="pill"
                      size="pillSm"
                      disabled={capped}
                      onClick={() => {
                        setAsking(course);
                        setNote("");
                      }}
                    >
                      Ask for this one
                    </Button>
                  )}
                </div>
              </PortalCard>
            );
          })}
        </div>
      )}

      <h2 className="mt-12 text-xl font-extrabold text-brand-navy">My requests</h2>
      <div className="mt-4 space-y-3">
        {requests.length === 0 ? (
          <p className="text-sm text-brand-navySoft">You have not asked for any course yet.</p>
        ) : (
          requests.map((request) => (
            <PortalCard key={request.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-brand-navy">
                    {request.course?.title ?? "Course"}
                  </p>
                  <p className="mt-1 text-sm italic text-brand-navySoft">“{request.note}”</p>
                  {request.status === "declined" && request.decline_reason ? (
                    <p className="mt-2 text-sm text-brand-navySoft">{request.decline_reason}</p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p
                    className={
                      request.status === "approved"
                        ? "text-sm font-bold text-portal-green"
                        : request.status === "declined"
                          ? "text-sm font-bold text-brand-navySoft"
                          : "text-sm font-bold text-portal-amber"
                    }
                  >
                    {request.status === "approved"
                      ? "Approved"
                      : request.status === "declined"
                        ? "Declined"
                        : "Pending"}
                  </p>
                  <p className="text-xs text-brand-navySoft">{formatDate(request.created_at)}</p>
                </div>
              </div>
            </PortalCard>
          ))
        )}
      </div>

      <h2 className="mt-12 text-xl font-extrabold text-brand-navy">Propose a course</h2>
      <p className="mt-2 max-w-2xl text-sm text-brand-navySoft">
        Have a subject of your own? Tell us what the reader will finish understanding. We answer every proposal.
      </p>

      {proposalCapped ? (
        <p className="mt-4 rounded-portal border border-portal-amber/40 bg-portal-amber/10 p-4 text-sm font-semibold text-brand-navy">
          You have three proposals pending. Wait for an answer before sending more.
        </p>
      ) : null}

      <PortalCard className="mt-4">
        <form onSubmit={submitProposal} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proposal-title">Title — a question</Label>
            <Input
              id="proposal-title"
              required
              className="h-11"
              value={proposal.title}
              onChange={(event) => setProposal({ ...proposal, title: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proposal-subtitle">Subtitle</Label>
            <Input
              id="proposal-subtitle"
              className="h-11"
              value={proposal.subtitle}
              onChange={(event) => setProposal({ ...proposal, subtitle: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proposal-area">Subject area</Label>
            <select
              id="proposal-area"
              value={proposal.subject_area}
              onChange={(event) => setProposal({ ...proposal, subject_area: event.target.value })}
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
            <Label htmlFor="proposal-reveal">
              What is the reveal? What will the reader finish understanding that they did not know?
            </Label>
            <Textarea
              id="proposal-reveal"
              required
              rows={4}
              maxLength={REVEAL_MAX}
              value={proposal.reveal}
              onChange={(event) => setProposal({ ...proposal, reveal: event.target.value })}
            />
            <p className="text-xs text-brand-navySoft">
              {proposal.reveal.length} / {REVEAL_MAX}
            </p>
          </div>
          <Button
            type="submit"
            variant="pill"
            size="pillSm"
            disabled={proposing || proposalCapped || proposal.title.trim().length === 0 || proposal.reveal.trim().length === 0}
          >
            Send my proposal
          </Button>
        </form>
      </PortalCard>

      <h2 className="mt-12 text-xl font-extrabold text-brand-navy">My proposals</h2>
      <div className="mt-4 space-y-3">
        {proposals.length === 0 ? (
          <p className="text-sm text-brand-navySoft">You have not proposed a course yet.</p>
        ) : (
          proposals.map((row) => (
            <PortalCard key={row.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-brand-navy">{row.title}</p>
                  {row.subtitle ? <p className="text-sm text-brand-navySoft">{row.subtitle}</p> : null}
                  <p className="mt-1 text-xs uppercase tracking-wide text-brand-navySoft">
                    {subjectLabel(row.subject_area)}
                  </p>
                  <p className="mt-2 text-sm italic text-brand-navySoft">“{row.reveal}”</p>
                  {row.status === "declined" && row.decline_reason ? (
                    <p className="mt-2 text-sm text-brand-navySoft">{row.decline_reason}</p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p
                    className={
                      row.status.startsWith("approved")
                        ? "text-sm font-bold text-portal-green"
                        : row.status === "declined"
                          ? "text-sm font-bold text-brand-navySoft"
                          : "text-sm font-bold text-portal-amber"
                    }
                  >
                    {PROPOSAL_LABEL[row.status] ?? row.status}
                  </p>
                  <p className="text-xs text-brand-navySoft">{formatDate(row.created_at)}</p>
                </div>
              </div>
            </PortalCard>
          ))
        )}
      </div>

      <Dialog open={Boolean(asking)} onOpenChange={(open) => (open ? null : setAsking(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{asking?.title}</DialogTitle>
            <DialogDescription>
              In one line, why you? What do you know about this that a general writer would not?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              rows={3}
              maxLength={NOTE_MAX}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              aria-label="Why you"
            />
            <p className="text-xs text-brand-navySoft">
              {note.length} / {NOTE_MAX}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="pill"
              size="pillSm"
              disabled={saving || note.trim().length === 0}
              onClick={submitRequest}
            >
              Send my request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
