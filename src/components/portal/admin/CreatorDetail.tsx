import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Banner, EmptyState, PageTitle, PortalCard } from "../ui";
import { adminAssignCreatorCode, adminCreatorDetail, adminRevealCredentials } from "@/lib/creator-app.functions";
import { adminResendCreatorInvite } from "@/lib/ugc-admin.functions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AppEnrolment } from "./AppEnrolment";
import { HandleLinksInline, PersonAvatar, useCreatorPhotos } from "@/components/hub/PersonAvatar";
import { flag } from "@/components/hub/hub-data";
import { UgcCreatorPanel } from "./UgcAdmin";
import { creatorSteps, SETUP_GUIDE, WARMUP_DAYS } from "@/lib/creator-steps";

const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

/** Opens the signed contract snapshot in a printable window (Print → Save as PDF). */
export function printContract(text: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  w.document.write(`<!doctype html><title>Contract</title><pre style="white-space:pre-wrap;font:14px/1.5 Georgia,serif;max-width:720px;margin:40px auto">${esc}</pre>`);
  w.document.close(); w.focus(); w.print();
}

export function CreatorDetail({ creatorId }: { creatorId: string }) {
  const qc = useQueryClient();
  const detailFn = useServerFn(adminCreatorDetail);
  const revealFn = useServerFn(adminRevealCredentials);
  const assignFn = useServerFn(adminAssignCreatorCode);
  const resendFn = useServerFn(adminResendCreatorInvite);
  const [creds, setCreds] = useState<{ handle: string; email: string; password: string } | null>(null);
  const { data: me } = useQuery({
    queryKey: ["admin-creator", creatorId],
    queryFn: async () => (await supabase.from("creators").select("*").eq("id", creatorId).maybeSingle()).data,
  });
  const photos = useCreatorPhotos([creatorId]);
  const { data: detail } = useQuery({ queryKey: ["admin-creator-detail", creatorId], queryFn: () => detailFn({ data: { creatorId } }) });
  if (me === undefined || !detail) return <p className="text-sm text-brand-navySoft">Loading…</p>;
  if (!me) return <EmptyState title="Creator not found" />;
  const steps = creatorSteps(me, Boolean(detail.signature), detail.payout, detail.signature?.document_version);
  const current = !steps.signed ? "Step 1: sign the UGC contract" : !steps.rules ? "Step 2: read the shooting guidelines" : "Onboarding complete";
  const warm = (me.warmup ?? {}) as Record<string, string>;
  const checks = (me.setup_guide_checks ?? {}) as Record<string, string>;

  return (
    <div>
      <Link to={me.track === "ugc" ? "/hub/ugc/creators" : "/auteurs/admin/creators/ops"} search={(me.track === "ugc" ? { view: "directory" } : {}) as never} className="text-sm font-semibold text-portal-accent">← Creators</Link>
      <div className="mb-6 mt-3 flex items-center gap-4">
        <PersonAvatar name={me.full_name} url={photos[creatorId]} size={64} />
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-brand-navy">{me.full_name} <span className="text-lg">{flag(me.country)}</span></h1>
          <p className="text-sm text-brand-navySoft">{me.email_pending ? "email pending" : me.email}{me.phone ? ` · ${me.phone}` : ""} · {me.country ?? "no country"} · {["paused", "ended", "dormant"].includes(String(me.ugc_status ?? me.status)) ? "paused" : "active"}</p>
          <HandleLinksInline tiktok={me.tiktok_handle} instagram={me.instagram_handle} />
        </div>
        {me.track === "ugc" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="ml-auto" aria-label="More actions">⋯</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={async () => {
                try { const r = await resendFn({ data: { creatorId, origin: window.location.origin } }); if (r.sent) toast.success(`Invitation sent to ${me.email}`); else toast.error("The email could not be sent. Try again later."); }
                catch { toast.error("The invitation could not be resent."); }
              }}>Resend invitation</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AppEnrolment kind="creator" personId={creatorId} />
        <PortalCard>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Onboarding</p>
          <p className="mt-1 text-2xl font-extrabold text-brand-navy">{steps.count}/2</p>
          <p className="text-sm text-brand-navySoft">{current}</p>
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex items-center gap-2"><dt className="text-brand-navySoft">Status:</dt><dd className="flex gap-1">{(["active", "paused"] as const).map((s) => { const paused = ["paused", "ended", "dormant", "archived", "rejected"].includes(String(me.ugc_status ?? me.status)); const current = paused ? "paused" : "active"; return <button key={s} type="button" disabled={current === s} onClick={async () => { const { error } = await supabase.from("creators").update({ ugc_status: s }).eq("id", creatorId); if (error) toast.error("Could not save"); else { toast.success(s === "paused" ? "Creator paused" : "Creator active"); void qc.invalidateQueries({ queryKey: ["admin-creator", creatorId] }); } }} className={current === s ? "rounded-full bg-brand-navy px-3 py-1 text-xs font-bold text-card" : "rounded-full bg-muted px-3 py-1 text-xs font-bold text-brand-navySoft hover:text-brand-navy"}>{s === "active" ? "Active" : "Paused"}</button>; })}</dd></div>
            <div data-testid="contract-status"><dt className="inline text-brand-navySoft">Contract: </dt><dd className="inline font-semibold">{detail.signature ? `Contrat signé le ${new Date(detail.signature.signed_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} (v${detail.signature.document_version}, ${(detail.signature.contract_lang ?? "en").toUpperCase()})` : "Pas encore signé"}</dd>
              {detail.signature?.contract_snapshot ? <button type="button" className="ml-2 text-xs font-semibold text-portal-accent underline" onClick={() => printContract(detail.signature!.contract_snapshot!)}>View / print</button> : null}</div>
            <div><dt className="inline text-brand-navySoft">Shooting guidelines: </dt><dd className="inline font-semibold">{me.guidelines_accepted_at ? fmt(me.guidelines_accepted_at) : "not yet"}</dd></div>
            <div><dt className="inline text-brand-navySoft">App codes: </dt><dd className="inline font-semibold">{detail.codes.length ? detail.codes.map((c) => `${c.app_id === "00000000-0000-4000-8000-000000000002" ? "UnSwipe" : "Sophia"} ${c.platform === "android" ? "Android" : "iOS"}: ${c.code}`).join(" · ") : "none drawn yet"}</dd></div>
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

      </div>
      {me.track === "ugc" ? <CreatorPostsAndPay creatorId={creatorId} /> : null}
      {!me.user_id && <div className="mt-6"><Banner tone="info" title="This creator has not created their account yet" /></div>}
    </div>
  );
}

function CreatorPostsAndPay({ creatorId }: { creatorId: string }) {
  const { data } = useQuery({
    queryKey: ["admin-creator-posts-pay", creatorId],
    queryFn: async () => {
      const [p, pay] = await Promise.all([
        supabase.from("creator_posts").select("id, url, platform, status, posted_on, created_at, views").eq("creator_id", creatorId).order("created_at", { ascending: false }).limit(100),
        Promise.resolve({ data: [] }),
      ]);
      return { posts: (p.data ?? []) as any[], pay: (pay.data ?? []) as any[] }; // eslint-disable-line @typescript-eslint/no-explicit-any
    },
  });
  const dd = (x?: string | null) => (x ? new Date(x).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <PortalCard>
        <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Posts</p>
        {data?.posts.length ? <ul className="mt-2 divide-y divide-brand-line text-sm">{data.posts.map((p) => <li key={p.id} className="flex items-center gap-2 py-2"><a href={p.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-semibold text-portal-accent">{p.platform} · {dd(p.posted_on ?? p.created_at)}</a><span className="text-xs text-brand-navySoft">{Number(p.views ?? 0).toLocaleString()} views</span><span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold">{p.status}</span></li>)}</ul> : <p className="mt-2 text-sm text-brand-navySoft">No posts yet.</p>}
      </PortalCard>
    </div>
  );
}
