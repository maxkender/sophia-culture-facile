import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AppBadge, useAdminApp } from "@/lib/apps";
import { draftVideoUrl, reviewDraft } from "@/lib/ugc-drafts.functions";
import { PersonAvatar, useCreatorPhotos } from "./PersonAvatar";
import { UgcPosts } from "./UgcPosts";

type DraftRow = {
  id: string; creator_id: string; brief_id: string; app_id: string | null; version: number; video_path: string | null; link_url: string | null; note: string | null; created_at: string;
  creators: { full_name: string } | null; briefs: { title: string; hook: string | null; style: string | null } | null;
};

export function useDraftsToReview(appId: string | null) {
  return useQuery({
    queryKey: ["hub", "ugc-drafts", appId],
    queryFn: async () => {
      let q = supabase.from("creator_drafts").select("id, creator_id, brief_id, app_id, version, video_path, link_url, note, created_at, creators!inner(full_name, is_test), briefs(title, hook, style)").eq("status", "submitted").eq("creators.is_test", false).order("created_at", { ascending: true }).limit(500);
      if (appId) q = q.eq("app_id", appId);
      return ((await q).data ?? []) as unknown as DraftRow[];
    },
  });
}

/** Hub → UGC → Posts: Drafts to review · Posts. */
export function UgcPostsPage() {
  const { appId } = useAdminApp();
  const { data = [] } = useDraftsToReview(appId);
  const [tab, setTab] = useState<"drafts" | "posts">("drafts");
  return (
    <div className="space-y-4">
      <div className="flex gap-1" role="tablist">
        {([["drafts", `Drafts to review (${data.length})`], ["posts", "Posts"]] as const).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("min-h-9 rounded-full px-4 py-2 text-sm font-bold", tab === k ? "bg-brand-navy text-card" : "bg-card text-brand-navy")}>{l}</button>
        ))}
      </div>
      {tab === "drafts" ? <DraftsList rows={data} /> : <UgcPosts />}
    </div>
  );
}

function DraftsList({ rows }: { rows: DraftRow[] }) {
  const photos = useCreatorPhotos([...new Set(rows.map((r) => r.creator_id))]);
  const [open, setOpen] = useState<DraftRow | null>(null);
  if (!rows.length) return <p className="rounded-2xl bg-card p-5 text-sm text-brand-navySoft shadow-portal">No draft waiting for review.</p>;
  return (
    <>
      <div className="overflow-x-auto rounded-2xl bg-card shadow-portal">
        <table className="w-full min-w-[640px] text-sm" data-testid="ugc-drafts">
          <thead className="text-left text-xs uppercase text-brand-navySoft"><tr><th className="p-3">Creator</th><th className="p-3">Brief</th><th className="p-3">Version</th><th className="p-3">Sent on</th><th className="p-3">Note</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} onClick={() => setOpen(r)} className="cursor-pointer border-t border-brand-line hover:bg-portal-bg">
              <td className="p-3"><span className="flex items-center gap-2"><PersonAvatar name={r.creators?.full_name ?? "?"} url={photos[r.creator_id]} /><b className="text-brand-navy">{r.creators?.full_name}</b></span></td>
              <td className="p-3"><span className="flex items-center gap-2">{r.briefs?.title ?? "—"}<AppBadge appId={r.app_id} /></span></td>
              <td className="p-3">v{r.version}</td>
              <td className="p-3 text-brand-navySoft">{new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td>
              <td className="max-w-[260px] truncate p-3 text-brand-navySoft">{r.note ?? "—"}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">{open ? <DraftReview key={open.id} d={open} onDone={() => setOpen(null)} /> : null}</SheetContent>
      </Sheet>
    </>
  );
}

function DraftReview({ d, onDone }: { d: DraftRow; onDone: () => void }) {
  const qc = useQueryClient();
  const sign = useServerFn(draftVideoUrl); const review = useServerFn(reviewDraft);
  const { data: url } = useQuery({ queryKey: ["hub", "draft-video", d.id], enabled: !!d.video_path, queryFn: async () => (await sign({ data: { id: d.id } })).url });
  const [comment, setComment] = useState(""); const [busy, setBusy] = useState(false);
  async function decide(decision: "validated" | "changes_requested") {
    if (decision === "changes_requested" && comment.trim().length < 2) return void toast.error("Write what needs to change.");
    setBusy(true);
    try {
      const r = await review({ data: { id: d.id, decision, ...(comment.trim() ? { comment: comment.trim() } : {}), origin: window.location.origin } });
      toast.success(`${decision === "validated" ? "Validated" : "Changes requested"}${r.emailSent ? " — email sent" : ""}`);
      await qc.invalidateQueries({ queryKey: ["hub"] }); onDone();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-4">
      <SheetHeader><SheetTitle>{d.creators?.full_name} · v{d.version}</SheetTitle></SheetHeader>
      <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
        <div>
          {d.video_path ? (url ? <video src={url} controls playsInline className="max-h-[60vh] w-full rounded-xl bg-brand-navy" data-testid="draft-player" /> : <p className="text-sm text-brand-navySoft">Loading video…</p>)
            : d.link_url ? <a href={d.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-portal-accent underline"><ExternalLink className="size-4" />Open the draft link</a> : null}
          {d.note ? <p className="mt-3 rounded-xl bg-portal-bg p-3 text-sm"><b>Note:</b> {d.note}</p> : null}
        </div>
        <aside className="rounded-xl bg-portal-bg p-3 text-sm">
          <p className="text-xs font-bold uppercase text-brand-navySoft">Brief</p>
          <p className="font-extrabold text-brand-navy">{d.briefs?.title}</p>
          {d.briefs?.style ? <p className="mt-1 text-xs text-brand-navySoft">Style: {d.briefs.style.replace(/_/g, " ")}</p> : null}
          {d.briefs?.hook ? <p className="mt-2 text-brand-navy">“{d.briefs.hook}”</p> : null}
        </aside>
      </div>
      <Textarea aria-label="Comment" placeholder="Comment (required to request changes)" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => void decide("validated")}>Validate</Button>
        <Button disabled={busy} variant="outline" onClick={() => void decide("changes_requested")}>Request changes</Button>
      </div>
    </div>
  );
}

/** Settings → Shooting rules: whether a validated draft is needed before posting. */
export function DraftRequiredToggle() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["hub", "draft-required"], queryFn: async () => (await supabase.from("ugc_settings").select("draft_required").eq("id", 1).maybeSingle()).data?.draft_required ?? true });
  return (
    <label className="flex items-center gap-3 rounded-2xl bg-card p-4 text-sm font-bold text-brand-navy shadow-portal">
      <input type="checkbox" className="size-5" checked={data ?? true} onChange={async (e) => {
        const { error } = await supabase.from("ugc_settings").update({ draft_required: e.target.checked }).eq("id", 1);
        if (error) toast.error("Could not save."); else { toast.success("Saved"); void qc.invalidateQueries({ queryKey: ["hub", "draft-required"] }); }
      }} />
      Draft validation required before posting
      <span className="font-normal text-brand-navySoft">— when off, drafts are optional.</span>
    </label>
  );
}
