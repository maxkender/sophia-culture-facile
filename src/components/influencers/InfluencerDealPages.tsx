import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  checkpointOpen, CHECKPOINTS, cpm, daysLeft, DEAL_LABEL, deliverableLabel, euros, parseDeliverables, RIGHTS_LABEL, timeLeft, type Rights,
} from "@/lib/influencer-deals";
import {
  dealUploadSlot, flagBriefInterest, invoiceUploadSlot, openMyInvoice, submitInvoice, markOfferViewed, markPosted, openDealFile, reportMetrics, respondToOffer, setSparkCode, signDealSheet, submitDraft,
} from "@/lib/influencer-deals.functions";
import { friendlyCreatorError } from "@/lib/creator-validation";
import { DealSheetView } from "./DealSheetView";
import { useInfluencerQuery } from "./useInfluencer";

function msg(e: unknown) {
  const m = e instanceof Error ? e.message : "";
  if (!m || m.startsWith("[") || m.includes("{")) return friendlyCreatorError(e);
  return m;
}
function Title({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-brand-navy">{title}</h1>
      {lead ? <p className="mt-2 text-brand-navySoft">{lead}</p> : null}
    </div>
  );
}
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl bg-card p-5 shadow-card md:p-6", className)}>{children}</section>;
}
function useTick(ms = 60_000) {
  const [, set] = useState(0);
  useEffect(() => { const t = setInterval(() => set((n) => n + 1), ms); return () => clearInterval(t); }, [ms]);
}

export const OFFERS_KEY = ["influencer", "offers"] as const;
export const DEALS_KEY = ["influencer", "deals"] as const;

export function useMyOffers() {
  return useQuery({
    queryKey: OFFERS_KEY,
    refetchInterval: 60_000,
    queryFn: async () => (await supabase.from("influencer_offers").select("*, influencer_briefs(*)").order("created_at", { ascending: false })).data ?? [],
  });
}
export function useMyDeals() {
  return useQuery({
    queryKey: DEALS_KEY,
    refetchInterval: 60_000,
    queryFn: async () => (await supabase.from("influencer_deals").select("*, influencer_deliverables(*, influencer_deliverable_metrics(*))").order("created_at", { ascending: false })).data ?? [],
  });
}
type DealRow = NonNullable<ReturnType<typeof useMyDeals>["data"]>[number];

const live = (o: { status: string; expires_at: string | null }) => ["sent", "viewed"].includes(o.status) && (!o.expires_at || new Date(o.expires_at).getTime() > Date.now());

/** What the influencer must do next on a deal; null when nothing is waiting on them. */
export function nextStep(d: DealRow): string | null {
  const items = d.influencer_deliverables ?? [];
  const snap = (d.deal_sheet_snapshot ?? {}) as { draft_approval_required?: boolean };
  if (["completed", "cancelled"].includes(d.status)) return null;
  if (!d.deal_sheet_signed_at) return "Sign the Deal Sheet to start production.";
  if (items.some((i) => i.status === "changes_requested")) return "Changes were requested on your draft: send a new version.";
  if (snap.draft_approval_required && items.some((i) => i.status === "pending")) return "Record your video and send the draft for approval.";
  if (items.some((i) => i.status === "draft_submitted")) return null;
  if (items.some((i) => i.status === "pending" || i.status === "draft_approved")) return "Publish the post on your account and paste its link.";
  for (const i of items) {
    for (const c of CHECKPOINTS) {
      if (checkpointOpen(i.posted_at, c.id) && !(i.influencer_deliverable_metrics ?? []).some((m) => m.checkpoint === c.id)) return `Report your ${c.id} numbers with a screenshot.`;
    }
  }
  return null;
}

export function useInfluencerBadges() {
  const { data: offers = [] } = useMyOffers();
  const { data: deals = [] } = useMyDeals();
  return { offers: offers.filter(live).length, deals: deals.filter((d) => nextStep(d)).length };
}

/* ---------------- Offers ---------------- */
export function InfluencerOffers() {
  useTick();
  const { data: offers, isLoading } = useMyOffers();
  const viewed = useServerFn(markOfferViewed);
  const qc = useQueryClient();
  const seen = useRef(new Set<string>());
  useEffect(() => {
    const fresh = (offers ?? []).filter((o) => o.status === "sent" && !seen.current.has(o.id));
    if (!fresh.length) return;
    fresh.forEach((o) => seen.current.add(o.id));
    void Promise.all(fresh.map((o) => viewed({ data: { offerId: o.id } }).catch(() => null))).then(() => qc.invalidateQueries({ queryKey: OFFERS_KEY }));
  }, [offers, viewed, qc]);
  if (isLoading) return <p className="text-sm">Loading…</p>;
  const open = (offers ?? []).filter(live);
  const past = (offers ?? []).filter((o) => !live(o));
  return (
    <div className="space-y-5">
      <Title title="Offers" lead="Each offer has a price, the deliverables, the rights and a deadline. Accept, counter once, or decline." />
      {open.length ? open.map((o) => <OfferCard key={o.id} offer={o} />) : <Card><p className="text-sm text-brand-navySoft">No open offer right now. When a brief fits you, it will appear here.</p></Card>}
      {past.length ? (
        <Card>
          <p className="mb-3 text-sm font-bold text-brand-navy">Past offers</p>
          <ul className="divide-y divide-brand-line text-sm">
            {past.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="font-semibold text-brand-navy">{o.influencer_briefs?.title}</span>
                <span className="text-brand-navySoft">{euros(o.status === "countered" ? o.counter_price : o.price)} · {o.status === "countered" ? "counter sent, waiting for Sophia" : ["sent", "viewed"].includes(o.status) ? "expired" : o.status}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

function OfferCard({ offer }: { offer: NonNullable<ReturnType<typeof useMyOffers>["data"]>[number] }) {
  const respond = useServerFn(respondToOffer);
  const qc = useQueryClient();
  const [mode, setMode] = useState<"counter" | "decline" | null>(null);
  const [price, setPrice] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const b = offer.influencer_briefs;
  const rights = RIGHTS_LABEL[offer.rights_package as Rights];
  const left = timeLeft(offer.expires_at);
  async function go(action: "accept" | "counter" | "decline") {
    if (action === "counter" && !(Number(price.replace(",", ".")) > 0)) return void toast.error("Enter your price in euros, for example 450.");
    setBusy(true);
    try {
      const r = await respond({ data: { offerId: offer.id, action, price: action === "counter" ? Number(price.replace(",", ".")) : undefined, message: text.trim() || undefined } });
      toast.success(action === "accept" ? "Accepted. Sign the Deal Sheet to start." : action === "counter" ? "Counter sent. Sophia will answer here." : "Offer declined.");
      await qc.invalidateQueries({ queryKey: OFFERS_KEY });
      await qc.invalidateQueries({ queryKey: DEALS_KEY });
      if (r.dealId) window.location.assign(`/creators/influencer/app/deals/${r.dealId}`);
    } catch (e) { toast.error(msg(e)); } finally { setBusy(false); }
  }
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xl font-extrabold text-brand-navy">{b?.title}</p>
          {b?.angle ? <p className="text-sm text-brand-navySoft">{b.angle}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-brand-navy">{euros(offer.price)}</p>
          <p className={cn("text-xs font-bold", left && /^\d+h/.test(left) ? "text-portal-red" : "text-portal-amber")}>{left}</p>
        </div>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="font-bold text-brand-navy">Deliverables</dt><dd className="text-brand-navySoft">{parseDeliverables(offer.deliverables).map(deliverableLabel).join(", ")}</dd></div>
        <div><dt className="font-bold text-brand-navy">Deadline to post</dt><dd className="text-brand-navySoft">{offer.deadline ?? "To agree"}</dd></div>
        <div className="sm:col-span-2"><dt className="font-bold text-brand-navy">What Sophia buys</dt><dd className="text-brand-navySoft">{rights?.plain}</dd></div>
        {offer.split_payment ? <div className="sm:col-span-2"><dt className="font-bold text-brand-navy">Payment</dt><dd className="text-brand-navySoft">50% when you accept, 50% when the post is live.</dd></div> : null}
        {b?.must_mention?.length ? <div className="sm:col-span-2"><dt className="font-bold text-brand-navy">Must mention</dt><dd className="text-brand-navySoft">{b.must_mention.join(", ")}</dd></div> : null}
        {b?.exclusivity_days ? <div className="sm:col-span-2"><dt className="font-bold text-brand-navy">Exclusivity</dt><dd className="text-brand-navySoft">{b.exclusivity_days} days without promoting a competing learning app.</dd></div> : null}
      </dl>
      {b?.body ? <details className="rounded-xl bg-brand-navy/5 p-4 text-sm"><summary className="cursor-pointer font-bold text-brand-navy">Read the full brief</summary><p className="mt-3 whitespace-pre-line text-brand-navy">{b.body}</p></details> : null}
      {offer.message ? <p className="rounded-xl border border-brand-line p-3 text-sm"><span className="font-bold">From Sophia: </span>{offer.message}</p> : null}
      {offer.counter_round > 0 ? <p className="text-xs text-brand-navySoft">This is Sophia's answer to your counter ({euros(offer.counter_price)}).</p> : null}
      {mode === "counter" ? (
        <div className="space-y-2">
          <Label htmlFor={`cp-${offer.id}`}>Your price (€)</Label>
          <Input id={`cp-${offer.id}`} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Why this price? (optional)" aria-label="Counter message" />
          <div className="flex gap-2"><Button variant="pill" size="pillSm" disabled={busy} onClick={() => void go("counter")}>Send counter</Button><Button variant="ghost" size="pillSm" onClick={() => setMode(null)}>Back</Button></div>
        </div>
      ) : mode === "decline" ? (
        <div className="space-y-2">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="A word on why (optional)" aria-label="Decline reason" />
          <div className="flex gap-2"><Button variant="outline" size="pillSm" disabled={busy} onClick={() => void go("decline")}>Decline offer</Button><Button variant="ghost" size="pillSm" onClick={() => setMode(null)}>Back</Button></div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="pill" size="pillSm" disabled={busy} onClick={() => void go("accept")}>Accept {euros(offer.price)}</Button>
          <Button variant="pillSecondary" size="pillSm" onClick={() => setMode("counter")}>Counter</Button>
          <Button variant="ghost" size="pillSm" onClick={() => setMode("decline")}>Decline</Button>
        </div>
      )}
    </Card>
  );
}

/* ---------------- Briefs board ---------------- */
export function InfluencerBriefs() {
  const qc = useQueryClient();
  const flag = useServerFn(flagBriefInterest);
  const { data: me } = useInfluencerQuery();
  const { data, isLoading } = useQuery({
    queryKey: ["influencer", "briefs"],
    queryFn: async () => {
      const [{ data: briefs }, { data: mine }] = await Promise.all([
        supabase.from("influencer_briefs").select("*").eq("status", "open").order("created_at", { ascending: false }),
        supabase.from("influencer_brief_interest").select("brief_id"),
      ]);
      return { briefs: briefs ?? [], interested: new Set((mine ?? []).map((m) => m.brief_id)) };
    },
  });
  if (isLoading || !data) return <p className="text-sm">Loading…</p>;
  return (
    <div className="space-y-5">
      <Title title="Briefs" lead={`Open briefs that match your profile${me?.tier ? ` (${me.tier})` : ""}. Tap "I'd do this" to tell us; it is not a commitment, and we send an offer if it fits.`} />
      {data.briefs.length ? data.briefs.map((b) => (
        <Card key={b.id} className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-lg font-extrabold text-brand-navy">{b.title}</p>
              {b.angle ? <p className="text-sm text-brand-navySoft">{b.angle}</p> : null}
            </div>
            {data.interested.has(b.id) ? <span className="rounded-full bg-portal-green/10 px-3 py-1 text-xs font-bold text-portal-green">You said you'd do this</span> : (
              <Button variant="pill" size="pillSm" onClick={async () => {
                try { await flag({ data: { briefId: b.id } }); toast.success("Noted. The team will see it."); await qc.invalidateQueries({ queryKey: ["influencer", "briefs"] }); }
                catch (e) { toast.error(msg(e)); }
              }}>I'd do this</Button>
            )}
          </div>
          <p className="text-sm text-brand-navySoft">{parseDeliverables(b.deliverables).map(deliverableLabel).join(", ")} · {RIGHTS_LABEL[b.rights_package as Rights]?.short}{b.latest_post_date ? ` · post by ${b.latest_post_date}` : ""}</p>
          <details className="text-sm"><summary className="cursor-pointer font-semibold text-brand-navy">Read the brief</summary><p className="mt-2 whitespace-pre-line">{b.body}</p></details>
        </Card>
      )) : <Card><p className="text-sm text-brand-navySoft">No open brief matches your profile right now.</p></Card>}
    </div>
  );
}

/* ---------------- Deals list ---------------- */
export function InfluencerDeals() {
  const { data: deals, isLoading } = useMyDeals();
  if (isLoading) return <p className="text-sm">Loading…</p>;
  return (
    <div className="space-y-4">
      <Title title="Deals" lead="Your accepted collaborations and what to do next on each." />
      {(deals ?? []).length ? (deals ?? []).map((d) => {
        const next = nextStep(d);
        const left = daysLeft(d.deadline);
        return (
          <Link key={d.id} to="/creators/influencer/app/deals/$dealId" params={{ dealId: d.id }} className="block rounded-2xl bg-card p-5 shadow-card hover:ring-2 hover:ring-brand-navy/20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-extrabold text-brand-navy">{(d.deal_sheet_snapshot as { brief_title?: string })?.brief_title}</p>
              <span className="text-sm font-bold">{euros(d.agreed_price)}</span>
            </div>
            <p className="mt-1 text-xs text-brand-navySoft">{DEAL_LABEL[d.status]}{d.deadline && !["completed", "cancelled"].includes(d.status) ? ` · deadline ${d.deadline}${left != null ? ` (${left < 0 ? `${-left}d late` : `${left}d left`})` : ""}` : ""}</p>
            {next ? <p className="mt-2 rounded-xl bg-portal-amber/10 px-3 py-2 text-sm font-semibold text-brand-navy">Next: {next}</p> : null}
          </Link>
        );
      }) : <Card><p className="text-sm text-brand-navySoft">No deal yet. Deals start when you accept an offer.</p></Card>}
    </div>
  );
}

/* ---------------- Deal page ---------------- */
async function upload(slot: { signedUrl: string }, file: File) {
  const r = await fetch(slot.signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream", "x-upsert": "true" } });
  if (!r.ok) throw new Error("The upload did not go through. Check your connection and try again.");
}

export function InfluencerDealPage({ dealId }: { dealId: string }) {
  const { data: deals, isLoading } = useMyDeals();
  const { data: me } = useInfluencerQuery();
  const qc = useQueryClient();
  const sign = useServerFn(signDealSheet);
  const spark = useServerFn(setSparkCode);
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [code, setCode] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: DEALS_KEY });
  const d = (deals ?? []).find((x) => x.id === dealId);
  if (isLoading) return <p className="text-sm">Loading…</p>;
  if (!d) return <Card><p className="text-sm">This deal was not found.</p></Card>;
  const next = nextStep(d);
  const items = d.influencer_deliverables ?? [];
  const snap = (d.deal_sheet_snapshot ?? {}) as { brief_title?: string; draft_approval_required?: boolean };
  const views7 = items.flatMap((i) => i.influencer_deliverable_metrics ?? []).filter((m) => m.checkpoint === "7d").reduce((s, m) => s + (m.views ?? 0), 0);
  const ads = RIGHTS_LABEL[d.rights_package as Rights]?.ads;
  return (
    <div className="space-y-5">
      <Title title={snap.brief_title ?? "Deal"} lead={`${DEAL_LABEL[d.status]} · ${euros(d.agreed_price)}${d.deadline ? ` · post by ${d.deadline}` : ""}`} />
      {d.status === "cancelled" ? <Card><p className="text-sm">This deal was cancelled{d.cancelled_reason ? `: ${d.cancelled_reason}` : "."}</p></Card> : null}
      {d.status === "completed" ? <Card><p className="text-sm font-semibold text-portal-green">Completed. Thank you!{views7 ? ` ${views7.toLocaleString("en-GB")} views at 7 days (CPM ${euros(cpm(Number(d.agreed_price), views7))}).` : ""}</p></Card> : null}
      {next ? <div className="rounded-2xl bg-portal-amber/10 p-4 text-sm font-bold text-brand-navy">Next step: {next}</div> : null}
      {!next && !["completed", "cancelled"].includes(d.status) ? <div className="rounded-2xl bg-brand-navy/5 p-4 text-sm text-brand-navy">Nothing to do right now: Sophia is reviewing. You will get a message.</div> : null}

      <Card>
        <DealSheetView snapshot={d.deal_sheet_snapshot} />
        {d.deal_sheet_signed_at ? (
          <p className="mt-4 text-sm font-semibold text-portal-green">Signed by {d.deal_sheet_signed_name} on {new Date(d.deal_sheet_signed_at).toLocaleString("en-GB")}.</p>
        ) : d.status !== "cancelled" ? (
          <div className="mt-5 space-y-3 border-t border-brand-line pt-4">
            {!me?.agreement_signed_at ? <p className="text-sm text-portal-amber">Sign the <Link to="/creators/influencer/app/agreement" className="underline">master agreement</Link> first.</p> : null}
            <Label htmlFor="ds-name">Type your full legal name to sign</Label>
            <Input id="ds-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 size-4" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I have read this Deal Sheet and agree to it, under the Master Agreement.</label>
            <Button variant="pill" size="pillSm" disabled={!agree || name.trim().length < 2 || !me?.agreement_signed_at} onClick={async () => {
              try { await sign({ data: { dealId: d.id, signedName: name.trim() } }); toast.success("Deal Sheet signed. You can start."); await refresh(); }
              catch (e) { toast.error(msg(e)); }
            }}>Sign the Deal Sheet</Button>
          </div>
        ) : null}
      </Card>

      {d.deal_sheet_signed_at && d.status !== "cancelled" ? items.map((it) => (
        <DeliverableCard key={it.id} dealId={d.id} item={it} draftRequired={Boolean(snap.draft_approval_required)} onDone={refresh} />
      )) : null}

      {ads && d.deal_sheet_signed_at && d.status !== "cancelled" ? (
        <Card className="space-y-2">
          <p className="font-bold text-brand-navy">Spark Ads code</p>
          <p className="text-sm text-brand-navySoft">This deal includes ad rights. In TikTok: open the post, ⋯ → Ad settings → turn on ad authorisation, then generate a code and paste it here.</p>
          {d.spark_ads_code ? <p className="text-sm">Current code: <code className="rounded bg-brand-navy/5 px-2 py-1">{d.spark_ads_code}</code></p> : null}
          <div className="flex gap-2">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste the code" aria-label="Spark Ads code" />
            <Button variant="pillSecondary" size="pillSm" onClick={async () => {
              try { await spark({ data: { dealId: d.id, code } }); toast.success("Code saved."); setCode(""); await refresh(); } catch (e) { toast.error(msg(e)); }
            }}>Save</Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function DeliverableCard({ dealId, item, draftRequired, onDone }: { dealId: string; item: DealRow["influencer_deliverables"][number]; draftRequired: boolean; onDone: () => void }) {
  const slot = useServerFn(dealUploadSlot);
  const draft = useServerFn(submitDraft);
  const posted = useServerFn(markPosted);
  const metrics = useServerFn(reportMetrics);
  const open = useServerFn(openDealFile);
  const [link, setLink] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const canDraft = ["pending", "changes_requested"].includes(item.status);
  const canPost = !["posted", "verified"].includes(item.status) && (!draftRequired || item.status === "draft_approved");

  async function sendDraft(file?: File) {
    setBusy(true);
    try {
      let path: string | undefined;
      if (file) {
        const s = await slot({ data: { deliverableId: item.id, kind: "draft", name: file.name, size: file.size } });
        if (!s.ok) throw new Error(s.reason === "type" ? "Send a video file (MP4, MOV or WebM)." : s.reason === "size" ? "The video is over 50 MB. Paste a link instead." : "The upload could not start. Try again.");
        await upload(s, file);
        path = s.path;
      } else if (!/^https?:\/\//.test(link.trim())) throw new Error("Paste a full link starting with https://");
      await draft({ data: { deliverableId: item.id, path, url: file ? "" : link.trim() } });
      toast.success("Draft sent. Sophia will review it.");
      setLink("");
      onDone();
    } catch (e) { toast.error(msg(e)); } finally { setBusy(false); }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-bold capitalize text-brand-navy">{item.platform} {item.format}</p>
        <span className="rounded-full bg-brand-navy/10 px-2 py-0.5 text-[11px] font-bold">{item.status.replace("_", " ")}</span>
      </div>
      {item.draft_feedback ? <p className={cn("rounded-xl p-3 text-sm", item.status === "changes_requested" ? "bg-portal-amber/10" : "bg-portal-green/10")}><span className="font-bold">Sophia: </span>{item.draft_feedback}</p> : null}
      {item.draft_file_path ? <button className="text-sm underline" onClick={async () => { const r = await open({ data: { dealId, path: item.draft_file_path! } }); if (r.url) window.open(r.url, "_blank", "noopener"); }}>See the draft you sent</button> : null}
      {draftRequired && canDraft ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-brand-navy">{item.status === "changes_requested" ? "Send a new version" : "Send your draft"}</p>
          <Input type="file" accept="video/*" disabled={busy} aria-label="Draft video" onChange={(e) => { const f = e.target.files?.[0]; if (f) void sendDraft(f); }} />
          <div className="flex gap-2"><Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="…or paste a link (Drive, WeTransfer)" aria-label="Draft link" /><Button variant="pillSecondary" size="pillSm" disabled={busy || !link} onClick={() => void sendDraft()}>Send</Button></div>
        </div>
      ) : null}
      {item.status === "draft_submitted" ? <p className="text-sm text-brand-navySoft">Draft sent. Waiting for Sophia's feedback.</p> : null}
      {canPost ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-brand-navy">Posted? Paste the link to the live post</p>
          <div className="flex gap-2">
            <Input value={postUrl} onChange={(e) => setPostUrl(e.target.value)} placeholder="https://www.tiktok.com/@you/video/…" aria-label="Post link" />
            <Button variant="pill" size="pillSm" disabled={busy} onClick={async () => {
              if (!/^https?:\/\//.test(postUrl.trim())) return void toast.error("Paste the full link to your post, starting with https://");
              try { await posted({ data: { deliverableId: item.id, url: postUrl.trim() } }); toast.success("Thanks! Sophia will verify it."); onDone(); } catch (e) { toast.error(msg(e)); }
            }}>It's live</Button>
          </div>
        </div>
      ) : null}
      {item.post_url ? <p className="text-sm">Live post: <a className="underline" href={item.post_url} target="_blank" rel="noopener noreferrer">{item.post_url}</a>{item.verified_at ? <span className="ml-2 font-bold text-portal-green">Verified</span> : null}</p> : null}
      {item.posted_at ? (
        <div className="grid gap-3 md:grid-cols-3">
          {CHECKPOINTS.map((c) => {
            const m = (item.influencer_deliverable_metrics ?? []).find((x) => x.checkpoint === c.id);
            const isOpen = checkpointOpen(item.posted_at, c.id);
            return <MetricsForm key={c.id} checkpoint={c.id} existing={m} open={isOpen} opensAt={new Date(new Date(item.posted_at!).getTime() + c.hours * 3600e3)}
              onSubmit={async (v, file) => {
                const s = await slot({ data: { deliverableId: item.id, kind: "screenshot", name: file.name, size: file.size } });
                if (!s.ok) throw new Error(s.reason === "type" ? "The screenshot must be an image (PNG, JPG, WebP or HEIC)." : s.reason === "size" ? "The screenshot is over 50 MB." : "The upload could not start.");
                await upload(s, file);
                await metrics({ data: { deliverableId: item.id, checkpoint: c.id, ...v, screenshotPath: s.path } });
                toast.success(`${c.id} numbers saved.`);
                onDone();
              }} />;
          })}
        </div>
      ) : null}
    </Card>
  );
}

type M = { views: number | null; likes: number | null; comments: number | null; shares: number | null; saves: number | null } | undefined;
function MetricsForm({ checkpoint, existing, open, opensAt, onSubmit }: {
  checkpoint: "48h" | "7d" | "30d"; existing: M; open: boolean; opensAt: Date;
  onSubmit: (v: { views: number; likes: number | null; comments: number | null; shares: number | null; saves: number | null }, file: File) => Promise<void>;
}) {
  const [v, setV] = useState({ views: "", likes: "", comments: "", shares: "", saves: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  if (existing) return <div className="rounded-xl border border-brand-line p-3 text-xs"><p className="font-bold text-brand-navy">{checkpoint} · reported</p><p>{(existing.views ?? 0).toLocaleString("en-GB")} views · {existing.likes ?? "—"} likes · {existing.comments ?? "—"} comments</p></div>;
  if (!open) return <div className="rounded-xl border border-dashed border-brand-line p-3 text-xs text-brand-navySoft"><p className="font-bold">{checkpoint}</p>Opens {opensAt.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>;
  const n = (s: string) => (s.trim() === "" ? null : Math.max(0, Math.round(Number(s.replace(/[\s,.]/g, "")))));
  return (
    <div className="space-y-2 rounded-xl border border-portal-amber p-3">
      <p className="text-xs font-bold text-brand-navy">{checkpoint} numbers</p>
      {(["views", "likes", "comments", "shares", "saves"] as const).map((k) => (
        <Input key={k} inputMode="numeric" placeholder={k === "views" ? "Views (required)" : k[0]!.toUpperCase() + k.slice(1)} aria-label={`${checkpoint} ${k}`} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
      ))}
      <Label className="text-xs">Screenshot of your stats (required)</Label>
      <Input type="file" accept="image/*" aria-label={`${checkpoint} screenshot`} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <Button variant="pill" size="pillSm" className="w-full" disabled={busy} onClick={async () => {
        const views = n(v.views);
        if (views == null || Number.isNaN(views)) return void toast.error("Enter the number of views, digits only.");
        if (!file) return void toast.error("Add a screenshot of your stats.");
        setBusy(true);
        try { await onSubmit({ views, likes: n(v.likes), comments: n(v.comments), shares: n(v.shares), saves: n(v.saves) }, file); }
        catch (e) { toast.error(msg(e)); } finally { setBusy(false); }
      }}>Send</Button>
    </div>
  );
}

/* ---------------- Earnings ---------------- */
export function InfluencerEarnings() {
  const qc = useQueryClient();
  const { data: me } = useInfluencerQuery();
  const slot = useServerFn(invoiceUploadSlot);
  const submit = useServerFn(submitInvoice);
  const openInv = useServerFn(openMyInvoice);
  const [busy, setBusy] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["influencer", "earnings"],
    queryFn: async () => {
      const [{ data: items }, { data: deals }] = await Promise.all([
        supabase.from("influencer_payout_items").select("*, influencer_invoices(file_path, status)").order("created_at", { ascending: false }),
        supabase.from("influencer_deals").select("id, agreed_price, status, deal_sheet_snapshot"),
      ]);
      return { items: items ?? [], deals: deals ?? [] };
    },
  });
  if (isLoading || !data) return <p className="text-sm">Loading…</p>;
  const title = (id: string) => (data.deals.find((d) => d.id === id)?.deal_sheet_snapshot as { brief_title?: string } | null)?.brief_title ?? "Deal";
  const month = new Date().toISOString().slice(0, 7);
  const paid = data.items.filter((i) => i.status === "paid");
  const due = data.items.filter((i) => ["due", "invoiced"].includes(i.status)).reduce((s, i) => s + Number(i.amount), 0);
  const inProgress = data.deals.filter((d) => !["completed", "cancelled"].includes(d.status)).reduce((s, d) => s + Number(d.agreed_price), 0);
  const needsInvoice = me?.payout_method === "invoice" || me?.payout_method === "agency";
  async function upload(itemId: string, file: File) {
    setBusy(itemId);
    try {
      const s = await slot({ data: { name: file.name, size: file.size } });
      if (!s.ok) throw new Error(s.reason === "type" ? "The invoice must be a PDF." : s.reason === "size" ? "The PDF is over 10 MB." : "The upload could not start.");
      const r = await fetch(s.signedUrl, { method: "PUT", body: file, headers: { "Content-Type": "application/pdf", "x-upsert": "true" } });
      if (!r.ok) throw new Error("The upload did not go through. Try again.");
      await submit({ data: { itemIds: [itemId], path: s.path } });
      toast.success("Invoice sent. You will be paid by bank transfer.");
      await qc.invalidateQueries({ queryKey: ["influencer", "earnings"] });
    } catch (e) { toast.error(msg(e)); } finally { setBusy(null); }
  }
  return (
    <div className="space-y-5">
      <Title title="Earnings" lead={`Payments are created when a deal is completed.${needsInvoice ? ` Upload an invoice (PDF) for each payment${me?.payee === "agency" ? ", or have your agency send it" : ""}.` : " Paid through Stripe."}`} />
      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-xs font-bold uppercase text-brand-navySoft">Paid this month</p><p className="mt-1 text-2xl font-extrabold">{euros(paid.filter((i) => i.paid_on?.startsWith(month)).reduce((s, i) => s + Number(i.amount), 0))}</p></Card>
        <Card><p className="text-xs font-bold uppercase text-brand-navySoft">Waiting to be paid</p><p className="mt-1 text-2xl font-extrabold">{euros(due)}</p></Card>
        <Card><p className="text-xs font-bold uppercase text-brand-navySoft">Deals in progress</p><p className="mt-1 text-2xl font-extrabold">{euros(inProgress)}</p></Card>
      </div>
      <Card>
        {data.items.length ? (
          <ul className="divide-y divide-brand-line text-sm">
            {data.items.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-semibold text-brand-navy">{title(i.deal_id)}</p>
                  <p className="text-xs text-brand-navySoft">{i.part === "full" ? "Full amount" : i.part === "acceptance" ? "50% on acceptance" : "50% on posting"}{i.payee === "agency" ? " · paid to your agency" : ""}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{euros(i.amount)}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", i.status === "paid" ? "bg-portal-green/10 text-portal-green" : "bg-portal-amber/10 text-portal-amber")}>
                    {i.status === "paid" ? `Paid ${i.paid_on ?? ""}` : i.status === "invoiced" ? "Invoice received" : "Due"}
                  </span>
                  {i.influencer_invoices?.file_path ? <button className="text-xs underline" onClick={async () => { const r = await openInv({ data: { path: i.influencer_invoices!.file_path } }); if (r.url) window.open(r.url, "_blank", "noopener"); }}>Statement (invoice)</button> : null}
                  {i.status === "due" && i.method !== "stripe" ? (
                    <label className="cursor-pointer rounded-full border border-brand-navy px-3 py-2 text-xs font-bold">
                      {busy === i.id ? "Uploading…" : "Upload invoice (PDF)"}
                      <input type="file" accept="application/pdf" className="sr-only" disabled={busy !== null} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(i.id, f); }} />
                    </label>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-brand-navySoft">No payment yet. Your first one appears when a deal is completed.</p>}
      </Card>
    </div>
  );
}
