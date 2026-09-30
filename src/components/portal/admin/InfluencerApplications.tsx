import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/portal";
import { acceptInfluencerApplication } from "@/lib/influencer-admin.functions";
import { computeTier } from "@/i18n/influencers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";
import { EmptyState, PageTitle, PortalCard } from "../ui";
import { usePortalProfile } from "../usePortal";
import { SocialLinks } from "./ApplicationVideo";

type App = Database["public"]["Tables"]["influencer_applications"]["Row"];

const STATUS_CLASS: Record<string, string> = {
  new: "bg-portal-amber/15 text-portal-amber",
  reviewing: "bg-portal-accent/10 text-portal-accent",
  waitlist: "bg-brand-navy/10 text-brand-navy",
  accepted: "bg-portal-green/10 text-portal-green",
  rejected: "bg-portal-red/10 text-portal-red",
};
const fmt = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString("en-GB"));
function largest(a: App) {
  const list: [string, number][] = [["TikTok", a.tiktok_followers ?? 0], ["Instagram", a.instagram_followers ?? 0], ["YouTube", a.youtube_subscribers ?? 0]];
  return list.sort((x, y) => y[1] - x[1])[0];
}

export function InfluencerApplications() {
  const qc = useQueryClient();
  const { data: me } = usePortalProfile();
  const accept = useServerFn(acceptInfluencerApplication);
  const [status, setStatus] = useState("new");
  const [selected, setSelected] = useState<App | null>(null);
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["portal", "admin", "influencer-applications", status],
    queryFn: async () => {
      let q = supabase.from("influencer_applications").select("*").order("created_at", { ascending: false });
      if (status !== "all") q = q.eq("status", status);
      const { data: rows, error } = await q;
      if (error) throw error;
      return rows ?? [];
    },
  });
  const rows = useMemo(() => [...(data ?? [])].sort((a, b) => largest(b)[1] - largest(a)[1]), [data]);

  function open(a: App) {
    setSelected(a);
    setNotes(a.admin_notes ?? "");
    setReason(a.rejection_reason ?? "");
  }
  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["portal", "admin", "influencer-applications"] });
    await qc.invalidateQueries({ queryKey: ["portal", "nav-counts"] });
  }
  async function setState(next: "reviewing" | "waitlist" | "rejected") {
    if (!selected || !me?.profile) return;
    if (next === "rejected" && !reason.trim()) return void toast.error("Add a rejection reason first.");
    setBusy(true);
    const { error } = await supabase.from("influencer_applications").update({
      status: next, admin_notes: notes.trim() || null,
      rejection_reason: next === "rejected" ? reason.trim() : null,
      ...(next === "rejected" ? { decided_at: new Date().toISOString(), decided_by: me.profile.id } : {}),
    }).eq("id", selected.id);
    setBusy(false);
    if (error) return void toast.error("The change could not be saved.");
    toast.success("Saved.");
    setSelected(null);
    await refresh();
  }
  async function onAccept() {
    if (!selected) return;
    setBusy(true);
    try {
      await accept({ data: { applicationId: selected.id, notes: notes.trim() || undefined } });
      toast.success("Accepted. The influencer has been added to the roster.");
      setSelected(null);
      await refresh();
    } catch {
      toast.error("The application could not be accepted.");
    } finally {
      setBusy(false);
    }
  }
  async function openKit(path: string) {
    const { data: s } = await supabase.storage.from("influencer-files").createSignedUrl(path, 600);
    if (s?.signedUrl) window.open(s.signedUrl, "_blank", "noopener,noreferrer");
    else toast.error("The media kit could not be opened.");
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Influencer applications" lead="Sorted by largest audience. These never mix with author, UGC or slideshow data." />
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="h-11 w-44" aria-label="Filter by status"><SelectValue /></SelectTrigger>
        <SelectContent>
          {["new", "reviewing", "waitlist", "accepted", "rejected", "all"].map((s) => <SelectItem key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</SelectItem>)}
        </SelectContent>
      </Select>
      <PortalCard className="overflow-x-auto p-0">
        {rows.length ? (
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-brand-navySoft">
              <tr>{["Name", "Tier", "Largest", "Followers", "Avg views", "Rate TikTok", "Niches", "Agency", "Applied", "Status"].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {rows.map((a) => {
                const [platform, n] = largest(a);
                return (
                  <tr key={a.id} className="cursor-pointer hover:bg-brand-navy/5" onClick={() => open(a)}>
                    <td className="px-4 py-3 font-bold text-brand-navy">{a.full_name}<span className="block text-xs font-normal text-brand-navySoft">{a.city}, {a.country}</span></td>
                    <td className="px-4 py-3 capitalize">{computeTier(n)}</td>
                    <td className="px-4 py-3">{platform}</td>
                    <td className="px-4 py-3">{fmt(n)}</td>
                    <td className="px-4 py-3">{fmt(a.tiktok_avg_views)}</td>
                    <td className="px-4 py-3">€{fmt(Number(a.rate_tiktok))}</td>
                    <td className="px-4 py-3">{a.niche_tags.join(", ")}</td>
                    <td className="px-4 py-3">{a.has_agency ? a.agency_name : "—"}</td>
                    <td className="px-4 py-3 text-xs">{formatDateTime(a.created_at)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_CLASS[a.status] ?? ""}`}>{a.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <EmptyState title="Nothing here" text="No influencer application matches this filter." />
        )}
      </PortalCard>

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selected ? (
            <>
              <DialogHeader><DialogTitle>{selected.full_name}</DialogTitle></DialogHeader>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                {[
                  ["Email", selected.email], ["Phone", selected.phone], ["Location", `${selected.city}, ${selected.country}`], ["Age", selected.age],
                  ["TikTok followers", fmt(selected.tiktok_followers)], ["TikTok avg views (last 10)", fmt(selected.tiktok_avg_views)],
                  ["Instagram followers", fmt(selected.instagram_followers)], ["YouTube subscribers", fmt(selected.youtube_subscribers)],
                  ["Rate per TikTok", `€${fmt(Number(selected.rate_tiktok))}`], ["Rate per Reel", selected.rate_reel != null ? `€${fmt(Number(selected.rate_reel))}` : "—"],
                  ["Monthly partnership", selected.accepts_recurring], ["Niches", selected.niche_tags.join(", ")], ["Languages", selected.languages.join(", ")],
                  ["Agency", selected.has_agency ? `${selected.agency_name ?? ""} — ${selected.agency_contact ?? ""}` : "No"],
                  ["Heard about us", selected.referral_source ?? "—"], ["Applied", formatDateTime(selected.created_at)],
                ].map(([k, v]) => (
                  <div key={String(k)}><dt className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">{k}</dt><dd className="text-brand-navy">{String(v)}</dd></div>
                ))}
              </dl>
              <SocialLinks tiktok={selected.tiktok_url} instagram={selected.instagram_url} other={[selected.youtube_url, ...selected.proud_links, selected.media_kit_url].filter(Boolean).join("\n")} />
              {selected.media_kit_path ? (
                <Button variant="pillSecondary" size="pillSm" onClick={() => void openKit(selected.media_kit_path!)}><FileText className="size-4" /> Open media kit</Button>
              ) : null}
              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-wide text-brand-navySoft" htmlFor="inf-notes">Admin notes</label>
                <Textarea id="inf-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                <label className="text-xs font-bold uppercase tracking-wide text-brand-navySoft" htmlFor="inf-reason">Rejection reason</label>
                <Input id="inf-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              {selected.status !== "accepted" ? (
                <div className="flex flex-wrap gap-2">
                  <Button variant="pill" size="pillSm" disabled={busy} onClick={() => void onAccept()}>Accept</Button>
                  <Button variant="pillSecondary" size="pillSm" disabled={busy} onClick={() => void setState("reviewing")}>Reviewing</Button>
                  <Button variant="pillSecondary" size="pillSm" disabled={busy} onClick={() => void setState("waitlist")}>Waitlist</Button>
                  <Button variant="outline" size="pillSm" disabled={busy} onClick={() => void setState("rejected")}>Reject</Button>
                </div>
              ) : (
                <p className="text-sm text-brand-navySoft">Accepted — on the roster. Their invitation to the influencer space will be sent once that space is live.</p>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
