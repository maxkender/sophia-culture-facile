import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { claimCreatorInvite } from "@/lib/creator-space.functions";
import { startStripeOnboarding, syncStripeStatus } from "@/lib/creator-payouts.functions";
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

function SignIn({ invite }: { invite: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">(invite ? "up" : "in");
  const [busy, setBusy] = useState(false);
  async function go() {
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
      <p className="text-sm text-brand-navySoft">{mode === "up" ? "Create your account with the email your invite was sent to." : "Sign in to your creator space."}</p>
      <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
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
  const { data } = useQuery({
    queryKey: ["creator-space"],
    queryFn: async () => {
      const { data: me } = await supabase.from("creators").select("*").maybeSingle();
      if (!me) return null;
      const [briefs, posts, calls, refs, payoutProfile, payoutItems] = await Promise.all([
        supabase.from("briefs").select("*").eq("status", "published").order("created_at", { ascending: false }),
        supabase.from("creator_posts").select("*").order("posted_on", { ascending: false }),
        supabase.from("creator_calls").select("*").gte("starts_at", new Date().toISOString()).order("starts_at"),
        supabase.from("reference_videos").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("creator_payout_profiles").select("*").eq("creator_id", me.id).maybeSingle(),
        supabase.from("payout_items").select("*, payout_batches(period, status)").eq("creator_id", me.id).order("created_at", { ascending: false }),
      ]);
      return { me, briefs: briefs.data ?? [], posts: posts.data ?? [], calls: calls.data ?? [], refs: refs.data ?? [], payoutProfile: payoutProfile.data ?? null, payoutItems: payoutItems.data ?? [] };
    },
  });
  if (data === undefined) return <p className="p-6 text-sm">Loading…</p>;
  if (data === null)
    return (
      <div className="mx-auto max-w-md p-6 text-sm text-brand-navySoft">
        This account is not linked to a creator invite. Open the invite link you received.
        <Button variant="outline" className="mt-4" onClick={() => supabase.auth.signOut()}>Sign out</Button>
      </div>
    );
  const monday = new Date(); monday.setUTCHours(0, 0, 0, 0); monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const week = data.posts.filter((p) => p.posted_on >= monday.toISOString().slice(0, 10) && p.status !== "flagged").length;

  async function logPost() {
    if (!/^https?:\/\//.test(url)) return toast.error("Paste the full link to your post.");
    const { error } = await supabase.from("creator_posts").insert({ creator_id: data!.me.id, url, platform, brief_id: briefId || null, reference_video_id: refId });
    if (error) return toast.error("Could not log the post.");
    setUrl(""); setRefId(null); toast.success("Post logged."); return qc.invalidateQueries({ queryKey: ["creator-space"] });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-brand-navy">Hi {data.me.full_name.split(" ")[0]}</h1>
        <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>Sign out</Button>
      </div>
      <section className="rounded-2xl border border-brand-line p-4">
        <p className="text-sm font-bold text-brand-navy">This week: {week} / {data.me.weekly_target} posts</p>
        <div className="mt-2 h-2 rounded-full bg-muted">
          <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, (week / Math.max(1, data.me.weekly_target)) * 100)}%` }} />
        </div>
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-brand-navy">Briefs</h2>
        {data.briefs.length === 0 && <p className="text-sm text-brand-navySoft">No brief yet.</p>}
        {data.briefs.map((b) => (
          <div key={b.id} className="rounded-2xl border border-brand-line p-4">
            <p className="font-semibold text-brand-navy">{b.title}</p>
            {b.hook && <p className="text-sm italic text-brand-navySoft">{b.hook}</p>}
            <p className="mt-1 whitespace-pre-wrap text-sm">{b.body}</p>
          </div>
        ))}
      </section>
      <section className="space-y-2">
        <h2 className="font-bold text-brand-navy">Library</h2>
        {data.refs.length === 0 && <p className="text-sm text-brand-navySoft">No reference video yet.</p>}
        {data.refs.map((r) => (
          <div key={r.id} className="flex items-center gap-2 rounded-xl border border-brand-line p-3 text-sm">
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex-1 font-semibold text-portal-accent">{r.platform} · {r.category}{r.note ? ` — ${r.note}` : ""}</a>
            <Button size="sm" variant="outline" onClick={() => { setRefId(r.id); toast.success("Linked. Now log your post below."); }}>Use this</Button>
          </div>
        ))}
      </section>
      <section className="space-y-2 rounded-2xl border border-brand-line p-4">
        <h2 className="font-bold text-brand-navy">I posted a video{refId ? " (linked to a reference)" : ""}</h2>
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
            {p.feedback && <p className="mt-1">{p.feedback}</p>}
          </div>
        ))}
      </section>
      <PayoutSection profile={data.payoutProfile} items={data.payoutItems} />
      <section className="space-y-2">
        <h2 className="font-bold text-brand-navy">Upcoming calls</h2>
        {data.calls.length === 0 && <p className="text-sm text-brand-navySoft">No call scheduled.</p>}
        {data.calls.map((c) => (
          <div key={c.id} className="rounded-xl border border-brand-line p-3 text-sm">
            <b>{c.title}</b> · {new Date(c.starts_at).toLocaleString()} {c.link && <a className="text-portal-accent" href={c.link} target="_blank" rel="noopener noreferrer">Join</a>}
          </div>
        ))}
      </section>
    </div>
  );
}

export function CreatorSpace() {
  const user = useSessionUser();
  const claim = useServerFn(claimCreatorInvite);
  const qc = useQueryClient();
  const [invite, setInvite] = useState<string | null>(null);
  useEffect(() => setInvite(new URLSearchParams(window.location.search).get("invite")), []);
  useEffect(() => {
    if (!user || !invite) return;
    claim({ data: { token: invite } }).then((r) => {
      if (!r.ok) toast.error(r.error);
      window.history.replaceState(null, "", "/creators/app");
      setInvite(null);
      qc.invalidateQueries({ queryKey: ["creator-space"] });
    });
  }, [user, invite, claim, qc]);
  if (user === undefined) return null;
  if (!user) return <SignIn invite={invite} />;
  return <Workspace />;
}
