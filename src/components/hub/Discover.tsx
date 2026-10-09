import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ExternalLink, Tag, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAdminApp } from "@/lib/apps";
import { compact, eur, flag } from "./hub-data";

type Kind = "creator" | "applicant" | "prospect";
type Person = {
  key: string; id: string; kind: Kind; name: string; country: string | null; age: number | null; gender: string | null; city: string | null;
  school: string | null; email: string | null; tiktok: string | null; instagram: string | null; followers: number | null; niche: string | null;
  source: string | null; status: string; lastSeen: string | null; views: number; earned: number; posts: number; streak: number; notes: string | null;
  postDays: string[]; platforms: string[];
};
const TABS: [string, string][] = [["all", "All"], ["creator", "Creators"], ["applicant", "Applicants"], ["prospect", "Prospects"], ["agencies", "Agencies"], ["clipping", "Clipping"]];
const handleOf = (u: string | null | undefined) => (u ? u.replace(/^https?:\/\/(www\.)?(tiktok|instagram)\.com\/@?/i, "").replace(/[/?].*$/, "").replace(/^@/, "") || null : null);

function streakOf(days: string[]) {
  const set = new Set(days);
  let n = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
    if (set.has(d)) n++; else if (i > 0) break;
  }
  return n;
}
function tierOf(p: Person) { if (p.kind !== "creator") return null; if (p.posts >= 60) return "Platinum"; if (p.posts >= 20) return "Gold"; return "Silver"; }
function awardsOf(p: Person, maxViews: number) {
  return [
    p.posts >= 1 && "First Step", p.streak >= 7 && "7-day streak", p.streak >= 30 && "30-day streak",
    maxViews >= 10_000 && "10K views post", maxViews >= 100_000 && "100K views post",
  ].filter(Boolean) as string[];
}

function usePeople() {
  const { appId } = useAdminApp();
  return useQuery({
    queryKey: ["hub", "discover", appId],
    queryFn: async () => {
      const [c, a, p, posts, pay] = await Promise.all([
        supabase.from("creators").select("id, full_name, email, country, status, ugc_status, tiktok_handle, instagram_handle, last_seen_at, admin_notes, application_id"),
        supabase.from("creator_applications").select("id, full_name, email, country, age, occupation, tiktok_url, instagram_url, status, source, created_creator_id, app_id"),
        supabase.from("creator_prospects").select("*"),
        supabase.from("creator_posts").select("creator_id, views, posted_on, created_at, status, platform"),
        supabase.from("payout_items").select("creator_id, amount, amount_usd, status"),
      ]);
      const byCreator = new Map<string, { views: number; posts: number; days: string[]; max: number; platforms: Set<string> }>();
      for (const r of posts.data ?? []) {
        const s = byCreator.get(r.creator_id) ?? { views: 0, posts: 0, days: [], max: 0, platforms: new Set<string>() };
        if (r.status === "approved") { s.posts++; s.views += Number(r.views ?? 0); s.max = Math.max(s.max, Number(r.views ?? 0)); }
        s.days.push((r.posted_on ?? r.created_at).slice(0, 10)); if (r.platform) s.platforms.add(r.platform);
        byCreator.set(r.creator_id, s);
      }
      const earned = new Map<string, number>();
      for (const r of pay.data ?? []) if (r.status === "paid") earned.set(r.creator_id, (earned.get(r.creator_id) ?? 0) + Number(r.amount ?? r.amount_usd ?? 0));
      const out: Person[] = [];
      const maxViews = new Map<string, number>();
      for (const r of c.data ?? []) {
        const s = byCreator.get(r.id);
        maxViews.set(`c-${r.id}`, s?.max ?? 0);
        out.push({ key: `c-${r.id}`, id: r.id, kind: "creator", name: r.full_name, country: r.country, age: null, gender: null, city: null, school: null, email: r.email, tiktok: r.tiktok_handle, instagram: r.instagram_handle, followers: null, niche: null, source: null,
          status: r.ugc_status ?? r.status ?? "active", lastSeen: r.last_seen_at, views: s?.views ?? 0, earned: earned.get(r.id) ?? 0, posts: s?.posts ?? 0, streak: streakOf(s?.days ?? []), notes: r.admin_notes, postDays: s?.days ?? [], platforms: [...(s?.platforms ?? [])] });
      }
      for (const r of a.data ?? []) {
        if (r.created_creator_id || (appId && r.app_id !== appId)) continue;
        out.push({ key: `a-${r.id}`, id: r.id, kind: "applicant", name: r.full_name, country: r.country, age: r.age, gender: null, city: null, school: r.occupation, email: r.email, tiktok: handleOf(r.tiktok_url), instagram: handleOf(r.instagram_url), followers: null, niche: null, source: r.source,
          status: "applied", lastSeen: null, views: 0, earned: 0, posts: 0, streak: 0, notes: null, postDays: [], platforms: [r.tiktok_url && "tiktok", r.instagram_url && "instagram"].filter(Boolean) as string[] });
      }
      for (const r of p.data ?? []) {
        if (appId && r.target_app_id && r.target_app_id !== appId) continue;
        out.push({ key: `p-${r.id}`, id: r.id, kind: "prospect", name: r.name, country: r.country, age: r.age, gender: r.gender, city: r.city, school: r.school_or_job, email: r.email, tiktok: r.tiktok_handle, instagram: r.instagram_handle, followers: r.followers, niche: r.niche, source: r.source,
          status: r.status === "invited" ? "invited" : "prospect", lastSeen: r.last_seen_at, views: 0, earned: 0, posts: 0, streak: 0, notes: r.notes, postDays: [], platforms: [r.platform, r.tiktok_handle && "tiktok", r.instagram_handle && "instagram"].filter(Boolean) as string[] });
      }
      return { people: out, maxViews };
    },
  });
}

function Avatar({ p, big }: { p: Person; big?: boolean }) {
  const initials = p.name.split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join("");
  return <div className={cn("flex items-center justify-center bg-gradient-to-br from-brand-navy to-portal-accent font-extrabold text-card", big ? "size-28 rounded-3xl text-3xl" : "aspect-square w-full rounded-xl text-3xl")}>{initials}</div>;
}
const online = (p: Person) => Boolean(p.lastSeen && Date.now() - new Date(p.lastSeen).getTime() < 10 * 60_000);
function StatStrip({ p }: { p: Person }) {
  return (
    <div className="grid grid-cols-4 gap-1 rounded-xl bg-portal-bg p-2 text-center">
      {[["Views", compact(p.views)], ["Earned", eur(p.earned)], ["Posts", String(p.posts)], ["Streak", `${p.streak}d`]].map(([k, v]) => <div key={k}><p className="text-sm font-extrabold text-brand-navy">{v}</p><p className="text-[10px] text-brand-navySoft">{k}</p></div>)}
    </div>
  );
}

function InviteButton({ p, className }: { p: Person; className?: string }) {
  const [open, setOpen] = useState(false);
  const { appId } = useAdminApp();
  const { data: jobs = [] } = useQuery({ queryKey: ["hub", "job-options", appId], enabled: open, queryFn: async () => { let q = supabase.from("jobs").select("id, title").eq("status", "active"); if (appId) q = q.eq("app_id", appId); return (await q).data ?? []; } });
  const qc = useQueryClient();
  async function invite(jobId: string) {
    const row = { job_id: jobId, creator_id: p.kind === "creator" ? p.id : null, prospect_id: p.kind === "prospect" ? p.id : null, email: p.email };
    const { data, error } = await supabase.from("job_invites").insert(row).select("token").single();
    if (error) { toast.error("The invite could not be created. Please try again."); return; }
    if (p.kind === "creator") await supabase.from("creator_notifications").insert({ creator_id: p.id, body: "You were invited to a new job. Open Jobs to see it." });
    if (p.kind === "prospect") await supabase.from("creator_prospects").update({ status: "invited" }).eq("id", p.id);
    const link = `${window.location.origin}/jobs/invite/${data.token}`;
    void navigator.clipboard?.writeText(link);
    toast.success("Invite created — link copied", { description: link });
    setOpen(false); void qc.invalidateQueries({ queryKey: ["hub", "discover"] });
  }
  return (
    <div className={cn("relative", className)}>
      <Button size="sm" className="w-full bg-brand-navy" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>Invite</Button>
      {open ? (
        <div className="absolute bottom-full left-0 z-20 mb-1 w-56 rounded-xl border bg-card p-1 shadow-lg" onClick={(e) => e.stopPropagation()}>
          <p className="px-2 py-1 text-xs font-bold text-brand-navySoft">Choose a job</p>
          {jobs.length === 0 ? <p className="px-2 py-1 text-xs">No active job. <Link to="/hub/campaigns" search={{ tab: "jobs" }} className="underline">Create one</Link></p> : jobs.map((j) => <button key={j.id} type="button" onClick={() => void invite(j.id)} className="block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-portal-bg">{j.title}</button>)}
        </div>
      ) : null}
    </div>
  );
}

function ImportCsv() {
  const qc = useQueryClient();
  const { appId } = useAdminApp();
  async function onFile(f: File) {
    const text = await f.text();
    const [head = "", ...lines] = text.split(/\r?\n/).filter(Boolean);
    const cols = head.split(/[,;]/).map((c) => c.trim().toLowerCase());
    const idx = (n: string) => cols.indexOf(n);
    if (idx("handle") < 0) { toast.error("The file needs a 'handle' column (also: followers, niche, face_cam, email, country)."); return; }
    const { data: existing } = await supabase.from("creator_prospects").select("tiktok_handle, handle");
    const seen = new Set((existing ?? []).flatMap((r) => [r.tiktok_handle, r.handle]).filter(Boolean).map((h) => String(h).toLowerCase()));
    const rows = lines.map((l) => l.split(/[,;]/).map((v) => v.trim())).map((v) => {
      const h = v[idx("handle")]?.replace(/^@/, "");
      return h ? { name: h, handle: h, tiktok_handle: h, platform: "tiktok", followers: Number(v[idx("followers")]) || null, niche: v[idx("niche")] || null, face_cam: idx("face_cam") >= 0 ? /^(1|true|yes|oui)$/i.test(v[idx("face_cam")] ?? "") : null, email: v[idx("email")] || null, country: v[idx("country")] || null, source: "csv_import", status: "new", target_app_id: appId } : null;
    }).filter((r): r is NonNullable<typeof r> => Boolean(r) && !seen.has(r!.handle.toLowerCase()));
    if (!rows.length) { toast("Nothing new to import — every handle is already in Discover."); return; }
    const { error } = await supabase.from("creator_prospects").insert(rows as never);
    if (error) toast.error("The import could not be saved. Please check the file and try again.");
    else { toast.success(`${rows.length} accounts imported`); void qc.invalidateQueries({ queryKey: ["hub", "discover"] }); }
  }
  return (
    <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-brand-line bg-card px-3 text-sm font-semibold text-brand-navy">
      <Upload className="size-4" />Import CSV<input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ""; }} />
    </label>
  );
}

function Drawer({ list, index, setIndex, maxViews }: { list: Person[]; index: number | null; setIndex: (i: number | null) => void; maxViews: Map<string, number> }) {
  const p = index === null ? null : list[index];
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const { data: exp = [] } = useQuery({
    queryKey: ["hub", "experiences", p?.key], enabled: p?.kind === "creator",
    queryFn: async () => (await supabase.from("job_applications").select("status, created_at, jobs(title, campaigns(name))").eq("creator_id", p!.id)).data ?? [],
  });
  if (!p) return null;
  const awards = awardsOf(p, maxViews.get(p.key) ?? 0);
  async function saveNotes() {
    const res = p!.kind === "creator" ? await supabase.from("creators").update({ admin_notes: notes }).eq("id", p!.id) : p!.kind === "prospect" ? await supabase.from("creator_prospects").update({ notes }).eq("id", p!.id) : { error: null };
    if (res.error) toast.error("Notes could not be saved."); else { toast.success("Notes saved"); void qc.invalidateQueries({ queryKey: ["hub", "discover"] }); }
  }
  return (
    <Sheet open onOpenChange={(o) => !o && setIndex(null)}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-card p-0 sm:max-w-xl">
        <SheetTitle className="sr-only">{p.name}</SheetTitle>
        <div className="flex items-center gap-2 border-b p-3">
          <Button size="icon" variant="ghost" aria-label="Previous" disabled={index === 0} onClick={() => setIndex(index! - 1)}><ChevronLeft className="size-4" /></Button>
          <Button size="icon" variant="ghost" aria-label="Next" disabled={index === list.length - 1} onClick={() => setIndex(index! + 1)}><ChevronRight className="size-4" /></Button>
          <span className="flex-1" />
          <Button size="icon" variant="ghost" aria-label="Close" onClick={() => setIndex(null)}><X className="size-4" /></Button>
        </div>
        <div className="space-y-5 p-5">
          <div className="flex items-center gap-4">
            <Avatar p={p} big />
            <div className="min-w-0">
              <p className="text-xl font-extrabold text-brand-navy">{p.name} {flag(p.country)}</p>
              <p className="text-sm text-brand-navySoft">{[p.age, p.gender, p.city].filter(Boolean).join(" • ") || p.kind}</p>
              {p.school ? <p className="text-sm text-brand-navySoft">{p.school}</p> : null}
              {online(p) ? <span className="mt-1 inline-flex rounded-full bg-portal-green/15 px-2 text-xs font-bold text-portal-green">Online</span> : null}
            </div>
          </div>
          <StatStrip p={p} />
          <div className="flex gap-2"><InviteButton p={p} className="flex-1" />{p.kind === "creator" ? <Button asChild variant="outline" size="sm"><Link to="/hub/creators/$creatorId" params={{ creatorId: p.id }}>Full profile</Link></Button> : null}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {([["Instagram", p.instagram, "https://instagram.com/"], ["TikTok", p.tiktok, "https://tiktok.com/@"]] as const).map(([n, h, base]) => (
              <div key={n} className="rounded-xl border border-brand-line p-3">
                {h ? <a href={`${base}${h}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-bold text-brand-navy">{n} @{h}<ExternalLink className="size-3.5" /></a> : <p className="text-sm font-bold text-brand-navySoft">{n}</p>}
                <p className="mt-6 text-center text-xs text-brand-navySoft">No posts</p>
              </div>
            ))}
          </div>
          <section><h3 className="text-sm font-bold text-brand-navy">Awards</h3>{awards.length ? <div className="mt-2 flex flex-wrap gap-2">{awards.map((a) => <span key={a} className="rounded-full bg-portal-amber/15 px-3 py-1 text-xs font-bold text-brand-navy">🏅 {a}</span>)}</div> : <p className="text-xs text-brand-navySoft">No awards yet.</p>}</section>
          <section><h3 className="text-sm font-bold text-brand-navy">Experiences</h3>{exp.length ? <ul className="mt-2 space-y-1 text-sm">{exp.map((e, i) => { const j = e.jobs as { title?: string; campaigns?: { name?: string } | null } | null; return <li key={i}>{j?.campaigns?.name ?? j?.title} · {e.status} · {new Date(e.created_at).toLocaleDateString()}</li>; })}</ul> : <p className="text-xs text-brand-navySoft">No campaigns joined yet.</p>}</section>
          <section><h3 className="text-sm font-bold text-brand-navy">Content Niches</h3>{p.niche ? <span className="mt-2 inline-flex rounded-full bg-portal-bg px-3 py-1 text-xs font-bold">{p.niche}</span> : <p className="text-xs text-brand-navySoft">None set.</p>}</section>
          {p.kind !== "applicant" ? (
            <section><h3 className="text-sm font-bold text-brand-navy">Admin notes</h3>
              <textarea aria-label="Admin notes" defaultValue={p.notes ?? ""} key={p.key} onChange={(e) => setNotes(e.target.value)} className="mt-2 min-h-20 w-full rounded-xl border p-3 text-sm" />
              <Button size="sm" variant="outline" className="mt-2" onClick={() => void saveNotes()}>Save notes</Button>
            </section>
          ) : null}
          {p.kind === "creator" ? <div className="flex flex-wrap gap-2 border-t pt-4"><Button asChild size="sm" variant="outline"><Link to="/hub/messages">Message</Link></Button><Button asChild size="sm" variant="outline"><Link to="/hub/creators/$creatorId" params={{ creatorId: p.id }}>Change tier, rates or account</Link></Button></div> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function Discover() {
  const { data, isLoading } = usePeople();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [f, setF] = useState({ source: "", country: "", platform: "", niche: "", followers: "", status: "", online: false });
  const [open, setOpen] = useState<number | null>(null);
  const people = data?.people ?? [];
  const opts = (k: "source" | "country" | "niche" | "status") => [...new Set(people.map((p) => p[k]).filter(Boolean))].sort() as string[];
  const list = useMemo(() => people.filter((p) => {
    if (tab !== "all" && p.kind !== tab) return false;
    if (q && !`${p.name} ${p.tiktok ?? ""} ${p.instagram ?? ""} ${p.email ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (f.source && p.source !== f.source) return false;
    if (f.country && p.country !== f.country) return false;
    if (f.platform && !p.platforms.includes(f.platform)) return false;
    if (f.niche && p.niche !== f.niche) return false;
    if (f.status && p.status !== f.status) return false;
    if (f.online && !online(p)) return false;
    if (f.followers) { const [lo = 0, hi = 0] = f.followers.split("-").map(Number); const n = p.followers ?? 0; if (n < lo || (hi && n > hi)) return false; }
    return true;
  }), [people, tab, q, f]);
  const sel = "min-h-9 rounded-lg border border-brand-line bg-card px-2 text-sm";
  const count = (k: string) => (k === "all" ? people.length : people.filter((p) => p.kind === k).length);
  return (
    <div>
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-brand-line">
        {TABS.map(([k, l]) => <button key={k} type="button" onClick={() => setTab(k)} className={cn("shrink-0 border-b-2 px-3 pb-2.5 text-sm font-bold", tab === k ? "border-brand-navy text-brand-navy" : "border-transparent text-brand-navySoft")}>{l} <span className="text-xs font-normal">{count(k)}</span></button>)}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or handle" className="min-h-9 flex-1 rounded-lg border border-brand-line bg-card px-3 text-sm sm:max-w-xs" />
        <select aria-label="Source" className={sel} value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}><option value="">Source</option>{opts("source").map((o) => <option key={o}>{o}</option>)}</select>
        <select aria-label="Country" className={sel} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })}><option value="">Country</option>{opts("country").map((o) => <option key={o}>{o}</option>)}</select>
        <select aria-label="Platform" className={sel} value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value })}><option value="">Platform</option><option value="tiktok">TikTok</option><option value="instagram">Instagram</option></select>
        <select aria-label="Niche" className={sel} value={f.niche} onChange={(e) => setF({ ...f, niche: e.target.value })}><option value="">Niche</option>{opts("niche").map((o) => <option key={o}>{o}</option>)}</select>
        <select aria-label="Followers" className={sel} value={f.followers} onChange={(e) => setF({ ...f, followers: e.target.value })}><option value="">Followers</option><option value="0-1000">&lt; 1K</option><option value="1000-10000">1K–10K</option><option value="10000-100000">10K–100K</option><option value="100000-0">100K+</option></select>
        <select aria-label="Status" className={sel} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">Status</option>{opts("status").map((o) => <option key={o}>{o}</option>)}</select>
        <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={f.online} onChange={(e) => setF({ ...f, online: e.target.checked })} />Online</label>
        <ImportCsv />
      </div>
      {isLoading ? <p className="text-sm text-brand-navySoft">Loading…</p> : list.length === 0 ? <p className="rounded-2xl bg-card p-6 text-sm text-brand-navySoft shadow-portal">{tab === "agencies" || tab === "clipping" ? "Nobody here yet." : "No one matches these filters."}</p> : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {list.map((p, i) => {
            const tier = tierOf(p);
            return (
              <article key={p.key} onClick={() => setOpen(i)} className="cursor-pointer space-y-2 rounded-2xl bg-card p-3 shadow-portal transition hover:shadow-lg">
                <div className="relative"><Avatar p={p} />{online(p) ? <span className="absolute left-2 top-2 rounded-full bg-portal-green px-2 text-[10px] font-bold text-card">Online</span> : null}{tier ? <span className="absolute right-2 top-2 rounded-full bg-card/90 px-2 text-[10px] font-bold text-brand-navy">{tier}</span> : null}</div>
                <p className="truncate font-extrabold text-brand-navy">{p.name} {flag(p.country)}</p>
                <p className="truncate text-xs text-brand-navySoft">{[p.age, p.gender, p.city].filter(Boolean).join(" • ") || p.kind}{p.followers ? ` · ${compact(p.followers)} followers` : ""}</p>
                {p.school ? <p className="truncate text-xs text-brand-navySoft">{p.school}</p> : null}
                <StatStrip p={p} />
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-brand-navySoft">{p.platforms.map((x) => <span key={x} className="rounded bg-portal-bg px-1.5 py-0.5">{x === "tiktok" ? "TT" : x === "instagram" ? "IG" : x}</span>)}</div>
                <div className="flex gap-1"><InviteButton p={p} className="flex-1" /><Button size="icon" variant="outline" aria-label="Tag" className="size-9" onClick={(e) => { e.stopPropagation(); setOpen(i); }}><Tag className="size-4" /></Button></div>
              </article>
            );
          })}
        </div>
      )}
      <Drawer list={list} index={open} setIndex={setOpen} maxViews={data?.maxViews ?? new Map()} />
    </div>
  );
}
