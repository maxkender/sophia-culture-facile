import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { claimCreatorInvite, linkCreatorByEmail } from "@/lib/creator-space.functions";
import { checkCreatorInvite } from "@/lib/creator-extras.functions";
import { Outlet } from "@tanstack/react-router";
import { CreatorShell } from "./app/CreatorShell";
import { CREATOR_KEY, useCreatorQuery } from "./app/useCreator";
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
  const { data } = useCreatorQuery();
  const linkByEmail = useServerFn(linkCreatorByEmail);
  useEffect(() => {
    if (data !== null) return;
    linkByEmail({} as never).then((r) => {
      if (r?.ok) qc.invalidateQueries({ queryKey: CREATOR_KEY });
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
  return <CreatorShell><Outlet /></CreatorShell>;
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
      window.history.replaceState(null, "", window.location.pathname);
      setInvite(null);
      qc.invalidateQueries({ queryKey: CREATOR_KEY });
    });
  }, [user, invite, claim, qc]);
  if (user === undefined) return null;
  if (!user) return <SignIn invite={invite} invitedEmail={invitedEmail} />;
  return <Workspace />;
}
