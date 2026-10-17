import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useSlideshowApps } from "./SlideshowApplications";
import { STATUS_LABEL, useOsStatus , OS_UI_ENABLED } from "./useOs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OsNotConnected } from "./Posters";

const card = "rounded-2xl bg-card p-5 shadow-portal";

export function SlideshowsHome() {
  const { data } = useSlideshowApps();
  const os = useOsStatus();
  const apps = data?.apps ?? [];
  const n = (s: string) => apps.filter((a) => a.status === s).length;
  const now = new Date();
  const parisDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const day = new Date(`${parisDay}T12:00:00Z`);
  const week = new Date(day); week.setUTCDate(week.getUTCDate() - ((week.getUTCDay() + 6) % 7));
  const next = new Date(week); next.setUTCDate(next.getUTCDate() + 7);
  const nextMonday = next.toISOString().slice(0, 10);
  const { data: payouts = 0 } = useQuery({ queryKey: ["hub", "slides", "payouts-to-approve"], queryFn: async () => (await supabase.from("slideshow_payouts").select("id", { count: "exact", head: true }).eq("status", "draft")).count ?? 0 });
  const { data: ruulToAdd = 0 } = useQuery({ queryKey: ["hub", "slides", "ruul-to-add"], queryFn: async () => (await (supabase.from("slideshow_applications") as any).select("id", { count: "exact", head: true }).is("ruul_added_at", null).in("status", ["contract_signed", "os_created", "started"])).count ?? 0 });
  const { data: slackUrl } = useQuery({ queryKey: ["hub", "setting", "slideshow_slack_invite_url"], queryFn: async () => (await supabase.from("hub_settings").select("value").eq("key", "slideshow_slack_invite_url").maybeSingle()).data?.value ?? null });
  const notOpen = apps.filter((a) => a.status === "pending" && !a.zone).length;
  const tiles: [string, number, string][] = [
    ["Pending applications", n("pending"), "/hub/slideshows/applications"],
    ["Accepted this week", apps.filter((a) => a.accepted_at && a.accepted_at >= week.toISOString()).length, "/hub/slideshows/applications"],
    ["Starting next Monday", apps.filter((a) => a.start_monday === nextMonday && ["accepted", "contract_signed", "os_created"].includes(a.status)).length, "/hub/slideshows/posters"],
    ["Posters started", n("started"), "/hub/slideshows/posters"],
    ["Payouts to approve", payouts, "/hub/slideshows/payouts"],
    ["To add in Ruul", ruulToAdd, "/hub/slideshows/applications"],
  ];
  const byZone = ["A", "B", "C"].map((z) => [z, apps.filter((a) => a.zone === z && a.status === "pending").length] as const);
  return (
    <div className="space-y-5">
      {!slackUrl ? <p className="rounded-2xl border border-portal-amber/40 bg-portal-amber/10 p-3 text-sm font-semibold text-portal-amber">The Slack invite link (slideshow_slack_invite_url) is empty — new posters get no Slack link in their logins email. Fill it in Slideshows → Guide & templates.</p> : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {tiles.map(([l, v, to]) => (
          <Link key={l} to={to as never} className={cn(card, "block hover:ring-2 hover:ring-space-slides/30")}>
            <p className="text-xs font-semibold uppercase text-brand-navySoft">{l}</p><p className="mt-1 text-3xl font-extrabold text-brand-navy">{v}</p>
          </Link>
        ))}
      </div>
      <div className={card}>
        <h3 className="font-extrabold text-brand-navy">Pending by zone</h3>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">{byZone.map(([z, v]) => <span key={z} className="rounded-full bg-space-slides/10 px-3 py-1 font-semibold text-space-slides">Zone {z}: {v}</span>)}<span className="rounded-full bg-portal-red/10 px-3 py-1 font-semibold text-portal-red">Country not open: {notOpen}</span></div>
        <p className="mt-3 text-sm text-brand-navySoft">Applications never trigger anything by themselves: open Applications and pick posters one by one when a country needs them.</p>
      </div>
      {!OS_UI_ENABLED ? null : !os.data?.connected ? <OsNotConnected what="Sophia OS" /> : <p className="text-sm text-brand-navySoft">OS connected · last sync {os.data.lastSync ? new Date(os.data.lastSync).toLocaleString("en-GB") : "never"}</p>}
      <p className="text-xs text-brand-navySoft">Statuses: {Object.values(STATUS_LABEL).join(" · ")}</p>
    </div>
  );
}
