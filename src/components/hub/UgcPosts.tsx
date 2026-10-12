import { TEST_CHIP, useShowTest } from "./show-test";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AppBadge, useAdminApp } from "@/lib/apps";
import { approveReadyPayout, decidePosts, simulateJ7 } from "@/lib/ugc-loop.functions";
import { PostThumb } from "./PostThumb";

const card = "rounded-2xl bg-card p-5 shadow-portal";
const eurFr = (n: unknown) => `${Number(n ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const d = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—");
type Row = {
  id: string; creator_id: string; url: string; platform: string; status: string; feedback: string | null; app_id: string; brief_id: string | null; submitted_at: string | null; created_at: string;
  guidelines_checked: string[]; validated_at: string | null; pay_status: string | null; views: number | null; views_frozen: number | null; pay_amount: number | null; pay_formula: string | null; pay_flag: string | null; cover_url: string | null;
  creators: { full_name: string; is_test?: boolean } | null; briefs: { title: string } | null;
};

function usePosts(appId: string | null) {
  const [showTest] = useShowTest();
  return useQuery({
    queryKey: [...["hub", "ugc-posts", appId], showTest],
    queryFn: async () => {
      let q = supabase.from("creator_posts").select("id, creator_id, url, platform, status, feedback, app_id, brief_id, submitted_at, created_at, guidelines_checked, validated_at, pay_status, views, views_frozen, pay_amount, pay_formula, pay_flag, cover_url, creators!inner(full_name, is_test), briefs(title)").order("created_at", { ascending: false }).limit(500);
      if (appId) q = q.eq("app_id", appId);
      if (!showTest) q = q.eq("creators.is_test", false);
      return ((await q).data ?? []) as unknown as Row[];
    },
  });
}
function useGuidelineCount() {
  return useQuery({ queryKey: ["ugc-guidelines-count"], queryFn: async () => (await supabase.from("ugc_guidelines").select("id", { count: "exact", head: true }).eq("active", true)).count ?? 0 });
}

/** Posts: the validation queue, then tracking until J+7 with the pay formula. */
export function UgcPosts() {
  const { appId } = useAdminApp(); const qc = useQueryClient();
  const { data = [] } = usePosts(appId); const { data: gCount = 0 } = useGuidelineCount();
  const decide = useServerFn(decidePosts); const sim = useServerFn(simulateJ7);
  const [tab, setTab] = useState<"queue" | "tracking" | "refused">("queue");
  const [sel, setSel] = useState<Set<string>>(new Set()); const [open, setOpen] = useState<Row | null>(null);
  const [reasonFor, setReasonFor] = useState<string | null>(null); const [reason, setReason] = useState(""); const [busy, setBusy] = useState<string | null>(null);
  const queue = data.filter((p) => p.status === "pending");
  const tracking = data.filter((p) => p.status === "approved");
  const refused = data.filter((p) => p.status === "rejected");
  const rows = tab === "queue" ? queue : tab === "tracking" ? tracking : refused;
  const reload = () => { setSel(new Set()); void qc.invalidateQueries({ queryKey: ["hub"] }); };
  async function run(ids: string[], decision: "approve" | "reject", why?: string) {
    try { const r = await decide({ data: { ids, decision, ...(why ? { reason: why } : {}) } }); toast.success(`${r.updated} ${decision === "approve" ? "validated" : "refused"}`); setReasonFor(null); setReason(""); reload(); }
    catch (e) { toast.error((e as Error).message); }
  }
  const stage = (p: Row) => p.pay_status === "ready" ? "Ready for payment" : p.pay_status === "no_data" ? "No view data at J+7" : p.pay_status === "approved" ? "In a payout" : p.pay_status === "paid" ? "Paid" : `Tracking · J+7 on ${d(p.validated_at ? new Date(new Date(p.validated_at).getTime() + 7 * 86400000).toISOString() : null)}`;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {([["queue", `To validate ${queue.length}`], ["tracking", `Validated & tracking ${tracking.length}`], ["refused", `Refused ${refused.length}`]] as const).map(([k, l]) => (
          <button key={k} type="button" aria-pressed={tab === k} onClick={() => { setTab(k); setSel(new Set()); }} className={cn("min-h-9 rounded-full px-4 text-sm font-bold", tab === k ? "bg-brand-navy text-card" : "bg-card text-brand-navy")}>{l}</button>
        ))}
        {tab === "queue" && sel.size ? <Button size="sm" className="ml-auto" onClick={() => void run([...sel], "approve")}>Validate {sel.size} selected</Button> : null}
      </div>
      {!rows.length ? <p className={cn(card, "text-sm text-brand-navySoft")}>{tab === "queue" ? "No link waiting for validation." : tab === "tracking" ? "No validated post yet." : "No refused link."}</p> : (
        <div className="overflow-x-auto rounded-2xl bg-card shadow-portal">
          <table className="w-full min-w-[900px] text-sm" data-testid="posts-table">
            <thead><tr className="border-b text-left text-xs text-brand-navySoft">
              {tab === "queue" ? <th className="p-3"><input type="checkbox" aria-label="Select all" checked={sel.size === rows.length} onChange={(e) => setSel(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} /></th> : null}
              <th className="p-3">Video</th><th>Creator</th><th>Brief</th><th>Submitted</th>{tab === "tracking" ? <><th>Status</th><th>Pay</th></> : <th>Guidelines</th>}<th className="p-3 text-right">{tab === "refused" ? "Reason" : ""}</th>
            </tr></thead>
            <tbody>{rows.map((p) => (
              <tr key={p.id} className="border-b align-top last:border-0" data-testid="post-admin-row">
                {tab === "queue" ? <td className="p-3"><input type="checkbox" aria-label={`Select ${p.url}`} checked={sel.has(p.id)} onChange={(e) => { const n = new Set(sel); if (e.target.checked) n.add(p.id); else n.delete(p.id); setSel(n); }} /></td> : null}
                <td className="p-3"><button type="button" onClick={() => setOpen(p)} className="flex items-center gap-2 text-left"><span className="block h-16 w-10 overflow-hidden rounded-md bg-muted">{p.cover_url ? <img src={p.cover_url} alt="" className="size-full object-cover" /> : <PostThumb url={p.url} className="size-full" />}</span><span><b className="capitalize">{p.platform}</b><span className="block max-w-44 truncate text-xs text-portal-accent">{p.url.replace(/^https:\/\/(www\.)?/, "")}</span></span></button></td>
                <td className="py-3 pr-2"><b>{p.creators?.full_name ?? "deleted"}</b>{p.creators?.is_test ? <span className={TEST_CHIP}>test</span> : null}<div><AppBadge appId={p.app_id} /></div></td>
                <td className="py-3 pr-2">{p.briefs?.title ?? "—"}</td>
                <td className="py-3 pr-2">{d(p.submitted_at ?? p.created_at)}</td>
                {tab === "tracking" ? <>
                  <td className="py-3 pr-2"><span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", p.pay_status === "ready" ? "bg-portal-green/15 text-portal-green" : p.pay_status === "no_data" ? "bg-portal-amber/20 text-brand-navy" : "bg-muted")}>{stage(p)}</span><div className="mt-1 text-xs text-brand-navySoft">{(p.views_frozen ?? p.views) != null ? `${Number(p.views_frozen ?? p.views).toLocaleString("en-GB")} views${p.views_frozen != null ? " (frozen)" : " so far"}` : "no views yet"}</div>{p.pay_flag ? <div className="text-xs text-portal-amber">{p.pay_flag}</div> : null}</td>
                  <td className="py-3 pr-2"><b>{p.pay_amount != null ? eurFr(p.pay_amount) : "—"}</b>{p.pay_formula ? <div className="max-w-64 text-xs text-brand-navySoft" data-testid="pay-formula">{p.pay_formula}</div> : null}</td>
                </> : <td className="py-3 pr-2">{gCount ? `${(p.guidelines_checked ?? []).length}/${gCount} ticked` : "—"}</td>}
                <td className="p-3 text-right">
                  {tab === "queue" ? (reasonFor === p.id ? (
                    <div className="ml-auto flex max-w-72 flex-col gap-1"><input aria-label="Refusal reason" autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason sent to the creator" className="h-9 rounded-lg border px-2 text-sm" /><div className="flex justify-end gap-1"><Button size="sm" variant="ghost" onClick={() => setReasonFor(null)}>Cancel</Button><Button size="sm" variant="destructive" disabled={reason.trim().length < 3} onClick={() => void run([p.id], "reject", reason.trim())}>Refuse</Button></div></div>
                  ) : <div className="flex justify-end gap-1"><Button size="sm" onClick={() => void run([p.id], "approve")}>Valider</Button><Button size="sm" variant="outline" onClick={() => { setReasonFor(p.id); setReason(""); }}>Refuser</Button></div>)
                  : tab === "refused" ? <span className="text-xs">{p.feedback}</span>
                  : p.pay_status === "tracking" ? <Button size="sm" variant="outline" disabled={busy === p.id} title="Admin test switch: refresh views now and freeze as if J+7 had passed" onClick={async () => { setBusy(p.id); try { const r = await sim({ data: { postId: p.id } }); toast.success(r.ready ? "Frozen: ready for payment" : "Frozen: no view data, flagged"); reload(); } catch (e) { toast.error((e as Error).message); } setBusy(null); }}><FlaskConical className="size-4" />Simulate J+7</Button> : null}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <Sheet open={Boolean(open)} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {open ? <div className="space-y-3">
            <SheetHeader><SheetTitle>{open.creators?.full_name ?? "deleted"} · {open.platform}</SheetTitle></SheetHeader>
            <div className="mx-auto aspect-[9/16] max-h-[70vh] overflow-hidden rounded-xl bg-brand-navy">
              {open.platform === "tiktok" && /\/video\/(\d+)/.test(open.url) ? <iframe title="TikTok preview" src={`https://www.tiktok.com/embed/v2/${open.url.match(/\/video\/(\d+)/)![1]}`} className="size-full" allow="encrypted-media" />
                : open.platform === "instagram" && /\/(reel|p)\/([^/]+)/.test(open.url) ? <iframe title="Instagram preview" src={`https://www.instagram.com/p/${open.url.match(/\/(?:reel|p)\/([^/?#]+)/)![1]}/embed`} className="size-full" />
                : <PostThumb url={open.url} className="size-full" />}
            </div>
            <a href={open.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-portal-accent">Open on {open.platform} <ExternalLink className="size-3" /></a>
            <p className="text-sm">Brief: {open.briefs?.title ?? "—"} · Guidelines ticked: {(open.guidelines_checked ?? []).length}/{gCount}</p>
          </div> : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Payouts → Ready: J+7-priced posts grouped by creator → Approve (creates a batch that Pay via Stripe / exports below handle). */
export function ReadyForPayment() {
  const { appId } = useAdminApp(); const qc = useQueryClient(); const approve = useServerFn(approveReadyPayout);
  const { data = [] } = useQuery({
    queryKey: ["hub", "ugc-ready", appId],
    queryFn: async () => {
      let q = supabase.from("creator_posts").select("id, creator_id, url, pay_amount, pay_formula, views_frozen, platform, app_id, creators!inner(full_name, is_test)").eq("creators.is_test", false).eq("pay_status", "ready");
      if (appId) q = q.eq("app_id", appId);
      return ((await q).data ?? []) as unknown as { id: string; creator_id: string; url: string; pay_amount: number; pay_formula: string; views_frozen: number; platform: string; creators: { full_name: string } | null }[];
    },
  });
  const { data: min = 20 } = useQuery({ queryKey: ["hub", "min-payout"], queryFn: async () => Number((await supabase.from("ugc_settings").select("min_payout").eq("id", 1).maybeSingle()).data?.min_payout ?? 20) });
  const groups = useMemo(() => { const m = new Map<string, typeof data>(); for (const p of data) m.set(p.creator_id, [...(m.get(p.creator_id) ?? []), p]); return [...m.values()]; }, [data]);
  const total = data.reduce((s, p) => s + Number(p.pay_amount), 0);
  return (
    <section className={card} data-testid="ready-for-payment">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-extrabold text-brand-navy">Ready for payment · {eurFr(total)}</h2><p className="text-xs text-brand-navySoft">Posts priced at J+7 after validation (that is the hold). Minimum payout {min} € per creator; below it carries over.</p></div>
      {!groups.length ? <p className="mt-3 text-sm text-brand-navySoft">Nothing ready yet.</p> : <div className="mt-3 space-y-3">{groups.map((g) => { const sum = g.reduce((s, p) => s + Number(p.pay_amount), 0); return (
        <div key={g[0]!.creator_id} className="rounded-xl border border-brand-line p-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><b>{g[0]!.creators?.full_name ?? "deleted"} · {g.length} post{g.length > 1 ? "s" : ""} · {eurFr(sum)}</b>
            <Button size="sm" disabled={sum < min} title={sum < min ? `Below the ${min} € minimum` : undefined} onClick={async () => { try { const r = await approve({ data: { creatorId: g[0]!.creator_id } }); toast.success(`Approved ${eurFr(r.total)} — pay it in the batch below`); void qc.invalidateQueries(); } catch (e) { toast.error((e as Error).message); } }}>{sum < min ? `Below ${min} €` : "Approve"}</Button></div>
          <ul className="mt-2 space-y-1 text-xs text-brand-navySoft">{g.map((p) => <li key={p.id}><a href={p.url} target="_blank" rel="noreferrer" className="text-portal-accent">{p.platform}</a> · {p.pay_formula}</li>)}</ul>
        </div>); })}</div>}
    </section>
  );
}
