import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Banner, EmptyState, PageTitle, PortalCard } from "../ui";
import { adminAssignCreatorCode, adminCreatorDetail, adminRevealCredentials } from "@/lib/creator-app.functions";
import { AppEnrolment } from "./AppEnrolment";
import { UgcCreatorPanel } from "./UgcAdmin";
import { creatorSteps, SETUP_GUIDE, WARMUP_DAYS } from "@/lib/creator-steps";

const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

export function CreatorDetail({ creatorId }: { creatorId: string }) {
  const qc = useQueryClient();
  const detailFn = useServerFn(adminCreatorDetail);
  const revealFn = useServerFn(adminRevealCredentials);
  const assignFn = useServerFn(adminAssignCreatorCode);
  const [creds, setCreds] = useState<{ handle: string; email: string; password: string } | null>(null);
  const { data: me } = useQuery({
    queryKey: ["admin-creator", creatorId],
    queryFn: async () => (await supabase.from("creators").select("*").eq("id", creatorId).maybeSingle()).data,
  });
  const { data: detail } = useQuery({ queryKey: ["admin-creator-detail", creatorId], queryFn: () => detailFn({ data: { creatorId } }) });
  if (me === undefined || !detail) return <p className="text-sm text-brand-navySoft">Loading…</p>;
  if (!me) return <EmptyState title="Creator not found" />;
  const steps = creatorSteps(me, Boolean(detail.signature), detail.payout, detail.signature?.document_version);
  const current = !steps.rules ? "Step 1: read the rules" : !steps.signed ? (steps.resignPending ? "Step 2: re-sign agreement v3" : "Step 2: sign the agreement") : !steps.accounts ? "Step 3: create accounts" : !steps.warmDone ? "Step 4: warm-up" : !steps.payouts ? "Step 5: payouts" : !steps.slack ? "Step 6: Slack" : "Onboarding complete";
  const warm = (me.warmup ?? {}) as Record<string, string>;
  const checks = (me.setup_guide_checks ?? {}) as Record<string, string>;

  return (
    <div>
      <Link to="/auteurs/admin/creators/ops" className="text-sm font-semibold text-portal-accent">← Creators</Link>
      <div className="mt-3"><PageTitle title={me.full_name} lead={`${me.email} · ${me.country ?? "no country"} · ${me.track} · status ${me.status}`} /></div>

      <div className="grid gap-4 md:grid-cols-2">
        <AppEnrolment kind="creator" personId={creatorId} />
        <PortalCard>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Onboarding</p>
          <p className="mt-1 text-2xl font-extrabold text-brand-navy">{steps.count}/6</p>
          <p className="text-sm text-brand-navySoft">{current}</p>
          <dl className="mt-4 space-y-1 text-sm">
            <div><dt className="inline text-brand-navySoft">Rules accepted: </dt><dd className="inline font-semibold">{fmt(me.rules_accepted_at)}{me.rules_version ? ` (v${me.rules_version})` : ""}</dd></div>
            <div><dt className="inline text-brand-navySoft">Agreement signed: </dt><dd className="inline font-semibold">{detail.signature ? `${fmt(detail.signature.signed_at)} · ${detail.signature.variant} variant · v${detail.signature.document_version}` : "—"}</dd></div>
            <div><dt className="inline text-brand-navySoft">Payouts: </dt><dd className="inline font-semibold">{detail.payout?.stripe_onboarded ? "Stripe connected" : detail.payout?.method === "wise" || detail.payout?.method === "paypal" ? `${detail.payout.method} · ${detail.payout.wise_email ?? detail.payout.paypal_email}` : "not set up"}</dd></div>
            <div className="flex items-center gap-2"><dt className="text-brand-navySoft"><label htmlFor="weekly-target">Weekly target (Mon→Sun):</label></dt><dd><input id="weekly-target" type="number" min={0} max={50} defaultValue={me.weekly_target ?? 5} className="h-8 w-16 rounded-lg border px-2 text-sm font-semibold" onBlur={async (e) => { const v = Math.max(0, Math.min(50, Number(e.target.value) || 0)); if (v === me.weekly_target) return; const { error } = await supabase.from("creators").update({ weekly_target: v }).eq("id", creatorId); if (error) toast.error("Could not save"); else { toast.success("Weekly target saved"); void qc.invalidateQueries({ queryKey: ["admin-creator", creatorId] }); } }} /> posts</dd></div>
          </dl>
        </PortalCard>

        <PortalCard>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Sophia email & credentials</p>
          {detail.account ? (
            <div className="mt-2 space-y-1 text-sm">
              <p className="text-lg font-extrabold text-brand-navy">{detail.account.handle}</p>
              <p>Email: {detail.account.account_email}</p>
              <p>Phone: {detail.account.phone || "—"} · Device: {detail.account.device || "—"}</p>
              <p className="text-brand-navySoft">Registered {fmt(detail.account.registered_at)}</p>
              {creds ? (
                <div className="mt-2 rounded-xl bg-portal-amber/10 p-3 font-mono text-sm">Password: {creds.password}</div>
              ) : (
                <Button size="sm" variant="outline" className="mt-2" onClick={async () => {
                  try { setCreds(await revealFn({ data: { creatorId } })); } catch (e: any) { toast.error(e?.message ?? "Could not reveal."); }
                }}>Reveal credentials</Button>
              )}
              <p className="text-xs text-brand-navySoft">Each reveal is recorded in the activity log.</p>
            </div>
          ) : <p className="mt-2 text-sm text-brand-navySoft">Not registered yet.</p>}
        </PortalCard>

        <PortalCard>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Account sub-steps</p>
          <ul className="mt-2 space-y-1 text-sm">
            {SETUP_GUIDE.map((g) => <li key={g.key}>{checks[g.key] ? "✓" : "○"} Step {g.key} {checks[g.key] ? <span className="text-brand-navySoft">· {fmt(checks[g.key])}</span> : null}</li>)}
          </ul>
        </PortalCard>

        <PortalCard>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Warm-up</p>
          <ul className="mt-2 space-y-1 text-sm">
            {WARMUP_DAYS.map((d) => <li key={d.day}>{warm[String(d.day)] ? "✓" : "○"} 24-hour warm-up {warm[String(d.day)] ? <span className="text-brand-navySoft">· {fmt(warm[String(d.day)])}</span> : null}</li>)}
          </ul>
        </PortalCard>

        <PortalCard className="md:col-span-2">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Sophia app access code</p>
          {me.access_code ? (
            <p className="mt-2 font-mono text-lg font-bold text-brand-navy">{me.access_code} <span className="text-sm font-normal text-brand-navySoft">({me.platform})</span></p>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-sm text-brand-navySoft">No code yet. Assign a real one from the pool{me.platform ? ` (creator uses ${me.platform === "ios" ? "iPhone" : "Android"})` : " (creator has not chosen a phone type)"}:</p>
              {(["ios", "android"] as const).map((p) => (
                <Button key={p} size="sm" variant={me.platform === p ? "default" : "outline"} onClick={async () => {
                  try { await assignFn({ data: { creatorId, platform: p } }); toast.success("Code assigned."); qc.invalidateQueries({ queryKey: ["admin-creator", creatorId] }); }
                  catch (e: any) { toast.error(e?.message ?? "Could not assign."); }
                }}>Assign {p === "ios" ? "Apple" : "Google"} code</Button>
              ))}
            </div>
          )}
        </PortalCard>
      </div>
      {me.track === "ugc" && <UgcCreatorPanel creator={me} />}
      {!me.user_id && <div className="mt-6"><Banner tone="info" title="This creator has not created their account yet" /></div>}
    </div>
  );
}
