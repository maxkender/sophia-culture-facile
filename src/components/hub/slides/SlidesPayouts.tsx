import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { approveWeek, buildWeekNow, markWeekPaid } from "@/lib/slideshows.functions";
import { RUUL_HEADERS, RUUL_HELPERS, RUUL_MAX_ROWS, RUUL_MIN_EUR, RUUL_SHEET } from "@/lib/ruul";
import { useOsStatus } from "./useOs";
import { StatusPill } from "./Crm";
import { OsNotConnected } from "./Posters";

const lastMonday = () => { const d = new Date(); const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7) - 7); return x.toISOString().slice(0, 10); };

type Row = {
  id: string; amount: number | null; carried_in: number | null; status: string; zone: string | null; rate: number | null;
  first_week: boolean | null; prevus: number | null; publies: number | null; manques: number | null; suggested: number | null;
  note: string | null; skip_reason: string | null; ruul_ref: string | null;
  slideshow_applications: { full_name: string; email: string; ruul_email: string | null; ruul_added_at: string | null; payout_channel: string | null } | null;
};

export function SlidesPayouts() {
  const qc = useQueryClient();
  const os = useOsStatus();
  const build = useServerFn(buildWeekNow); const approve = useServerFn(approveWeek); const mark = useServerFn(markWeekPaid);
  const [lundi, setLundi] = useState(lastMonday());
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [ruulRef, setRuulRef] = useState("");
  const [includeNotAdded, setIncludeNotAdded] = useState<string[]>([]);
  const { data = [] } = useQuery({
    queryKey: ["hub", "slides", "payouts", lundi],
    queryFn: async () => (await supabase.from("slideshow_payouts").select("*, slideshow_applications(full_name, email, ruul_email, ruul_added_at, payout_channel)").eq("week_start", lundi).order("created_at")).data as unknown as Row[] ?? [],
  });
  const reload = () => void qc.invalidateQueries({ queryKey: ["hub", "slides", "payouts"] });
  const total = useMemo(() => data.filter((r) => r.status !== "skipped").reduce((s, r) => s + Number(r.amount ?? 0) + Number(r.carried_in ?? 0), 0), [data]);
  async function go<T>(fn: () => Promise<T>, msg: (r: T) => string) { setBusy(true); try { toast.success(msg(await fn())); reload(); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); } }
  async function saveRow(id: string, patch: { amount?: number; note?: string }) {
    const { error } = await supabase.from("slideshow_payouts").update(patch).eq("id", id).eq("status", "draft");
    if (error) toast.error("Could not save."); else reload();
  }
  const approved = data.filter((r) => r.status === "approved");
  const notAdded = approved.filter((r) => !r.slideshow_applications?.ruul_added_at);
  const inFile = approved.filter((r) => r.slideshow_applications?.ruul_added_at || includeNotAdded.includes(r.id));
  const fileTotal = inFile.reduce((s, r) => s + Number(r.amount ?? 0) + Number(r.carried_in ?? 0), 0);

  async function downloadRuul() {
    if (!inFile.length) { toast.error("No approved poster in the file."); return; }
    if (inFile.length > RUUL_MAX_ROWS) { toast.error(`Too many rows — Ruul takes at most ${RUUL_MAX_ROWS} per file.`); return; }
    const XLSX = await import("xlsx");
    const rows = inFile.map((r) => {
      const p = r.slideshow_applications;
      if (!p) return [];
      const parts = p.full_name.trim().split(/\s+/);
      const net = Math.max(1, Number(r.amount ?? 0) + Number(r.carried_in ?? 0));
      return [p.ruul_email ?? p.email, parts[0] ?? "", parts.slice(1).join(" "), `Sophia slideshow posts — week of ${lundi}`, Number(net.toFixed(2)), "USD"];
    });
    const sheet = XLSX.utils.aoa_to_sheet([RUUL_HEADERS, RUUL_HELPERS, ...rows]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, RUUL_SHEET);
    XLSX.writeFile(book, `ruul-payouts-${lundi}.xlsx`);
  }

  return (
    <div className="space-y-4">
      <p className="crm-count">{data.length} payouts · USD ${total.toFixed(2)}</p>
      <div className="crm-toolbar">
        <label className="text-xs font-semibold text-brand-navySoft">Week starting (Monday)<input type="date" value={lundi} onChange={(e) => setLundi(e.target.value)} className="mt-1 block h-9 rounded-lg border px-2 text-sm" /></label>
        <Button variant="outline" disabled={busy} onClick={() => void go(() => build({ data: { lundi } }), (r) => `${r.built} built, ${r.skipped} skipped`)}>Build this week</Button>
        <Button disabled={busy || !data.some((r) => r.status === "draft")} onClick={() => void go(() => approve({ data: { lundi } }), (r) => `${r.approved} approved, ${r.carried} carried over (under $20)`)}>Approve week</Button>
        <span className="ml-auto text-sm">Total <b>${total.toFixed(2)}</b></span>
      </div>
      {!os.data?.connected ? <OsNotConnected what="Post counts for payouts" /> : null}

      <div className="space-y-2 border-y border-brand-line py-3" data-testid="ruul-export">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-bold text-brand-navy">Ruul file · {inFile.length} poster{inFile.length === 1 ? "" : "s"} · total ${fileTotal.toFixed(2)}</p>
          <Button size="sm" disabled={!inFile.length} onClick={() => void downloadRuul()}>Download Ruul file</Button>
          <input aria-label="Ruul transaction number" value={ruulRef} onChange={(e) => setRuulRef(e.target.value)} placeholder="Ruul transaction no. (optional)" className="h-9 rounded-lg border px-2 text-sm" />
          <Button size="sm" variant="outline" disabled={busy || !approved.length} onClick={() => void go(() => mark({ data: { ids: approved.map((r) => r.id), ruulRef: ruulRef || undefined } }), () => "Marked as paid")}>Mark the week as paid</Button>
        </div>
        {fileTotal > 0 && fileTotal < RUUL_MIN_EUR ? <p className="text-xs font-semibold text-portal-amber">Warning: the file total is under the equivalent of {RUUL_MIN_EUR} EUR — Ruul's minimum per payment.</p> : null}
        {notAdded.length ? (
          <div className="rounded-xl border border-portal-amber/40 bg-portal-amber/10 p-3 text-xs">
            <p className="font-bold">Not added in Ruul yet — left out of the file unless you tick them:</p>
            {notAdded.map((r) => (
              <label key={r.id} className="mt-1 flex items-center gap-2">
                <input type="checkbox" checked={includeNotAdded.includes(r.id)} onChange={(e) => setIncludeNotAdded(e.target.checked ? [...includeNotAdded, r.id] : includeNotAdded.filter((x) => x !== r.id))} />
                {r.slideshow_applications?.full_name} ({r.slideshow_applications?.ruul_email ?? r.slideshow_applications?.email})
              </label>
            ))}
          </div>
        ) : null}
      </div>

      <div className="crm-toolbar"><input aria-label="Search payouts" className="crm-search" placeholder="Search posters" value={search} onChange={(e) => setSearch(e.target.value)} />{["all","draft","approved","paid","skipped"].map((v) => <Button key={v} size="sm" variant={status === v ? "secondary" : "ghost"} onClick={() => setStatus(v)}>{v === "all" ? "All" : v}</Button>)}</div>
      <div className="crm-table">
        <table className="w-full min-w-[860px] text-sm" data-testid="slides-payouts">
          <thead className="text-left text-xs uppercase text-brand-navySoft"><tr><th className="p-3">Poster</th><th className="p-3">Zone</th><th className="p-3">Zone rate</th><th className="p-3">First week</th><th className="p-3">Posts</th><th className="p-3">Missed</th><th className="p-3">Suggested</th><th className="p-3">Amount</th><th className="p-3">Carried in</th><th className="p-3">Note</th><th className="p-3">Status</th></tr></thead>
          <tbody>{data.filter((r) => (status === "all" || r.status === status) && `${r.slideshow_applications?.full_name ?? ""} ${r.slideshow_applications?.email ?? ""}`.toLowerCase().includes(search.toLowerCase())).map((r) => { const p = r.slideshow_applications; return (
            <tr key={r.id} className={cn("border-t border-brand-line", r.status === "skipped" && "text-brand-navySoft")}>
              <td className="p-3 font-bold">{p?.full_name}{!p?.ruul_added_at && r.status !== "paid" ? <span className="block text-xs font-normal text-portal-amber">Not added in Ruul yet</span> : null}</td>
              <td className="p-3">{r.zone}{r.first_week ? " · 1st week" : ""}</td>
              <td className="p-3">${Number(r.rate ?? 0)}</td><td className="p-3">{r.first_week ? "+$1" : "—"}</td>
              <td className="p-3">{r.prevus ?? "—"}/{r.publies ?? "—"}</td><td className="p-3">{r.manques ?? "—"}</td>
              <td className="p-3">{r.suggested != null ? `$${Number(r.suggested)}` : "—"}</td>
              <td className="p-3">{r.status === "draft" ? <input type="number" step="0.5" min="0" aria-label={`Amount for ${p?.full_name}`} defaultValue={Number(r.amount ?? 0)} onBlur={(e) => { const v = Number(e.target.value); if (v !== Number(r.amount)) void saveRow(r.id, { amount: v }); }} className="h-8 w-20 rounded border px-2" /> : r.amount != null ? `$${Number(r.amount)}` : "—"}</td>
              <td className="p-3">{Number(r.carried_in) ? `$${Number(r.carried_in)}` : "—"}</td>
              <td className="p-3">{r.status === "draft" ? <input aria-label={`Note for ${p?.full_name}`} defaultValue={r.note ?? ""} onBlur={(e) => { if (e.target.value !== (r.note ?? "")) void saveRow(r.id, { note: e.target.value }); }} className="h-8 w-40 rounded border px-2" /> : r.note ?? ""}</td>
              <td className="p-3">{r.status === "skipped" ? <span title={r.skip_reason ?? ""}>Skipped — {r.skip_reason}</span> : r.status === "paid" ? `paid${r.ruul_ref ? ` · Ruul ${r.ruul_ref}` : ""}` : <StatusPill status={r.status} />}</td>
            </tr>); })}</tbody>
        </table>
        {!data.length ? <p className="p-5 text-sm text-brand-navySoft">No payouts for this week.</p> : null}
      </div>
    </div>
  );
}
