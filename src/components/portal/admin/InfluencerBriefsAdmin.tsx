import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { INFLUENCER_COPY, NICHES, POST_LANGUAGES } from "@/i18n/influencers";
import {
  basePrice, cpm, deliverableLabel, euros, FORMATS, parseDeliverables, PLATFORMS, RIGHTS, RIGHTS_LABEL, TIERS, withRightsFee,
  type Deliverable, type Rights,
} from "@/lib/influencer-deals";
import { adminOfferAction, sendInfluencerOffers } from "@/lib/influencer-deals.functions";
import { EmptyState, PageTitle, PortalCard } from "../ui";
import { usePortalProfile } from "../usePortal";

const L = INFLUENCER_COPY.en;
const chip = (on: boolean) => (on ? "pill" : "pillSecondary") as "pill" | "pillSecondary";
function toggle<T>(list: T[], v: T) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}
function err(e: unknown) {
  return e instanceof Error && !e.message.startsWith("[") ? e.message : "Something went wrong.";
}

/* ---------------- List + create ---------------- */
export function InfluencerBriefsList() {
  const [open, setOpen] = useState(false);
  const { data = [] } = useQuery({
    queryKey: ["admin", "influencer-briefs"],
    queryFn: async () => {
      const [{ data: briefs }, { data: offers }] = await Promise.all([
        supabase.from("influencer_briefs").select("*").order("created_at", { ascending: false }),
        supabase.from("influencer_offers").select("brief_id, status"),
      ]);
      return (briefs ?? []).map((b) => {
        const o = (offers ?? []).filter((x) => x.brief_id === b.id);
        return { ...b, sent: o.length, accepted: o.filter((x) => x.status === "accepted").length, declined: o.filter((x) => x.status === "declined").length, countered: o.filter((x) => x.status === "countered").length };
      });
    },
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle title="Briefs & offers" lead="Influencer briefs, and the offers sent for each." />
        <Button variant="pill" size="pill" onClick={() => setOpen(true)}><Plus className="size-4" /> New brief</Button>
      </div>
      <PortalCard className="overflow-x-auto p-0">
        {data.length ? (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-brand-navySoft">
              <tr>{["Brief", "Status", "Rights", "Offers sent", "Accepted", "Countered", "Declined"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {data.map((b) => (
                <tr key={b.id} className="hover:bg-brand-navy/5">
                  <td className="px-4 py-3 font-bold text-brand-navy">
                    <Link to="/auteurs/admin/creators/influencer-briefs/$briefId" params={{ briefId: b.id }} className="underline-offset-2 hover:underline">{b.title}</Link>
                  </td>
                  <td className="px-4 py-3 capitalize">{b.status}</td>
                  <td className="px-4 py-3">{RIGHTS_LABEL[b.rights_package as Rights]?.short}</td>
                  <td className="px-4 py-3">{b.sent}</td>
                  <td className="px-4 py-3">{b.accepted}</td>
                  <td className="px-4 py-3">{b.countered ? <span className="font-bold text-portal-amber">{b.countered}</span> : 0}</td>
                  <td className="px-4 py-3">{b.declined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyState title="No brief yet" text="Create the first influencer brief." />}
      </PortalCard>
      <BriefForm open={open} onOpenChange={setOpen} />
    </div>
  );
}

type BriefRow = Awaited<ReturnType<typeof loadBrief>>;
async function loadBrief(id: string) {
  const { data, error } = await supabase.from("influencer_briefs").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

function BriefForm({ open, onOpenChange, brief }: { open: boolean; onOpenChange: (o: boolean) => void; brief?: BriefRow }) {
  const qc = useQueryClient();
  const { data: me } = usePortalProfile();
  const { data: refs = [] } = useQuery({
    queryKey: ["admin", "reference-videos", "active"],
    queryFn: async () => (await supabase.from("reference_videos").select("id, title, url, category, platform").eq("active", true).order("pinned", { ascending: false })).data ?? [],
  });
  const [f, setF] = useState(() => ({
    title: brief?.title ?? "", angle: brief?.angle ?? "", brief_type: brief?.brief_type ?? "freestyle", body: brief?.body ?? "",
    rights_package: (brief?.rights_package ?? "post_only") as Rights, exclusivity_days: String(brief?.exclusivity_days ?? 0),
    must_mention: (brief?.must_mention ?? []).join(", "), budget_min: brief?.budget_min?.toString() ?? "", budget_max: brief?.budget_max?.toString() ?? "",
    earliest_post_date: brief?.earliest_post_date ?? "", latest_post_date: brief?.latest_post_date ?? "", draft_approval_required: brief?.draft_approval_required ?? false,
  }));
  const [deliverables, setDeliverables] = useState<Deliverable[]>(brief ? parseDeliverables(brief.deliverables) : [{ platform: "tiktok", format: "post", count: 1 }]);
  const [refIds, setRefIds] = useState<string[]>(brief?.reference_video_ids ?? []);
  const [tiers, setTiers] = useState<string[]>(brief?.target_tiers ?? []);
  const [niches, setNiches] = useState<string[]>(brief?.target_niches ?? []);
  const [langs, setLangs] = useState<string[]>(brief?.target_languages ?? ["fr"]);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function save(status: "draft" | "open") {
    setProblem(null);
    if (f.title.trim().length < 3) return setProblem("Give the brief a title.");
    if (!f.body.trim()) return setProblem(f.brief_type === "precise" ? "Write the full brief." : "Write the angle and the must-haves.");
    if (!deliverables.length) return setProblem("Add at least one deliverable.");
    if (f.earliest_post_date && f.latest_post_date && f.earliest_post_date > f.latest_post_date) return setProblem("The earliest posting date is after the latest one.");
    const num = (v: string) => (v.trim() === "" ? null : Number(v));
    const row = {
      title: f.title.trim(), angle: f.angle.trim() || null, brief_type: f.brief_type, body: f.body.trim(), deliverables,
      rights_package: f.rights_package, exclusivity_days: Number(f.exclusivity_days) || 0,
      must_mention: f.must_mention.split(",").map((s) => s.trim()).filter(Boolean), reference_video_ids: refIds,
      budget_min: num(f.budget_min), budget_max: num(f.budget_max), target_tiers: tiers, target_niches: niches, target_languages: langs,
      earliest_post_date: f.earliest_post_date || null, latest_post_date: f.latest_post_date || null,
      draft_approval_required: f.draft_approval_required, status,
    };
    setBusy(true);
    const res = brief
      ? await supabase.from("influencer_briefs").update(row).eq("id", brief.id)
      : await supabase.from("influencer_briefs").insert({ ...row, created_by: me?.profile?.id ?? null });
    setBusy(false);
    if (res.error) return setProblem("The brief could not be saved.");
    toast.success(status === "open" ? "Brief saved and open." : "Draft saved.");
    await qc.invalidateQueries({ queryKey: ["admin", "influencer-briefs"] });
    await qc.invalidateQueries({ queryKey: ["admin", "influencer-brief"] });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>{brief ? "Edit brief" : "New influencer brief"}</DialogTitle></DialogHeader>
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2"><Label htmlFor="b-title">Title</Label><Input id="b-title" value={f.title} onChange={set("title")} /></div>
            <div className="md:col-span-2"><Label htmlFor="b-angle">Angle</Label><Input id="b-angle" value={f.angle} onChange={set("angle")} placeholder="One line: the idea of the video" /></div>
          </div>
          <div>
            <Label>Brief type</Label>
            <div className="mt-2 flex gap-2">
              <Button variant={chip(f.brief_type === "precise")} size="pillSm" onClick={() => setF({ ...f, brief_type: "precise" })}>Precise (full script)</Button>
              <Button variant={chip(f.brief_type === "freestyle")} size="pillSm" onClick={() => setF({ ...f, brief_type: "freestyle" })}>Freestyle (angle + must-haves)</Button>
            </div>
            <Textarea className="mt-2 min-h-32" value={f.body} onChange={set("body")} aria-label="Brief text" placeholder={f.brief_type === "precise" ? "The full brief" : "The angle and the must-haves"} />
          </div>
          <div>
            <Label>Deliverables</Label>
            <div className="mt-2 space-y-2">
              {deliverables.map((d, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <select className="h-11 rounded-xl border border-input bg-card px-3 text-sm" value={d.platform} aria-label="Platform"
                    onChange={(e) => { const p = e.target.value as (typeof PLATFORMS)[number]; setDeliverables(deliverables.map((x, j) => (j === i ? { ...x, platform: p, format: FORMATS[p][0]! } : x))); }}>
                    {PLATFORMS.map((p) => <option key={p} value={p}>{p === "tiktok" ? "TikTok" : p === "instagram" ? "Instagram" : "YouTube"}</option>)}
                  </select>
                  <select className="h-11 rounded-xl border border-input bg-card px-3 text-sm" value={d.format} aria-label="Format"
                    onChange={(e) => setDeliverables(deliverables.map((x, j) => (j === i ? { ...x, format: e.target.value } : x)))}>
                    {FORMATS[d.platform as (typeof PLATFORMS)[number]].map((fm) => <option key={fm} value={fm}>{fm}</option>)}
                  </select>
                  <Input className="w-20" type="number" min={1} max={10} value={d.count} aria-label="Count"
                    onChange={(e) => setDeliverables(deliverables.map((x, j) => (j === i ? { ...x, count: Math.max(1, Number(e.target.value) || 1) } : x)))} />
                  <Button variant="ghost" size="icon" className="size-11" aria-label="Remove deliverable" onClick={() => setDeliverables(deliverables.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button>
                </div>
              ))}
              <Button variant="pillSecondary" size="pillSm" onClick={() => setDeliverables([...deliverables, { platform: "instagram", format: "reel", count: 1 }])}><Plus className="size-4" /> Add deliverable</Button>
            </div>
          </div>
          <div>
            <Label>Rights we buy</Label>
            <div className="mt-2 grid gap-2 md:grid-cols-2" role="radiogroup" aria-label="Rights package">
              {RIGHTS.map((r) => (
                <button key={r} role="radio" aria-checked={f.rights_package === r} onClick={() => setF({ ...f, rights_package: r })}
                  className={cn("rounded-xl border-2 p-3 text-left text-sm", f.rights_package === r ? "border-brand-navy bg-brand-navy/5" : "border-brand-line")}>
                  <span className="block font-bold text-brand-navy">{RIGHTS_LABEL[r].short}</span>
                  <span className="text-brand-navySoft">{RIGHTS_LABEL[r].plain}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div><Label htmlFor="b-ex">Exclusivity (days, 0 = none)</Label><Input id="b-ex" type="number" min={0} value={f.exclusivity_days} onChange={set("exclusivity_days")} /></div>
            <div><Label htmlFor="b-min">Budget min (€)</Label><Input id="b-min" inputMode="decimal" value={f.budget_min} onChange={set("budget_min")} /></div>
            <div><Label htmlFor="b-max">Budget max (€)</Label><Input id="b-max" inputMode="decimal" value={f.budget_max} onChange={set("budget_max")} /></div>
            <div className="md:col-span-3"><Label htmlFor="b-mm">Must mention (comma-separated: promo code, app name, hashtag…)</Label><Input id="b-mm" value={f.must_mention} onChange={set("must_mention")} /></div>
            <div><Label htmlFor="b-e">Earliest post date</Label><Input id="b-e" type="date" value={f.earliest_post_date} onChange={set("earliest_post_date")} /></div>
            <div><Label htmlFor="b-l">Latest post date</Label><Input id="b-l" type="date" value={f.latest_post_date} onChange={set("latest_post_date")} /></div>
            <label className="flex items-center gap-2 pt-6 text-sm font-semibold text-brand-navy">
              <input type="checkbox" className="size-4" checked={f.draft_approval_required} onChange={(e) => setF({ ...f, draft_approval_required: e.target.checked })} /> Draft approval required
            </label>
          </div>
          <div className="space-y-2">
            <Label>Target tiers (none = all)</Label>
            <div className="flex flex-wrap gap-2">{TIERS.map((t) => <Button key={t} variant={chip(tiers.includes(t))} size="pillSm" onClick={() => setTiers(toggle(tiers, t))}>{t}</Button>)}</div>
            <Label>Target niches (none = all)</Label>
            <div className="flex flex-wrap gap-2">{NICHES.map((n) => <Button key={n} variant={chip(niches.includes(n))} size="pillSm" onClick={() => setNiches(toggle(niches, n))}>{L.niches[n]}</Button>)}</div>
            <Label>Target languages (none = all)</Label>
            <div className="flex flex-wrap gap-2">{POST_LANGUAGES.map((l) => <Button key={l} variant={chip(langs.includes(l))} size="pillSm" onClick={() => setLangs(toggle(langs, l))}>{L.languages[l]}</Button>)}</div>
          </div>
          <div>
            <Label>Reference videos from the library</Label>
            <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-xl border border-brand-line p-2">
              {refs.length ? refs.map((r) => (
                <label key={r.id} className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm hover:bg-brand-navy/5">
                  <input type="checkbox" className="size-4" checked={refIds.includes(r.id)} onChange={() => setRefIds(toggle(refIds, r.id))} />
                  <span className="flex-1 truncate">{r.title || r.url}</span>
                  <span className="text-xs text-brand-navySoft">{r.category}</span>
                </label>
              )) : <p className="p-2 text-sm text-brand-navySoft">The library is empty.</p>}
            </div>
          </div>
          {problem ? <p role="alert" className="text-sm font-semibold text-portal-red">{problem}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="pillSecondary" size="pill" disabled={busy} onClick={() => void save("draft")}>Save as draft</Button>
            <Button variant="pill" size="pill" disabled={busy} onClick={() => void save("open")}>Save and open</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Brief detail ---------------- */
const OFFER_CLASS: Record<string, string> = {
  sent: "bg-brand-navy/10 text-brand-navy", viewed: "bg-portal-accent/10 text-portal-accent", accepted: "bg-portal-green/10 text-portal-green",
  countered: "bg-portal-amber/15 text-portal-amber", declined: "bg-portal-red/10 text-portal-red", expired: "bg-brand-navy/5 text-brand-navySoft", withdrawn: "bg-brand-navy/5 text-brand-navySoft",
};

export function InfluencerBriefDetail({ briefId }: { briefId: string }) {
  const qc = useQueryClient();
  const [edit, setEdit] = useState(false);
  const { data: brief } = useQuery({ queryKey: ["admin", "influencer-brief", briefId], queryFn: () => loadBrief(briefId) });
  const { data: settings } = useQuery({
    queryKey: ["admin", "influencer-settings"],
    queryFn: async () => (await supabase.from("influencer_settings").select("*").eq("id", 1).maybeSingle()).data,
  });
  const { data: offers = [] } = useQuery({
    queryKey: ["admin", "influencer-offers", briefId],
    queryFn: async () => (await supabase.from("influencer_offers").select("*, influencers(display_name, tier)").eq("brief_id", briefId).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: interest = [] } = useQuery({
    queryKey: ["admin", "influencer-interest", briefId],
    queryFn: async () => (await supabase.from("influencer_brief_interest").select("influencer_id").eq("brief_id", briefId)).data ?? [],
  });
  const act = useServerFn(adminOfferAction);
  const [counter, setCounter] = useState<{ id: string; price: string; message: string } | null>(null);
  async function run(offerId: string, action: "accept_counter" | "recounter" | "withdraw", price?: number, message?: string) {
    try {
      const r = await act({ data: { offerId, action, price, message } });
      toast.success(action === "accept_counter" ? "Counter accepted. A deal was created." : action === "withdraw" ? "Offer withdrawn." : "New price sent.");
      setCounter(null);
      await qc.invalidateQueries({ queryKey: ["admin", "influencer-offers", briefId] });
      if ("dealId" in r && r.dealId) await qc.invalidateQueries({ queryKey: ["admin", "influencer-deals"] });
    } catch (e) { toast.error(err(e)); }
  }
  if (!brief) return <p className="text-sm">Loading…</p>;
  const dl = parseDeliverables(brief.deliverables);
  const offeredIds = new Set(offers.filter((o) => !["declined", "expired", "withdrawn"].includes(o.status)).map((o) => o.influencer_id));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle title={brief.title} lead={`${brief.status === "open" ? "Open" : brief.status === "draft" ? "Draft" : "Closed"} · ${RIGHTS_LABEL[brief.rights_package as Rights]?.short}`} />
        <div className="flex gap-2">
          <Button variant="pillSecondary" size="pillSm" onClick={() => setEdit(true)}>Edit</Button>
          {brief.status !== "closed" ? (
            <Button variant="pillSecondary" size="pillSm" onClick={async () => { await supabase.from("influencer_briefs").update({ status: "closed" }).eq("id", brief.id); await qc.invalidateQueries({ queryKey: ["admin", "influencer-brief", briefId] }); }}>Close brief</Button>
          ) : null}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <PortalCard className="space-y-3 text-sm">
          {brief.angle ? <p className="font-bold text-brand-navy">{brief.angle}</p> : null}
          <p className="whitespace-pre-line text-brand-navySoft">{brief.body}</p>
          <dl className="grid grid-cols-2 gap-2">
            {[
              ["Type", brief.brief_type], ["Deliverables", dl.map(deliverableLabel).join(", ")],
              ["Rights", RIGHTS_LABEL[brief.rights_package as Rights]?.plain], ["Exclusivity", brief.exclusivity_days ? `${brief.exclusivity_days} days` : "None"],
              ["Must mention", brief.must_mention.join(", ") || "—"], ["Budget", `${euros(brief.budget_min)} – ${euros(brief.budget_max)}`],
              ["Posting window", `${brief.earliest_post_date ?? "—"} → ${brief.latest_post_date ?? "—"}`], ["Draft approval", brief.draft_approval_required ? "Required" : "No"],
              ["Tiers", brief.target_tiers.join(", ") || "All"], ["Niches", brief.target_niches.join(", ") || "All"],
            ].map(([k, v]) => <div key={k}><dt className="text-xs font-bold uppercase text-brand-navySoft">{k}</dt><dd className="text-brand-navy">{v}</dd></div>)}
          </dl>
        </PortalCard>
        <SendOffers brief={brief} settings={settings ?? null} exclude={offeredIds} interested={new Set(interest.map((i) => i.influencer_id))}
          onSent={() => qc.invalidateQueries({ queryKey: ["admin", "influencer-offers", briefId] })} />
      </div>
      <PortalCard className="overflow-x-auto p-0">
        <p className="px-4 pt-4 font-bold text-brand-navy">Offers</p>
        {offers.length ? (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-brand-navySoft">
              <tr>{["Influencer", "Price", "Status", "Counter", "Round", "Expires", ""].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {offers.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-bold text-brand-navy">{o.influencers?.display_name}<span className="block text-xs font-normal capitalize text-brand-navySoft">{o.influencers?.tier}</span></td>
                  <td className="px-4 py-3">{euros(o.price)}{o.split_payment ? <span className="block text-xs text-brand-navySoft">50/50 split</span> : null}</td>
                  <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", OFFER_CLASS[o.status])}>{o.status}</span></td>
                  <td className="px-4 py-3">{o.counter_price ? <>{euros(o.counter_price)}{o.counter_message ? <span className="block max-w-48 truncate text-xs text-brand-navySoft" title={o.counter_message}>{o.counter_message}</span> : null}</> : "—"}</td>
                  <td className="px-4 py-3">{o.counter_round}</td>
                  <td className="px-4 py-3 text-xs">{o.expires_at ? new Date(o.expires_at).toLocaleDateString("en-GB") : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {o.status === "countered" ? (
                        <>
                          <Button variant="pill" size="pillSm" onClick={() => void run(o.id, "accept_counter")}>Accept counter</Button>
                          <Button variant="pillSecondary" size="pillSm" onClick={() => setCounter({ id: o.id, price: String(o.price), message: "" })}>Re-counter</Button>
                        </>
                      ) : null}
                      {["sent", "viewed", "countered"].includes(o.status) ? (
                        <Button variant="outline" size="pillSm" onClick={() => void run(o.id, "withdraw")}>Withdraw</Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="p-4 text-sm text-brand-navySoft">No offer sent yet.</p>}
      </PortalCard>
      <Dialog open={Boolean(counter)} onOpenChange={(o) => !o && setCounter(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Re-counter</DialogTitle></DialogHeader>
          {counter ? (
            <div className="space-y-3">
              <Label htmlFor="rc-p">New price (€)</Label>
              <Input id="rc-p" inputMode="decimal" value={counter.price} onChange={(e) => setCounter({ ...counter, price: e.target.value })} />
              <Label htmlFor="rc-m">Message</Label>
              <Textarea id="rc-m" value={counter.message} onChange={(e) => setCounter({ ...counter, message: e.target.value })} />
              <Button variant="pill" size="pill" onClick={() => {
                const p = Number(counter.price);
                if (!(p > 0)) return void toast.error("Enter a price above zero.");
                void run(counter.id, "recounter", p, counter.message || undefined);
              }}>Send new price</Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      {edit ? <BriefForm open={edit} onOpenChange={setEdit} brief={brief} /> : null}
    </div>
  );
}

type Settings = { rights_fee_pct: unknown; split_threshold: number; offer_expiry_days: number } | null;

function SendOffers({ brief, settings, exclude, interested, onSent }: { brief: BriefRow; settings: Settings; exclude: Set<string>; interested: Set<string>; onSent: () => void }) {
  const send = useServerFn(sendInfluencerOffers);
  const [tier, setTier] = useState<string>("");
  const [niche, setNiche] = useState<string>("");
  const [lang, setLang] = useState<string>("");
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [picked, setPicked] = useState<Record<string, { price: string; split: boolean }>>({});
  const [message, setMessage] = useState("");
  const [expiry, setExpiry] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const { data: people = [] } = useQuery({
    queryKey: ["admin", "influencers-for-offers"],
    queryFn: async () => {
      const [{ data: inf }, { data: deals }] = await Promise.all([
        supabase.from("influencers").select("id, display_name, tier, niche_tags, languages, availability, booked_until, rate_tiktok, rate_reel, rate_youtube, status").eq("status", "active").order("display_name"),
        supabase.from("influencer_deals").select("influencer_id, agreed_price, influencer_deliverables(influencer_deliverable_metrics(checkpoint, views))").eq("status", "completed"),
      ]);
      const cpmBy = new Map<string, number[]>();
      for (const d of deals ?? []) {
        const views = (d.influencer_deliverables ?? []).flatMap((v) => v.influencer_deliverable_metrics ?? []).filter((m) => m.checkpoint === "7d").reduce((s, m) => s + (m.views ?? 0), 0);
        const c = cpm(Number(d.agreed_price), views);
        if (c != null) cpmBy.set(d.influencer_id, [...(cpmBy.get(d.influencer_id) ?? []), c]);
      }
      return (inf ?? []).map((i) => {
        const list = cpmBy.get(i.id);
        return { ...i, cpm: list ? Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 100) / 100 : null };
      });
    },
  });
  const deliverables = parseDeliverables(brief.deliverables);
  const pct = (settings?.rights_fee_pct ?? null) as Record<string, number> | null;
  const threshold = Number(settings?.split_threshold ?? 500);
  const expiryDays = Number(expiry || settings?.offer_expiry_days || 5);
  const list = useMemo(() => people.filter((p) =>
    !exclude.has(p.id) && (!tier || p.tier === tier) && (!niche || p.niche_tags.includes(niche)) && (!lang || p.languages.includes(lang)) &&
    (!onlyAvailable || p.availability !== "booked" || (p.booked_until != null && p.booked_until < new Date().toISOString().slice(0, 10))),
  ), [people, exclude, tier, niche, lang, onlyAvailable]);
  const count = Object.keys(picked).length;

  function pick(p: (typeof people)[number]) {
    if (picked[p.id]) { const next = { ...picked }; delete next[p.id]; return setPicked(next); }
    if (count >= 10) return void toast.error("You can send up to 10 offers at a time.");
    const base = basePrice(p, deliverables);
    const total = base == null ? "" : String(withRightsFee(base, brief.rights_package as Rights, pct).total);
    setPicked({ ...picked, [p.id]: { price: total, split: total !== "" && Number(total) > threshold } });
  }
  async function go() {
    if (brief.status !== "open") return void toast.error("Open the brief before sending offers.");
    const items = [];
    for (const [id, v] of Object.entries(picked)) {
      const price = Number(v.price);
      const p = people.find((x) => x.id === id)!;
      if (!(price > 0)) return void toast.error(`Set a price for ${p.display_name}.`);
      const base = basePrice(p, deliverables);
      const fee = base == null ? 0 : withRightsFee(base, brief.rights_package as Rights, pct).rights_fee;
      items.push({ influencerId: id, price, fixed: Math.max(0, price - fee), rightsFee: fee, split: v.split, message: message.trim() || undefined });
    }
    setBusy(true);
    try {
      const r = await send({ data: { briefId: brief.id, expiryDays, deadline: brief.latest_post_date, items } });
      toast.success(`${r.sent} offer${r.sent > 1 ? "s" : ""} sent.`);
      setPicked({});
      setMessage("");
      onSent();
    } catch (e) { toast.error(err(e)); }
    finally { setBusy(false); }
  }
  const sel = "h-11 rounded-xl border border-input bg-card px-3 text-sm";
  return (
    <PortalCard className="space-y-4">
      <p className="font-bold text-brand-navy">Send offers</p>
      <div className="flex flex-wrap gap-2">
        <select className={sel} value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Tier"><option value="">All tiers</option>{TIERS.map((t) => <option key={t}>{t}</option>)}</select>
        <select className={sel} value={niche} onChange={(e) => setNiche(e.target.value)} aria-label="Niche"><option value="">All niches</option>{NICHES.map((n) => <option key={n} value={n}>{L.niches[n]}</option>)}</select>
        <select className={sel} value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language"><option value="">All languages</option>{POST_LANGUAGES.map((l) => <option key={l} value={l}>{L.languages[l]}</option>)}</select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} /> Available only</label>
      </div>
      <div className="max-h-80 space-y-1 overflow-y-auto">
        {list.length ? list.map((p) => {
          const v = picked[p.id];
          return (
            <div key={p.id} className={cn("rounded-xl border p-2", v ? "border-brand-navy bg-brand-navy/5" : "border-brand-line")}>
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" className="size-4" checked={Boolean(v)} onChange={() => pick(p)} />
                <span className="flex-1 font-semibold text-brand-navy">{p.display_name}{interested.has(p.id) ? <span className="ml-2 rounded-full bg-portal-green/10 px-2 text-[11px] font-bold text-portal-green">Interested</span> : null}</span>
                <span className="text-xs capitalize text-brand-navySoft">{p.tier}</span>
                <span className="w-24 text-right text-xs text-brand-navySoft">{p.cpm != null ? `CPM ${euros(p.cpm)}` : "No CPM yet"}</span>
              </label>
              {v ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 pl-6">
                  <Input className="w-32" inputMode="decimal" value={v.price} aria-label={`Price for ${p.display_name}`} placeholder="Price €"
                    onChange={(e) => setPicked({ ...picked, [p.id]: { ...v, price: e.target.value } })} />
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={v.split} onChange={(e) => setPicked({ ...picked, [p.id]: { ...v, split: e.target.checked } })} /> 50% on acceptance, 50% on posting</label>
                  {v.price === "" ? <span className="text-xs text-portal-amber">No rate for these deliverables: set a price.</span> : null}
                </div>
              ) : null}
            </div>
          );
        }) : <p className="text-sm text-brand-navySoft">No influencer matches these filters.</p>}
      </div>
      <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Optional message sent with every offer" aria-label="Message" />
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor="exp">Expires after (days)</Label>
        <Input id="exp" className="w-20" type="number" min={1} max={60} value={expiry || String(settings?.offer_expiry_days ?? 5)} onChange={(e) => setExpiry(e.target.value)} />
        <span className="flex-1" />
        <Button variant="pill" size="pill" disabled={busy || !count} onClick={go}>Send {count || ""} offer{count === 1 ? "" : "s"}</Button>
      </div>
      <p className="text-xs text-brand-navySoft">Prices start from each influencer's rate for these deliverables plus the rights fee ({pct?.[brief.rights_package] ?? 0}%). The 50/50 split is ticked automatically above {euros(threshold)}.</p>
    </PortalCard>
  );
}
