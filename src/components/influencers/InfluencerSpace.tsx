import { useEffect, useState, type ReactNode } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BookOpen, Briefcase, FileSignature, Handshake, Home, Inbox, Landmark, LogOut, Menu, MessageSquare, UserCircle, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NotSetUp } from "@/components/auth/NotSetUp";
import { cn } from "@/lib/utils";
import { homeFor, resolveAccountRole } from "@/lib/account-role";
import { checkInfluencerInvite, claimInfluencerInvite, linkInfluencerByEmail } from "@/lib/influencer-space.functions";
import { useInfluencerBadges } from "./InfluencerDealPages";
import { INFLUENCER_KEY, influencerSteps, useInfluencerQuery, useInfluencerUnread } from "./useInfluencer";

type Item = { to: string; label: string; icon: LucideIcon; exact?: boolean; badge?: "messages" | "offers" | "deals" };
const NAV: { heading: string; items: Item[] }[] = [
  {
    heading: "Espace",
    items: [
      { to: "/creators/influencer/app", label: "Home", icon: Home, exact: true },
      { to: "/creators/influencer/app/offers", label: "Offers", icon: Inbox, badge: "offers" },
      { to: "/creators/influencer/app/deals", label: "Deals", icon: Handshake, badge: "deals" },
      { to: "/creators/influencer/app/briefs", label: "Briefs", icon: Briefcase },
      { to: "/creators/influencer/app/earnings", label: "Earnings", icon: Landmark },
      { to: "/creators/influencer/app/messages", label: "Messages", icon: MessageSquare, badge: "messages" },
      { to: "/creators/influencer/app/profile", label: "Profile", icon: UserCircle },
    ],
  },
  {
    heading: "Onboarding",
    items: [
      { to: "/creators/influencer/app/rules", label: "Rules", icon: BookOpen },
      { to: "/creators/influencer/app/agreement", label: "Master agreement", icon: FileSignature },
      { to: "/creators/influencer/app/payouts", label: "Payouts", icon: Landmark },
    ],
  },
];

function useSessionUser() {
  const [user, setUser] = useState<{ id: string; email?: string } | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return user;
}

function InfluencerSignIn({ invite, invitedEmail }: { invite: string | null; invitedEmail: string }) {
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">(invite ? "up" : "in");
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const check = useServerFn(checkInfluencerInvite);
  useEffect(() => {
    if (invite) check({ data: { token: invite } }).then((r) => { setState(r.state); if (r.state !== "fresh") setMode("in"); }).catch(() => setState("fresh"));
  }, [invite, check]);
  useEffect(() => { setEmail(invitedEmail); }, [invitedEmail]);
  async function go() {
    if (!email.includes("@")) return void toast.error("Enter the email address your invite was sent to.");
    if (password.length < 8) return void toast.error("Your password needs at least 8 characters.");
    if (mode === "up" && !adult) return void toast.error("Confirm you are at least 18.");
    setBusy(true);
    const res = mode === "up"
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.href } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (res.error) toast.error(res.error.message.includes("Invalid login") ? "The email or password is not right." : res.error.message);
    else if (mode === "up" && !res.data.session) { setSent(true); toast.success("Check your inbox to confirm your email, then come back to this link."); }
  }
  return (
    <div className="min-h-screen bg-portal-bg">
      <div className="mx-auto max-w-sm space-y-3 p-6 pt-12 [&_input:not([type=checkbox])]:min-h-11 [&_button]:min-h-11">
        <Logo />
        {sent ? <p role="status" className="rounded-xl bg-portal-green/10 p-3 text-sm font-semibold text-brand-navy">Account created. We sent a confirmation email to {email}: open it, then come back to this link to sign in.</p> : null}
        <h1 className="text-2xl font-extrabold text-brand-navy">Sophia influencer space</h1>
        {state === "used" && <p className="rounded-xl bg-portal-green/10 p-3 text-sm text-brand-navy">You have already set up your account. Sign in below.</p>}
        {state === "expired" && <p className="rounded-xl bg-portal-amber/10 p-3 text-sm text-brand-navy">This invite is more than 30 days old. Ask the Sophia team for a new one, or sign in if you already created your account.</p>}
        {state === "invalid" && <p className="rounded-xl bg-portal-amber/10 p-3 text-sm text-brand-navy">This invite link is not valid. If you already have an account, sign in below.</p>}
        <p className="text-sm text-brand-navySoft">{mode === "up" ? "Create your password with the email your invite was sent to." : "Sign in to your influencer space."}</p>
        <Input type="email" placeholder="Email" aria-label="Email" value={email} readOnly={Boolean(invite && invitedEmail)} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Password (8 characters minimum)" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {mode === "up" && (
          <label className="flex items-start gap-2 text-sm text-brand-navySoft">
            <input type="checkbox" className="mt-1" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
            I confirm I am at least 18 years old.
          </label>
        )}
        {mode === "in" && (
          <button className="block text-xs text-brand-navySoft underline" onClick={async () => {
            if (!email) return void toast.error("Enter your email first.");
            const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password?space=creators` });
            if (error) toast.error(error.message); else toast.success("Check your inbox for a reset link.");
          }}>Forgot password?</button>
        )}
        <Button className="w-full" disabled={busy} onClick={go}>{mode === "up" ? "Create account" : "Sign in"}</Button>
        <button className="text-xs text-brand-navySoft underline" onClick={() => setMode(mode === "up" ? "in" : "up")}>
          {mode === "up" ? "I already have an account" : "I have an invite, create my account"}
        </button>
      </div>
    </div>
  );
}

function Nav({ onNavigate, unread, steps }: { onNavigate?: () => void; unread: number; steps: ReturnType<typeof influencerSteps> }) {
  const badges = useInfluencerBadges();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const doneFor: Record<string, boolean> = {
    "/creators/influencer/app/rules": steps.rules,
    "/creators/influencer/app/agreement": steps.agreement,
    "/creators/influencer/app/payouts": steps.payouts,
  };
  return (
    <nav aria-label="Influencer space" className="flex flex-col gap-6">
      {NAV.map((g) => (
        <div key={g.heading}>
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-navySoft/70">{g.heading}</p>
          <ul className="space-y-1">
            {g.items.map((item) => {
              const Icon = item.icon;
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              const count = item.badge === "messages" ? unread : item.badge ? badges[item.badge] : 0;
              const done = doneFor[item.to];
              return (
                <li key={item.to}>
                  <Link to={item.to} onClick={onNavigate} className={cn(
                    "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                    active ? "bg-brand-navy text-card shadow-sm" : "text-brand-navy hover:bg-brand-navy/10",
                  )}>
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {done === true ? <span className="text-[11px] font-bold text-portal-green">Done</span> : null}
                    {done === false ? <span className="text-[11px] font-bold text-portal-amber">To do</span> : null}
                    {count > 0 ? <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", active ? "bg-card text-brand-navy" : "bg-brand-navy text-card")}>{count}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const { data: me } = useInfluencerQuery();
  const { data: unread = 0 } = useInfluencerUnread(me?.id);
  const steps = influencerSteps(me);
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    window.location.replace("/creators/login");
  }
  const foot = (
    <div className="mt-auto space-y-2 border-t border-brand-line pt-4">
      <p className="truncate px-3 text-sm font-bold text-brand-navy">{me?.display_name}</p>
      <button onClick={signOut} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-brand-navy hover:bg-brand-navy/10">
        <LogOut className="size-4" aria-hidden="true" /> Sign out
      </button>
    </div>
  );
  return (
    <div className="min-h-screen bg-portal-bg md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-brand-line bg-card p-5 md:flex">
        <Logo />
        <Nav unread={unread} steps={steps} />
        {foot}
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-brand-line bg-card px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] md:hidden">
        <Logo />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="size-11" aria-label="Open menu"><Menu className="size-5" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col gap-6 p-5">
            <SheetTitle>Influencer space</SheetTitle>
            <Nav unread={unread} steps={steps} onNavigate={() => setOpen(false)} />
            {foot}
          </SheetContent>
        </Sheet>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-8 md:py-10">{children}</main>
    </div>
  );
}

function Workspace() {
  const qc = useQueryClient();
  const { data } = useInfluencerQuery();
  const link = useServerFn(linkInfluencerByEmail);
  const [state, setState] = useState<"checking" | "none">("checking");
  useEffect(() => {
    if (data !== null) return;
    let active = true;
    (async () => {
      const r = await link({} as never).catch(() => null);
      if (r?.ok) return void qc.invalidateQueries({ queryKey: INFLUENCER_KEY });
      const role = await resolveAccountRole();
      if (!active) return;
      if (role && role !== "none" && role !== "influencer") window.location.replace(homeFor(role));
      else setState("none");
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  if (data === undefined || (data === null && state === "checking")) return <p className="p-6 text-sm">Loading…</p>;
  if (data === null) return <NotSetUp loginTo="/creators/login" />;
  return <Shell><Outlet /></Shell>;
}

export function InfluencerSpace() {
  const user = useSessionUser();
  const claim = useServerFn(claimInfluencerInvite);
  const qc = useQueryClient();
  const [invite, setInvite] = useState<string | null>(null);
  const [invitedEmail, setInvitedEmail] = useState("");
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setInvite(p.get("invite"));
    setInvitedEmail(p.get("email") ?? "");
  }, []);
  useEffect(() => {
    if (!user || !invite) return;
    if (invitedEmail && user.email && user.email.toLowerCase() !== invitedEmail.toLowerCase()) {
      void supabase.auth.signOut();
      return;
    }
    claim({ data: { token: invite } }).then((r) => {
      if (!r.ok) toast.error(r.error);
      window.history.replaceState(null, "", window.location.pathname);
      setInvite(null);
      void qc.invalidateQueries({ queryKey: INFLUENCER_KEY });
    });
  }, [user, invite, invitedEmail, claim, qc]);
  if (user === undefined) return null;
  if (!user) return <InfluencerSignIn invite={invite} invitedEmail={invitedEmail} />;
  return <Workspace />;
}
