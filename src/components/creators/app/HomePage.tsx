import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CopyButton, PageTitle, PortalCard } from "@/components/portal/ui";
import { TAAP_LINK, useCreator, weekStart } from "./useCreator";

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
  const order = [steps.rules, steps.signed, steps.account, steps.payouts];
  const currentIdx = order.findIndex((d) => !d);
  const week = posts.filter((p) => p.posted_on >= weekStart() && p.status !== "flagged").length;
  const target = me.weekly_target || 5;
  const nextCall = [...calls].filter((c) => new Date(c.starts_at).getTime() > Date.now()).sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
  const feedback = posts.filter((p) => p.status === "flagged");
  const warm = (me.warmup ?? {}) as Record<string, string>;
  const warmCount = [1, 2, 3, 4, 5].filter((d) => warm[String(d)]).length;

  return (
    <div>
      <PageTitle title={`Welcome, ${first}`} lead="Your creator space: briefs, the reference library, your posts, calls, earnings and messages with the Sophia team." />

      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-extrabold text-brand-navy">Before you post</h2>
        <p className="text-sm font-bold text-brand-navySoft">{steps.count} of 4 done</p>
      </div>
      <div className="mb-2 h-2 rounded-full bg-brand-line"><div className="h-2 rounded-full bg-portal-green transition-all" style={{ width: `${(steps.count / 4) * 100}%` }} /></div>
      <div className="mt-4 space-y-4">
        <Step n={1} title="Read the rules" done={steps.rules} current={currentIdx === 0}>
          <p className="mt-2 text-sm text-brand-navySoft">Eight short rules about the account, posting, quality and pay. You accept them at the bottom of the page.</p>
          {steps.rules ? <p className="mt-3 text-sm font-semibold text-portal-green">Accepted on {fmt(me.rules_accepted_at!)}</p> : <Button asChild className="mt-4"><Link to="/creators/app/rules">Read the rules</Link></Button>}
        </Step>
        <Step n={2} title="Sign the Creator Account Agreement" done={steps.signed} current={currentIdx === 1}>
          <p className="mt-2 text-sm text-brand-navySoft">The account you set up belongs to Sophia; this agreement says so. Read it in full, then sign with your typed name.</p>
          {steps.signed ? <p className="mt-3 text-sm font-semibold text-portal-green">Signed on {fmt(signature!.signed_at)}</p> : <Button asChild className="mt-4" variant={steps.rules ? "default" : "outline"}><Link to="/creators/app/contract">Open the agreement</Link></Button>}
        </Step>
        <Step n={3} title="Set up your Sophia account" done={steps.account} current={currentIdx === 2}>
          <p className="mt-2 text-sm text-brand-navySoft">Create the TikTok account following the guide, register it here, then do the five-day warm-up.</p>
          {!steps.account && <p className="mt-2 text-xs font-semibold text-brand-navySoft">{me.social_account_created_at ? "Account registered" : "Account not registered yet"} · warm-up {warmCount}/5 days</p>}
          {steps.account ? <p className="mt-3 text-sm font-semibold text-portal-green">Account {me.social_handle} registered and warmed up</p> : <Button asChild className="mt-4" variant={steps.signed ? "default" : "outline"}><Link to="/creators/app/account">Open account setup</Link></Button>}
        </Step>
        <Step n={4} title="Set up payouts" done={steps.payouts} current={currentIdx === 3}>
          <p className="mt-2 text-sm text-brand-navySoft">Connect Stripe, or give a Wise or PayPal email if Stripe does not work in your country. This only unlocks Earnings; it does not block the rest.</p>
          {steps.payouts ? <p className="mt-3 text-sm font-semibold text-portal-green">Payout details saved</p> : <Button asChild className="mt-4" variant="outline"><Link to="/creators/app/profile" hash="payouts">Set up payouts</Link></Button>}
        </Step>
      </div>

      {steps.unlocked && (
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <PortalCard className="md:col-span-2">
            <p className="text-sm font-bold text-brand-navy">This week: {week} / {target} posts</p>
            <div className="mt-3 h-2 rounded-full bg-brand-line"><div className="h-2 rounded-full bg-portal-accent" style={{ width: `${Math.min(100, (week / target) * 100)}%` }} /></div>
          </PortalCard>
          <PortalCard>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Newest brief</p>
            {briefs[0] ? (
              <Link to="/creators/app/briefs/$briefId" params={{ briefId: briefs[0].id }} className="mt-2 block text-base font-extrabold text-portal-accent hover:underline">{briefs[0].title}</Link>
            ) : <p className="mt-2 text-sm text-brand-navySoft">No brief yet.</p>}
          </PortalCard>
          <PortalCard>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Next call</p>
            {nextCall ? (
              <div className="mt-2 text-sm">
                <p className="font-extrabold text-brand-navy">{nextCall.title}</p>
                <p className="text-brand-navySoft">{new Date(nextCall.starts_at).toLocaleString()} · {rsvps.find((r) => r.call_id === nextCall.id)?.answer ?? "no answer yet"}</p>
                <Link to="/creators/app/calls" className="text-xs font-semibold text-portal-accent underline">RSVP</Link>
              </div>
            ) : <p className="mt-2 text-sm text-brand-navySoft">No call scheduled.</p>}
          </PortalCard>
          <PortalCard className={cn(feedback.length > 0 && "border-2 border-portal-amber bg-portal-amber/10")}>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Feedback waiting</p>
            {feedback.length ? (
              <Link to="/creators/app/posts" className="mt-2 block text-base font-extrabold text-brand-navy underline">{feedback.length} post{feedback.length > 1 ? "s" : ""} need a reply</Link>
            ) : <p className="mt-2 text-sm text-brand-navySoft">Nothing waiting.</p>}
          </PortalCard>
          <AccessCodeCard />
        </div>
      )}
    </div>
  );
}

export function AccessCodeCard() {
  const { me } = useCreator();
  const store = me.platform === "android" ? "Play Store" : "App Store";
  return (
    <PortalCard>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-navySoft"><Smartphone className="size-4" /> Your Sophia app access</p>
      {me.platform ? (
        <p className="mt-2 text-base font-extrabold text-brand-navy">Your code goes into the {store}, not into the Sophia app.</p>
      ) : (
        <p className="mt-2 text-sm font-semibold text-portal-amber">Tell us whether you use an iPhone or an Android phone on <Link to="/creators/app/profile" className="underline">your profile page</Link> and we will give you a code for the right store.</p>
      )}
      {me.access_code ? (
        <>
          <p className="mt-4 rounded-2xl bg-portal-bg px-4 py-3 font-mono text-xl font-bold tracking-[0.12em] text-brand-navy">{me.access_code}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton value={me.access_code} label="Copy code" />
            {me.access_redeem_url ? <Button asChild variant="pillSecondary" size="pillSm"><a href={me.access_redeem_url} target="_blank" rel="noreferrer noopener">Redeem</a></Button> : null}
          </div>
          <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-brand-navySoft">
            <li>Open the {store}, not Sophia</li>
            <li>Tap your profile picture, top right</li>
            <li>{store === "App Store" ? "Choose Redeem Gift Card or Code" : "Choose Payments and subscriptions"}</li>
            <li>{store === "App Store" ? "Choose Enter Code Manually" : "Choose Redeem code"}</li>
            <li>Paste the code above</li>
          </ol>
        </>
      ) : (
        <p className="mt-4 text-sm text-brand-navySoft">Your code is on its way. The Sophia team will add it here as soon as it is issued.</p>
      )}
      <p className="mt-4 text-sm font-semibold text-brand-navy">Searching for Sophia will bury you in results. This link goes straight to the right listing:</p>
      <a href={TAAP_LINK} target="_blank" rel="noopener noreferrer" className="mt-1 block font-bold text-portal-accent underline">{TAAP_LINK.replace("https://", "")}</a>
    </PortalCard>
  );
}
