import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CHECKPOINTS, cpm, daysLeft, DEAL_COLUMNS, DEAL_LABEL, euros, RIGHTS_LABEL, type Rights } from "@/lib/influencer-deals";
import { adminDealAction } from "@/lib/influencer-deals.functions";
import { DealSheetView } from "@/components/influencers/DealSheetView";
import { EmptyState, PageTitle, PortalCard } from "../ui";

function err(e: unknown) {
  return e instanceof Error && !e.message.startsWith("[") ? e.message : "Something went wrong.";
}

export function InfluencerDealsBoard() {
  const { data = [] } = useQuery({
    queryKey: ["admin", "influencer-deals"],
    queryFn: async () => (await supabase.from("influencer_deals").select("id, status, agreed_price, deadline, deal_sheet_signed_at, influencers(display_name), influencer_briefs(title)").order("created_at", { ascending: false })).data ?? [],
  });
  const colOf = (s: string) => (s === "changes_requested" ? "in_production" : s);
  const cancelled = data.filter((d) => d.status === "cancelled");
  return (
    <div className="space-y-6">
      <PageTitle title="Deals" lead="Every accepted offer, from signature to metrics." />
      {!data.length ? <EmptyState title="No deal yet" text="Deals appear here when an influencer accepts an offer, or you accept their counter." /> : (
        <div className="flex gap-4 overflow-x-auto pb-3">
          {DEAL_COLUMNS.map((col) => {
            const cards = data.filter((d) => colOf(d.status) === col);
            return (
              <div key={col} className="w-64 shrink-0">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-navySoft">{DEAL_LABEL[col]} · {cards.length}</p>
                <div className="space-y-2">
                  {cards.map((d) => {
                    const left = daysLeft(d.deadline);
                    return (
                      <Link key={d.id} to="/auteurs/admin/creators/influencer-deals/$dealId" params={{ dealId: d.id }}
                        className="block rounded-2xl bg-card p-3 shadow-card transition hover:ring-2 hover:ring-brand-navy/20">
                        <p className="text-sm font-bold text-brand-navy">{d.influencers?.display_name}</p>
                        <p className="truncate text-xs text-brand-navySoft">{d.influencer_briefs?.title}</p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="font-semibold">{euros(d.agreed_price)}</span>
                          {d.status !== "completed" && left != null ? <span className={cn(left < 3 ? "font-bold text-portal-red" : "text-brand-navySoft")}>{left < 0 ? `${-left}d late` : `${left}d left`}</span> : null}
                        </div>
                        {d.status === "changes_requested" ? <p className="mt-1 text-[11px] font-bold text-portal-amber">Changes requested</p> : null}
                        {!d.deal_sheet_signed_at ? <p className="mt-1 text-[11px] font-bold text-portal-amber">Deal Sheet not signed</p> : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {cancelled.length ? <p className="text-sm text-brand-navySoft">{cancelled.length} cancelled deal{cancelled.length > 1 ? "s" : ""} hidden from the board.</p> : null}
    </div>
  );
}

async function signed(path: string) {
  const { data } = await supabase.storage.from("influencer-files").createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}

export function InfluencerDealDetail({ dealId }: { dealId: string }) {
  const qc = useQueryClient();
  const act = useServerFn(adminDealAction);
  const [comment, setComment] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [deadline, setDeadline] = useState("");
  const [spark, setSpark] = useState<string | null>(null);
  const [draftUrl, setDraftUrl] = useState<Record<string, string>>({});
  const key = ["admin", "influencer-deal", dealId];
  const { data } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data: deal, error } = await supabase.from("influencer_deals").select("*, influencers(id, display_name, email)").eq("id", dealId).single();
      if (error) throw error;
      const { data: items } = await supabase.from("influencer_deliverables").select("*, influencer_deliverable_metrics(*)").eq("deal_id", dealId).order("platform");
      return { deal, items: items ?? [] };
    },
  });
  async function run(action: Parameters<typeof act>[0]["data"]["action"], extra: Record<string, string | undefined> = {}) {
    try {
      await act({ data: { dealId, action, ...extra } });
      toast.success("Saved.");
      await qc.invalidateQueries({ queryKey: key });
      await qc.invalidateQueries({ queryKey: ["admin", "influencer-deals"] });
    } catch (e) { toast.error(err(e)); }
  }
  if (!data) return <p className="text-sm">Loading…</p>;
  const { deal, items } = data;
  const views7 = items.flatMap((i) => i.influencer_deliverable_metrics ?? []).filter((m) => m.checkpoint === "7d").reduce((s, m) => s + (m.views ?? 0), 0);
  const liveCpm = cpm(Number(deal.agreed_price), views7);
  const ads = RIGHTS_LABEL[deal.rights_package as Rights]?.ads;
  const closed = ["completed", "cancelled"].includes(deal.status);
  return (
    <div className="space-y-6">
      <PageTitle title={`${deal.influencers?.display_name} · ${(deal.deal_sheet_snapshot as { brief_title?: string })?.brief_title ?? "Deal"}`}
        lead={`${DEAL_LABEL[deal.status]} · ${euros(deal.agreed_price)}${deal.split_payment ? " (50/50 split)" : ""} · deadline ${deal.deadline ?? "—"}`} />
      <div className="grid gap-4 md:grid-cols-3">
        <PortalCard><p className="text-xs font-bold uppercase text-brand-navySoft">CPM (7-day views)</p><p className="mt-1 text-2xl font-extrabold text-brand-navy">{liveCpm != null ? euros(liveCpm) : "—"}</p><p className="text-xs text-brand-navySoft">{views7.toLocaleString("en-GB")} views at 7 days</p></PortalCard>
        <PortalCard><p className="text-xs font-bold uppercase text-brand-navySoft">Deal Sheet</p><p className="mt-1 text-sm font-semibold">{deal.deal_sheet_signed_at ? `Signed by ${deal.deal_sheet_signed_name} on ${new Date(deal.deal_sheet_signed_at).toLocaleDateString("en-GB")}` : "Not signed yet"}</p>
          {!deal.deal_sheet_signed_at ? <p className="mt-1 text-xs text-brand-navySoft">Production is blocked until they sign it in their Deals page: {typeof window !== "undefined" ? window.location.origin : ""}/creators/influencer/app/deals/{deal.id}</p> : null}</PortalCard>
        <PortalCard><p className="text-xs font-bold uppercase text-brand-navySoft">Payment</p><p className="mt-1 text-sm">Payment lines are created when the deal is completed (next phase).</p></PortalCard>
      </div>
      <PortalCard>
        <p className="mb-3 font-bold text-brand-navy">Deal Sheet</p>
        <DealSheetView snapshot={deal.deal_sheet_snapshot} adminNote />
      </PortalCard>
      <div className="space-y-4">
        {items.map((it) => (
          <PortalCard key={it.id} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold capitalize text-brand-navy">{it.platform} {it.format}</p>
              <span className="rounded-full bg-brand-navy/10 px-2 py-0.5 text-[11px] font-bold">{it.status.replace("_", " ")}</span>
            </div>
            {it.draft_submitted_at ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Draft submitted {new Date(it.draft_submitted_at).toLocaleString("en-GB")}</p>
                {it.draft_file_path ? (
                  draftUrl[it.id] ? <video src={draftUrl[it.id]} controls playsInline className="max-h-[480px] w-full max-w-[270px] rounded-xl bg-brand-navy object-contain" /> :
                  <Button variant="pillSecondary" size="pillSm" onClick={async () => { const u = await signed(it.draft_file_path!); if (u) setDraftUrl({ ...draftUrl, [it.id]: u }); }}>Load draft video</Button>
                ) : null}
                {it.draft_url ? <Button asChild variant="pillSecondary" size="pillSm"><a href={it.draft_url} target="_blank" rel="noopener noreferrer">Open draft link</a></Button> : null}
                {it.draft_feedback ? <p className="rounded-xl bg-portal-amber/10 p-3 text-sm">{it.draft_feedback}</p> : null}
                {it.status === "draft_submitted" ? (
                  <>
                    <Textarea placeholder="Comment (required to request changes)" value={comment[it.id] ?? ""} onChange={(e) => setComment({ ...comment, [it.id]: e.target.value })} aria-label="Comment on draft" />
                    <div className="flex gap-2">
                      <Button variant="pill" size="pillSm" onClick={() => void run("approve_draft", { deliverableId: it.id, comment: comment[it.id] })}>Approve</Button>
                      <Button variant="pillSecondary" size="pillSm" onClick={() => void run("request_changes", { deliverableId: it.id, comment: comment[it.id] })}>Request changes</Button>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
            {it.post_url ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="pillSecondary" size="pillSm"><a href={it.post_url} target="_blank" rel="noopener noreferrer">Open post</a></Button>
                <span className="text-xs text-brand-navySoft">Posted {it.posted_at ? new Date(it.posted_at).toLocaleString("en-GB") : ""}</span>
                {it.status === "posted" ? <Button variant="pill" size="pillSm" onClick={() => void run("verify", { deliverableId: it.id })}>Verify</Button> : null}
                {it.verified_at ? <span className="text-xs font-bold text-portal-green">Verified</span> : null}
              </div>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-3">
              {CHECKPOINTS.map((c) => {
                const m = (it.influencer_deliverable_metrics ?? []).find((x) => x.checkpoint === c.id);
                return (
                  <div key={c.id} className="rounded-xl border border-brand-line p-3 text-xs">
                    <p className="font-bold text-brand-navy">{c.id}</p>
                    {m ? (
                      <>
                        <p>{(m.views ?? 0).toLocaleString("en-GB")} views · {m.likes ?? "—"} likes · {m.comments ?? "—"} comments · {m.shares ?? "—"} shares · {m.saves ?? "—"} saves</p>
                        {m.screenshot_path ? <button className="mt-1 underline" onClick={async () => { const u = await signed(m.screenshot_path!); if (u) window.open(u, "_blank", "noopener"); }}>Screenshot</button> : null}
                      </>
                    ) : <p className="text-brand-navySoft">Not reported</p>}
                  </div>
                );
              })}
            </div>
          </PortalCard>
        ))}
      </div>
      {ads ? (
        <PortalCard className="space-y-2">
          <p className="font-bold text-brand-navy">Spark Ads code</p>
          <div className="flex gap-2">
            <Input value={spark ?? deal.spark_ads_code ?? ""} onChange={(e) => setSpark(e.target.value)} aria-label="Spark Ads code" />
            <Button variant="pillSecondary" size="pillSm" onClick={() => void run("spark", { code: spark ?? deal.spark_ads_code ?? "" })}>Save</Button>
          </div>
        </PortalCard>
      ) : null}
      {!closed ? (
        <PortalCard className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <p className="font-bold text-brand-navy">Extend deadline</p>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} aria-label="New deadline" />
            <Button variant="pillSecondary" size="pillSm" onClick={() => void run("extend", { deadline })}>Extend</Button>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-brand-navy">Mark completed</p>
            <p className="text-xs text-brand-navySoft">When the posts are verified and the numbers are in.</p>
            <Button variant="pill" size="pillSm" onClick={() => void run("complete")}>Mark completed</Button>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-brand-navy">Cancel deal</p>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (required)" aria-label="Cancel reason" />
            <Button variant="outline" size="pillSm" onClick={() => void run("cancel", { comment: reason })}>Cancel deal</Button>
          </div>
        </PortalCard>
      ) : deal.cancelled_reason ? <PortalCard><p className="text-sm">Cancelled: {deal.cancelled_reason}</p></PortalCard> : null}
    </div>
  );
}
