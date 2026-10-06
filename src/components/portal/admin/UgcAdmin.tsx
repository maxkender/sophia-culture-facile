import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Banner, EmptyState, PageTitle, PortalCard } from "../ui";
import {
  addManualExternalPost, addPayoutAdjustment, adminUgcDashboard, bulkMessageCreators, generateUgcMonth, getEmailTemplates,
  integrationsStatus, previewUgcMonth, publishWeek, requestCreatorResign, runComplianceNow, runD7Now, saveCreatorUgcSettings,
  saveEmailTemplate, saveRateCardAndDefaults, updateExternalPost,
} from "@/lib/ugc-admin.functions";
import { currentPeriod, fmtMoney } from "@/lib/ugc-pay";
import { Breakdown } from "@/components/creators/app/UgcPages";
import { cn } from "@/lib/utils";

const n = (v: number) => new Intl.NumberFormat("en-GB").format(Math.round(v));
const d = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "—");
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
const sel = "h-10 rounded-md border border-input bg-card px-3 text-sm";

export function HandleLinks({ tiktok, instagram, big = false }: { tiktok?: string | null; instagram?: string | null; big?: boolean }) {
  const h = (x: string) => x.replace(/^@/, "");
  const cls = big ? "inline-flex items-center gap-2 rounded-xl bg-brand-navy px-5 py-3 text-base font-extrabold text-card" : "inline-flex items-center gap-1 text-xs font-bold text-portal-accent underline";
  return (
    <span className={cn("flex flex-wrap gap-2", big && "gap-3")}>
      {tiktok ? <a className={cls} href={`https://www.tiktok.com/@${h(tiktok)}`} target="_blank" rel="noopener noreferrer">TikTok {tiktok} <ExternalLink className="size-3.5" /></a> : null}
      {instagram ? <a className={cls} href={`https://www.instagram.com/${h(instagram)}/`} target="_blank" rel="noopener noreferrer">Instagram {instagram} <ExternalLink className="size-3.5" /></a> : null}
      {!tiktok && !instagram && <span className="text-xs text-brand-navySoft">No handle yet</span>}
    </span>
  );
}

/* ================= C. Compliance dashboard ================= */
type SortKey = "full_name" | "counted" | "views" | "projected" | "lastPost" | "daysSinceLogin";
export function UgcComplianceDashboard() {
  const fn = useServerFn(adminUgcDashboard);
  const msg = useServerFn(bulkMessageCreators);
  const { data, isLoading } = useQuery({ queryKey: ["ugc-dashboard"], queryFn: () => fn() });
  const [sort, setSort] = useState<{ k: SortKey; desc: boolean }>({ k: "counted", desc: false });
  const [f, setF] = useState({ behind: false, noPost: false, noLogin: false, viewsMissing: false });
  const [body, setBody] = useState("");
  const rows = useMemo(() => {
    const now = Date.now();
    const list = (data?.rows ?? []).filter((r: any) =>
      (!f.behind || r.behind) && (!f.noPost || !r.lastPost || now - new Date(r.lastPost).getTime() > 7 * 86400000) &&
      (!f.noLogin || r.daysSinceLogin == null || r.daysSinceLogin > 7) && (!f.viewsMissing || r.viewsMissing > 0));
    return [...list].sort((a: any, b: any) => {
      const x = a[sort.k] ?? -Infinity, y = b[sort.k] ?? -Infinity;
      return (x > y ? 1 : x < y ? -1 : 0) * (sort.desc ? -1 : 1);
    });
  }, [data, sort, f]);
  const th = (k: SortKey, label: string) => <th className="cursor-pointer whitespace-nowrap px-2 py-2" onClick={() => setSort({ k, desc: sort.k === k ? !sort.desc : true })}>{label}{sort.k === k ? (sort.desc ? " ↓" : " ↑") : ""}</th>;
  if (isLoading) return <p className="text-sm text-brand-navySoft">Loading…</p>;
  return (
    <div>
      <PageTitle title="Creators dashboard" lead={`Compliance for ${data?.period}: posts found online vs target, per platform. Red = behind pace.`} />
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        {([["behind", "Behind pace"], ["noPost", "No post in 7 days"], ["noLogin", "No login in 7 days"], ["viewsMissing", "Views not collected"]] as const).map(([k, l]) => (
          <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} />{l}</label>
        ))}
      </div>
      <PortalCard className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-portal-bg text-left text-xs uppercase text-brand-navySoft">
            <tr>{th("full_name", "Creator")}<th className="px-2">Handles</th>{th("counted", "Posts vs target")}{th("views", "Views")}{th("projected", "Projected")}{th("lastPost", "Last post")}{th("daysSinceLogin", "Days since login")}<th className="px-2">Sync</th></tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t border-brand-line align-top">
                <td className="px-2 py-2"><Link to="/auteurs/admin/creators/$creatorId" params={{ creatorId: r.id }} className="font-bold text-brand-navy hover:underline">{r.full_name}</Link><p className="text-xs text-brand-navySoft">{r.ugc_status} · {r.required_platforms}</p></td>
                <td className="px-2 py-2"><HandleLinks tiktok={r.tiktok_handle} instagram={r.instagram_handle} /></td>
                <td className="min-w-48 px-2 py-2">
                  <p className={cn("font-bold", r.behind ? "text-portal-red" : "text-brand-navy")}>{r.counted} / {r.target} <span className="text-xs font-normal text-brand-navySoft">(pace {r.pace.toFixed(1)})</span></p>
                  <div className="mt-1 h-2 rounded-full bg-brand-line"><div className={cn("h-2 rounded-full", r.behind ? "bg-portal-red" : "bg-portal-green")} style={{ width: `${Math.min(100, (r.counted / Math.max(1, r.target)) * 100)}%` }} /></div>
                  <p className="mt-1 text-xs text-brand-navySoft">TikTok {r.tiktok} · Instagram {r.instagram}</p>
                </td>
                <td className="px-2 py-2">{n(r.views)}{r.viewsMissing ? <p className="text-xs text-portal-amber">{r.viewsMissing} missing D+7</p> : null}</td>
                <td className="px-2 py-2 font-semibold">{fmtMoney(r.projected, data?.currency)}</td>
                <td className="px-2 py-2">{d(r.lastPost)}</td>
                <td className="px-2 py-2">{r.daysSinceLogin ?? "never"}</td>
                <td className="px-2 py-2">{r.sync_status === "failed" ? <span className="font-bold text-portal-red" title={r.sync_error ?? ""}>Failed</span> : r.sync_status === "ok" ? <span className="text-portal-green">OK {d(r.sync_checked_at)}</span> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="p-6"><EmptyState title="No creator matches" /></div>}
      </PortalCard>
      <PortalCard className="mt-4">
        <Label htmlFor="bulk">Message the {rows.length} creator{rows.length === 1 ? "" : "s"} shown</Label>
        <Textarea id="bulk" rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
        <Button className="mt-2" disabled={!body.trim() || !rows.length} onClick={async () => {
          try { const r = await msg({ data: { creatorIds: rows.map((x: any) => x.id), body } }); toast.success(`Sent to ${r.sent}.`); setBody(""); } catch (e) { toast.error(errMsg(e)); }
        }}>Send message</Button>
      </PortalCard>
    </div>
  );
}

/* ================= C/D/F. Creator detail block ================= */
export function UgcCreatorPanel({ creator }: { creator: any }) {
  const qc = useQueryClient();
  const save = useServerFn(saveCreatorUgcSettings);
  const resign = useServerFn(requestCreatorResign);
  const sync = useServerFn(runComplianceNow);
  const upd = useServerFn(updateExternalPost);
  const addAdj = useServerFn(addPayoutAdjustment);
  const addPost = useServerFn(addManualExternalPost);
  const [s, setS] = useState({
    posts_per_month: creator.posts_per_month ?? "", required_platforms: creator.required_platforms ?? "both", ugc_status: creator.ugc_status ?? "trial",
    fixed_monthly_override: creator.fixed_monthly_override ?? "", rpm_override: creator.rpm_override ?? "", cap_override: creator.cap_override ?? "",
    assigned_hm_id: creator.assigned_hm_id ?? "", admin_notes: creator.admin_notes ?? "",
  });
  const [adj, setAdj] = useState({ amount: "", reason: "" });
  const [mp, setMp] = useState({ platform: "tiktok", url: "", posted_at: new Date().toISOString().slice(0, 10) });
  const { data: hms = [] } = useQuery({ queryKey: ["admin-hms"], queryFn: async () => (await supabase.from("profiles").select("id, full_name").eq("role", "admin")).data ?? [] });
  const { data: posts = [] } = useQuery({ queryKey: ["ext-posts", creator.id], queryFn: async () => (await supabase.from("external_posts").select("*").eq("creator_id", creator.id).order("posted_at", { ascending: false }).limit(100)).data ?? [] });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["ext-posts", creator.id] }); qc.invalidateQueries({ queryKey: ["admin-creator", creator.id] }); };
  const num = (v: unknown) => (v === "" || v == null ? null : Number(v));
  return (
    <div className="mt-6 space-y-4">
      <PortalCard>
        <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Accounts — click to check videos</p>
        <div className="mt-3"><HandleLinks tiktok={creator.tiktok_handle} instagram={creator.instagram_handle} big /></div>
        {creator.sync_status === "failed" && <div className="mt-3"><Banner tone="error" title="Sync failed for this creator">{creator.sync_error} The creator can submit views manually with a screenshot; accept them below.</Banner></div>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={async () => { try { const r = await sync({ data: { creatorId: creator.id } }); toast.success(`Sync done: ${r.items} items.${r.errors.length ? " Some errors." : ""}`); refresh(); } catch (e) { toast.error(errMsg(e)); } }}>Run compliance sync now</Button>
          <Button size="sm" variant="outline" onClick={async () => { await resign({ data: { creatorId: creator.id } }); toast.success("Re-signature requested."); refresh(); }}>Request re-signature (v3)</Button>
          {creator.resign_required_at && <span className="self-center text-xs font-bold text-portal-amber">Re-signature pending since {d(creator.resign_required_at)}</span>}
          {creator.whatsapp_opt_in != null && <span className="self-center text-xs text-brand-navySoft">WhatsApp: {creator.whatsapp_opt_in ? "opted in" : "opted out"}</span>}
        </div>
      </PortalCard>

      <PortalCard>
        <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Settings</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div><Label>Posts per month (blank = default)</Label><Input type="number" value={s.posts_per_month} onChange={(e) => setS({ ...s, posts_per_month: e.target.value })} /></div>
          <div><Label>Required platforms</Label><select className={cn(sel, "w-full")} value={s.required_platforms} onChange={(e) => setS({ ...s, required_platforms: e.target.value })}><option value="both">Both</option><option value="tiktok">TikTok</option><option value="instagram">Instagram</option></select></div>
          <div><Label>Status</Label><select className={cn(sel, "w-full")} value={s.ugc_status} onChange={(e) => setS({ ...s, ugc_status: e.target.value })}>{["trial", "active", "paused", "ended"].map((x) => <option key={x}>{x}</option>)}</select></div>
          <div><Label>Fixed monthly € (blank = rate card)</Label><Input type="number" value={s.fixed_monthly_override} onChange={(e) => setS({ ...s, fixed_monthly_override: e.target.value })} /></div>
          <div><Label>€ per 1,000 views (blank = rate card)</Label><Input type="number" step="0.01" value={s.rpm_override} onChange={(e) => setS({ ...s, rpm_override: e.target.value })} /></div>
          <div><Label>Cap per video € (blank = rate card)</Label><Input type="number" value={s.cap_override} onChange={(e) => setS({ ...s, cap_override: e.target.value })} /></div>
          <div><Label>Hiring manager</Label><select className={cn(sel, "w-full")} value={s.assigned_hm_id} onChange={(e) => setS({ ...s, assigned_hm_id: e.target.value })}><option value="">—</option>{hms.map((h: any) => <option key={h.id} value={h.id}>{h.full_name}</option>)}</select></div>
          <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={2} value={s.admin_notes} onChange={(e) => setS({ ...s, admin_notes: e.target.value })} /></div>
        </div>
        <Button className="mt-3" onClick={async () => {
          try {
            await save({ data: { creatorId: creator.id, posts_per_month: num(s.posts_per_month), required_platforms: s.required_platforms as any, ugc_status: s.ugc_status as any, fixed_monthly_override: num(s.fixed_monthly_override), rpm_override: num(s.rpm_override), cap_override: num(s.cap_override), assigned_hm_id: s.assigned_hm_id || null, admin_notes: s.admin_notes || null } });
            toast.success("Settings saved."); refresh();
          } catch (e) { toast.error(errMsg(e)); }
        }}>Save settings</Button>
      </PortalCard>

      <PortalCard className="overflow-x-auto">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Posts found online ({posts.length})</p>
        {posts.length === 0 ? <p className="mt-2 text-sm text-brand-navySoft">Nothing found yet. Run the sync once handles are registered.</p> : (
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase text-brand-navySoft"><tr><th className="py-1">Posted</th><th>Platform</th><th>Views now</th><th>Views D+7</th><th>Logged</th><th>Manual</th><th></th></tr></thead>
            <tbody>
              {posts.map((p: any) => (
                <tr key={p.id} className={cn("border-t border-brand-line", p.excluded && "opacity-50")}>
                  <td className="py-1">{p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-portal-accent underline">{d(p.posted_at)}</a> : d(p.posted_at)}</td>
                  <td>{p.platform}</td>
                  <td>{p.views != null ? n(p.views) : "—"}</td>
                  <td>
                    <input aria-label="Views at 7 days" className="h-8 w-28 rounded border border-input px-2" defaultValue={p.views_7d ?? ""} onBlur={async (e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);
                      if (v === (p.views_7d ?? null)) return;
                      try { await upd({ data: { id: p.id, views_7d: v } }); toast.success("D+7 views saved."); refresh(); } catch (er) { toast.error(errMsg(er)); }
                    }} />
                  </td>
                  <td>{p.logged_post_id ? "✓" : <span className="text-xs text-portal-amber">Found by sync, not logged</span>}</td>
                  <td>{p.manual_views_7d != null ? (p.manual_accepted_at ? `${n(p.manual_views_7d)} ✓` : <Button size="sm" variant="outline" onClick={async () => { await upd({ data: { id: p.id, acceptManual: true } }); refresh(); }}>Accept {n(p.manual_views_7d)}</Button>) : "—"}</td>
                  <td><Button size="sm" variant="ghost" onClick={async () => { const reason = p.excluded ? null : prompt("Why exclude this post?"); if (!p.excluded && !reason) return; await upd({ data: { id: p.id, excluded: !p.excluded, exclude_reason: reason } }); refresh(); }}>{p.excluded ? "Include" : "Exclude"}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-brand-line pt-3">
          <div><Label>Add a post by hand</Label><select className={sel} value={mp.platform} onChange={(e) => setMp({ ...mp, platform: e.target.value })}><option value="tiktok">TikTok</option><option value="instagram">Instagram</option></select></div>
          <Input className="w-72" placeholder="https://…" value={mp.url} onChange={(e) => setMp({ ...mp, url: e.target.value })} />
          <Input type="date" className="w-40" value={mp.posted_at} onChange={(e) => setMp({ ...mp, posted_at: e.target.value })} />
          <Button size="sm" variant="outline" disabled={!mp.url} onClick={async () => { try { await addPost({ data: { creatorId: creator.id, platform: mp.platform as any, url: mp.url, posted_at: mp.posted_at } }); setMp({ ...mp, url: "" }); refresh(); } catch (e) { toast.error(errMsg(e)); } }}>Add</Button>
        </div>
      </PortalCard>

      <PortalCard>
        <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Manual adjustment ({currentPeriod()})</p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div><Label>Amount € (negative to deduct)</Label><Input type="number" className="w-36" value={adj.amount} onChange={(e) => setAdj({ ...adj, amount: e.target.value })} /></div>
          <div className="flex-1"><Label>Reason</Label><Input value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} /></div>
          <Button disabled={!adj.amount || adj.reason.trim().length < 2} onClick={async () => { try { await addAdj({ data: { creatorId: creator.id, period: currentPeriod(), amount: Number(adj.amount), reason: adj.reason } }); toast.success("Adjustment added."); setAdj({ amount: "", reason: "" }); } catch (e) { toast.error(errMsg(e)); } }}>Add adjustment</Button>
        </div>
      </PortalCard>
    </div>
  );
}

/* ================= I. Week planner ================= */
function nextMonday() {
  const t = new Date(); t.setUTCHours(0, 0, 0, 0);
  t.setUTCDate(t.getUTCDate() + ((8 - t.getUTCDay()) % 7 || 7));
  return t.toISOString().slice(0, 10);
}
const addDays = (iso: string, k: number) => { const x = new Date(`${iso}T00:00:00Z`); x.setUTCDate(x.getUTCDate() + k); return x.toISOString().slice(0, 10); };

export function WeekPlanner() {
  const qc = useQueryClient();
  const publish = useServerFn(publishWeek);
  const [week, setWeek] = useState(nextMonday());
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const { data: creators = [] } = useQuery({ queryKey: ["planner-creators"], queryFn: async () => (await supabase.from("creators").select("id, full_name").eq("track", "ugc").in("ugc_status", ["trial", "active"]).not("user_id", "is", null).order("full_name")).data ?? [] });
  const { data: briefs = [] } = useQuery({ queryKey: ["planner-briefs"], queryFn: async () => (await supabase.from("briefs").select("id, title, format, platform").neq("status", "retired").order("created_at", { ascending: false })).data ?? [] });
  const { data: cells = [] } = useQuery({ queryKey: ["planner-cells", week], queryFn: async () => (await supabase.from("brief_assignments").select("id, creator_id, brief_id, target_date, published_at, declined_at, decline_reason, replacement_brief_id").eq("week_start", week)).data ?? [] });
  const reload = () => qc.invalidateQueries({ queryKey: ["planner-cells", week] });
  const title = (id: string) => briefs.find((b: any) => b.id === id)?.title ?? "Brief";
  async function drop(briefId: string, creatorId: string, date: string) {
    const { error } = await supabase.from("brief_assignments").insert({ brief_id: briefId, creator_id: creatorId, target_date: date, week_start: week, published_at: null });
    if (error) toast.error(error.message); else reload();
  }
  async function assignAll(briefId: string, date: string) {
    const { error } = await supabase.from("brief_assignments").insert(creators.map((c: any) => ({ brief_id: briefId, creator_id: c.id, target_date: date, week_start: week, published_at: null })));
    if (error) toast.error(error.message); else { toast.success(`Assigned to ${creators.length} creators.`); reload(); }
  }
  const [allDay, setAllDay] = useState(days[0] ?? week);
  const unpublished = cells.filter((c: any) => !c.published_at).length;
  const deadline = addDays(week, -3);
  return (
    <div>
      <PageTitle title="Week planner" lead={`Drag briefs into cells. Publish the week of ${week} by Friday ${deadline}; each creator gets one digest.`} action={
        <div className="flex items-center gap-2">
          <Input type="date" value={week} onChange={(e) => setWeek(e.target.value)} className="w-44" />
          <Button disabled={!unpublished} onClick={async () => { try { const r = await publish({ data: { weekStart: week } }); toast.success(`Published ${r.assignments} briefs to ${r.creators} creators.`); reload(); } catch (e) { toast.error(errMsg(e)); } }}>Publish week ({unpublished})</Button>
        </div>
      } />
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <PortalCard className="max-h-[70vh] overflow-y-auto p-3">
          <p className="mb-2 text-xs font-bold uppercase text-brand-navySoft">Briefs — drag into a cell</p>
          <div className="mb-3 flex items-center gap-1 text-xs"><span>Assign to all on</span><select className="h-8 rounded border px-1" value={allDay} onChange={(e) => setAllDay(e.target.value)}>{days.map((x) => <option key={x} value={x}>{d(x)}</option>)}</select></div>
          {briefs.map((b: any) => (
            <div key={b.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/brief", b.id)} className="mb-2 cursor-grab rounded-lg border border-brand-line bg-card p-2 text-sm">
              <p className="font-bold text-brand-navy">{b.title}</p>
              <p className="text-xs text-brand-navySoft">{[b.format, b.platform].filter(Boolean).join(" · ")}</p>
              <button type="button" className="mt-1 text-xs font-semibold text-portal-accent underline" onClick={() => void assignAll(b.id, allDay)}>Assign to all</button>
            </div>
          ))}
        </PortalCard>
        <PortalCard className="overflow-x-auto p-0">
          <table className="w-full text-xs">
            <thead className="bg-portal-bg"><tr><th className="p-2 text-left">Creator</th>{days.map((x) => <th key={x} className="p-2">{d(x)}</th>)}</tr></thead>
            <tbody>
              {creators.map((c: any) => (
                <tr key={c.id} className="border-t border-brand-line">
                  <td className="p-2 font-bold text-brand-navy">{c.full_name}</td>
                  {days.map((day) => (
                    <td key={day} className="min-w-32 border-l border-brand-line p-1 align-top" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const id = e.dataTransfer.getData("text/brief"); if (id) void drop(id, c.id, day); }}>
                      {cells.filter((x: any) => x.creator_id === c.id && x.target_date === day).map((x: any) => (
                        <div key={x.id} className={cn("mb-1 rounded p-1", x.declined_at ? "bg-portal-amber/15" : x.published_at ? "bg-portal-green/10" : "bg-portal-accent/10")}>
                          <p className="font-semibold">{title(x.brief_id)}</p>
                          {x.declined_at && <p className="text-[11px]">Declined → {title(x.replacement_brief_id)}: {x.decline_reason}</p>}
                          {!x.published_at && <button type="button" className="text-[11px] underline" onClick={async () => { await supabase.from("brief_assignments").delete().eq("id", x.id); reload(); }}>remove</button>}
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </PortalCard>
      </div>
    </div>
  );
}

/* ================= I. Briefs grid + Scripts ================= */
const FORMATS = ["talking head", "green screen", "GRWM", "duet", "story time", "other"];
export function UgcBriefsGrid() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["ugc-briefs-grid"],
    queryFn: async () => {
      const [b, a, p, sw] = await Promise.all([
        supabase.from("briefs").select("*").order("created_at", { ascending: false }),
        supabase.from("brief_assignments").select("brief_id"),
        supabase.from("external_posts").select("id, brief_id, creator_id, url, views_7d, platform, creators(full_name)").not("brief_id", "is", null),
        supabase.from("brief_assignments").select("id, brief_id, replacement_brief_id, decline_reason, declined_at, creators(full_name)").not("declined_at", "is", null).order("declined_at", { ascending: false }).limit(50),
      ]);
      return { briefs: b.data ?? [], asg: a.data ?? [], posts: p.data ?? [], swaps: sw.data ?? [] };
    },
  });
  const [view, setView] = useState<"all" | "week" | "best" | "never" | "retired" | "scripts">("all");
  const [f, setF] = useState({ q: "", platform: "", format: "", type: "", tag: "", difficulty: "", status: "" });
  const [sel2, setSel2] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(null);
  const reload = () => qc.invalidateQueries({ queryKey: ["ugc-briefs-grid"] });
  const median = (xs: number[]) => { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2; };
  const perf = (id: string) => {
    const ps = (data?.posts ?? []).filter((p: any) => p.brief_id === id);
    const v = ps.filter((p: any) => p.views_7d != null).map((p: any) => Number(p.views_7d));
    const best = ps.filter((p: any) => p.views_7d != null).sort((a: any, b: any) => b.views_7d - a.views_7d)[0];
    return { assigned: (data?.asg ?? []).filter((x: any) => x.brief_id === id).length, posted: ps.length, avg: v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0, median: median(v), withViews: v.length, best: best?.url ?? null };
  };
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const rows = (data?.briefs ?? []).map((b: any) => ({ ...b, ...perf(b.id) })).filter((b: any) =>
    (!f.q || b.title.toLowerCase().includes(f.q.toLowerCase())) && (!f.platform || b.platform === f.platform) && (!f.format || b.format === f.format) && (!f.type || b.brief_type === f.type) &&
    (!f.tag || (b.tags ?? []).includes(f.tag)) && (!f.difficulty || String(b.difficulty) === f.difficulty) && (!f.status || b.status === f.status) &&
    (view === "all" || view === "scripts" || (view === "week" && b.created_at >= weekAgo) || (view === "best" && b.withViews > 0) || (view === "never" && b.assigned === 0) || (view === "retired" && b.status === "retired")))
    .sort((a: any, b: any) => (view === "best" || view === "scripts" ? b.median - a.median : 0));
  const tags = [...new Set((data?.briefs ?? []).flatMap((b: any) => b.tags ?? []))] as string[];
  const blank = { title: "", hook: "", angle: "", script: "", body: "", brief_type: "precise", platform: "both", format: "talking head", duration_target: "", must_mention: "", tags: "", difficulty: 1, status: "draft", audience: "all", app_id: "00000000-0000-4000-8000-000000000001" };
  async function saveBrief() {
    const payload = { ...form, tags: String(form.tags).split(",").map((t: string) => t.trim()).filter(Boolean), difficulty: Number(form.difficulty), body: form.body || form.script || "" };
    delete payload.assigned; delete payload.posted; delete payload.avg; delete payload.median; delete payload.withViews; delete payload.best;
    const q = payload.id ? supabase.from("briefs").update(payload).eq("id", payload.id) : supabase.from("briefs").insert(payload);
    const { error } = await q;
    if (error) toast.error(error.message); else { toast.success("Brief saved."); setForm(null); reload(); }
  }
  const open = rows.find((r: any) => r.id === openId) ?? (data?.briefs ?? []).find((b: any) => b.id === openId);
  return (
    <div>
      <PageTitle title="UGC briefs" lead="Every brief with its performance at 7 days. Medians beat averages: a single viral post does not mislead." action={<Button onClick={() => setForm({ ...blank })}>New brief</Button>} />
      <div className="mb-3 flex flex-wrap gap-2">
        {([["all", "All"], ["week", "This week"], ["best", "Best performers"], ["never", "Never used"], ["retired", "Retired"], ["scripts", "Scripts ranking"]] as const).map(([k, l]) => <Button key={k} size="sm" variant={view === k ? "default" : "outline"} onClick={() => setView(k)}>{l}</Button>)}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Input placeholder="Search title" className="w-48" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        <select className={sel} value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value })}><option value="">Platform</option><option value="tiktok">TikTok</option><option value="instagram">Instagram</option><option value="both">Both</option></select>
        <select className={sel} value={f.format} onChange={(e) => setF({ ...f, format: e.target.value })}><option value="">Format</option>{FORMATS.map((x) => <option key={x}>{x}</option>)}</select>
        <select className={sel} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="">Type</option><option value="precise">Precise</option><option value="freestyle">Freestyle</option></select>
        <select className={sel} value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value })}><option value="">Tag</option>{tags.map((x) => <option key={x}>{x}</option>)}</select>
        <select className={sel} value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })}><option value="">Difficulty</option>{[1, 2, 3].map((x) => <option key={x}>{x}</option>)}</select>
        <select className={sel} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">Status</option><option value="draft">Draft</option><option value="published">Active</option><option value="retired">Retired</option></select>
      </div>
      {sel2.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={async () => { await supabase.from("briefs").update({ status: "retired" }).in("id", sel2); setSel2([]); reload(); }}>Retire {sel2.length}</Button>
          <Button size="sm" variant="outline" onClick={async () => { const t = prompt("Tag to add"); if (!t) return; for (const id of sel2) { const b = data?.briefs.find((x: any) => x.id === id); await supabase.from("briefs").update({ tags: [...new Set([...(b?.tags ?? []), t])] }).eq("id", id); } setSel2([]); reload(); }}>Tag {sel2.length}</Button>
          <Button size="sm" variant="outline" onClick={async () => { for (const id of sel2) { const b: any = { ...data?.briefs.find((x: any) => x.id === id) }; delete b.id; delete b.created_at; b.title = `${b.title} (copy)`; b.status = "draft"; await supabase.from("briefs").insert(b); } setSel2([]); reload(); }}>Duplicate {sel2.length}</Button>
        </div>
      )}
      <PortalCard className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-portal-bg text-left text-xs uppercase text-brand-navySoft"><tr><th className="p-2"></th><th>Title</th><th>Type</th><th>Platform</th><th>Format</th><th>Diff.</th><th>Tags</th><th>Status</th><th>Assigned</th><th>Posted</th><th>Avg D+7</th><th>Median D+7</th><th>Posts with views</th><th>Best</th></tr></thead>
          <tbody>
            {rows.map((b: any) => (
              <tr key={b.id} className="cursor-pointer border-t border-brand-line hover:bg-portal-bg" onClick={() => setOpenId(b.id)}>
                <td className="p-2" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={sel2.includes(b.id)} onChange={(e) => setSel2(e.target.checked ? [...sel2, b.id] : sel2.filter((x) => x !== b.id))} /></td>
                <td className="font-bold text-brand-navy">{b.title}</td><td>{b.brief_type}</td><td>{b.platform}</td><td>{b.format ?? "—"}</td><td>{b.difficulty}</td><td className="text-xs">{(b.tags ?? []).join(", ")}</td>
                <td>{b.status === "published" ? "active" : b.status}</td><td>{b.assigned}</td><td>{b.posted}</td><td>{b.withViews ? n(b.avg) : "—"}</td><td className="font-semibold">{b.withViews ? n(b.median) : "—"}</td><td>{b.withViews}</td>
                <td onClick={(e) => e.stopPropagation()}>{b.best ? <a href={b.best} target="_blank" rel="noopener noreferrer" className="text-portal-accent underline">open</a> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PortalCard>

      {(data?.swaps?.length ?? 0) > 0 && (
        <PortalCard className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Recent swaps</p>
          {(data?.swaps ?? []).map((s: any) => <p key={s.id} className="mt-1 text-sm">{s.creators?.full_name}: declined <b>{data?.briefs.find((b: any) => b.id === s.brief_id)?.title}</b>, picked <b>{data?.briefs.find((b: any) => b.id === s.replacement_brief_id)?.title}</b> — “{s.decline_reason}”</p>)}
        </PortalCard>
      )}

      {open && !form && (
        <PortalCard className="mt-6">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-extrabold text-brand-navy">{open.title}</h2>
            <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setForm({ ...open, tags: (open.tags ?? []).join(", ") })}>Edit</Button><Button size="sm" variant="ghost" onClick={() => setOpenId(null)}>Close</Button></div>
          </div>
          {open.hook && <p className="mt-2 font-semibold">Hook: {open.hook}</p>}
          {open.angle && <p className="text-sm text-brand-navySoft">Angle: {open.angle}</p>}
          <p className="mt-3 whitespace-pre-wrap text-sm">{open.script || open.body}</p>
          {open.must_mention && <p className="mt-2 text-sm"><b>Must mention:</b> {open.must_mention}</p>}
          <p className="mt-6 text-xs font-bold uppercase text-brand-navySoft">Posts made from it</p>
          {(data?.posts ?? []).filter((p: any) => p.brief_id === open.id).map((p: any) => <p key={p.id} className="text-sm">{p.creators?.full_name} · {p.platform} · {p.views_7d != null ? `${n(p.views_7d)} views D+7` : "D+7 pending"} · <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-portal-accent underline">open</a></p>)}
          <p className="mt-4 text-xs font-bold uppercase text-brand-navySoft">Per creator</p>
          {Object.entries((data?.posts ?? []).filter((p: any) => p.brief_id === open.id && p.views_7d != null).reduce((m: Record<string, number[]>, p: any) => ({ ...m, [p.creators?.full_name ?? "?"]: [...(m[p.creators?.full_name ?? "?"] ?? []), Number(p.views_7d)] }), {})).map(([k, v]) => <p key={k} className="text-sm">{k}: median {n(median(v as number[]))} over {(v as number[]).length} post(s)</p>)}
        </PortalCard>
      )}

      {form && (
        <PortalCard className="mt-6 space-y-3">
          <h2 className="text-xl font-extrabold text-brand-navy">{form.id ? "Edit brief" : "New brief"}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Hook (one line)</Label><Input value={form.hook ?? ""} onChange={(e) => setForm({ ...form, hook: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Angle</Label><Input value={form.angle ?? ""} onChange={(e) => setForm({ ...form, angle: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Script (full text or beats)</Label><Textarea rows={6} value={form.script ?? ""} onChange={(e) => setForm({ ...form, script: e.target.value })} /></div>
            <div><Label>Type</Label><select className={cn(sel, "w-full")} value={form.brief_type} onChange={(e) => setForm({ ...form, brief_type: e.target.value })}><option value="precise">Precise</option><option value="freestyle">Freestyle</option></select></div>
            <div><Label>Platform</Label><select className={cn(sel, "w-full")} value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}><option value="both">Both</option><option value="tiktok">TikTok</option><option value="instagram">Instagram</option></select></div>
            <div><Label>Format</Label><select className={cn(sel, "w-full")} value={form.format ?? ""} onChange={(e) => setForm({ ...form, format: e.target.value })}>{FORMATS.map((x) => <option key={x}>{x}</option>)}</select></div>
            <div><Label>Duration target</Label><Input placeholder="30–45 s" value={form.duration_target ?? ""} onChange={(e) => setForm({ ...form, duration_target: e.target.value })} /></div>
            <div><Label>Must mention</Label><Input value={form.must_mention ?? ""} onChange={(e) => setForm({ ...form, must_mention: e.target.value })} /></div>
            <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
            <div><Label>Difficulty</Label><select className={cn(sel, "w-full")} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>{[1, 2, 3].map((x) => <option key={x}>{x}</option>)}</select></div>
            <div><Label>Status</Label><select className={cn(sel, "w-full")} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="published">Active</option><option value="retired">Retired</option></select></div>
            <div><Label>Visible in library</Label><select className={cn(sel, "w-full")} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}><option value="all">Yes, to all creators</option><option value="assigned">Only to assigned creators</option></select></div>
          </div>
          <div className="flex gap-2"><Button disabled={!form.title?.trim()} onClick={() => void saveBrief()}>Save</Button><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button></div>
        </PortalCard>
      )}
    </div>
  );
}

/* ================= F/B/G. Integrations setup + settings ================= */
export function IntegrationsSetup() {
  const qc = useQueryClient();
  const fn = useServerFn(integrationsStatus);
  const runC = useServerFn(runComplianceNow);
  const runD = useServerFn(runD7Now);
  const saveCard = useServerFn(saveRateCardAndDefaults);
  const tplFn = useServerFn(getEmailTemplates);
  const saveTpl = useServerFn(saveEmailTemplate);
  const { data } = useQuery({ queryKey: ["integrations"], queryFn: () => fn() });
  const { data: tpl } = useQuery({ queryKey: ["email-templates"], queryFn: () => tplFn() });
  const { data: card } = useQuery({ queryKey: ["rate-card"], queryFn: async () => (await supabase.from("ugc_rate_cards").select("*").order("effective_from", { ascending: false }).limit(1).maybeSingle()).data });
  const [busy, setBusy] = useState("");
  const run = async (k: string, f: () => Promise<any>) => { setBusy(k); try { const r = await f(); toast.success(`Done: ${r.items ?? 0} items, $${Number(r.cost ?? 0).toFixed(3)}`); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(""); qc.invalidateQueries({ queryKey: ["integrations"] }); } };
  const ok = (b?: boolean) => <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", b ? "bg-portal-green/12 text-portal-green" : "bg-portal-amber/15 text-portal-amber")}>{b ? "Set" : "Missing"}</span>;
  const steps = [
    { k: "STRIPE_SECRET_KEY", t: "Stripe — creator payouts", d: "Already used for Stripe Connect onboarding and transfers." },
    { k: "BREVO_API_KEY", t: "Brevo — welcome and decline emails", d: "Brevo → SMTP & API → API keys → Generate. Verify the sender maximilien@vikstudios.com (Senders & IP). Add the key as BREVO_API_KEY in project secrets. Until then, emails go through the backup sender." },
    { k: "APIFY_TOKEN", t: "Apify — weekly compliance and D+7 views", d: "Apify console → Settings → API & Integrations → Personal API token. Add it as APIFY_TOKEN. Scrapers used: clockworks/tiktok-profile-scraper and apify/instagram-profile-scraper (pay per result)." },
    { k: "LOVABLE_CRON_SECRET", t: "Schedules", d: "Compliance every Monday 06:00 Paris, D+7 every day 07:00, monthly pay on the 1st at 08:00, planner reminder Thursday." },
  ] as const;
  const [rc, setRc] = useState<any>(null);
  const r = rc ?? (card && data ? { fixed_monthly: card.fixed_monthly, rpm_eur_per_1000: card.rpm_eur_per_1000, cap_per_video: card.cap_per_video, prorate_fixed_by_quota: card.prorate_fixed_by_quota, effective_from: new Date().toISOString().slice(0, 10), default_posts_per_month: data.settings?.default_posts_per_month ?? 20, payday_day: data.settings?.payday_day ?? 5 } : null);
  const [t, setT] = useState<Record<string, any>>({});
  const tv = (k: "welcome" | "decline") => t[k] ?? (tpl as any)?.[k];
  return (
    <div>
      <PageTitle title="Integrations setup" lead="Keys, schedules, Apify costs, rate card, defaults and email templates for the UGC pipeline." />
      <div className="space-y-3">
        {steps.map((s, i) => (
          <PortalCard key={s.k} className="flex gap-4 p-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-navy text-sm font-bold text-card">{i + 1}</span>
            <div className="flex-1"><p className="font-extrabold text-brand-navy">{s.t} <code className="ml-2 text-xs">{s.k}</code> {ok((data?.secrets as any)?.[s.k])}</p><p className="mt-1 text-sm text-brand-navySoft">{s.d}</p></div>
          </PortalCard>
        ))}
      </div>

      <PortalCard className="mt-6">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Estimated Apify cost per month</p>
        {data && <>
          <p className="mt-2 text-3xl font-extrabold text-brand-navy">${data.estimate.totalUsd.toFixed(2)}</p>
          <p className="text-sm text-brand-navySoft">{data.estimate.profiles} profiles × 4 weekly calls + {data.estimate.postsMonth} posts × 1 D+7 call, at ~{data.estimate.perCall} results per call and ${data.estimate.price} per result (weekly ${data.estimate.weeklyUsd.toFixed(2)}, D+7 ${data.estimate.d7Usd.toFixed(2)}).</p>
        </>}
        <div className="mt-4 flex gap-2">
          <Button disabled={!!busy} onClick={() => run("c", () => runC({ data: {} }))}>{busy === "c" ? "Running…" : "Run compliance now"}</Button>
          <Button disabled={!!busy} variant="outline" onClick={() => run("d", () => runD())}>{busy === "d" ? "Running…" : "Run D+7 now"}</Button>
        </div>
        <table className="mt-4 w-full text-sm">
          <thead className="text-left text-xs uppercase text-brand-navySoft"><tr><th>When</th><th>Job</th><th>Status</th><th>Items</th><th>Cost</th><th>Errors</th></tr></thead>
          <tbody>{(data?.runs ?? []).map((x: any) => <tr key={x.id} className="border-t border-brand-line"><td className="py-1">{new Date(x.started_at).toLocaleString()}</td><td>{x.job}</td><td>{x.status}</td><td>{x.items}</td><td>${Number(x.cost_usd).toFixed(3)}</td><td className="max-w-xs truncate text-xs" title={x.error ?? ""}>{x.error ?? "—"}</td></tr>)}</tbody>
        </table>
        {(data?.runs ?? []).length === 0 && <p className="mt-2 text-sm text-brand-navySoft">No run yet.</p>}
      </PortalCard>

      {r && (
        <PortalCard className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Rate card & defaults (EUR)</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <div><Label>Fixed monthly</Label><Input type="number" value={r.fixed_monthly} onChange={(e) => setRc({ ...r, fixed_monthly: e.target.value })} /></div>
            <div><Label>€ per 1,000 views</Label><Input type="number" step="0.01" value={r.rpm_eur_per_1000} onChange={(e) => setRc({ ...r, rpm_eur_per_1000: e.target.value })} /></div>
            <div><Label>Cap per video</Label><Input type="number" value={r.cap_per_video} onChange={(e) => setRc({ ...r, cap_per_video: e.target.value })} /></div>
            <div><Label>Effective from</Label><Input type="date" value={r.effective_from} onChange={(e) => setRc({ ...r, effective_from: e.target.value })} /></div>
            <div><Label>Default posts / month</Label><Input type="number" value={r.default_posts_per_month} onChange={(e) => setRc({ ...r, default_posts_per_month: e.target.value })} /></div>
            <div><Label>Payday (day of month)</Label><Input type="number" value={r.payday_day} onChange={(e) => setRc({ ...r, payday_day: e.target.value })} /></div>
            <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" checked={!!r.prorate_fixed_by_quota} onChange={(e) => setRc({ ...r, prorate_fixed_by_quota: e.target.checked })} /> Prorate fixed by quota</label>
          </div>
          <Button className="mt-3" onClick={async () => { try { await saveCard({ data: { fixed_monthly: Number(r.fixed_monthly), rpm_eur_per_1000: Number(r.rpm_eur_per_1000), cap_per_video: Number(r.cap_per_video), prorate_fixed_by_quota: !!r.prorate_fixed_by_quota, effective_from: r.effective_from, default_posts_per_month: Number(r.default_posts_per_month), payday_day: Number(r.payday_day) } }); toast.success("Saved."); setRc(null); qc.invalidateQueries(); } catch (e) { toast.error(errMsg(e)); } }}>Save rate card & defaults</Button>
        </PortalCard>
      )}

      {tpl && (["welcome", "decline"] as const).map((k) => (
        <PortalCard key={k} className="mt-6 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Email: {k === "welcome" ? "welcome (on Accept)" : "decline (on Reject with notify)"}</p>
          <p className="text-xs text-brand-navySoft">Merge fields: {"{first_name}"}, {"{full_name}"}. The invite link and Slack link are added automatically.</p>
          <Label>Subject</Label><Input value={tv(k).subject} onChange={(e) => setT({ ...t, [k]: { ...tv(k), subject: e.target.value } })} />
          <Label>Opening</Label><Textarea rows={3} value={tv(k).intro} onChange={(e) => setT({ ...t, [k]: { ...tv(k), intro: e.target.value } })} />
          <Label>Body</Label><Textarea rows={6} value={tv(k).instructions} onChange={(e) => setT({ ...t, [k]: { ...tv(k), instructions: e.target.value } })} />
          {k === "welcome" && <><Label>Button label</Label><Input value={tv(k).button_label} onChange={(e) => setT({ ...t, [k]: { ...tv(k), button_label: e.target.value } })} /></>}
          <Button onClick={async () => { try { await saveTpl({ data: { key: k === "welcome" ? "ugc-welcome" : "ugc-decline", subject: tv(k).subject, intro: tv(k).intro, instructions: tv(k).instructions ?? "", button_label: tv(k).button_label ?? "" } }); toast.success("Template saved."); } catch (e) { toast.error(errMsg(e)); } }}>Save template</Button>
        </PortalCard>
      ))}
    </div>
  );
}

/* ================= G. Monthly preview / generate ================= */
export function UgcMonthPanel() {
  const qc = useQueryClient();
  const prev = useServerFn(previewUgcMonth);
  const gen = useServerFn(generateUgcMonth);
  const [period, setPeriod] = useState(currentPeriod());
  const [rows, setRows] = useState<any[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <PortalCard className="mb-6">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">UGC monthly pay (EUR)</p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-44" />
        <Button variant="outline" onClick={async () => { try { setRows(await prev({ data: { period } })); } catch (e) { toast.error(errMsg(e)); } }}>Preview month</Button>
        <Button onClick={async () => { try { const r = await gen({ data: { period } }); toast.success(`${r.items} payout line(s) created as draft.`); qc.invalidateQueries({ queryKey: ["portal", "admin", "payouts"] }); } catch (e) { toast.error(errMsg(e)); } }}>Create payout lines</Button>
      </div>
      {rows && (
        <div className="mt-4 divide-y divide-brand-line text-sm">
          {rows.length === 0 && <p className="text-brand-navySoft">No creator.</p>}
          {rows.map((r) => (
            <div key={r.creatorId} className="py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-brand-navy">{r.name}</span>
                <span>{r.breakdown.postsCounted}/{r.breakdown.target} posts · fixed {fmtMoney(r.breakdown.fixedPart)} · bonus {fmtMoney(r.breakdown.bonusPart)} · <b>{fmtMoney(r.breakdown.total)}</b> <button type="button" className="ml-2 text-portal-accent underline" onClick={() => setOpen(open === r.creatorId ? null : r.creatorId)}>details</button></span>
              </div>
              {open === r.creatorId && <Breakdown b={r.breakdown} />}
            </div>
          ))}
        </div>
      )}
    </PortalCard>
  );
}
