import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generatePayoutBatch, payPayoutBatch } from "@/lib/creator-payouts.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTitle, PortalCard, EmptyState } from "../ui";

type Tab = "batches" | "rates" | "creators";

export function CreatorPayouts() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("batches");
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [track, setTrack] = useState<"ugc" | "slideshow">("ugc");
  const [country, setCountry] = useState("");
  const [rate, setRate] = useState("");
  const gen = useServerFn(generatePayoutBatch);
  const pay = useServerFn(payPayoutBatch);

  const { data } = useQuery({
    queryKey: ["portal", "admin", "payouts", tab],
    queryFn: async () => {
      if (tab === "rates") return (await supabase.from("creator_rates").select("*").order("track").order("country")).data ?? [];
      if (tab === "creators")
        return (
          await supabase.from("creators").select("id, full_name, email, country, track, creator_payout_profiles(method, stripe_onboarded, paypal_email, wise_email)").order("full_name")
        ).data ?? [];
      return (
        await supabase
          .from("payout_batches")
          .select("*, payout_items(*, creators(full_name))")
          .order("period", { ascending: false })
      ).data ?? [];
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["portal", "admin", "payouts"] });

  async function addRate() {
    const amount = Number(rate);
    if (!rate || isNaN(amount) || amount < 0) return toast.error("Enter a valid amount.");
    const { error } = await supabase
      .from("creator_rates")
      .upsert({ track, country: country.trim() || null, rate_usd: amount }, { onConflict: "track,country" });
    if (error) return toast.error("Could not save rate.");
    setRate(""); setCountry(""); toast.success("Rate saved."); refresh();
  }

  async function generate() {
    try {
      const res = await gen({ data: { period } });
      toast.success(`Batch created: ${res.items} payout line(s).`);
      if (res.missingRates.length) toast.warning(`No rate for: ${res.missingRates.join(", ")}`);
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not generate batch.");
    }
  }

  async function payBatch(batchId: string) {
    if (!confirm("Send real Stripe transfers for this batch?")) return;
    try {
      const res = await pay({ data: { batchId } });
      toast.success(`Paid: ${res.paid} · Skipped: ${res.skipped} · Failed: ${res.failed}`);
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Payment failed.");
    }
  }

  async function setBatchStatus(id: string, status: string) {
    await supabase.from("payout_batches").update({ status }).eq("id", id);
    refresh();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];

  return (
    <div className="space-y-6">
      <PageTitle title="Creator payouts" lead="Monthly batches from approved posts, paid by Stripe Connect." />
      <div className="flex flex-wrap gap-2">
        {(["batches", "rates", "creators"] as Tab[]).map((t) => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>{t}</Button>
        ))}
      </div>

      {tab === "rates" && (
        <>
          <PortalCard className="grid gap-2 p-4 sm:grid-cols-4">
            <select className="rounded-md border border-input bg-background px-3 text-sm" value={track} onChange={(e) => setTrack(e.target.value as "ugc" | "slideshow")}>
              <option value="ugc">UGC</option>
              <option value="slideshow">Slideshow</option>
            </select>
            <Input placeholder="Country (empty = default)" value={country} onChange={(e) => setCountry(e.target.value)} />
            <Input placeholder="Rate per post (USD)" type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
            <Button onClick={addRate}>Save rate</Button>
          </PortalCard>
          {rows.length === 0 ? (
            <EmptyState title="No rates yet" body="Add a rate per track (and optionally per country) before generating a batch." />
          ) : (
            <PortalCard className="divide-y p-0">
              {rows.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span>{r.track} · {r.country ?? "all countries"}</span>
                  <span className="font-semibold">${Number(r.rate_usd).toFixed(2)} / post</span>
                </div>
              ))}
            </PortalCard>
          )}
        </>
      )}

      {tab === "batches" && (
        <>
          <PortalCard className="flex flex-wrap items-end gap-2 p-4">
            <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-44" />
            <Button onClick={generate}>Generate batch</Button>
          </PortalCard>
          {rows.length === 0 ? (
            <EmptyState title="No batches" body="Pick a month and generate a batch from approved posts." />
          ) : (
            rows.map((b) => {
              const total = (b.payout_items ?? []).reduce((s: number, i: any) => s + Number(i.amount_usd), 0);
              return (
                <PortalCard key={b.id} className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold">{b.period}</span>
                      <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs">{b.status}</span>
                      <span className="ml-2 text-sm text-muted-foreground">${total.toFixed(2)} total</span>
                    </div>
                    <div className="flex gap-2">
                      {b.status === "draft" && <Button size="sm" variant="outline" onClick={() => setBatchStatus(b.id, "approved")}>Approve</Button>}
                      {b.status === "approved" && <Button size="sm" onClick={() => payBatch(b.id)}>Pay via Stripe</Button>}
                    </div>
                  </div>
                  <div className="divide-y text-sm">
                    {(b.payout_items ?? []).map((i: any) => (
                      <div key={i.id} className="flex items-center justify-between py-1.5">
                        <span>{i.creators?.full_name} — {i.posts_count} post(s) × ${Number(i.rate_usd).toFixed(2)}</span>
                        <span className="flex items-center gap-2">
                          <span className="font-medium">${Number(i.amount_usd).toFixed(2)}</span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{i.status}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </PortalCard>
              );
            })
          )}
        </>
      )}

      {tab === "creators" && (
        <PortalCard className="divide-y p-0">
          {rows.length === 0 && <EmptyState title="No creators" body="Add creators from the ops page first." />}
          {rows.map((c) => {
            const p = Array.isArray(c.creator_payout_profiles) ? c.creator_payout_profiles[0] : c.creator_payout_profiles;
            return (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
                <span>{c.full_name} · {c.track} · {c.country ?? "—"}</span>
                <span className={p?.stripe_onboarded ? "text-green-700" : "text-muted-foreground"}>
                  {p?.stripe_onboarded ? "Stripe ready" : "Not onboarded"}
                </span>
              </div>
            );
          })}
        </PortalCard>
      )}
    </div>
  );
}
