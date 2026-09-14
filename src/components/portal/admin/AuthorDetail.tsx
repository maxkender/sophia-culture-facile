import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatDateTime, inviteUrl, newInviteToken, type Course, type Profile } from "@/lib/portal";
import type { CourseStatus } from "@/config/portal";
import { Banner, CopyButton, PageTitle, PortalCard, StatusPill } from "../ui";

export function AuthorDetail({ authorId }: { authorId: string }) {
  const queryClient = useQueryClient();
  const [bulk, setBulk] = useState("");
  const [fee, setFee] = useState<string | null>(null);
  const [form, setForm] = useState({ lot_code: "", subject_area: "", title: "", subtitle: "", brief_note: "", due_date: "" });

  const { data } = useQuery({
    queryKey: ["portal", "admin", "author", authorId],
    queryFn: async () => {
      const [{ data: author }, { data: courses }, { data: contract }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", authorId).maybeSingle(),
        supabase.from("courses").select("*").eq("author_id", authorId).order("order_index"),
        supabase.from("contracts").select("*").eq("author_id", authorId).order("signed_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      return { author: (author ?? null) as Profile | null, courses: (courses ?? []) as Course[], contract };
    },
  });

  const author = data?.author ?? null;
  const courses = data?.courses ?? [];

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["portal", "admin"] });
  }

  async function addCourse(event: FormEvent) {
    event.preventDefault();
    const { error } = await supabase.from("courses").insert({
      author_id: authorId,
      lot_code: form.lot_code.trim() || null,
      subject_area: form.subject_area.trim() || null,
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      brief_note: form.brief_note.trim() || null,
      due_date: form.due_date || null,
      order_index: courses.length + 1,
      status: "assigned",
    });
    if (error) {
      toast.error("The course could not be added.");
      return;
    }
    setForm({ lot_code: "", subject_area: "", title: "", subtitle: "", brief_note: "", due_date: "" });
    await refresh();
    toast.success("Course assigned.");
  }

  async function addBulk() {
    const lines = bulk.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const rows = lines.map((line, index) => {
      const [lot, subject, title, subtitle, due] = line.split(";").map((part) => part?.trim() ?? "");
      return {
        author_id: authorId,
        lot_code: lot || null,
        subject_area: subject || null,
        title: title || lot || "Untitled course",
        subtitle: subtitle || null,
        due_date: due || null,
        order_index: courses.length + index + 1,
        status: "assigned" as const,
      };
    });
    const { error } = await supabase.from("courses").insert(rows);
    if (error) {
      toast.error("Some rows could not be added. Check the format.");
      return;
    }
    setBulk("");
    await refresh();
    toast.success(`${rows.length} courses assigned.`);
  }

  async function saveFee() {
    if (fee === null) return;
    const { error } = await supabase.from("profiles").update({ fee: fee.trim() || null }).eq("id", authorId);
    if (error) {
      toast.error("The fee could not be saved.");
      return;
    }
    await refresh();
    toast.success("Fee saved.");
  }

  async function regenerateInvite() {
    const token = newInviteToken();
    await supabase.from("profiles").update({ invite_token: token, invited_at: new Date().toISOString() }).eq("id", authorId);
    await refresh();
    toast.success("New invite link generated.");
  }

  if (!author) return <Banner tone="error" title="Author not found" />;

  return (
    <div>
      <Link to="/auteurs/admin/authors" className="mb-6 inline-block text-sm font-semibold text-portal-accent">
        ← All authors
      </Link>
      {author.is_test ? (
        <p className="mb-3 inline-block rounded-full bg-brand-line px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-navySoft">
          Test account — excluded from dashboard figures
        </p>
      ) : null}
      <PageTitle title={author.full_name} lead={[author.title, author.institution, author.country].filter(Boolean).join(" · ")} />

      <div className="grid gap-5 lg:grid-cols-3">
        <PortalCard>
          <h2 className="text-sm font-bold text-brand-navy">Contact</h2>
          <p className="mt-3 text-sm text-brand-navySoft">{author.email ?? "No email — contracted through Upwork"}</p>
          <p className="mt-1 text-sm">
            {author.platform === "android" ? (
              <span className="text-brand-navySoft">Android</span>
            ) : author.platform === "ios" ? (
              <span className="text-brand-navySoft">iOS</span>
            ) : (
              <span className="font-semibold text-portal-amber">Platform unknown</span>
            )}
          </p>
          <p className="mt-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                author.upwork_status === "accepted"
                  ? "bg-portal-green/10 text-portal-green"
                  : "bg-brand-line text-brand-navySoft"
              }`}
            >
              {author.upwork_status === "accepted" ? "Accepted on Upwork" : "Contacted on Upwork"}
            </span>
          </p>
          {author.bio ? <p className="mt-3 text-sm leading-relaxed text-brand-navySoft">{author.bio}</p> : null}
          <div className="mt-4 space-y-1">
            <Label htmlFor="fee">Fee (shown in their contract)</Label>
            <div className="flex gap-2">
              <Input
                id="fee"
                className="h-11"
                placeholder="e.g. USD 600"
                defaultValue={author.fee ?? ""}
                onChange={(event) => setFee(event.target.value)}
              />
              <Button type="button" variant="pillSecondary" size="pillSm" onClick={saveFee}>
                Save
              </Button>
            </div>
          </div>
        </PortalCard>

        <PortalCard>
          <h2 className="text-sm font-bold text-brand-navy">Access code</h2>
          <p className="mt-3 font-mono text-base font-bold text-brand-navy">{author.access_code ?? "None assigned"}</p>
          {author.access_code ? (
            <div className="mt-3">
              <CopyButton value={author.access_code} label="Copy code" />
            </div>
          ) : null}
        </PortalCard>

        <PortalCard>
          <h2 className="text-sm font-bold text-brand-navy">Invite link</h2>
          <p className="mt-3 text-sm text-brand-navySoft">
            {author.activated_at ? `Activated ${formatDate(author.activated_at)}` : "Not activated yet"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {author.invite_token ? <CopyButton value={inviteUrl(author.invite_token)} label="Copy invite link" /> : null}
            <Button type="button" variant="ghost" size="pillSm" onClick={regenerateInvite}>
              Regenerate
            </Button>
          </div>
        </PortalCard>
      </div>

      <div className="mt-6">
        {data?.contract ? (
          <Banner tone="success" title={`Agreement signed by ${data.contract.signed_name}`}>
            {formatDateTime(data.contract.signed_at)} · version {data.contract.document_version}
          </Banner>
        ) : (
          <Banner tone="warning" title="Agreement not signed">
            This author cannot edit their courses until they sign.
          </Banner>
        )}
      </div>

      <h2 className="mt-10 text-xl font-extrabold text-brand-navy">Commissioned courses</h2>
      <PortalCard className="mt-4">
        {courses.length === 0 ? (
          <p className="text-sm text-brand-navySoft">No course assigned yet.</p>
        ) : (
          <ul className="divide-y divide-brand-line">
            {courses.map((course) => (
              <li key={course.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-bold text-brand-navy">{course.title}</p>
                  <p className="text-xs text-brand-navySoft">
                    {course.lot_code ?? "—"} · {course.subject_area ?? "—"} · due {formatDate(course.due_date)}
                  </p>
                </div>
                <StatusPill status={course.status as CourseStatus} />
              </li>
            ))}
          </ul>
        )}
      </PortalCard>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <PortalCard>
          <h3 className="text-lg font-extrabold text-brand-navy">Assign a course</h3>
          <form onSubmit={addCourse} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lot">Lot code</Label>
                <Input id="lot" value={form.lot_code} onChange={(e) => setForm({ ...form, lot_code: e.target.value })} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject area</Label>
                <Input id="subject" value={form.subject_area} onChange={(e) => setForm({ ...form, subject_area: e.target.value })} className="h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input id="subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brief">Brief note</Label>
              <Textarea id="brief" rows={3} value={form.brief_note} onChange={(e) => setForm({ ...form, brief_note: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due">Due date</Label>
              <Input id="due" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="h-11" />
            </div>
            <Button type="submit" variant="pill" size="pillSm">Assign course</Button>
          </form>
        </PortalCard>

        <PortalCard>
          <h3 className="text-lg font-extrabold text-brand-navy">Paste several courses</h3>
          <p className="mt-2 text-sm text-brand-navySoft">
            One course per line: lot code; subject area; title; subtitle; due date (YYYY-MM-DD).
          </p>
          <Textarea rows={10} className="mt-4" value={bulk} onChange={(event) => setBulk(event.target.value)} aria-label="Bulk course list" />
          <Button type="button" variant="pillSecondary" size="pillSm" className="mt-4" onClick={addBulk}>
            Add all
          </Button>
        </PortalCard>
      </div>
    </div>
  );
}
