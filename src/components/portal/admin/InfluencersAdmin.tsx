import { AppEnrolment } from "./AppEnrolment";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { INFLUENCER_COPY, NICHES } from "@/i18n/influencers";
import { cpm, DEAL_LABEL, euros, RIGHTS, TIERS } from "@/lib/influencer-deals";
import { markPayoutPaid } from "@/lib/influencer-deals.functions";
import { EmptyState, PageTitle, PortalCard } from "../ui";
import { usePortalProfile } from "../usePortal";

const L = INFLUENCER_COPY.en;
const n = (v: number | null | undefined) => (v == null ? "—" : v.toLocaleString("en-GB"));
const sel = "h-11 rounded-xl border border-input bg-card px-3 text-sm";
function err(e: unknown) {
  return e instanceof Error && !e.message.startsWith("[") ? e.message : "Something went wrong.";
}

type MetricRow = { checkpoint: string; views: number | null };
type DealLite = {
  id: string; influencer_id: string; brief_id: string; agreed_price: number; status: string; created_at: string; completed_at: string | null;
  deal_sheet_snapshot: unknown; influencer_deliverables: { influencer_deliverable_metrics: MetricRow[] }[];
};
const views7 = (d: DealLite) => d.influencer_deliverables.flatMap((v) => v.influencer_deliverable_metrics ?? []).filter((m) => m.checkpoint === "7d").reduce((s, m) => s + (m.views ?? 0), 0);
const views48 = (d: DealLite) => d.influencer_deliverables.flatMap((v) => v.influencer_deliverable_metrics ?? []).filter((m) => m.checkpoint === "48h").reduce((s, m) => s + (m.views ?? 0), 0);
/** 7-day views drive CPM; when only 48h is in, that is used and labelled. */
const dealCpm = (d: DealLite) => cpm(Number(d.agreed_price), views7(d) || views48(d));
const DEAL_SELECT = "id, influencer_id, brief_id, agreed_price, status, created_at, completed_at, deal_sheet_snapshot, influencer_deliverables(influencer_deliverable_metrics(checkpoint, views))";

function useInfluencerData() {
  return useQuery({
    queryKey: ["admin", "influencers-grid"],
    queryFn: async () => {
      const [{ data: inf }, { data: deals }, { data: attr }] = await Promise.all([
        supabase.from("influencers").select("*").order("created_at", { ascending: false }),
        supabase.from("influencer_deals").select(DEAL_SELECT),
        supabase.from("influencer_attribution").select("*"),
      ]);
      return { inf: inf ?? [], deals: (deals ?? []) as unknown as DealLite[], attr: attr ?? [] };
    },
  });
}

/* ---------------- Grid ---------------- */
export function InfluencersGrid() {
  const { data } = useInfluencerData();
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("");
  const [niche, setNiche] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<"followers" | "cpm" | "deals" | "name">("followers");
  const rows = useMemo(() => {
    if (!data) return [];
    return data.inf.map((i) => {
      const done = data.deals.filter((d) => d.influencer_id === i.id && d.status === "completed");
      const cpms = done.map(dealCpm).filter((x): x is number => x != null);
      const last = data.deals.filter((d) => d.influencer_id === i.id).map((d) => d.created_at).sort().pop() ?? null;
      const followers = Math.max(i.tiktok_followers ?? 0, i.instagram_followers ?? 0, i.youtube_subscribers ?? 0);
      return { ...i, followers, dealsDone: done.length, avgCpm: cpms.length ? Math.round((cpms.reduce((a, b) => a + b, 0) / cpms.length) * 100) / 100 : null, last };
    })
      .filter((r) => (!q || `${r.display_name} ${r.email} ${r.tiktok_url ?? ""} ${r.instagram_url ?? ""}`.toLowerCase().includes(q.toLowerCase()))
        && (!tier || r.tier === tier) && (!niche || r.niche_tags.includes(niche)) && (!status || r.status === status))
      .sort((a, b) => sort === "name" ? a.display_name.localeCompare(b.display_name) : sort === "cpm" ? (a.avgCpm ?? 1e9) - (b.avgCpm ?? 1e9) : sort === "deals" ? b.dealsDone - a.dealsDone : b.followers - a.followers);
  }, [data, q, tier, niche, status, sort]);
  return (
    <div className="space-y-5">
      <PageTitle title="Influencers" lead={`${rows.length} on the roster view`} />
      <div className="flex flex-wrap gap-2">
        <Input className="w-56" placeholder="Search name, email, handle" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        <select className={sel} value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Tier"><option value="">All tiers</option>{TIERS.map((t) => <option key={t}>{t}</option>)}</select>
        <select className={sel} value={niche} onChange={(e) => setNiche(e.target.value)} aria-label="Niche"><option value="">All niches</option>{NICHES.map((x) => <option key={x} value={x}>{L.niches[x]}</option>)}</select>
        <select className={sel} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="">All statuses</option>{["active", "paused", "ended"].map((s) => <option key={s}>{s}</option>)}</select>
        <select className={sel} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort">
          <option value="followers">Sort: followers</option><option value="cpm">Sort: best CPM</option><option value="deals">Sort: deals done</option><option value="name">Sort: name</option>
        </select>
      </div>
      <PortalCard className="overflow-x-auto p-0">
        {rows.length ? (
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-brand-navySoft">
              <tr>{["Name", "Tier", "TikTok", "Instagram", "YouTube", "Avg views", "Niches", "Languages", "Rates", "Recurring", "Agency", "Deals", "Avg CPM", "Last deal", "Status"].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-brand-navy/5">
                  <td className="px-3 py-2 font-bold text-brand-navy"><Link to="/auteurs/admin/creators/influencers/$influencerId" params={{ influencerId: r.id }} className="hover:underline">{r.display_name}</Link></td>
                  <td className="px-3 py-2"><span className="rounded-full bg-brand-navy/10 px-2 py-0.5 text-[11px] font-bold capitalize">{r.tier}</span></td>
                  <td className="px-3 py-2">{n(r.tiktok_followers)}</td>
                  <td className="px-3 py-2">{n(r.instagram_followers)}</td>
                  <td className="px-3 py-2">{n(r.youtube_subscribers)}</td>
                  <td className="px-3 py-2">{n(r.tiktok_avg_views)}</td>
                  <td className="px-3 py-2 text-xs">{r.niche_tags.join(", ")}</td>
                  <td className="px-3 py-2 text-xs">{r.languages.join(", ")}</td>
                  <td className="px-3 py-2 text-xs">TT {euros(r.rate_tiktok)}{r.rate_reel ? ` · Reel ${euros(r.rate_reel)}` : ""}</td>
                  <td className="px-3 py-2 text-xs">{r.accepts_recurring ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{r.agency_name ?? "—"}</td>
                  <td className="px-3 py-2">{r.dealsDone}</td>
                  <td className="px-3 py-2">{r.avgCpm != null ? euros(r.avgCpm) : "—"}</td>
                  <td className="px-3 py-2 text-xs">{r.last ? new Date(r.last).toLocaleDateString("en-GB") : "—"}</td>
                  <td className="px-3 py-2 capitalize">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyState title="No influencer" text="Accepted applications appear here." />}
      </PortalCard>
    </div>
  );
}

/* ---------------- Detail ---------------- */
export function InfluencerAdminDetail({ influencerId }: { influencerId: string }) {
  const qc = useQueryClient();
  const { data: me } = usePortalProfile();
  const key = ["admin", "influencer", influencerId];
  const { data } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const [{ data: inf, error }, { data: deals }, { data: attr }, { data: items }, { data: briefs }] = await Promise.all([
        supabase.from("influencers").select("*").eq("id", influencerId).single(),
        supabase.from("influencer_deals").select(DEAL_SELECT).eq("influencer_id", influencerId).order("created_at", { ascending: false }),
        supabase.from("influencer_attribution").select("*").eq("influencer_id", influencerId).order("period_start", { ascending: false }),
        supabase.from("influencer_payout_items").select("*").eq("influencer_id", influencerId).order("created_at", { ascending: false }),
        supabase.from("influencer_briefs").select("id, title").eq("status", "open"),
      ]);
      if (error) throw error;
      return { inf, deals: (deals ?? []) as unknown as DealLite[], attr: attr ?? [], items: items ?? [], briefs: briefs ?? [] };
    },
  });
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [a, setA] = useState({ period_start: "", period_end: "", deal_id: "", link_clicks: "", code_redemptions: "", installs: "", subscriptions: "" });
  if (!data) return <p className="text-sm">Loading…</p>;
  const { inf, deals, attr, items, briefs } = data;
  const val = (k: string) => edit[k] ?? String((inf as Record<string, unknown>)[k] ?? "");
  async function save() {
    const numKeys = ["rate_tiktok", "rate_reel", "rate_youtube"];
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(edit)) patch[k] = numKeys.includes(k) ? (v.trim() === "" ? null : Number(v)) : v.trim() || null;
    if ("tier_override" in patch) patch["tier_override"] = Boolean(patch["tier"]);
    if (numKeys.some((k) => k in patch && patch[k] != null && Number.isNaN(patch[k]))) return void toast.error("Rates must be numbers.");
    const { error } = await supabase.from("influencers").update(patch as never).eq("id", influencerId);
    if (error) return void toast.error("Could not save.");
    toast.success("Saved.");
    setEdit({});
    await qc.invalidateQueries({ queryKey: key });
  }
  async function addAttribution() {
    if (!a.period_start || !a.period_end) return void toast.error("Pick the period start and end.");
    if (a.period_start > a.period_end) return void toast.error("The period starts after it ends.");
    const num = (v: string) => (v.trim() === "" ? null : Math.max(0, Math.round(Number(v))));
    const { error } = await supabase.from("influencer_attribution").insert({
      influencer_id: influencerId, deal_id: a.deal_id || null, period_start: a.period_start, period_end: a.period_end,
      link_clicks: num(a.link_clicks), code_redemptions: num(a.code_redemptions), installs: num(a.installs), subscriptions: num(a.subscriptions), entered_by: me?.profile?.id ?? null,
    });
    if (error) return void toast.error("Could not save the attribution.");
    toast.success("Attribution saved.");
    setA({ period_start: "", period_end: "", deal_id: "", link_clicks: "", code_redemptions: "", installs: "", subscriptions: "" });
    await qc.invalidateQueries({ queryKey: key });
  }
  const tot = attr.reduce((s, r) => ({ clicks: s.clicks + (r.link_clicks ?? 0), codes: s.codes + (r.code_redemptions ?? 0), installs: s.installs + (r.installs ?? 0), subs: s.subs + (r.subscriptions ?? 0) }), { clicks: 0, codes: 0, installs: 0, subs: 0 });
  const field = (k: string, label: string, type = "text") => (
    <div><Label htmlFor={`f-${k}`}>{label}</Label><Input id={`f-${k}`} type={type} value={val(k)} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></div>
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle title={inf.display_name} lead={`${inf.tier}${inf.tier_override ? " (set by admin)" : ""} · ${inf.email} · ${inf.country ?? ""}`} />
        {briefs.length ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Send offer:</span>
            {briefs.slice(0, 4).map((b) => <Button key={b.id} asChild variant="pillSecondary" size="pillSm"><Link to="/auteurs/admin/creators/influencer-briefs/$briefId" params={{ briefId: b.id }}>{b.title}</Link></Button>)}
          </div>
        ) : <Button asChild variant="pillSecondary" size="pillSm"><Link to="/auteurs/admin/creators/influencer-briefs">Create a brief to send an offer</Link></Button>}
      </div>
      <AppEnrolment kind="influencer" personId={influencerId} />
      <PortalCard className="space-y-4">
        <p className="font-bold text-brand-navy">Profile</p>
        <div className="grid gap-3 md:grid-cols-3">
          {field("display_name", "Display name")}
          {field("legal_name", "Legal name")}
          {field("phone", "Phone")}
          <div><Label htmlFor="f-tier">Tier</Label><select id="f-tier" className={cn(sel, "w-full")} value={val("tier")} onChange={(e) => setEdit({ ...edit, tier: e.target.value, tier_override: "1" })}>{TIERS.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div><Label htmlFor="f-status">Status</Label><select id="f-status" className={cn(sel, "w-full")} value={val("status")} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>{["active", "paused", "ended"].map((t) => <option key={t}>{t}</option>)}</select></div>
          {field("agency_name", "Agency")}
          {field("rate_tiktok", "Rate TikTok (€)")}
          {field("rate_reel", "Rate Reel (€)")}
          {field("rate_youtube", "Rate YouTube (€)")}
          {field("tracked_link", "Tracked link")}
          {field("promo_code", "Promo code")}
          {field("agency_contact", "Agency contact")}
        </div>
        <div><Label htmlFor="f-notes">Admin notes</Label><Textarea id="f-notes" value={val("admin_notes")} onChange={(e) => setEdit({ ...edit, admin_notes: e.target.value })} /></div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Button variant="pill" size="pillSm" disabled={!Object.keys(edit).length} onClick={save}>Save changes</Button>
          {inf.media_kit_path ? <button className="underline" onClick={async () => { const { data: s } = await supabase.storage.from("influencer-files").createSignedUrl(inf.media_kit_path!, 600); if (s?.signedUrl) window.open(s.signedUrl, "_blank", "noopener"); }}>Open media kit</button> : null}
          {inf.media_kit_url ? <a className="underline" href={inf.media_kit_url} target="_blank" rel="noopener noreferrer">Media kit link</a> : null}
          {[["TikTok", inf.tiktok_url, inf.tiktok_followers], ["Instagram", inf.instagram_url, inf.instagram_followers], ["YouTube", inf.youtube_url, inf.youtube_subscribers]].filter(([, u]) => u).map(([k, u, f]) => (
            <a key={String(k)} className="underline" href={String(u)} target="_blank" rel="noopener noreferrer">{k} · {n(f as number)}</a>
          ))}
          <span className="text-brand-navySoft">Payout: {inf.payout_method ?? "not set"}{inf.payee === "agency" ? " (to agency)" : ""}</span>
        </div>
      </PortalCard>
      <PortalCard className="overflow-x-auto p-0">
        <p className="px-4 pt-4 font-bold text-brand-navy">Deal history</p>
        {deals.length ? (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-brand-navySoft"><tr>{["Brief", "Price", "Status", "Views 7d", "CPM", "Date"].map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-brand-line">{deals.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-2"><Link className="font-semibold underline" to="/auteurs/admin/creators/influencer-deals/$dealId" params={{ dealId: d.id }}>{(d.deal_sheet_snapshot as { brief_title?: string })?.brief_title}</Link></td>
                <td className="px-4 py-2">{euros(d.agreed_price)}</td>
                <td className="px-4 py-2">{DEAL_LABEL[d.status]}</td>
                <td className="px-4 py-2">{n(views7(d) || null)}</td>
                <td className="px-4 py-2">{dealCpm(d) != null ? `${euros(dealCpm(d))}${!views7(d) ? " (48h)" : ""}` : "—"}</td>
                <td className="px-4 py-2 text-xs">{new Date(d.created_at).toLocaleDateString("en-GB")}</td>
              </tr>
            ))}</tbody>
          </table>
        ) : <p className="p-4 text-sm text-brand-navySoft">No deal yet.</p>}
      </PortalCard>
      <PortalCard className="space-y-4">
        <p className="font-bold text-brand-navy">Attribution</p>
        <p className="text-sm">Totals: {n(tot.clicks)} link clicks · {n(tot.codes)} code redemptions · {n(tot.installs)} installs · {n(tot.subs)} subscriptions</p>
        {attr.length ? (
          <ul className="divide-y divide-brand-line text-sm">{attr.map((r) => <li key={r.id} className="py-2">{r.period_start} → {r.period_end}: {n(r.link_clicks)} clicks · {n(r.code_redemptions)} codes · {n(r.installs)} installs · {n(r.subscriptions)} subs</li>)}</ul>
        ) : null}
        <div className="grid gap-2 md:grid-cols-4">
          <div><Label htmlFor="a-s">From</Label><Input id="a-s" type="date" value={a.period_start} onChange={(e) => setA({ ...a, period_start: e.target.value })} /></div>
          <div><Label htmlFor="a-e">To</Label><Input id="a-e" type="date" value={a.period_end} onChange={(e) => setA({ ...a, period_end: e.target.value })} /></div>
          <div className="md:col-span-2"><Label htmlFor="a-d">Deal (optional)</Label><select id="a-d" className={cn(sel, "w-full")} value={a.deal_id} onChange={(e) => setA({ ...a, deal_id: e.target.value })}><option value="">No specific deal</option>{deals.map((d) => <option key={d.id} value={d.id}>{(d.deal_sheet_snapshot as { brief_title?: string })?.brief_title}</option>)}</select></div>
          {(["link_clicks", "code_redemptions", "installs", "subscriptions"] as const).map((k) => (
            <div key={k}><Label htmlFor={`a-${k}`}>{k.replace("_", " ")}</Label><Input id={`a-${k}`} inputMode="numeric" value={a[k]} onChange={(e) => setA({ ...a, [k]: e.target.value })} /></div>
          ))}
        </div>
        <Button variant="pillSecondary" size="pillSm" onClick={addAttribution}>Add attribution</Button>
      </PortalCard>
      <PortalCard>
        <p className="mb-2 font-bold text-brand-navy">Payments</p>
        {items.length ? <ul className="divide-y divide-brand-line text-sm">{items.map((i) => <li key={i.id} className="flex justify-between py-2"><span>{i.part === "full" ? "Full" : i.part === "acceptance" ? "50% on acceptance" : "50% on posting"} · {i.method}{i.payee === "agency" ? " (agency)" : ""}</span><span>{euros(i.amount)} · {i.status}</span></li>)}</ul> : <p className="text-sm text-brand-navySoft">No payment yet.</p>}
      </PortalCard>
    </div>
  );
}

/* ---------------- Payouts ---------------- */
export function InfluencerPayoutsAdmin() {
  const qc = useQueryClient();
  const pay = useServerFn(markPayoutPaid);
  const [status, setStatus] = useState("open");
  const [picked, setPicked] = useState<string[]>([]);
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [ref, setRef] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["admin", "influencer-payouts"],
    queryFn: async () => (await supabase.from("influencer_payout_items").select("*, influencers(display_name, agency_name, payout_details), influencer_invoices(file_path, status), influencer_deals(deal_sheet_snapshot)").order("created_at", { ascending: false })).data ?? [],
  });
  const rows = data.filter((r) => (status === "open" ? ["due", "invoiced"].includes(r.status) : !status || r.status === status));
  async function go() {
    if (!ref.trim()) return void toast.error("Enter the payment reference.");
    try { await pay({ data: { itemIds: picked, paidOn, reference: ref.trim() } }); toast.success("Marked as paid."); setPicked([]); setRef(""); await qc.invalidateQueries({ queryKey: ["admin", "influencer-payouts"] }); }
    catch (e) { toast.error(err(e)); }
  }
  return (
    <div className="space-y-5">
      <PageTitle title="Influencer payouts" lead="Created when a deal is completed. Invoice payments are paid by bank transfer, then marked paid here with a date and reference." />
      <div className="flex flex-wrap items-center gap-2">
        <select className={sel} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="open">Due or invoiced</option><option value="">All</option>{["due", "invoiced", "paid", "cancelled"].map((s) => <option key={s}>{s}</option>)}</select>
        <span className="flex-1" />
        <Input type="date" className="w-40" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} aria-label="Paid on" />
        <Input className="w-48" placeholder="Reference" value={ref} onChange={(e) => setRef(e.target.value)} aria-label="Payment reference" />
        <Button variant="pill" size="pillSm" disabled={!picked.length} onClick={go}>Mark {picked.length || ""} paid</Button>
      </div>
      <PortalCard className="overflow-x-auto p-0">
        {rows.length ? (
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-xs uppercase text-brand-navySoft"><tr>{["", "Influencer", "Deal", "Part", "Amount", "Method", "Payee", "Invoice", "Status", "Paid"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-brand-line">{rows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2">{r.status !== "paid" && r.status !== "cancelled" ? <input type="checkbox" className="size-4" aria-label="Select" checked={picked.includes(r.id)} onChange={() => setPicked(picked.includes(r.id) ? picked.filter((x) => x !== r.id) : [...picked, r.id])} /> : null}</td>
                <td className="px-3 py-2 font-semibold">{r.influencers?.display_name}</td>
                <td className="px-3 py-2 text-xs">{(r.influencer_deals?.deal_sheet_snapshot as { brief_title?: string } | null)?.brief_title}</td>
                <td className="px-3 py-2 text-xs">{r.part}</td>
                <td className="px-3 py-2">{euros(r.amount)}</td>
                <td className="px-3 py-2">{r.method}</td>
                <td className="px-3 py-2">{r.payee === "agency" ? r.influencers?.agency_name ?? "Agency" : "Influencer"}</td>
                <td className="px-3 py-2">{r.influencer_invoices?.file_path ? <button className="underline" onClick={async () => { const { data: s } = await supabase.storage.from("influencer-files").createSignedUrl(r.influencer_invoices!.file_path, 600); if (s?.signedUrl) window.open(s.signedUrl, "_blank", "noopener"); }}>PDF</button> : r.method === "stripe" ? "—" : <span className="text-xs text-portal-amber">Waiting</span>}</td>
                <td className="px-3 py-2">{r.status}</td>
                <td className="px-3 py-2 text-xs">{r.paid_on ? `${r.paid_on} · ${r.paid_reference}` : ""}</td>
              </tr>
            ))}</tbody>
          </table>
        ) : <p className="p-4 text-sm text-brand-navySoft">Nothing here.</p>}
      </PortalCard>
      <p className="text-xs text-brand-navySoft">No money moves from this page: send the transfer from your bank or Stripe, then mark it paid.</p>
    </div>
  );
}

/* ---------------- Performance ---------------- */
export function InfluencerPerformance() {
  const monthStart = new Date(); monthStart.setDate(1);
  const [from, setFrom] = useState(new Date(Date.now() - 90 * 86400e3).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const { data } = useInfluencerData();
  const { data: briefs = [] } = useQuery({ queryKey: ["admin", "influencer-briefs-lite"], queryFn: async () => (await supabase.from("influencer_briefs").select("id, title")).data ?? [] });
  const stats = useMemo(() => {
    if (!data) return null;
    const inRange = (iso: string | null) => Boolean(iso) && iso!.slice(0, 10) >= from && iso!.slice(0, 10) <= to;
    const done = data.deals.filter((d) => d.status === "completed" && inRange(d.completed_at));
    const infById = new Map(data.inf.map((i) => [i.id, i]));
    const spend = done.reduce((s, d) => s + Number(d.agreed_price), 0);
    const monthKey = monthStart.toISOString().slice(0, 7);
    const spendMonth = data.deals.filter((d) => d.status === "completed" && d.completed_at?.startsWith(monthKey)).reduce((s, d) => s + Number(d.agreed_price), 0);
    const withCpm = done.map((d) => ({ d, c: dealCpm(d) })).filter((x): x is { d: DealLite; c: number } => x.c != null);
    const avgCpm = withCpm.length ? withCpm.reduce((s, x) => s + x.c, 0) / withCpm.length : null;
    const attr = data.attr.filter((a) => a.period_end >= from && a.period_start <= to);
    const installs = attr.reduce((s, a) => s + (a.installs ?? 0), 0);
    const attributedIds = new Set(attr.map((a) => a.influencer_id));
    const attributedSpend = done.filter((d) => attributedIds.has(d.influencer_id)).reduce((s, d) => s + Number(d.agreed_price), 0);
    const cpi = installs ? attributedSpend / installs : null;
    const group = (keyOf: (d: DealLite) => string[]) => {
      const m = new Map<string, number[]>();
      for (const x of withCpm) for (const k of keyOf(x.d)) m.set(k, [...(m.get(k) ?? []), x.c]);
      return [...m.entries()].map(([k, v]) => ({ name: k, cpm: Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100 }));
    };
    const byTier = group((d) => [infById.get(d.influencer_id)?.tier ?? "—"]);
    const byNiche = group((d) => infById.get(d.influencer_id)?.niche_tags ?? []);
    const months = new Map<string, number>();
    for (const d of done) months.set(d.completed_at!.slice(0, 7), (months.get(d.completed_at!.slice(0, 7)) ?? 0) + Number(d.agreed_price));
    const byMonth = [...months.entries()].sort().map(([m, v]) => ({ name: m, spend: v }));
    const perInf = new Map<string, { name: string; cpms: number[]; installs: number }>();
    for (const x of withCpm) { const i = infById.get(x.d.influencer_id); const e = perInf.get(x.d.influencer_id) ?? { name: i?.display_name ?? "—", cpms: [], installs: 0 }; e.cpms.push(x.c); perInf.set(x.d.influencer_id, e); }
    for (const a of attr) { const i = infById.get(a.influencer_id); const e = perInf.get(a.influencer_id) ?? { name: i?.display_name ?? "—", cpms: [], installs: 0 }; e.installs += a.installs ?? 0; perInf.set(a.influencer_id, e); }
    const board = [...perInf.values()].map((e) => ({ name: e.name, cpm: e.cpms.length ? e.cpms.reduce((a, b) => a + b, 0) / e.cpms.length : null, installs: e.installs }));
    const briefRows = briefs.map((b) => {
      const ds = done.filter((d) => d.brief_id === b.id);
      return { title: b.title, deals: ds.length, spend: ds.reduce((s, d) => s + Number(d.agreed_price), 0), reach: ds.reduce((s, d) => s + (views7(d) || views48(d)), 0) };
    }).filter((r) => r.deals);
    return { spend, spendMonth, count: done.length, avgCpm, cpi, byTier, byNiche, byMonth, byCpm: board.filter((b) => b.cpm != null).sort((a, b) => a.cpm! - b.cpm!).slice(0, 10), byInstalls: board.filter((b) => b.installs).sort((a, b) => b.installs - a.installs).slice(0, 10), briefRows };
  }, [data, briefs, from, to]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!stats) return <p className="text-sm">Loading…</p>;
  const Kpi = ({ label, value, note }: { label: string; value: string; note?: string }) => (
    <PortalCard><p className="text-xs font-bold uppercase text-brand-navySoft">{label}</p><p className="mt-1 text-2xl font-extrabold text-brand-navy">{value}</p>{note ? <p className="text-xs text-brand-navySoft">{note}</p> : null}</PortalCard>
  );
  const Chart = ({ title, rows, k }: { title: string; rows: { name: string }[]; k: string }) => (
    <PortalCard>
      <p className="mb-3 font-bold text-brand-navy">{title}</p>
      {rows.length ? (
        <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={rows}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip formatter={(v: number) => euros(v)} /><Bar dataKey={k} fill="var(--primary)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
      ) : <p className="text-sm text-brand-navySoft">No data in this range.</p>}
    </PortalCard>
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageTitle title="Performance" lead="Completed deals in the chosen range. CPM uses 7-day views, or 48h views until the 7-day numbers are in." />
        <div className="flex items-center gap-2"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" /><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" /></div>
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        <Kpi label="Spend this month" value={euros(stats.spendMonth)} />
        <Kpi label="Spend in range" value={euros(stats.spend)} />
        <Kpi label="Deals completed" value={String(stats.count)} />
        <Kpi label="Average CPM" value={stats.avgCpm != null ? euros(Math.round(stats.avgCpm * 100) / 100) : "—"} />
        <Kpi label="Average CPI" value={stats.cpi != null ? euros(Math.round(stats.cpi * 100) / 100) : "—"} note="Only where attribution is entered" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Chart title="CPM by tier" rows={stats.byTier} k="cpm" />
        <Chart title="CPM by niche" rows={stats.byNiche} k="cpm" />
        <Chart title="Spend by month" rows={stats.byMonth} k="spend" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <PortalCard><p className="mb-2 font-bold text-brand-navy">Best CPM</p>{stats.byCpm.length ? <ol className="list-decimal pl-5 text-sm">{stats.byCpm.map((b) => <li key={b.name}>{b.name} · {euros(Math.round(b.cpm! * 100) / 100)}</li>)}</ol> : <p className="text-sm text-brand-navySoft">No data.</p>}</PortalCard>
        <PortalCard><p className="mb-2 font-bold text-brand-navy">Most installs</p>{stats.byInstalls.length ? <ol className="list-decimal pl-5 text-sm">{stats.byInstalls.map((b) => <li key={b.name}>{b.name} · {n(b.installs)}</li>)}</ol> : <p className="text-sm text-brand-navySoft">No attribution entered.</p>}</PortalCard>
      </div>
      <PortalCard className="overflow-x-auto p-0">
        <p className="px-4 pt-4 font-bold text-brand-navy">Briefs</p>
        {stats.briefRows.length ? (
          <table className="w-full text-left text-sm"><thead className="text-xs uppercase text-brand-navySoft"><tr>{["Brief", "Deals", "Spend", "Reach (views)"].map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-brand-line">{stats.briefRows.map((r) => <tr key={r.title}><td className="px-4 py-2">{r.title}</td><td className="px-4 py-2">{r.deals}</td><td className="px-4 py-2">{euros(r.spend)}</td><td className="px-4 py-2">{n(r.reach)}</td></tr>)}</tbody></table>
        ) : <p className="p-4 text-sm text-brand-navySoft">No completed deal in this range.</p>}
      </PortalCard>
    </div>
  );
}

/* ---------------- Settings ---------------- */
export function InfluencerSettingsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "influencer-settings"], queryFn: async () => (await supabase.from("influencer_settings").select("*").eq("id", 1).single()).data });
  const [f, setF] = useState<null | { pct: Record<string, string>; split: string; expiry: string; bounds: Record<string, string>; niches: string; disclosure: { code: string; text: string }[] }>(null);
  if (!data) return <p className="text-sm">Loading…</p>;
  const cur = f ?? {
    pct: Object.fromEntries(RIGHTS.map((r) => [r, String((data.rights_fee_pct as Record<string, number>)?.[r] ?? 0)])),
    split: String(data.split_threshold), expiry: String(data.offer_expiry_days),
    bounds: Object.fromEntries(["micro", "mid", "macro", "top"].map((k) => [k, String((data.tier_bounds as Record<string, number>)?.[k] ?? "")])),
    niches: data.niches.join(", "),
    disclosure: Object.entries((data.disclosure ?? {}) as Record<string, string>).map(([code, text]) => ({ code, text })),
  };
  const set = (patch: Partial<typeof cur>) => setF({ ...cur, ...patch });
  async function save() {
    const nums = [...Object.values(cur.pct), cur.split, cur.expiry, ...Object.values(cur.bounds)].map(Number);
    if (nums.some((x) => Number.isNaN(x) || x < 0)) return void toast.error("Every number must be zero or more.");
    const b = Object.fromEntries(Object.entries(cur.bounds).map(([k, v]) => [k, Number(v)]));
    if (!(b["micro"]! < b["mid"]! && b["mid"]! < b["macro"]! && b["macro"]! < b["top"]!)) return void toast.error("Tier boundaries must go up: micro < mid < macro < top.");
    const disclosure = Object.fromEntries(cur.disclosure.filter((d) => d.code.trim() && d.text.trim()).map((d) => [d.code.trim().toUpperCase(), d.text.trim()]));
    const { error } = await supabase.from("influencer_settings").update({
      rights_fee_pct: Object.fromEntries(Object.entries(cur.pct).map(([k, v]) => [k, Number(v)])), split_threshold: Number(cur.split), offer_expiry_days: Math.max(1, Math.round(Number(cur.expiry))),
      tier_bounds: b, niches: cur.niches.split(",").map((s) => s.trim()).filter(Boolean), disclosure, updated_at: new Date().toISOString(),
    }).eq("id", 1);
    if (error) return void toast.error("Could not save the settings.");
    toast.success("Settings saved.");
    setF(null);
    await qc.invalidateQueries({ queryKey: ["admin", "influencer-settings"] });
  }
  return (
    <div className="space-y-5">
      <PageTitle title="Influencer settings" />
      <PortalCard className="space-y-3">
        <p className="font-bold text-brand-navy">Rights fee (% added to the rate)</p>
        <div className="grid gap-3 md:grid-cols-4">{RIGHTS.map((r) => <div key={r}><Label htmlFor={`p-${r}`}>{r.replaceAll("_", " ")}</Label><Input id={`p-${r}`} inputMode="decimal" value={cur.pct[r]} onChange={(e) => set({ pct: { ...cur.pct, [r]: e.target.value } })} /></div>)}</div>
      </PortalCard>
      <PortalCard className="grid gap-3 md:grid-cols-2">
        <div><Label htmlFor="s-split">50/50 split above (€)</Label><Input id="s-split" inputMode="decimal" value={cur.split} onChange={(e) => set({ split: e.target.value })} /></div>
        <div><Label htmlFor="s-exp">Offer expiry (days)</Label><Input id="s-exp" inputMode="numeric" value={cur.expiry} onChange={(e) => set({ expiry: e.target.value })} /></div>
      </PortalCard>
      <PortalCard className="space-y-3">
        <p className="font-bold text-brand-navy">Tier boundaries (followers where each tier starts; below micro is nano)</p>
        <div className="grid gap-3 md:grid-cols-4">{Object.keys(cur.bounds).map((k) => <div key={k}><Label htmlFor={`t-${k}`}>{k}</Label><Input id={`t-${k}`} inputMode="numeric" value={cur.bounds[k]} onChange={(e) => set({ bounds: { ...cur.bounds, [k]: e.target.value } })} /></div>)}</div>
      </PortalCard>
      <PortalCard className="space-y-2">
        <Label htmlFor="s-n">Niche list (comma-separated)</Label>
        <Textarea id="s-n" value={cur.niches} onChange={(e) => set({ niches: e.target.value })} />
      </PortalCard>
      <PortalCard className="space-y-3">
        <p className="font-bold text-brand-navy">Disclosure wording per country</p>
        {cur.disclosure.map((d, i) => (
          <div key={i} className="flex gap-2">
            <Input className="w-20" value={d.code} placeholder="FR" aria-label="Country code" onChange={(e) => set({ disclosure: cur.disclosure.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)) })} />
            <Input value={d.text} aria-label="Wording" onChange={(e) => set({ disclosure: cur.disclosure.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
          </div>
        ))}
        <Button variant="pillSecondary" size="pillSm" onClick={() => set({ disclosure: [...cur.disclosure, { code: "", text: "" }] })}>Add country</Button>
      </PortalCard>
      <Button variant="pill" size="pill" onClick={save}>Save settings</Button>
    </div>
  );
}
