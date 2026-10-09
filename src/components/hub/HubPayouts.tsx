import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAdminApp, useApps } from "@/lib/apps";
import { CreatorPayouts } from "@/components/portal/admin/CreatorPayouts";
import { runTiersNow } from "@/lib/hub.functions";
import { eur, useWallet } from "./hub-data";

const card = "rounded-2xl bg-card p-5 shadow-portal";
const input = "mt-1 block min-h-10 w-full rounded-xl border border-input bg-card px-3 text-sm";
const SETTINGS = [
  ["monthly_budget_cap", "Monthly budget cap (€)", "When reached, new posts wait for next month and open jobs close."],
  ["hold_days", "Hold days", "Posts stay pending this long before they count."],
  ["min_payout", "Minimum payout (€)", "Smaller amounts roll over to the next month."],
  ["ad_selection_bonus", "Ad selection bonus (€)", "Paid once when a creator's video wins in Ads."],
  ["cpi_target", "Target cost per install (€)", "Ads below it get the winner badge."],
  ["ten_post_bonus", "10 approved posts bonus (€)", "One time."],
  ["streak7_bonus", "7-day streak bonus (€)", "Once per month."],
  ["streak30_bonus", "30-day streak bonus (€)", "Once per month."],
] as const;

function Settings() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["hub", "ugc-settings"], queryFn: async () => (await supabase.from("ugc_settings").select("*").eq("id", 1).maybeSingle()).data });
  const [v, setV] = useState<Record<string, string>>({});
  useEffect(() => { if (data) setV(Object.fromEntries(SETTINGS.map(([k]) => [k, data[k] == null ? "" : String(data[k])]))); }, [data]);
  async function save() {
    const patch = Object.fromEntries(SETTINGS.map(([k]) => [k, v[k] === "" ? (k === "monthly_budget_cap" ? null : 0) : Number(v[k])]));
    const { error } = await supabase.from("ugc_settings").update(patch as never).eq("id", 1);
    if (error) toast.error("Settings could not be saved."); else { toast.success("Settings saved"); void qc.invalidateQueries({ queryKey: ["hub"] }); }
  }
  return (
    <section className={card}>
      <h2 className="font-extrabold text-brand-navy">Budget & rules</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SETTINGS.map(([k, l, h]) => <label key={k} className="text-sm font-semibold text-brand-navy">{l}<input type="number" min={0} className={input} value={v[k] ?? ""} onChange={(e) => setV((x) => ({ ...x, [k]: e.target.value }))} placeholder={k === "monthly_budget_cap" ? "No cap" : ""} /><span className="text-xs font-normal text-brand-navySoft">{h}</span></label>)}
      </div>
      <Button className="mt-4" onClick={() => void save()}>Save</Button>
    </section>
  );
}

function Tiers() {
  const { appId } = useAdminApp();
  const { data: apps = [] } = useApps();
  const qc = useQueryClient();
  const run = useServerFn(runTiersNow);
  const { data = [] } = useQuery({ queryKey: ["hub", "tiers", appId], queryFn: async () => { let q = supabase.from("ugc_tiers").select("*").order("per_post"); if (appId) q = q.eq("app_id", appId); return (await q).data ?? []; } });
  async function update(id: string, k: "per_post" | "cpm" | "cap_per_post", val: string) {
    const { error } = await supabase.from("ugc_tiers").update({ [k]: Number(val) } as never).eq("id", id);
    if (error) toast.error("Could not save."); else void qc.invalidateQueries({ queryKey: ["hub", "tiers"] });
  }
  return (
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-extrabold text-brand-navy">Tiers</h2>
        <Button size="sm" variant="outline" onClick={async () => { const r = await run(); toast.success(`Checked: ${r.awarded} awards, ${r.bonuses} bonuses${r.promote ? `, ${r.changed} tier changes` : " (tier changes only run on the 1st)"}`); }}>Run awards & bonuses now</Button></div>
      <p className="mt-1 text-xs text-brand-navySoft">Tiers replace the single rate card. Each post earns the per-post rate plus views pay up to the cap per post; there is no monthly ceiling per tier (only the global monthly budget cap). Instagram posts pay the per-post rate only. Per-creator overrides on the creator page still apply. Tier changes run on the 1st of each month.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs text-brand-navySoft"><tr><th className="py-2">App</th><th>Tier</th><th>Rule</th><th>Per post €</th><th>Per 1,000 views €</th><th>Cap per post €</th></tr></thead>
          <tbody className="divide-y divide-brand-line">{data.map((t) => (
            <tr key={t.id}>
              <td className="py-2">{apps.find((a) => a.id === t.app_id)?.name}</td><td className="font-bold">{t.label}</td><td className="text-xs text-brand-navySoft">{t.rule}</td>
              {(["per_post", "cpm", "cap_per_post"] as const).map((k) => <td key={k}><input aria-label={`${t.label} ${k}`} type="number" step="0.5" min={0} defaultValue={String(t[k])} onBlur={(e) => e.target.value !== String(t[k]) && void update(t.id, k, e.target.value)} className="h-9 w-20 rounded-lg border px-2" /></td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}

function StripeStatus() {
  const { data = [] } = useQuery({
    queryKey: ["hub", "stripe-status"],
    queryFn: async () => {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from("creators").select("id, full_name, tier").eq("track", "ugc").not("user_id", "is", null),
        supabase.from("creator_payout_profiles").select("creator_id, method, stripe_onboarded"),
      ]);
      return (c ?? []).map((x) => ({ ...x, p: (p ?? []).find((y) => y.creator_id === x.id) }));
    },
  });
  return (
    <section className={card}>
      <h2 className="font-extrabold text-brand-navy">Payout setup per creator</h2>
      {data.length === 0 ? <p className="mt-2 text-sm text-brand-navySoft">No active creators yet.</p> : (
        <ul className="mt-3 divide-y divide-brand-line text-sm">{data.map((c) => (
          <li key={c.id} className="flex justify-between gap-2 py-2"><span className="font-semibold text-brand-navy">{c.full_name} <span className="text-xs font-normal capitalize text-brand-navySoft">· {c.tier}</span></span>
            <span className={c.p?.stripe_onboarded || (c.p?.method && c.p.method !== "stripe") ? "text-portal-green" : "text-portal-amber"}>{c.p?.stripe_onboarded ? "Stripe ready" : c.p?.method && c.p.method !== "stripe" ? c.p.method : "Not set up"}</span></li>
        ))}</ul>
      )}
    </section>
  );
}

function StripeModeBanner() {
  const get = useServerFn(stripeModeInfo);
  const { data } = useQuery({ queryKey: ["hub", "stripe-mode"], queryFn: () => get() });
  const url = typeof window !== "undefined" ? `${window.location.origin.includes("localhost") || window.location.hostname.includes("preview") ? "https://sophia-culture.com" : window.location.origin}/api/public/stripe/webhook` : "";
  if (!data) return null;
  return (
    <section className={card}>
      <p className={`rounded-xl px-4 py-2 text-sm font-bold ${data.mode === "live" ? "bg-destructive text-destructive-foreground" : "bg-muted text-brand-navy"}`}>
        {data.mode === "live" ? "Stripe: LIVE" : data.mode === "test" ? "Stripe: TEST mode (STRIPE_ALLOW_LIVE is off)" : "Stripe: not configured"}
      </p>
      <div className="mt-3 space-y-1 text-sm text-brand-navySoft">
        <p className="font-bold text-brand-navy">Stripe webhook</p>
        <p>Endpoint URL to paste in Stripe → Developers → Webhooks (choose “Connected and v2 accounts” + “Your account”):</p>
        <p className="flex flex-wrap items-center gap-2"><code className="rounded bg-muted px-2 py-1 text-xs">{url}</code><button className="text-xs font-semibold underline" onClick={() => { navigator.clipboard.writeText(url); toast.success("Copied"); }}>Copy</button></p>
        <p>Events: <code className="text-xs">account.updated</code>, <code className="text-xs">transfer.failed</code>, <code className="text-xs">transfer.reversed</code></p>
        <p>Signing secret saved: <b>{data.webhookSecretSet ? "yes" : "no — add STRIPE_WEBHOOK_SECRET (whsec_…) in project secrets"}</b></p>
      </div>
    </section>
  );
}

export function HubPayouts() {
  const { data: w } = useWallet();
  return (
    <div className="space-y-5">
      <StripeModeBanner />
      <div className="grid gap-3 sm:grid-cols-4">
        {[["Available balance", w?.available], ["Currently owed", w?.currentlyOwed], ["Pending balance", w?.pending], ["Live budgets", w?.budget]].map(([k, v]) => (
          <div key={k as string} className="rounded-2xl bg-gradient-to-br from-brand-navy to-portal-accent p-4 text-card shadow-portal"><p className="text-xs opacity-80">{k}</p><p className="text-2xl font-extrabold">{eur(Number(v ?? 0))}</p></div>
        ))}
      </div>
      <Settings />
      <Tiers />
      <StripeStatus />
      <section className={card}><h2 className="mb-3 font-extrabold text-brand-navy">Months, statements & batches</h2><CreatorPayouts inHub /></section>
    </div>
  );
}
