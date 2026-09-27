import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { claimCreatorInvite, linkCreatorByEmail } from "@/lib/creator-space.functions";
import { logCreatorPost } from "@/lib/creator-onboarding.functions";
import { startStripeOnboarding, syncStripeStatus } from "@/lib/creator-payouts.functions";
import { checkCreatorInvite, enterPostViews, savePayoutFallback, skipBrief } from "@/lib/creator-extras.functions";
import { CreatorMessages } from "./CreatorMessages";
import { CreatorOnboarding } from "./CreatorOnboarding";
import { WeeklyGuides } from "./WeeklyGuides";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function useSessionUser() {
  const [user, setUser] = useState<{ id: string; email?: string } | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return user;
}

function SignIn({ invite, invitedEmail }: { invite: string | null; invitedEmail: string }) {
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">(invite ? "up" : "in");
  const [busy, setBusy] = useState(false);
  const [adult, setAdult] = useState(false);
  const [state, setState] = useState<string | null>(null);
  const check = useServerFn(checkCreatorInvite);
  useEffect(() => {
    if (invite) check({ data: { token: invite } }).then((r) => { setState(r.state); if (r.state !== "fresh") setMode("in"); }).catch(() => setState("fresh"));
  }, [invite, check]);
  async function go() {
    if (mode === "up" && !adult) { toast.error("Confirm you are at least 18."); return; }
    setBusy(true);
    const res =
      mode === "up"
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.href } })
        : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (res.error) toast.error(res.error.message);
    else if (mode === "up" && !res.data.session) toast.success("Check your inbox to confirm your email, then come back to this link.");
  }
  return (
    <div className="mx-auto max-w-sm space-y-3 p-6">
      <h1 className="text-2xl font-extrabold text-brand-navy">Sophia creators</h1>
      {state === "used" && <p className="rounded-xl bg-portal-green/10 p-3 text-sm text-brand-navy">You have already set up your account. Sign in below with your email and password.</p>}
      {state === "expired" && <p className="rounded-xl bg-portal-amber/10 p-3 text-sm text-brand-navy">This invite is more than 30 days old. Ask the Sophia team for a new one, or sign in if you already created your account.</p>}
      {state === "invalid" && <p className="rounded-xl bg-portal-amber/10 p-3 text-sm text-brand-navy">This invite link is not valid. If you already have an account, sign in below.</p>}
      <p className="text-sm text-brand-navySoft">{mode === "up" ? "Create your account with the email your invite was sent to." : "Sign in to your creator space."}</p>
      <Input type="email" placeholder="Email" value={email} readOnly={Boolean(invite && invitedEmail)} onChange={(e) => setEmail(e.target.value)} />
      <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {mode === "up" && (
        <label className="flex items-start gap-2 text-sm text-brand-navySoft">
          <input type="checkbox" className="mt-1" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
          I confirm I am at least 18 years old.
        </label>
      )}
      {mode === "in" && (
        <button className="block text-xs text-brand-navySoft underline" onClick={async () => {
          if (!email) { toast.error("Enter your email first."); return; }
          const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
          if (error) toast.error(error.message); else toast.success("Check your inbox for a reset link.");
        }}>Forgot password?</button>
      )}
      <Button className="w-full" disabled={busy} onClick={go}>{mode === "up" ? "Create account" : "Sign in"}</Button>
      <button className="text-xs text-brand-navySoft underline" onClick={() => setMode(mode === "up" ? "in" : "up")}>
        {mode === "up" ? "I already have an account" : "I have an invite, create my account"}
      </button>
    </div>
  );
}

function Workspace() {
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [briefId, setBriefId] = useState("");
  const [refId, setRefId] = useState<string | null>(null);
  const submitPost = useServerFn(logCreatorPost);
  const skip = useServerFn(skipBrief);
  const setViews = useServerFn(enterPostViews);
  const { data } = useQuery({
    queryKey: ["creator-space"],
    queryFn: async () => {
      const { data: me } = await supabase.from("creators").select("*").maybeSingle();
      if (!me) return null;
      const [briefs, posts, calls, refs, payoutProfile, payoutItems, signature, notes, rsvps] = await Promise.all([
        supabase.from("briefs").select("*").eq("status", "published").order("created_at", { ascending: false }),
        supabase.from("creator_posts").select("*").order("posted_on", { ascending: false }),
        supabase.from("creator_calls").select("*").gte("starts_at", new Date().toISOString()).order("starts_at"),
        supabase.from("reference_videos").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("creator_payout_profiles").select("*").eq("creator_id", me.id).maybeSingle(),
        supabase.from("payout_items").select("*, payout_batches(period, status)").eq("creator_id", me.id).order("created_at", { ascending: false }),
        supabase.from("creator_signatures").select("signed_at").eq("creator_id", me.id).maybeSingle(),
        supabase.from("creator_notifications").select("*").is("read_at", null).order("created_at", { ascending: false }).limit(20),
        supabase.from("creator_call_rsvps").select("call_id, answer").eq("creator_id", me.id),
      ]);
      return { me, signed: Boolean(signature.data), briefs: briefs.data ?? [], posts: posts.data ?? [], calls: calls.data ?? [], refs: refs.data ?? [], payoutProfile: payoutProfile.data ?? null, payoutItems: payoutItems.data ?? [], notes: notes.data ?? [], rsvps: rsvps.data ?? [] };
    },
  });
  const linkByEmail = useServerFn(linkCreatorByEmail);
  useEffect(() => {
    if (data !== null) return;
    linkByEmail({} as never).then((r) => {
      if (r?.ok) qc.invalidateQueries({ queryKey: ["creator-space"] });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  if (data === undefined) return <p className="p-6 text-sm">Loading…</p>;
  if (data === null)
    return (
      <div className="mx-auto max-w-md p-6 text-sm text-brand-navySoft">
        This account is not linked to a creator invite. Open the invite link you received, or sign in with the email the invite was sent to.
        <Button variant="outline" className="mt-4" onClick={() => supabase.auth.signOut()}>Sign out</Button>
      </div>
    );
  if (!data.me.onboarding_completed_at) return <CreatorOnboarding me={{ ...data.me, agreementSigned: data.signed }} refs={data.refs} />;
  const monday = new Date(); monday.setUTCHours(0, 0, 0, 0); monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const week = data.posts.filter((p) => p.posted_on >= monday.toISOString().slice(0, 10) && p.status !== "flagged").length;

  async function logPost() {
    if (!/^https?:\/\//.test(url)) return toast.error("Paste the full link to your post.");
    try {
      await submitPost({ data: { url, platform: platform as "tiktok" | "instagram", briefId: briefId || null, referenceVideoId: refId } });
      setUrl(""); setRefId(null); toast.success("Post logged."); return qc.invalidateQueries({ queryKey: ["creator-space"] });
    } catch (error: any) {
      toast.error(error?.message ?? "Could not log the post.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-brand-navy">Hi {data.me.full_name.split(" ")[0]}</h1>
        <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>Sign out</Button>
      </div>
      {data.notes.length > 0 && (
        <section className="space-y-1 rounded-2xl border border-portal-amber/40 bg-portal-amber/10 p-4 text-sm">
          {data.notes.map((n) => <p key={n.id}>{n.body}</p>)}
          <button className="text-xs underline" onClick={async () => { await supabase.from("creator_notifications").update({ read_at: new Date().toISOString() }).in("id", data.notes.map((n) => n.id)); qc.invalidateQueries({ queryKey: ["creator-space"] }); }}>Mark all as read</button>
        </section>
      )}
      {data.calls.filter((c) => new Date(c.starts_at).getTime() - Date.now() < 86400000).map((c) => (
        <p key={c.id} className="rounded-2xl bg-portal-accent/10 p-3 text-sm font-semibold text-portal-accent">Reminder: {c.title} starts {new Date(c.starts_at).toLocaleString()}</p>
      ))}
      <section className="rounded-2xl border border-brand-line p-4">
        <p className="text-sm font-bold text-brand-navy">This week: {week} / {data.me.weekly_target} posts</p>
        <div className="mt-2 h-2 rounded-full bg-muted">
          <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, (week / Math.max(1, data.me.weekly_target)) * 100)}%` }} />
        </div>
      </section>
      <WeeklyGuides />
      <section className="space-y-2">
        <h2 className="font-bold text-brand-navy">Briefs</h2>
        {data.briefs.length === 0 && <p className="text-sm text-brand-navySoft">No brief yet.</p>}
        {data.briefs.map((b) => (
          <div key={b.id} className="rounded-2xl border border-brand-line p-4">
            <p className="font-semibold text-brand-navy">{b.title}</p>
            {b.hook && <p className="text-sm italic text-brand-navySoft">{b.hook}</p>}
            <p className="mt-1 whitespace-pre-wrap text-sm">{b.body}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setBriefId(b.id); document.getElementById("log-post")?.scrollIntoView({ behavior: "smooth" }); }}>I posted this</Button>
              <Button size="sm" variant="ghost" onClick={async () => {
                const reason = prompt("Why are you skipping this brief?");
                if (!reason) return;
                try { await skip({ data: { briefId: b.id, reason } }); toast.success("Thanks, the team has been told."); } catch (e: any) { toast.error(e?.message ?? "Could not skip."); }
              }}>Skip</Button>
            </div>
          </div>
        ))}
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-brand-navy">Library</h2>
        {data.refs.length === 0 && <p className="text-sm text-brand-navySoft">No reference video yet.</p>}
        {data.refs.map((r) => (
          <div key={r.id} className="flex items-center gap-2 rounded-xl border border-brand-line p-3 text-sm">
            {r.thumbnail_url && <img src={r.thumbnail_url} alt="" loading="lazy" className="h-12 w-9 rounded object-cover" />}
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex-1 font-semibold text-portal-accent">{r.platform} · {r.category}{r.note ? ` — ${r.note}` : ""}</a>
            <Button size="sm" variant="outline" onClick={() => { setRefId(r.id); toast.success("Linked. Now log your post below."); }}>Use this</Button>
          </div>
        ))}
      </section>
      <section id="log-post" className="space-y-2 rounded-2xl border border-brand-line p-4">
        <h2 className="font-bold text-brand-navy">Log every post{refId ? " (linked to a reference)" : ""}</h2>
        <p className="text-sm text-brand-navySoft">Every video published on the Sophia account must be added here.</p>
        <Input placeholder="https://www.tiktok.com/@…/video/…" value={url} onChange={(e) => setUrl(e.target.value)} />
        <div className="flex gap-2">
          <select className="rounded-md border px-2 text-sm" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="tiktok">TikTok</option><option value="instagram">Instagram</option>
          </select>
          <select className="flex-1 rounded-md border px-2 text-sm" value={briefId} onChange={(e) => setBriefId(e.target.value)}>
            <option value="">No brief</option>
            {data.briefs.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
          <Button onClick={logPost}>Log</Button>
        </div>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-brand-navy">My posts</h2>
        {data.posts.map((p) => (
          <div key={p.id} className={`rounded-xl border p-3 text-sm ${p.status === "flagged" ? "border-portal-amber bg-portal-amber/10" : "border-brand-line"}`}>
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-portal-accent">{p.platform} · {p.posted_on}</a> · {p.status}
            {p.pay_status === "due" && <span> · ${Number(p.amount_usd).toFixed(2)}</span>}
            {p.pay_status === "held" && <span> · payment pending a rate</span>}
            {p.feedback && <p className="mt-1">{p.feedback} <span className="text-xs text-brand-navySoft">(reply in Messages below)</span></p>}
            {p.status !== "flagged" && Date.now() - new Date(p.posted_on).getTime() >= 7 * 86400000 && (
              p.views != null ? <p className="mt-1 text-xs">{p.views.toLocaleString()} views</p> : (
                <button className="mt-1 block text-xs font-semibold text-portal-accent underline" onClick={async () => {
                  const v = Number(prompt("How many views does this post have today?"));
                  if (!Number.isFinite(v) || v < 0) return;
                  try { await setViews({ data: { postId: p.id, views: Math.round(v) } }); qc.invalidateQueries({ queryKey: ["creator-space"] }); } catch (e: any) { toast.error(e?.message ?? "Could not save."); }
                }}>Day 7: enter views</button>
              )
            )}
          </div>
        ))}
      </section>
      <CreatorMessages creatorId={data.me.id} />
      <PayoutSection profile={data.payoutProfile} items={data.payoutItems} />
      <section className="space-y-2">
        <h2 className="font-bold text-brand-navy">Upcoming calls</h2>
        {data.calls.length === 0 && <p className="text-sm text-brand-navySoft">No call scheduled.</p>}
        {data.calls.map((c) => (
          <div key={c.id} className="rounded-xl border border-brand-line p-3 text-sm">
            <b>{c.title}</b> · {new Date(c.starts_at).toLocaleString()} {c.link && <a className="text-portal-accent" href={c.link} target="_blank" rel="noopener noreferrer">Join</a>}
            <span className="ml-2 inline-flex gap-1">
              {(["yes", "no"] as const).map((ans) => {
                const mine = data.rsvps.find((r) => r.call_id === c.id)?.answer;
                return <Button key={ans} size="sm" variant={mine === ans ? "default" : "outline"} onClick={async () => {
                  await supabase.from("creator_call_rsvps").upsert({ call_id: c.id, creator_id: data.me.id, answer: ans }, { onConflict: "call_id,creator_id" });
                  qc.invalidateQueries({ queryKey: ["creator-space"] });
                }}>{ans === "yes" ? "I'll be there" : "Can't make it"}</Button>;
              })}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PayoutSection({ profile, items }: { profile: any; items: any[] }) {
  const qc = useQueryClient();
  const onboard = useServerFn(startStripeOnboarding);
  const sync = useServerFn(syncStripeStatus);
  const [busy, setBusy] = useState(false);
  const fallback = useServerFn(savePayoutFallback);
  const [showAlt, setShowAlt] = useState(false);
  const [altMethod, setAltMethod] = useState<"wise" | "paypal">(profile?.method === "paypal" ? "paypal" : "wise");
  const [altEmail, setAltEmail] = useState(profile?.wise_email ?? profile?.paypal_email ?? "");

  useEffect(() => {
    if (profile?.stripe_account_id && !profile.stripe_onboarded) {
      sync({} as never).then(() => qc.invalidateQueries({ queryKey: ["creator-space"] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.stripe_account_id]);

  async function connect() {
    setBusy(true);
    try {
      const { url } = await onboard({} as never);
      window.location.href = url;
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start Stripe onboarding.");
      setBusy(false);
    }
  }

  return (
    <section className="space-y-2">
      <h2 className="font-bold text-brand-navy">Payouts</h2>
      <div className="rounded-2xl border border-brand-line p-4 text-sm">
        {profile?.stripe_onboarded ? (
          <p className="text-green-700">Your Stripe account is connected. Monthly payouts are sent automatically.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-brand-navySoft">Connect your Stripe account to receive your monthly payouts.</p>
            <Button size="sm" disabled={busy} onClick={connect}>{busy ? "Opening Stripe…" : "Set up payouts with Stripe"}</Button>
            <button className="block text-xs underline" onClick={() => setShowAlt(!showAlt)}>Stripe not available in your country?</button>
            {(showAlt || profile?.method === "wise" || profile?.method === "paypal") && (
              <div className="flex flex-wrap gap-2">
                <select className="rounded-md border px-2 text-sm" value={altMethod} onChange={(e) => setAltMethod(e.target.value as "wise" | "paypal")}>
                  <option value="wise">Wise</option><option value="paypal">PayPal</option>
                </select>
                <Input className="flex-1" type="email" placeholder={`${altMethod === "wise" ? "Wise" : "PayPal"} email`} value={altEmail} onChange={(e) => setAltEmail(e.target.value)} />
                <Button size="sm" onClick={async () => {
                  try { await fallback({ data: { method: altMethod, email: altEmail } }); toast.success("Payout details saved."); qc.invalidateQueries({ queryKey: ["creator-space"] }); } catch (e: any) { toast.error(e?.message ?? "Could not save."); }
                }}>Save</Button>
              </div>
            )}
          </div>
        )}
        {items.length > 0 && (
          <div className="mt-3 divide-y">
            {items.map((i) => (
              <div key={i.id} className="flex items-center justify-between py-1.5">
                <span>{i.payout_batches?.period} — {i.posts_count} post(s)</span>
                <span className="flex items-center gap-2">
                  <b>${Number(i.amount_usd).toFixed(2)}</b>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{i.status}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function CreatorSpace() {
  const user = useSessionUser();
  const claim = useServerFn(claimCreatorInvite);
  const qc = useQueryClient();
  const [invite, setInvite] = useState<string | null>(null);
  const [invitedEmail, setInvitedEmail] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInvite(params.get("invite"));
    setInvitedEmail(params.get("email") ?? "");
  }, []);
  useEffect(() => {
    if (!user || !invite) return;
    if (invitedEmail && user.email && user.email.toLowerCase() !== invitedEmail.toLowerCase()) {
      // Signed in with another account: switch to the invited email instead of dead-ending.
      supabase.auth.signOut();
      return;
    }
    claim({ data: { token: invite } }).then((r) => {
      if (!r.ok) toast.error(r.error);
      window.history.replaceState(null, "", "/creators/app");
      setInvite(null);
      qc.invalidateQueries({ queryKey: ["creator-space"] });
    });
  }, [user, invite, claim, qc]);
  if (user === undefined) return null;
  if (!user) return <SignIn invite={invite} invitedEmail={invitedEmail} />;
  return <Workspace />;
}
