import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { approveWeek, buildWeekNow, markWeekPaid, payWeekStripe } from "@/lib/slideshows.functions";
import { useOsStatus } from "./useOs";
import { OsNotConnected } from "./Posters";

const lastMonday = () => { const d = new Date(); const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7) - 7); return x.toISOString().slice(0, 10); };
const csv = (rows: (string | number)[][]) => rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
function download(name: string, body: string) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([body], { type: "text/csv" })); a.download = name; a.click(); }

export function SlidesPayouts() {
  const qc = useQueryClient();
  const os = useOsStatus();
  const build = useServerFn(buildWeekNow); const approve = useServerFn(approveWeek); const pay = useServerFn(payWeekStripe); const mark = useServerFn(markWeekPaid);
  const [lundi, setLundi] = useState(lastMonday());
  const [busy, setBusy] = useState(false);
  const { data = [] } = useQuery({
    queryKey: ["hub", "slides", "payouts", lundi],
    queryFn: async () => (await supabase.from("slideshow_payouts").select("*, slideshow_applications(full_name, email, payout_method, paypal_email, wise_email, stripe_onboarded)").eq("week_start", lundi).order("created_at")).data ?? [],
  });
  const reload = () => void qc.invalidateQueries({ queryKey: ["hub", "slides", "payouts"] });
  const total = useMemo(() => data.filter((r) => r.status !== "skipped").reduce((s, r) => s + Number(r.amount ?? 0) + Number(r.carried_in ?? 0), 0), [data]);
  async function go<T>(fn: () => Promise<T>, msg: (r: T) => string) { setBusy(true); try { toast.success(msg(await fn())); reload(); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); } }
  async function saveRow(id: string, patch: { amount?: number; note?: string }) {
    const { error } = await supabase.from("slideshow_payouts").update(patch).eq("id", id).eq("status", "draft");
    if (error) toast.error("Could not save."); else reload();
  }
  const approved = data.filter((r) => r.status === "approved");
  const exportCsv = (kind: "wise" | "paypal") => {
    const rows = approved.filter((r) => (r.slideshow_applications as any)?.payout_method === kind);
    if (!rows.length) { toast.error(`No approved poster uses ${kind === "wise" ? "Wise" : "PayPal"} this week.`); return; }
    const body = kind === "wise"
      ? csv([["name", "recipientEmail", "amount", "currency", "reference"], ...rows.map((r) => { const p = r.slideshow_applications as any; return [p.full_name, p.wise_email ?? p.email, (Number(r.amount) + Number(r.carried_in)).toFixed(2), "USD", `Sophia week ${lundi}`]; })])
      : csv([["email", "amount", "currency", "id", "note"], ...rows.map((r) => { const p = r.slideshow_applications as any; return [p.paypal_email ?? p.email, (Number(r.amount) + Number(r.carried_in)).toFixed(2), "USD", r.id, `Sophia week ${lundi}`]; })]);
    download(`slideshow-${kind}-${lundi}.csv`, body);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2 rounded-2xl bg-card p-4 shadow-portal">
        <label className="text-xs font-semibold text-brand-navySoft">Week starting (Monday)<input type="date" value={lundi} onChange={(e) => setLundi(e.target.value)} className="mt-1 block h-9 rounded-lg border px-2 text-sm" /></label>
        <Button variant="outline" disabled={busy} onClick={() => void go(() => build({ data: { lundi } }), (r) => `${r.built} built, ${r.skipped} skipped`)}>Build this week</Button>
        <Button disabled={busy || !data.some((r) => r.status === "draft")} onClick={() => void go(() => approve({ data: { lundi } }), (r) => `${r.approved} approved, ${r.carried} carried over (under $20)`)}>Approve week</Button>
        <Button variant="outline" disabled={busy || !approved.length} onClick={() => { if (window.confirm("Pay approved posters via Stripe? This initiates real transfers.")) void go(() => pay({ data: { lundi } }), (r) => `${r.paid} paid via Stripe, ${r.skipped} without Stripe${r.errors.length ? ` — ${r.errors[0]}` : ""}`); }}>Pay via Stripe</Button>
        <Button variant="outline" disabled={!approved.length} onClick={() => exportCsv("wise")}>Export Wise CSV</Button>
        <Button variant="outline" disabled={!approved.length} onClick={() => exportCsv("paypal")}>Export PayPal CSV</Button>
        <Button variant="ghost" disabled={busy || !approved.length} onClick={() => void go(() => mark({ data: { ids: approved.map((r) => r.id) } }), () => "Marked as paid")}>Mark approved as paid</Button>
        <span className="ml-auto text-sm">Total <b>${total.toFixed(2)}</b></span>
      </div>
      <p className="text-xs text-brand-navySoft">Build by hand for posters who have started. Confirm attendance and edit the amount before approving. Amount = zone weekly rate (+$1 the first week) − $1 per missed post beyond 1. No hold. Minimum payout $20: a smaller total carries over to the next week. Currency USD.</p>
      {!os.data?.connected ? <OsNotConnected what="Post counts for payouts" /> : null}
      <div className="overflow-x-auto rounded-2xl bg-card shadow-portal">
        <table className="w-full min-w-[860px] text-sm" data-testid="slides-payouts">
          <thead className="text-left text-xs uppercase text-brand-navySoft"><tr><th className="p-3">Poster</th><th className="p-3">Zone</th><th className="p-3">Zone rate</th><th className="p-3">First week</th><th className="p-3">Posts</th><th className="p-3">Missed</th><th className="p-3">Suggested</th><th className="p-3">Amount</th><th className="p-3">Carried in</th><th className="p-3">Note</th><th className="p-3">Status</th></tr></thead>
          <tbody>{data.map((r) => { const p = r.slideshow_applications as any; return (
            <tr key={r.id} className={cn("border-t border-brand-line", r.status === "skipped" && "text-brand-navySoft")}>
              <td className="p-3 font-bold">{p?.full_name}{!p?.payout_method ? <span className="block text-xs font-normal text-portal-amber">Payout method missing</span> : null}</td>
              <td className="p-3">{r.zone}{r.first_week ? " · 1st week" : ""}</td>
              <td className="p-3">${Number(r.rate ?? 0)}</td><td className="p-3">{r.first_week ? "+$1" : "—"}</td>
              <td className="p-3">{r.publies ?? "—"}/{r.prevus ?? "—"}</td><td className="p-3">{r.manques ?? "—"}</td>
              <td className="p-3">{r.suggested != null ? `$${Number(r.suggested)}` : "—"}</td>
              <td className="p-3">{r.status === "draft" ? <input type="number" step="0.5" min="0" aria-label={`Amount for ${p?.full_name}`} defaultValue={Number(r.amount ?? 0)} onBlur={(e) => { const v = Number(e.target.value); if (v !== Number(r.amount)) void saveRow(r.id, { amount: v }); }} className="h-8 w-20 rounded border px-2" /> : r.amount != null ? `$${Number(r.amount)}` : "—"}</td>
              <td className="p-3">{Number(r.carried_in) ? `$${Number(r.carried_in)}` : "—"}</td>
              <td className="p-3">{r.status === "draft" ? <input aria-label={`Note for ${p?.full_name}`} defaultValue={r.note ?? ""} onBlur={(e) => { if (e.target.value !== (r.note ?? "")) void saveRow(r.id, { note: e.target.value }); }} className="h-8 w-40 rounded border px-2" /> : r.note ?? ""}</td>
              <td className="p-3">{r.status === "skipped" ? <span title={r.skip_reason ?? ""}>Skipped — {r.skip_reason}</span> : r.status}</td>
            </tr>); })}</tbody>
        </table>
        {!data.length ? <p className="p-5 text-sm text-brand-navySoft">No lines for this week yet. Click Build this week to prepare editable rows for posters at status "Started". Nothing is paid automatically.</p> : null}
      </div>
    </div>
  );
}
