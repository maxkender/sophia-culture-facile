import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, PageTitle, PortalCard } from "@/components/portal/ui";
import { briefLibraryStats, declineAssignment, myRunningMonth } from "@/lib/ugc-creator.functions";
import { fmtMoney } from "@/lib/ugc-pay";
import { friendlyCreatorError } from "@/lib/creator-validation";
import { useCreator } from "./useCreator";
import { postStage } from "./WorkPages";
import { LibraryPage as ReferenceLibrary } from "./WorkPages";
import { MyTerms } from "./HubPages";
import { supabase } from "@/integrations/supabase/client";
import { creatorLocale, t as ct, L } from "@/i18n/creator-app";

const n = (v: number) => new Intl.NumberFormat("en-GB").format(Math.round(v));
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(creatorLocale(), { weekday: "short", day: "numeric", month: "short" }) : ct("Any day"));

/* ---------- Assigned briefs with decline → replacement ---------- */
export function AssignedBriefs() {
  const d = useCreator();
  const decline = useServerFn(declineAssignment);
  const [open, setOpen] = useState<string | null>(null);
  const [pick, setPick] = useState("");
  const [reason, setReason] = useState("");
  const live = (d.assignments ?? []).filter((a: any) => !a.declined_at);
  if (!live.length) return null;
  const title = (id: string) => d.briefs.find((b) => b.id === id)?.title ?? "Brief";
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-xl font-extrabold text-brand-navy">{ct("Assigned to you")}</h2>
      <div className="space-y-3">
        {live.map((a: any) => (
          <PortalCard key={a.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">{day(a.target_date)}{a.replaces_assignment_id ? " · your replacement" : ""}</p>
                <Link to="/creators/app/briefs/$briefId" params={{ briefId: a.brief_id }} className="text-base font-extrabold text-portal-accent hover:underline">{title(a.brief_id)}</Link>
              </div>
              {!a.replaces_assignment_id && <Button size="sm" variant="outline" onClick={() => { setOpen(open === a.id ? null : a.id); setPick(""); setReason(""); }}>{ct("Doesn't suit me")}</Button>}
            </div>
            {open === a.id && (
              <div className="mt-4 space-y-3 border-t border-brand-line pt-4">
                <Label htmlFor={`pick-${a.id}`}>{ct("Pick a replacement from the library")}</Label>
                <select id={`pick-${a.id}`} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm" value={pick} onChange={(e) => setPick(e.target.value)}>
                  <option value="">{ct("Choose a brief…")}</option>
                  {d.briefs.filter((b) => b.id !== a.brief_id).map((b) => <option key={b.id} value={b.id}>{ct(b.title)}</option>)}
                </select>
                <Label htmlFor={`why-${a.id}`}>{ct("Why doesn't this one suit you?")}</Label>
                <Textarea id={`why-${a.id}`} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
                <Button disabled={!pick || reason.trim().length < 3} onClick={async () => {
                  try { await decline({ data: { assignmentId: a.id, replacementBriefId: pick, reason } }); toast.success(ct("Swap saved. The team can see it.")); setOpen(null); d.reload(); }
                  catch (e) { toast.error(friendlyCreatorError(e)); }
                }}>{ct("Swap the brief")}</Button>
              </div>
            )}
          </PortalCard>
        ))}
      </div>
    </div>
  );
}

/* ---------- Brief library ---------- */
export function BriefLibraryPage() {
  const d = useCreator();
  const statsFn = useServerFn(briefLibraryStats);
  const { data } = useQuery({ queryKey: ["brief-lib-stats"], queryFn: () => statsFn() });
  const [tab, setTab] = useState<"briefs" | "videos">("briefs");
  const [f, setF] = useState({ format: "", platform: "", difficulty: "", tag: "", peers: false });
  const briefs = d.briefs as any[];
  const formats = [...new Set(briefs.map((b) => b.format).filter(Boolean))];
  const tags = [...new Set(briefs.flatMap((b) => b.tags ?? []))];
  const list = useMemo(() => briefs
    .filter((b) => (!f.format || b.format === f.format) && (!f.platform || b.platform === f.platform || b.platform === "both") && (!f.difficulty || String(b.difficulty) === f.difficulty) && (!f.tag || (b.tags ?? []).includes(f.tag)))
    .filter((b) => !f.peers || (data?.stats[b.id]?.peerPosts ?? 0) > 0)
    .sort((x, y) => (f.peers ? (data?.stats[y.id]?.peerAvg ?? 0) - (data?.stats[x.id]?.peerAvg ?? 0) : (data?.stats[y.id]?.avg ?? 0) - (data?.stats[x.id]?.avg ?? 0))), [briefs, f, data]);
  const sel = "h-10 rounded-md border border-input bg-card px-3 text-sm";
  return (
    <div>
      <PageTitle title={ct("Library")} lead={ct("Every brief you can use, with how it performs across the network, plus reference videos to study.")} />
      <div className="mb-6 flex gap-2">
        <Button variant={tab === "briefs" ? "default" : "outline"} onClick={() => setTab("briefs")}>{ct("Briefs")}</Button>
        <Button variant={tab === "videos" ? "default" : "outline"} onClick={() => setTab("videos")}>{ct("Reference videos")}</Button>
      </div>
      {tab === "videos" ? <ReferenceLibrary /> : (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            <select aria-label={ct("Format")} className={sel} value={f.format} onChange={(e) => setF({ ...f, format: e.target.value })}><option value="">{ct("All formats")}</option>{formats.map((x) => <option key={x}>{x}</option>)}</select>
            <select aria-label={ct("Platform")} className={sel} value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value })}><option value="">{ct("All platforms")}</option><option value="tiktok">{ct("TikTok")}</option><option value="instagram">{ct("Instagram")}</option></select>
            <select aria-label={ct("Difficulty")} className={sel} value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })}><option value="">{ct("Any difficulty")}</option><option value="1">{ct("Easy")}</option><option value="2">{ct("Medium")}</option><option value="3">{ct("Hard")}</option></select>
            <select aria-label={ct("Tag")} className={sel} value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value })}><option value="">{ct("All tags")}</option>{tags.map((x) => <option key={x}>{x}</option>)}</select>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.peers} onChange={(e) => setF({ ...f, peers: e.target.checked })} /> {ct("Worked well for people like me")}</label>
          </div>
          {list.length === 0 ? <EmptyState title={ct("No brief matches")} /> : (
            <div className="grid gap-4 md:grid-cols-2">
              {list.map((b) => {
                const s = data?.stats[b.id];
                return (
                  <Link key={b.id} to="/creators/app/briefs/$briefId" params={{ briefId: b.id }}>
                    <PortalCard className="h-full p-4 transition hover:ring-2 hover:ring-portal-accent/30">
                      <p className="text-lg font-extrabold text-brand-navy">{ct(b.title)}</p>
                      {b.hook && <p className="mt-1 text-sm text-brand-navySoft">{b.hook}</p>}
                      <p className="mt-2 text-xs text-brand-navySoft">{[b.format, b.platform === "both" ? ct("TikTok + Instagram") : b.platform, ["", "Easy", "Medium", "Hard"][b.difficulty ?? 1], ...(b.tags ?? [])].filter(Boolean).join(" · ")}</p>
                      <p className="mt-3 text-sm font-bold text-brand-navy">{s?.posts ? `${n(s.avg)} avg views at 7 days · ${s.posts} post${s.posts > 1 ? "s" : ""}` : ct("Not posted yet")}</p>
                      {f.peers && s?.peerPosts ? <p className="text-xs text-brand-navySoft">{n(s.peerAvg)} avg for creators at your level</p> : null}
                    </PortalCard>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Earnings: running month + statements ---------- */
export function UgcEarningsPage() {
  const { payoutItems } = useCreator();
  const fn = useServerFn(myRunningMonth);
  const { data, isLoading } = useQuery({ queryKey: ["creator-month"], queryFn: () => fn() });
  const [open, setOpen] = useState<string | null>(null);
  if (isLoading || !data) return <p className="text-sm text-brand-navySoft">{ct("Loading…")}</p>;
  const b = data.breakdown;
  return (
    <div>
      <PageTitle title={ct("Earnings")} lead={L(`Live for ${b.period}. Our system reads views directly from your accounts.`, `En direct pour ${b.period}. Notre système lit les vues directement sur tes comptes.`)} />
      <EarningsTerms />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Posts found", `${b.postsCounted} / ${b.target}`],
          ["Views so far", n(data.viewsSoFar)],
          ["Fixed part (projected)", fmtMoney(b.fixedPart, b.currency)],
          ["Bonus so far", fmtMoney(b.bonusPart, b.currency)],
          ["Total projected", fmtMoney(b.total, b.currency)],
        ].map(([k, v]) => <PortalCard key={k} className="p-4"><p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">{k}</p><p className="mt-1 text-2xl font-extrabold text-brand-navy">{v}</p></PortalCard>)}
      </div>
      <p className="mt-3 text-sm font-semibold text-brand-navy">Paid on the {data.paydayDay}th of next month.</p>
      <Breakdown b={b} />

      <h2 className="mb-3 mt-10 text-xl font-extrabold text-brand-navy">{ct("Paiements par post")}</h2>
      <PostPayments />
      <h2 className="mb-3 mt-10 text-xl font-extrabold text-brand-navy">{ct("Statements")}</h2>
      {payoutItems.length === 0 ? <EmptyState title={ct("No statement yet")} /> : payoutItems.map((it: any) => (
        <PortalCard key={it.id} className="mb-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-extrabold text-brand-navy">{it.period ?? it.payout_batches?.period} · {fmtMoney(Number(it.amount ?? it.amount_usd), it.currency ?? "USD")} · {it.status}{it.hold_reason ? ` (${it.hold_reason})` : ""}</p>
            {it.breakdown && <Button size="sm" variant="outline" onClick={() => setOpen(open === it.id ? null : it.id)}>{open === it.id ? "Hide" : ct("See breakdown")}</Button>}
          </div>
          {open === it.id && it.breakdown && <Breakdown b={it.breakdown} />}
        </PortalCard>
      ))}
    </div>
  );
}

export function Breakdown({ b }: { b: any }) {
  return (
    <PortalCard className="mt-6 p-4">
      <p className="text-sm font-bold text-brand-navy">{ct("Fixed part")}</p>
      <p className="text-sm text-brand-navySoft">
        {b.prorate ? `${fmtMoney(b.fixedMonthly, b.currency)} × min(1, ${b.postsCounted} / ${b.target}) = ` : `${b.postsCounted} / ${b.target} posts → `}
        <b className="text-brand-navy">{fmtMoney(b.fixedPart, b.currency)}</b>
      </p>
      {b.effortLines?.length ? (
        <ul className="mt-1 text-sm text-brand-navySoft" data-testid="effort-lines">
          {b.effortLines.map((l: { effort: string; posts: number; rate: number; amount: number }) => <li key={l.effort}>{l.effort === "pov" ? "POV" : l.effort === "reaction" ? "Reaction" : ct("Face cam")}: {l.posts} × {fmtMoney(l.rate, b.currency)} = <b className="text-brand-navy">{fmtMoney(l.amount, b.currency)}</b></li>)}
          {b.talkingHead && b.talkingHead.min > 0 ? <li>Face cam minimum: {b.talkingHead.done}/{b.talkingHead.min}{b.talkingHead.done < b.talkingHead.min ? " — per-post part prorated" : ""}</li> : null}
        </ul>
      ) : null}
      <p className="mt-4 text-sm font-bold text-brand-navy">Views bonus — {fmtMoney(b.rpm, b.currency)} per 1,000 views at 7 days, capped at {fmtMoney(b.cap, b.currency)} per post</p>
      {b.posts.length === 0 ? <p className="text-sm text-brand-navySoft">{ct("No 7-day views counted yet this month.")}</p> : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-brand-navySoft"><th className="py-1 pr-3">{ct("Post")}</th><th className="pr-3">{ct("Platform")}</th><th className="pr-3 text-right">{ct("Views at 7 days")}</th><th className="pr-3 text-right">{ct("Bonus")}</th><th>{ct("Cap")}</th></tr></thead>
            <tbody>
              {b.posts.map((p: any) => (
                <tr key={p.id} className="border-t border-brand-line">
                  <td className="py-1 pr-3">{p.url ? <a className="text-portal-accent underline" href={p.url} target="_blank" rel="noopener noreferrer">{p.posted_at ? new Date(p.posted_at).toLocaleDateString(creatorLocale()) : "open"}</a> : "—"}</td>
                  <td className="pr-3">{p.platform}</td>
                  <td className="pr-3 text-right">{n(p.views_7d)}</td>
                  <td className="pr-3 text-right font-semibold">{fmtMoney(p.bonus, b.currency)}</td>
                  <td>{p.capped ? ct("Cap applied") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {b.adjustments?.length > 0 && (<><p className="mt-4 text-sm font-bold text-brand-navy">{ct("Adjustments")}</p>{b.adjustments.map((a: any, i: number) => <p key={i} className="text-sm text-brand-navySoft">{fmtMoney(a.amount, b.currency)} — {a.reason}</p>)}</>)}
      <p className="mt-4 border-t border-brand-line pt-3 text-base font-extrabold text-brand-navy">Total: {fmtMoney(b.total, b.currency)}</p>
    </PortalCard>
  );
}

function EarningsTerms() {
  const { data: tiers = [] } = useQuery({ queryKey: ["creator-tiers"], queryFn: async () => (await supabase.from("ugc_tiers").select("tier, per_post, cpm, cap_per_post, app_id")).data ?? [] });
  return <PortalCard className="mb-6 p-4"><MyTerms tiers={tiers} /></PortalCard>;
}

function PostPayments() {
  const { posts, payoutItems } = useCreator();
  const { data: method } = useQuery({ queryKey: ["my-payout-method"], queryFn: async () => (await supabase.from("creator_payout_profiles").select("method").maybeSingle()).data?.method ?? null });
  const rows = posts.filter((p: any) => p.status === "approved");
  if (!rows.length) return <EmptyState title={ct("Aucun post validé pour l’instant")} />;
  return (
    <PortalCard className="p-4" data-testid="post-payments">
      <p className="mb-3 text-sm text-brand-navySoft">{ct("Méthode de paiement :")} <b className="text-brand-navy">{method ? String(method).toUpperCase() : "à renseigner dans ton profil"}</b></p>
      <ul className="space-y-2 text-sm">{rows.map((p: any) => { const paidAt = (payoutItems as any[]).find((i) => i.id === p.payout_item_id)?.paid_at ?? null; const st = postStage(p, paidAt); return <li key={p.id} className="flex flex-wrap justify-between gap-2 border-t border-brand-line pt-2"><a href={p.url} target="_blank" rel="noopener noreferrer" className="text-portal-accent underline">{p.platform}</a><span className="font-bold text-brand-navy">{ct(st.label)}</span>{p.pay_formula ? <span className="w-full text-xs text-brand-navySoft">{p.pay_formula}</span> : null}</li>; })}</ul>
    </PortalCard>
  );
}
