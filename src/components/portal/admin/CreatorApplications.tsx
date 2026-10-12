import { AppBadge, useAdminApp } from "@/lib/apps";
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
import { useServerFn } from "@tanstack/react-start";
import { generateSigningLink } from "@/lib/creator-agreement.functions";
import { approveUgcApplication } from "@/lib/creator-onboarding.functions";
import { rejectUgcApplication, resendWelcomeEmail } from "@/lib/ugc-admin.functions";
import { getGuideForApplication, setApplicationZone } from "@/lib/slideshow-zones.functions";
import { GUIDE_PDF_NAME, ZONE_BADGE } from "@/lib/slideshow-guide";
import { HandleLinksInline, PersonAvatar } from "@/components/hub/PersonAvatar";
import { SocialLinks, TalkingVideo, VideoStatusIcon } from "./ApplicationVideo";

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

export function CreatorApplications({ track, simple = false, q = "" }: { track: Track; simple?: boolean; q?: string }) {
  const queryClient = useQueryClient();
  const { data: portal } = usePortalProfile();
  const profile = portal?.profile;
  const [status, setStatus] = useState("pending");
  const [selected, setSelected] = useState<UgcApplication | SlideshowApplication | null>(null);
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [signedFilter, setSignedFilter] = useState<"any" | "signed" | "unsigned">("any");
  const genLink = useServerFn(generateSigningLink);
  const approveUgc = useServerFn(approveUgcApplication);
  const rejectUgc = useServerFn(rejectUgcApplication);
  const resendWelcome = useServerFn(resendWelcomeEmail);
  const [notifyReject, setNotifyReject] = useState(false);

  const { appId: switcherApp } = useAdminApp();
  // The Hub UGC Applications page ignores the app switcher: every application, app shown as a chip.
  const appId = simple ? null : switcherApp;
  const { data } = useQuery({
    queryKey: ["portal", "admin", "creator-applications", track, status, signedFilter, appId],
    queryFn: async () => {
      const table = track === "ugc" ? "creator_applications" : "slideshow_applications";
      let query = supabase.from(table).select("*").order("created_at", { ascending: false });
      if (status !== "all") query = query.eq("status", status);
      if (appId) query = query.eq("app_id", appId);
      if (track === "slideshow" && signedFilter === "signed") query = query.not("agreement_signed_at", "is", null);
      if (track === "slideshow" && signedFilter === "unsigned") query = query.is("agreement_signed_at", null);
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
      if (track === "ugc" && next === "approved") {
        const result = await approveUgc({ data: { applicationId: id, origin: window.location.origin, notes: notes.trim() || undefined } });
        if (result.emailSent) {
          if (result.emailReason) toast.warning(`Approved. ${result.emailReason}.`);
          else toast.success("Application approved. The welcome email went out through Brevo.");
        } else {
          await navigator.clipboard.writeText(result.inviteUrl).catch(() => {});
          toast.warning(`Application approved. ${result.emailReason ?? "Email not sent"}. The invite link was copied — send it yourself or use Resend welcome email.`);
        }
        setSelected(null);
        await queryClient.invalidateQueries({ queryKey: ["portal", "admin", "creator-applications"] });
        await queryClient.invalidateQueries({ queryKey: ["portal", "admin", "creator-ops"] });
        return;
      }
      if (track === "ugc" && next === "rejected") {
        const r = await rejectUgc({ data: { applicationId: id, reason: reason.trim(), notify: notifyReject } });
        if (notifyReject) r.sent ? toast.success(r.note ? `Rejected. ${r.note}.` : "Rejected. The decline email was sent.") : toast.warning(`Rejected. ${r.note ?? "Email not sent"}.`);
        else toast.success("Application rejected.");
        setSelected(null);
        await queryClient.invalidateQueries({ queryKey: ["portal", "admin", "creator-applications"] });
        return;
      }
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
      if (track === "slideshow" && next === "approved") {
        try { await genLink({ data: { applicationId: id } }); } catch { toast.error("Signing link could not be generated. Use Regenerate."); }
      }
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
      {!simple ? <PageTitle title={track === "ugc" ? "UGC applications" : "Slideshow applications"} lead="These never mix with author applications." /> : null}

      {simple ? <button type="button" onClick={() => setStatus(status === "rejected" ? "pending" : "rejected")} className="px-4 pt-3 text-xs font-semibold text-brand-navySoft underline hover:text-brand-navy">{status === "rejected" ? "← Back to pending applications" : "Rejected"}</button> : null}
      {simple ? <SimpleApplications rows={((data ?? []) as UgcApplication[]).filter((r) => !q || `${r.full_name} ${r.email} ${r.tiktok_url ?? ""} ${r.instagram_url ?? ""}`.toLowerCase().includes(q.toLowerCase()))} busy={busy} onOpen={(r) => setSelected(r)} onAccept={(r) => void decide(r.id, "approved")} /> : null}
      <div className={simple ? "hidden" : "flex flex-wrap items-center gap-3"}>
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
        {track === "slideshow" && (
          <Select value={signedFilter} onValueChange={(v) => setSignedFilter(v as typeof signedFilter)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any agreement status</SelectItem>
              <SelectItem value="signed">Agreement signed</SelectItem>
              <SelectItem value="unsigned">Agreement not signed</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <PortalCard className={simple ? "hidden" : "overflow-hidden"}>
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
                    <span className="block truncate text-sm font-bold text-brand-navy"><AppBadge appId={(row as { app_id?: string }).app_id} /> {row.full_name}</span>
                    <span className="block truncate text-xs text-brand-navySoft">
                      {row.email} · {row.country} · {formatDateTime(row.created_at)}
                    </span>
                  </span>
                  {track === "ugc" ? <VideoStatusIcon file={(row as UgcApplication).video_file_path} url={(row as UgcApplication).video_url} /> : null}
                  {track === "slideshow" ? <ZoneBadge zone={(row as SlideshowApplication).zone} /> : null}
                  {track === "slideshow" && row.status === "approved" ? (
                    <span className={`text-[11px] font-bold ${(row as SlideshowApplication).agreement_signed_at ? "text-portal-green" : "text-portal-amber"}`}>
                      {(row as SlideshowApplication).agreement_signed_at ? "Signed" : "Not signed"}
                    </span>
                  ) : null}
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
              {isUgc(selected) ? <TalkingVideo key={selected.id} file={selected.video_file_path} url={selected.video_url} /> : null}
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
                    <div className="sm:col-span-2">
                      <SocialLinks tiktok={selected.tiktok_url} instagram={selected.instagram_url} other={selected.other_links} />
                    </div>
                    <div><dt className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Source</dt><dd className="text-brand-navy">{(selected as any).source ?? "direct"}</dd></div>
                    {selected.status === "approved" && selected.created_creator_id ? (
                      <div className="sm:col-span-2 rounded-lg border border-brand-line bg-brand-surface p-3 text-xs text-brand-navySoft">
                        <p>Welcome email: {(selected as any).acceptance_email_sent_at ? `sent ${formatDateTime((selected as any).acceptance_email_sent_at)} via ${(selected as any).welcome_email_provider ?? "?"}${(selected as any).welcome_email_message_id ? ` · Brevo id ${(selected as any).welcome_email_message_id}` : ""}` : "not sent"}</p>
                        {(selected as any).welcome_email_error ? <p className="mt-1 font-semibold text-portal-amber">{(selected as any).welcome_email_error}</p> : null}
                        <Button type="button" size="sm" variant="outline" className="mt-2" onClick={async () => {
                          try { const r = await resendWelcome({ data: { applicationId: selected.id, origin: window.location.origin } }); r.sent ? toast.success(r.note ?? "Welcome email resent through Brevo.") : toast.warning(r.note ?? "Email not sent."); await queryClient.invalidateQueries({ queryKey: ["portal", "admin", "creator-applications"] }); }
                          catch (e) { toast.error(e instanceof Error ? e.message : "Could not resend."); }
                        }}>Resend welcome email</Button>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div><dt className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Adult</dt><dd className="text-brand-navy">{selected.is_adult ? "Yes" : "No"}</dd></div>
                    <div><dt className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Upwork</dt><dd className="text-brand-navy">{selected.has_upwork ? "Yes" : "No"}</dd></div>
                    <div className="flex flex-wrap gap-3 sm:col-span-2">
                      <LinkOut href={selected.upwork_profile_url} label="Upwork profile" />
                    </div>
                    <div className="sm:col-span-2">
                      <ZonePanel app={selected as SlideshowApplication} onChange={(next) => setSelected(next)} />
                    </div>
                    <div className="sm:col-span-2">
                      <SlideshowAgreement app={selected as SlideshowApplication} onChange={(next) => setSelected(next)} />
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
                    {track === "ugc" && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={notifyReject} onChange={(e) => setNotifyReject(e.target.checked)} /> Notify the applicant (kind decline email)</label>}
                  </div>
                  {track === "slideshow" && !(selected as SlideshowApplication).zone ? (
                    <p className="text-sm font-semibold text-portal-red">This country has no pay zone. Ask Adrien or Max before accepting.</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="pill" size="sm" disabled={busy || (track === "slideshow" && !(selected as SlideshowApplication).zone)} onClick={() => void decide(selected.id, "approved")}>Approve</Button>
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

function SlideshowAgreement({ app, onChange }: { app: SlideshowApplication; onChange: (next: SlideshowApplication) => void }) {
  const queryClient = useQueryClient();
  const gen = useServerFn(generateSigningLink);
  const [busy, setBusy] = useState(false);
  const link = app.signing_token && typeof window !== "undefined" ? `${window.location.origin}/creators/sign/${app.signing_token}` : null;
  const { data: hm } = useQuery({
    queryKey: ["portal", "admin", "hm-name", app.assigned_hm_id],
    enabled: Boolean(app.assigned_hm_id),
    queryFn: async () => (await supabase.from("profiles").select("full_name").eq("id", app.assigned_hm_id!).maybeSingle()).data,
  });
  if (app.status !== "approved") return null;
  const handoff = hm?.full_name ? <p className="rounded-xl bg-portal-accent/10 p-3 text-sm font-semibold text-portal-accent">Handed to {hm.full_name} for Upwork onboarding</p> : null;
  if (app.agreement_signed_at)
    return <>{handoff}<p className="rounded-xl bg-portal-green/10 p-3 text-sm font-semibold text-portal-green">Agreement signed on {formatDateTime(app.agreement_signed_at)}</p></>;
  async function regenerate() {
    setBusy(true);
    try {
      const { token } = await gen({ data: { applicationId: app.id } });
      onChange({ ...app, signing_token: token, signing_token_created_at: new Date().toISOString() });
      await queryClient.invalidateQueries({ queryKey: ["portal", "admin", "creator-applications"] });
      toast.success("New signing link ready. The old one no longer works.");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not generate the link.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>{handoff}
    <div className="space-y-2 rounded-xl border border-portal-amber/40 bg-portal-amber/10 p-3 text-sm">
      <p className="font-semibold text-portal-amber">Agreement not signed</p>
      {link ? (
        <div className="flex gap-2">
          <Input readOnly value={link} className="text-xs" />
          <Button type="button" size="sm" onClick={() => { void navigator.clipboard.writeText(link); toast.success("Link copied."); }}>Copy</Button>
        </div>
      ) : (
        <p className="text-xs text-brand-navySoft">No signing link yet.</p>
      )}
      <p className="text-xs text-brand-navySoft">Send this single-use link on Upwork. It stops working once signed.</p>
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void regenerate()}>
        {link ? "Regenerate link" : "Generate link"}
      </Button>
    </div>
    </>
  );
}

function ZoneBadge({ zone }: { zone: string | null }) {
  return zone ? (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${ZONE_BADGE[zone] ?? ""}`}>Zone {zone}</span>
  ) : (
    <span className="rounded-full bg-portal-red/10 px-2 py-0.5 text-[11px] font-bold text-portal-red">No zone</span>
  );
}

function ZonePanel({ app, onChange }: { app: SlideshowApplication; onChange: (next: SlideshowApplication) => void }) {
  const queryClient = useQueryClient();
  const setZone = useServerFn(setApplicationZone);
  const loadGuide = useServerFn(getGuideForApplication);
  const [zone, setZ] = useState<"A" | "B" | "C">("A");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: info } = useQuery({
    queryKey: ["portal", "admin", "zone-info", app.zone, app.country],
    queryFn: async () => {
      const [pz, cz] = await Promise.all([
        app.zone ? supabase.from("pay_zones").select("*").eq("zone", app.zone).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("country_zones").select("country_code, country_name, ceiling_applies"),
      ]);
      const c = (app.country ?? "").trim().toLowerCase();
      const match = (cz.data ?? []).find((r) => r.country_name.toLowerCase() === c || r.country_code.toLowerCase() === c);
      return { pz: pz.data as any, ceiling: Boolean(match?.ceiling_applies) };
    },
  });
  async function save() {
    if (note.trim().length < 3) { toast.error("Add a note explaining the zone."); return; }
    setBusy(true);
    try {
      await setZone({ data: { applicationId: app.id, zone, note: note.trim() } });
      onChange({ ...app, zone, zone_override: true, zone_note: note.trim() });
      await queryClient.invalidateQueries({ queryKey: ["portal", "admin", "creator-applications"] });
      toast.success(`Zone ${zone} set.`);
    } catch (e: any) { toast.error(e?.message ?? "Could not set the zone."); } finally { setBusy(false); }
  }
  async function pdf() {
    try {
      const g = await loadGuide({ data: { applicationId: app.id } });
      const { downloadDocumentPdf } = await import("@/lib/documentPdf");
      await downloadDocumentPdf({ slug: "slideshow-guide", title: g.title, subtitle: "Sophia · TikTok slideshow programme", version: g.version, blocks: g.blocks, filename: GUIDE_PDF_NAME });
    } catch (e: any) { toast.error(e?.message ?? "Could not build the PDF."); }
  }
  const shown = app.guide_figures_shown as { weekly_amount?: number; first_week_amount?: number; trial_amount?: number; monthly_amount?: number } | null;
  return (
    <div className="space-y-3 rounded-xl border border-brand-line p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <ZoneBadge zone={app.zone} />
        {info?.pz ? (
          <span className="text-brand-navy">${Number(info.pz.weekly_amount)}/week · first week ${Number(info.pz.first_week_amount)}</span>
        ) : null}
        {app.zone === "A" && info?.ceiling && info.pz?.ceiling_amount ? (
          <span className="text-xs text-brand-navySoft">ceiling ${Number(info.pz.ceiling_amount)}, only as a response to a refusal</span>
        ) : null}
      </div>
      {app.zone_override ? <p className="text-xs text-brand-navySoft">Set manually{app.zone_note ? `: ${app.zone_note}` : ""}</p> : null}
      {!app.zone ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Set a zone manually</p>
          <div className="flex flex-wrap gap-2">
            <Select value={zone} onValueChange={(v) => setZ(v as "A" | "B" | "C")}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="A">Zone A</SelectItem><SelectItem value="B">Zone B</SelectItem><SelectItem value="C">Zone C</SelectItem></SelectContent>
            </Select>
            <Input className="min-w-0 flex-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (who approved, why)" />
            <Button type="button" size="sm" disabled={busy} onClick={() => void save()}>Set zone</Button>
          </div>
        </div>
      ) : null}
      {app.status === "approved" ? (
        <div className="space-y-1 border-t border-brand-line pt-3">
          <p className="text-xs text-brand-navySoft">
            {app.guide_opened_at
              ? `Guide opened ${formatDateTime(app.guide_opened_at)} · Zone ${app.guide_zone_shown ?? "?"} figures shown${shown ? ` ($${shown.weekly_amount ?? "?"}/week, first week $${shown.first_week_amount ?? "?"})` : ""}`
              : "Guide not opened yet."}
          </p>
          {app.zone ? <Button type="button" size="sm" variant="outline" onClick={() => void pdf()}>Download guide PDF</Button> : null}
        </div>
      ) : null}
    </div>
  );
}

function SimpleApplications({ rows, busy, onOpen, onAccept }: { rows: UgcApplication[]; busy: boolean; onOpen: (r: UgcApplication) => void; onAccept: (r: UgcApplication) => void }) {
  const flagOf = (c: string | null) => { const x = (c ?? "").trim().toUpperCase(); return /^[A-Z]{2}$/.test(x) ? String.fromCodePoint(...[...x].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65)) : (c ?? ""); };
  if (!rows.length) return <p className="p-5 text-sm text-brand-navySoft">No application waiting.</p>;
  return (
    <table className="w-full min-w-[720px] text-sm" data-testid="ugc-applications">
      <thead className="text-left text-xs uppercase text-brand-navySoft"><tr><th className="p-3">Applicant</th><th className="p-3">Accounts</th><th className="p-3">Applied on</th><th className="p-3"><span className="sr-only">Decision</span></th></tr></thead>
      <tbody>{rows.map((r) => (
        <tr key={r.id} onClick={() => onOpen(r)} className="cursor-pointer border-t border-brand-line hover:bg-portal-bg">
          <td className="p-3"><span className="flex items-center gap-2"><PersonAvatar name={r.full_name} /><b className="text-brand-navy">{r.full_name}</b><span title={r.country ?? ""}>{flagOf(r.country)}</span></span></td>
          <td className="p-3"><HandleLinksInline tiktok={r.tiktok_url} instagram={r.instagram_url} /></td>
          <td className="p-3 text-brand-navySoft">{new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
          <td className="p-3"><span className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" disabled={busy} onClick={() => onAccept(r)}>Accept</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onOpen(r)}>Reject</Button>
          </span></td>
        </tr>
      ))}</tbody>
    </table>
  );
}
