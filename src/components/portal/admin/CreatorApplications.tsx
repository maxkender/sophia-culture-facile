import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";
import { EmptyState, PageTitle, PortalCard } from "../ui";
import { usePortalProfile } from "../usePortal";

type UgcApplication = Database["public"]["Tables"]["creator_applications"]["Row"];
type SlideshowApplication = Database["public"]["Tables"]["slideshow_applications"]["Row"];
type Track = "ugc" | "slideshow";

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-portal-amber/15 text-portal-amber",
  interview: "bg-portal-accent/10 text-portal-accent",
  approved: "bg-portal-green/10 text-portal-green",
  rejected: "bg-portal-red/10 text-portal-red",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_CLASS[status] ?? "bg-brand-navy/10 text-brand-navy"}`}>
      {status}
    </span>
  );
}

function LinkOut({ href, label }: { href: string | null; label: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs font-semibold text-portal-accent hover:underline"
    >
      {label} <ExternalLink className="size-3" />
    </a>
  );
}

export function CreatorApplications() {
  const queryClient = useQueryClient();
  const { data: portal } = usePortalProfile();
  const profile = portal?.profile;
  const [track, setTrack] = useState<Track>("ugc");
  const [status, setStatus] = useState("pending");
  const [selected, setSelected] = useState<UgcApplication | SlideshowApplication | null>(null);
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["portal", "admin", "creator-applications", track, status],
    queryFn: async () => {
      const table = track === "ugc" ? "creator_applications" : "slideshow_applications";
      let query = supabase.from(table).select("*").order("created_at", { ascending: false });
      if (status !== "all") query = query.eq("status", status);
      const { data: rows, error } = await query;
      if (error) throw error;
      return (rows ?? []) as (UgcApplication | SlideshowApplication)[];
    },
  });

  useEffect(() => {
    setNotes(selected?.admin_notes ?? "");
    setReason(selected?.rejection_reason ?? "");
  }, [selected]);

  async function decide(id: string, next: "approved" | "rejected" | "interview") {
    if (!profile) return;
    if (next === "rejected" && !reason.trim()) {
      toast.error("Add a rejection reason first.");
      return;
    }
    setBusy(true);
    try {
      const table = track === "ugc" ? "creator_applications" : "slideshow_applications";
      const { error } = await supabase
        .from(table)
        .update({
          status: next,
          decided_at: new Date().toISOString(),
          decided_by: profile.id,
          rejection_reason: next === "rejected" ? reason.trim() : null,
          admin_notes: notes.trim() || null,
        })
        .eq("id", id);
      if (error) throw error;
      toast.success(next === "approved" ? "Application approved." : next === "rejected" ? "Application rejected." : "Moved to interview.");
      setSelected(null);
      await queryClient.invalidateQueries({ queryKey: ["portal", "admin", "creator-applications"] });
      await queryClient.invalidateQueries({ queryKey: ["portal", "nav-counts"] });
    } catch {
      toast.error("The decision could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function saveNotes() {
    if (!selected) return;
    const table = track === "ugc" ? "creator_applications" : "slideshow_applications";
    const { error } = await supabase.from(table).update({ admin_notes: notes.trim() || null }).eq("id", selected.id);
    if (error) toast.error("Notes could not be saved.");
    else toast.success("Notes saved.");
  }

  const isUgc = (row: UgcApplication | SlideshowApplication): row is UgcApplication => track === "ugc";

  return (
    <div className="space-y-6">
      <PageTitle title="Creator applications" lead="Review UGC and slideshow creator applications. These never mix with author applications." />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-brand-line bg-card p-1">
          {(["ugc", "slideshow"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTrack(value)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                track === value ? "bg-brand-navy text-card" : "text-brand-navy hover:bg-brand-navy/10"
              }`}
            >
              {value === "ugc" ? "UGC creators" : "Slideshow creators"}
            </button>
          ))}
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <PortalCard className="overflow-hidden">
        {data?.length ? (
          <ul className="divide-y divide-brand-line">
            {data.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setSelected(row)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-brand-navy/5"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-navy text-xs font-bold text-card">
                    {row.full_name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-brand-navy">{row.full_name}</span>
                    <span className="block truncate text-xs text-brand-navySoft">
                      {row.email} · {row.country} · {formatDateTime(row.created_at)}
                    </span>
                  </span>
                  <StatusBadge status={row.status} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Nothing here" text="No application matches this filter." />
        )}
      </PortalCard>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selected.full_name} <StatusBadge status={selected.status} />
                </DialogTitle>
              </DialogHeader>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Email</dt><dd className="text-brand-navy">{selected.email}</dd></div>
                <div><dt className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Phone</dt><dd className="text-brand-navy">{selected.phone}</dd></div>
                <div><dt className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Country</dt><dd className="text-brand-navy">{selected.country}</dd></div>
                <div><dt className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Applied</dt><dd className="text-brand-navy">{formatDateTime(selected.created_at)}</dd></div>
                {isUgc(selected) ? (
                  <>
                    <div><dt className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Age</dt><dd className="text-brand-navy">{selected.age}</dd></div>
                    <div><dt className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Occupation</dt><dd className="text-brand-navy">{selected.occupation}</dd></div>
                    <div><dt className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Referral</dt><dd className="text-brand-navy">{selected.referral_source}</dd></div>
                    <div><dt className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Meets criteria</dt><dd className="text-brand-navy">{selected.meets_criteria ? "Yes" : "No"}</dd></div>
                    <div className="flex flex-wrap gap-3 sm:col-span-2">
                      <LinkOut href={selected.tiktok_url} label="TikTok" />
                      <LinkOut href={selected.instagram_url} label="Instagram" />
                      <LinkOut href={selected.video_url} label="Video" />
                      <LinkOut href={selected.other_links} label="Other links" />
                    </div>
                  </>
                ) : (
                  <>
                    <div><dt className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Adult</dt><dd className="text-brand-navy">{selected.is_adult ? "Yes" : "No"}</dd></div>
                    <div><dt className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Upwork</dt><dd className="text-brand-navy">{selected.has_upwork ? "Yes" : "No"}</dd></div>
                    <div className="flex flex-wrap gap-3 sm:col-span-2">
                      <LinkOut href={selected.upwork_profile_url} label="Upwork profile" />
                    </div>
                  </>
                )}
              </dl>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide text-brand-navySoft" htmlFor="creator-notes">Admin notes</label>
                <Textarea id="creator-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Internal notes, never shown to the applicant." />
                <Button type="button" variant="pillSecondary" size="sm" onClick={() => void saveNotes()}>Save notes</Button>
              </div>

              {selected.status === "pending" || selected.status === "interview" ? (
                <div className="space-y-3 rounded-xl border border-brand-line p-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wide text-brand-navySoft" htmlFor="creator-reason">Rejection reason (required to reject)</label>
                    <Input id="creator-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Not enough video examples" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="pill" size="sm" disabled={busy} onClick={() => void decide(selected.id, "approved")}>Approve</Button>
                    <Button type="button" variant="pillSecondary" size="sm" disabled={busy} onClick={() => void decide(selected.id, "interview")}>Move to interview</Button>
                    <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={() => void decide(selected.id, "rejected")}>Reject</Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-brand-navySoft">
                  Decided {selected.decided_at ? formatDateTime(selected.decided_at) : ""}
                  {selected.rejection_reason ? ` · Reason: ${selected.rejection_reason}` : ""}
                </p>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
