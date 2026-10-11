import { AppBadge, SOPHIA_APP_ID, useApps, type AppRow } from "@/lib/apps";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CopyButton, PageTitle, PortalCard } from "@/components/portal/ui";
import { WeeklyGuides } from "../WeeklyGuides";
import { TAAP_LINK, useCreator } from "./useCreator";
import { WeeklyBar } from "./WorkPages";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { myRunningMonth } from "@/lib/ugc-creator.functions";
import { CreatorStatsStrip } from "./HubPages";
import { supabase } from "@/integrations/supabase/client";
import { FilesSection, type BriefAsset } from "@/components/hub/BriefPreview";
import { t as ct } from "@/i18n/creator-app";

/** "Kit de démarrage": the app's screen recordings, logos and bio/CTA texts, plus the creator's personal files. */
function StarterKit() {
  const { me } = useCreator();
  const { data = [] } = useQuery({
    queryKey: ["creator-starter-kit", me.id],
    queryFn: async () => {
      const [a, mine] = await Promise.all([
        supabase.from("assets").select("id, kind, title, storage_path, url, text_content, thumbnail_url, role_default, folder").in("folder", ["screen_recordings", "logos", "captions"]).eq("status", "ready").order("folder"),
        supabase.from("creator_assets").select("role, assets(id, kind, title, storage_path, url, text_content, thumbnail_url)").eq("creator_id", me.id),
      ]);
      const own = (mine.data ?? []).filter((x) => x.assets).map((x) => ({ ...(x.assets as unknown as BriefAsset), role: x.role }));
      return [...own, ...(a.data ?? []).map((x) => ({ ...(x as unknown as BriefAsset), role: x.role_default }))];
    },
  });
  if (!data.length) return null;
  return <PortalCard><h2 className="mb-3 text-lg font-extrabold text-brand-navy">{ct("Kit de démarrage")}</h2><FilesSection assets={data} title={ct("Écrans de l'app, logos et textes")} /></PortalCard>;
}

function Step({ n, title, done, current, children }: { n: number; title: string; done: boolean; current: boolean; children: ReactNode }) {
  return (
    <PortalCard className={cn("flex gap-5", done && "opacity-70", current && "ring-2 ring-portal-accent/40")}>
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold", done ? "bg-portal-green/12 text-portal-green" : "bg-brand-navy text-white")} aria-hidden="true">
        {done ? <Check className="size-5" /> : n}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-extrabold leading-snug text-brand-navy">{title}</h3>
        {children}
      </div>
    </PortalCard>
  );
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export function CreatorHomePage() {
  const { me, steps, signature, briefs, calls, posts, rsvps } = useCreator();
  const first = me.full_name.split(" ")[0];
  const order = [steps.rules, steps.signed, steps.accounts, steps.warmDone, steps.payouts, steps.slack];
  const currentIdx = order.findIndex((d) => !d);
  const monthFn = useServerFn(myRunningMonth);
  const { data: month } = useQuery({ queryKey: ["creator-month"], queryFn: () => monthFn() });
  const found = month?.breakdown.postsCounted ?? 0;
  const target = month?.breakdown.target ?? (me as any).posts_per_month ?? 20;
  const nextCall = [...calls].filter((c) => new Date(c.starts_at).getTime() > Date.now()).sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
  const feedback = posts.filter((p) => p.status === "flagged");
  const warm = (me.warmup ?? {}) as Record<string, string>;
  const warmDone = Boolean(warm["1"]);

  return (
    <div>
      <PageTitle title={`Welcome, ${first}`} lead={ct("Your creator space: briefs, the reference library, your posts, calls, earnings and messages with the Sophia team.")} />
      <ol className="mb-6 grid gap-3 sm:grid-cols-3" data-testid="loop-strip">
        {([["1", "Lis ton brief", "/creators/app/briefs"], ["2", "Poste", "/creators/app/briefs"], ["3", "Colle tes liens", "/creators/app/posts"]] as const).map(([n, l, to]) => (
          <li key={n}><Link to={to} className="flex min-h-14 items-center gap-3 rounded-2xl bg-card p-4 font-extrabold text-brand-navy shadow-portal hover:ring-2 hover:ring-portal-accent/30"><span className="grid size-8 place-items-center rounded-full bg-portal-accent text-card">{n}</span>{l}</Link></li>
        ))}
      </ol>
      <div className="mb-6"><WeeklyBar /></div>
      <CreatorStatsStrip />
      <p className="-mt-4 mb-6 text-xs text-brand-navySoft">{ct("Bookmark this page: sophia-culture.com/creators/login is where you sign in from now on.")}</p>

      {steps.resignPending && (
        <div className="mb-6"><PortalCard className="border-2 border-portal-amber bg-portal-amber/10">
          <p className="font-extrabold text-brand-navy">{ct("Please re-sign the Creator Account Agreement (version 3)")}</p>
          <p className="mt-1 text-sm text-brand-navySoft">{ct("Clauses 2 and 4 changed: the Instagram account and the Sophia email are now covered, and advertising codes are included.")}</p>
          <Button asChild className="mt-3"><Link to="/creators/app/contract">{ct("Open the agreement")}</Link></Button>
        </PortalCard></div>
      )}
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-extrabold text-brand-navy">{ct("Before you post")}</h2>
        <p className="text-sm font-bold text-brand-navySoft">{steps.count} of 6 done</p>
      </div>
      <div className="mb-2 h-2 rounded-full bg-brand-line"><div className="h-2 rounded-full bg-portal-green transition-all" style={{ width: `${(steps.count / 6) * 100}%` }} /></div>
      <div className="mt-4 space-y-4">
        <Step n={1} title={ct("Read the rules")} done={steps.rules} current={currentIdx === 0}>
          <p className="mt-2 text-sm text-brand-navySoft">{ct("Eight short rules about the accounts, your target, quality and pay.")}</p>
          {steps.rules ? <p className="mt-3 text-sm font-semibold text-portal-green">Accepted on {fmt(me.rules_accepted_at!)}</p> : <Button asChild className="mt-4"><Link to="/creators/app/rules">{ct("Read the rules")}</Link></Button>}
        </Step>
        <Step n={2} title={ct("Sign the Creator Account Agreement")} done={steps.signed} current={currentIdx === 1}>
          <p className="mt-2 text-sm text-brand-navySoft">The TikTok, Instagram and email accounts belong to Sophia; this agreement says so.</p>
          {steps.signed ? <p className="mt-3 text-sm font-semibold text-portal-green">Signed on {fmt(signature!.signed_at)}</p> : <Button asChild className="mt-4" variant={steps.rules ? "default" : "outline"}><Link to="/creators/app/contract">{ct("Open the agreement")}</Link></Button>}
        </Step>
        <Step n={3} title={ct("Create your accounts")} done={steps.accounts} current={currentIdx === 2}>
          <p className="mt-2 text-sm text-brand-navySoft">{ct("A new Gmail or Outlook address, then TikTok and Instagram with it. Register all three here.")}</p>
          {steps.accounts ? <p className="mt-3 text-sm font-semibold text-portal-green">{[(me as any).tiktok_handle, (me as any).instagram_handle].filter(Boolean).join(" · ")} registered</p> : <Button asChild className="mt-4" variant={steps.signed ? "default" : "outline"}><Link to="/creators/app/account">{ct("Open account setup")}</Link></Button>}
        </Step>
        <Step n={4} title={ct("Warm-up, 24 hours")} done={steps.warmDone} current={currentIdx === 3}>
          <p className="mt-2 text-sm text-brand-navySoft">{ct("Scroll 10 minutes, follow 10 accounts in the niche, like and repost. No posting yet.")}</p>
          {!steps.warmDone && <Button asChild className="mt-4" variant="outline"><Link to="/creators/app/account">{ct("Open the warm-up")}</Link></Button>}
        </Step>
        <Step n={5} title={ct("Set up payouts")} done={steps.payouts} current={currentIdx === 4}>
          <p className="mt-2 text-sm text-brand-navySoft">{ct("Stripe by default, bank transfer with invoice as a fallback.")}</p>
          {steps.payouts ? <p className="mt-3 text-sm font-semibold text-portal-green">{ct("Payout details saved")}</p> : <Button asChild className="mt-4" variant="outline"><Link to="/creators/app/profile" hash="payouts">{ct("Set up payouts")}</Link></Button>}
        </Step>
        <Step n={6} title={ct("Join Slack")} done={steps.slack} current={currentIdx === 5}>
          <p className="mt-2 text-sm text-brand-navySoft">{ct("Where the team shares news and answers questions.")}</p>
          {!steps.slack && <Button asChild className="mt-4" variant="outline"><Link to="/creators/app/account">{ct("Join Slack")}</Link></Button>}
        </Step>
      </div>

      <div className="mt-10"><StarterKit /></div>

      {steps.unlocked && (
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <PortalCard className="md:col-span-2">
            <p className="text-sm font-bold text-brand-navy">This month: {found} / {target} posts found online</p>
            <div className="mt-3 h-2 rounded-full bg-brand-line"><div className="h-2 rounded-full bg-portal-accent" style={{ width: `${Math.min(100, (found / Math.max(1, target)) * 100)}%` }} /></div>
            <p className="mt-2 text-xs text-brand-navySoft">Your monthly target is {target} posts. We count what is actually online on your registered accounts.</p>
          </PortalCard>
          <PortalCard>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">{ct("Newest brief")}</p>
            {briefs[0] ? (
              <Link to="/creators/app/briefs/$briefId" params={{ briefId: briefs[0].id }} className="mt-2 block text-base font-extrabold text-portal-accent hover:underline">{briefs[0].title}</Link>
            ) : <p className="mt-2 text-sm text-brand-navySoft">{ct("No brief yet.")}</p>}
          </PortalCard>
          <PortalCard>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">{ct("Next call")}</p>
            {nextCall ? (
              <div className="mt-2 text-sm">
                <p className="font-extrabold text-brand-navy">{nextCall.title}</p>
                <p className="text-brand-navySoft">{new Date(nextCall.starts_at).toLocaleString()} · {rsvps.find((r) => r.call_id === nextCall.id)?.answer ?? "no answer yet"}</p>
                <Link to="/creators/app/calls" className="text-xs font-semibold text-portal-accent underline">{ct("RSVP")}</Link>
              </div>
            ) : <p className="mt-2 text-sm text-brand-navySoft">{ct("No call scheduled.")}</p>}
          </PortalCard>
          <PortalCard className={cn(feedback.length > 0 && "border-2 border-portal-amber bg-portal-amber/10")}>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">{ct("Feedback waiting")}</p>
            {feedback.length ? (
              <Link to="/creators/app/posts" className="mt-2 block text-base font-extrabold text-brand-navy underline">{feedback.length} post{feedback.length > 1 ? "s" : ""} need a reply</Link>
            ) : <p className="mt-2 text-sm text-brand-navySoft">{ct("Nothing waiting.")}</p>}
          </PortalCard>
          <AccessCodeCard />
          <div className="md:col-span-2"><WeeklyGuides /></div>
        </div>
      )}
    </div>
  );
}

export function AccessCodeCard() {
  const { enrolledApps, codes } = useCreator();
  const { data: apps = [] } = useApps();
  const mine = apps.filter((a) => enrolledApps.includes(a.id));
  return (
    <>
      {mine.map((a) => a.id === SOPHIA_APP_ID ? <SophiaAccessCard key={a.id} /> : <OtherAppAccessCard key={a.id} app={a} code={codes.find((c) => c.app_id === a.id) ?? null} />)}
    </>
  );
}

function OtherAppAccessCard({ app, code }: { app: AppRow; code: { code: string; redeem_url: string | null } | null }) {
  const { me } = useCreator();
  const store = me.platform === "android" ? "Play Store" : "App Store";
  const link = app.taap_url || (me.platform === "android" ? app.play_store_url : app.app_store_url);
  return (
    <PortalCard>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-navySoft"><Smartphone className="size-4" /> Your {app.name} app access <AppBadge appId={app.id} /></p>
      {code ? (
        <>
          <p className="mt-2 text-base font-extrabold text-brand-navy">Your code goes into the {store}, not into the {app.name} app.</p>
          <p className="mt-4 rounded-2xl bg-portal-bg px-4 py-3 font-mono text-xl font-bold tracking-[0.12em] text-brand-navy">{code.code}</p>
          <div className="mt-3 flex flex-wrap gap-2"><CopyButton value={code.code} label={ct("Copy code")} />{code.redeem_url ? <Button asChild variant="pillSecondary" size="pillSm"><a href={code.redeem_url} target="_blank" rel="noreferrer noopener">{ct("Redeem")}</a></Button> : null}</div>
          <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-brand-navySoft">
            <li>Open the {store}, not {app.name}</li>
            <li>{ct("Tap your profile picture, top right")}</li>
            <li>{store === "App Store" ? "Choose Redeem Gift Card or Code" : "Choose Payments and subscriptions"}</li>
            <li>{store === "App Store" ? "Choose Enter Code Manually" : "Choose Redeem code"}</li>
            <li>{ct("Paste the code above")}</li>
          </ol>
        </>
      ) : <p className="mt-3 text-base font-extrabold text-brand-navy">{ct("Code coming soon")}</p>}
      {link ? <a href={link} target="_blank" rel="noopener noreferrer" className="mt-4 block font-bold text-portal-accent underline">Open {app.name} in the store</a> : null}
    </PortalCard>
  );
}

function SophiaAccessCard() {
  const { me } = useCreator();
  const store = me.platform === "android" ? "Play Store" : "App Store";
  return (
    <PortalCard>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-navySoft"><Smartphone className="size-4" /> {ct("Your Sophia app access")}</p>
      {me.platform ? (
        <p className="mt-2 text-base font-extrabold text-brand-navy">Your code goes into the {store}, not into the Sophia app.</p>
      ) : (
        <p className="mt-2 text-sm font-semibold text-portal-amber">{ct("Tell us whether you use an iPhone or an Android phone on")} <Link to="/creators/app/profile" className="underline">{ct("your profile page")}</Link> {ct("and we will give you a code for the right store.")}</p>
      )}
      {me.access_code ? (
        <>
          <p className="mt-4 rounded-2xl bg-portal-bg px-4 py-3 font-mono text-xl font-bold tracking-[0.12em] text-brand-navy">{me.access_code}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton value={me.access_code} label={ct("Copy code")} />
            {me.access_redeem_url ? <Button asChild variant="pillSecondary" size="pillSm"><a href={me.access_redeem_url} target="_blank" rel="noreferrer noopener">{ct("Redeem")}</a></Button> : null}
          </div>
          <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-brand-navySoft">
            <li>Open the {store}, not Sophia</li>
            <li>{ct("Tap your profile picture, top right")}</li>
            <li>{store === "App Store" ? "Choose Redeem Gift Card or Code" : "Choose Payments and subscriptions"}</li>
            <li>{store === "App Store" ? "Choose Enter Code Manually" : "Choose Redeem code"}</li>
            <li>{ct("Paste the code above")}</li>
          </ol>
        </>
      ) : (
        <p className="mt-4 text-sm text-brand-navySoft">{ct("Your code is on its way. The Sophia team will add it here as soon as it is issued.")}</p>
      )}
      <p className="mt-4 text-sm font-semibold text-brand-navy">{ct("Searching for Sophia will bury you in results. This link goes straight to the right listing:")}</p>
      <a href={TAAP_LINK} target="_blank" rel="noopener noreferrer" className="mt-1 block font-bold text-portal-accent underline">{TAAP_LINK.replace("https://", "")}</a>
    </PortalCard>
  );
}
