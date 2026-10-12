import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppBadge, useAdminApp } from "@/lib/apps";
import { CreatorApplications } from "@/components/portal/admin/CreatorApplications";
import { AddValidatedCreator } from "./FastLane";
import { flag } from "./hub-data";
import { HandleLinksInline, PersonAvatar, useCreatorPhotos } from "./PersonAvatar";

function mondayParis() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const d = new Date(now); d.setDate(now.getDate() - ((now.getDay() + 6) % 7)); d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function useActiveCreators(appId: string | null) {
  return useQuery({
    queryKey: ["hub", "ugc-creators-simple", appId],
    queryFn: async () => {
      const [c, posts] = await Promise.all([
        supabase.from("creators").select("id, full_name, country, status, ugc_status, email_pending, tiktok_handle, instagram_handle, creator_apps(app_id)").eq("track", "ugc").eq("is_test", false).order("full_name").limit(1000),
        supabase.from("creator_posts").select("creator_id, posted_on, created_at, app_id").order("created_at", { ascending: false }).limit(5000),
      ]);
      const monday = mondayParis();
      const stats = new Map<string, { week: number; last: string | null }>();
      for (const p of posts.data ?? []) {
        if (appId && p.app_id && p.app_id !== appId) continue;
        const day = (p.posted_on ?? p.created_at).slice(0, 10);
        const s = stats.get(p.creator_id) ?? { week: 0, last: null };
        if (day >= monday) s.week++;
        if (!s.last || day > s.last) s.last = day;
        stats.set(p.creator_id, s);
      }
      return (c.data ?? []).map((x) => ({ ...x, apps: ((x.creator_apps ?? []) as { app_id: string }[]).map((a) => a.app_id), s: stats.get(x.id) }))
        .filter((x) => !appId || x.apps.includes(appId));
    },
  });
}

const INACTIVE = ["paused", "ended", "dormant", "archived", "rejected"];
const isInactive = (c: { ugc_status?: unknown; status?: unknown }) => INACTIVE.includes(String(c.ugc_status ?? c.status));

function ActiveCreators({ q }: { q: string }) {
  const { appId } = useAdminApp(); const navigate = useNavigate();
  const { data = [], isLoading } = useActiveCreators(appId);
  const [showInactive, setShowInactive] = useState(false);
  const rows = useMemo(() => data.filter((c) => !q || `${c.full_name} ${c.tiktok_handle ?? ""} ${c.instagram_handle ?? ""}`.toLowerCase().includes(q.toLowerCase())), [data, q]);
  const active = rows.filter((c) => !isInactive(c));
  const inactive = rows.filter(isInactive);
  const shown = showInactive ? rows : active;
  const photos = useCreatorPhotos(shown.map((r) => r.id));
  if (isLoading) return <p className="p-5 text-sm text-brand-navySoft">Loading…</p>;
  if (!shown.length) return <p className="p-5 text-sm text-brand-navySoft">No creators yet.</p>;
  return (
    <>
      <table className="w-full min-w-[720px] text-sm" data-testid="ugc-creators">
        <thead className="text-left text-xs uppercase text-brand-navySoft"><tr><th className="p-3">Creator</th><th className="p-3">App</th><th className="p-3">Accounts</th><th className="p-3">Posts this week</th><th className="p-3">Last post</th><th className="p-3">Status</th></tr></thead>
        <tbody>{shown.map((c) => { const paused = isInactive(c); return (
          <tr key={c.id} onClick={() => void navigate({ to: "/hub/ugc/creators/$creatorId", params: { creatorId: c.id } })} className="cursor-pointer border-t border-brand-line hover:bg-portal-bg">
            <td className="p-3"><span className="flex items-center gap-2"><PersonAvatar name={c.full_name} url={photos[c.id]} /><Link to="/hub/ugc/creators/$creatorId" params={{ creatorId: c.id }} className="font-bold text-brand-navy">{c.full_name}</Link><span title={c.country ?? ""}>{flag(c.country)}</span>{c.email_pending ? <span className="text-xs text-portal-amber">email pending</span> : null}</span></td>
            <td className="p-3"><span className="flex flex-wrap gap-1">{c.apps.map((a) => <AppBadge key={a} appId={a} />)}</span></td>
            <td className="p-3"><HandleLinksInline tiktok={c.tiktok_handle} instagram={c.instagram_handle} /></td>
            <td className="p-3">{c.s?.week ?? 0}</td>
            <td className="p-3 text-brand-navySoft">{c.s?.last ? new Date(c.s.last).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</td>
            <td className="p-3"><span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", paused ? "bg-muted text-brand-navySoft" : "bg-portal-green/15 text-portal-green")}>{paused ? "paused" : "active"}</span></td>
          </tr>); })}</tbody>
      </table>
      {inactive.length ? (
        <button type="button" onClick={() => setShowInactive((v) => !v)} className="block w-full border-t border-brand-line p-3 text-center text-xs font-semibold text-brand-navySoft hover:text-brand-navy">
          {showInactive ? "Hide inactive" : `Inactive (${inactive.length})`}
        </button>
      ) : null}
    </>
  );
}

/** Hub → UGC → Creators: Applications · Creators, one search, one Add button. */
export function UgcCreatorsPage({ view }: { view: "applications" | "directory" }) {
  const { appId } = useAdminApp();
  const [q, setQ] = useState(""); const [add, setAdd] = useState(false);
  const { data: active = [] } = useActiveCreators(appId);
  const { data: pending = 0 } = useQuery({ queryKey: ["portal", "admin", "creator-applications", "count", appId], queryFn: async () => { let x = supabase.from("creator_applications").select("id", { count: "exact", head: true }).eq("status", "pending"); if (appId) x = x.eq("app_id", appId); return (await x).count ?? 0; } });
  const tabs: ["applications" | "directory", string][] = [["applications", `Applications (${pending})`], ["directory", `Creators (${active.length})`]];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1" role="tablist">{tabs.map(([k, l]) => <Link key={k} to="/hub/ugc/creators" search={{ view: k }} role="tab" aria-selected={view === k} className={cn("min-h-9 rounded-full px-4 py-2 text-sm font-bold", view === k ? "bg-brand-navy text-card" : "bg-card text-brand-navy")}>{l}</Link>)}</div>
        <input aria-label="Search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="ml-auto h-9 w-full rounded-lg border bg-card px-3 text-sm sm:w-64" />
        <Button size="sm" variant="outline" onClick={() => setAdd(true)}>Add creator</Button>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-card shadow-portal">
        {view === "applications" ? <CreatorApplications key="ugc" track="ugc" simple q={q} /> : <ActiveCreators q={q} />}
      </div>
      <AddValidatedCreator open={add} onOpenChange={setAdd} />
    </div>
  );
}
