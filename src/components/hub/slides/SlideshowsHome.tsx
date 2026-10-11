import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useSlideshowApps } from "./SlideshowApplications";
import { STATUS_LABEL, useOsStatus } from "./useOs";
import { OsNotConnected } from "./Posters";

const card = "rounded-2xl bg-card p-5 shadow-portal";

export function SlideshowsHome() {
  const { data } = useSlideshowApps();
  const os = useOsStatus();
  const apps = data?.apps ?? [];
  const n = (s: string) => apps.filter((a) => a.status === s).length;
  const notOpen = apps.filter((a) => a.status === "pending" && !a.zone).length;
  const osErrors = apps.filter((a) => a.status === "contract_signed" && a.os_error).length;
  const tiles: [string, number, string][] = [
    ["Pending applications", n("pending"), "/hub/slideshows/applications"], ["Kept warm", n("pool"), "/hub/slideshows/applications"],
    ["Waiting for contract", n("accepted"), "/hub/slideshows/applications"], ["OS account created", n("os_created"), "/hub/slideshows/posters"],
    ["Posters started", n("started"), "/hub/slideshows/posters"], ["OS errors to retry", osErrors, "/hub/slideshows/applications"],
  ];
  const byZone = ["A", "B", "C"].map((z) => [z, apps.filter((a) => a.zone === z && a.status === "pending").length] as const);
  return (
    <div className="space-y-5">
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
      {!os.data?.connected ? <OsNotConnected what="Sophia OS" /> : <p className="text-sm text-brand-navySoft">OS connected · last sync {os.data.lastSync ? new Date(os.data.lastSync).toLocaleString("en-GB") : "never"}</p>}
      <p className="text-xs text-brand-navySoft">Statuses: {Object.values(STATUS_LABEL).join(" · ")}</p>
    </div>
  );
}
