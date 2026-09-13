import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { acceptInvite, claimInvite, getInvite, prepareMagicClaim } from "@/lib/portal.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/portal";
import { Banner, PortalCard } from "./ui";

const CONTACT = "Contact the Sophia editorial desk on Upwork and we will send you a fresh link.";

export function InvitePage({ token }: { token: string }) {
  const navigate = useNavigate();
  const load = useServerFn(getInvite);
  const accept = useServerFn(acceptInvite);
  const claim = useServerFn(claimInvite);
  const prepareMagic = useServerFn(prepareMagicClaim);

  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["invite", token],
    enabled: token.length > 3,
    retry: false,
    queryFn: () => load({ data: { token } }),
  });

  // Magic-link return: the account is already signed in, so attach it to the invited profile.
  useEffect(() => {
    let cancelled = false;
    async function run() {
      const { data: auth } = await supabase.auth.getUser();
      if (cancelled || !auth.user || token.length < 4) return;
      setLinking(true);
      try {
        const result = await accept({ data: { token } });
        if (result.ok) {
          await navigate({ to: "/auteurs/profile", replace: true });
          return;
        }
        setLinkError(
          result.reason === "email"
            ? "This invitation belongs to a different email address. Sign out and open the link again."
            : result.reason === "expired"
              ? "This invitation has expired."
              : result.reason === "taken"
                ? "This invitation has already been claimed."
                : "This invitation is no longer valid.",
        );
      } catch {
        setLinkError("This invitation could not be linked.");
      } finally {
        if (!cancelled) setLinking(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: { password?: string; confirm?: string } = {};
    if (password.length < 8) next.password = "Use at least 8 characters.";
    if (confirm !== password) next.confirm = "The two passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      const result = await claim({ data: { token, password } });
      if (!result.ok) {
        toast.error(
          result.state === "account"
            ? "An account already exists for this email. Use the sign-in link below instead."
            : "This invitation is no longer valid.",
        );
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: result.email, password });
      if (error) {
        toast.error("Your account was created. Sign in from the portal sign-in page.");
        await navigate({ to: "/auth" });
        return;
      }
      await navigate({ to: "/auteurs/profile", replace: true });
    } catch {
      toast.error("Your account could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function magicLink() {
    setBusy(true);
    try {
      const prepared = await prepareMagic({ data: { token } });
      if (!prepared.ok) {
        toast.error("This invitation is no longer valid.");
        return;
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: prepared.email,
        options: { emailRedirectTo: window.location.href },
      });
      if (error) {
        toast.error("The link could not be sent.");
        return;
      }
      setSent(true);
    } catch {
      toast.error("The link could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  const profile = data?.profile ?? null;

  return (
    <div className="min-h-screen bg-portal-bg px-6 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-center text-3xl font-extrabold text-brand-navy">Welcome to the Sophia author portal</h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-brand-navySoft">
          This is the profile the editorial desk prepared for you. Check it, then set a password to open your space.
        </p>

        <div className="mt-10 space-y-6">
          {linking ? (
            <PortalCard>
              <p className="text-sm text-brand-navySoft">Linking your invitation…</p>
            </PortalCard>
          ) : linkError ? (
            <Banner tone="error" title={linkError}>{CONTACT}</Banner>
          ) : isLoading ? (
            <PortalCard>
              <p className="text-sm text-brand-navySoft">Opening your invitation…</p>
            </PortalCard>
          ) : !data || data.state === "invalid" ? (
            <Banner tone="error" title="This invitation link is not valid">{CONTACT}</Banner>
          ) : data.state === "used" ? (
            <Banner tone="warning" title="This invitation has already been used">
              Your space is already open. Sign in with your email address, or {CONTACT.toLowerCase()}
            </Banner>
          ) : data.state === "expired" ? (
            <Banner tone="warning" title="This invitation has expired">{CONTACT}</Banner>
          ) : profile ? (
            <>
              <PortalCard>
                <div className="flex flex-wrap items-center gap-5">
                  {profile.photo_url ? (
                    <img
                      src={profile.photo_url}
                      alt=""
                      className="size-20 rounded-full object-cover"
                      width={80}
                      height={80}
                    />
                  ) : null}
                  <div>
                    <h2 className="text-2xl font-extrabold text-brand-navy">{profile.full_name}</h2>
                    <p className="mt-1 text-sm text-brand-navySoft">
                      {[profile.title, profile.institution, profile.country].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-1 text-sm text-brand-navySoft">{profile.email}</p>
                  </div>
                </div>
                {profile.bio ? (
                  <p className="mt-5 text-sm leading-relaxed text-brand-navySoft">{profile.bio}</p>
                ) : null}
                <p className="mt-5 text-xs text-brand-navySoft">
                  You can correct your title, institution, biography and photo once you are in. Your email address and
                  your commissioned courses are fixed.
                </p>
              </PortalCard>

              <PortalCard>
                <h2 className="text-lg font-extrabold text-brand-navy">
                  {data.courses.length > 0 ? "Courses commissioned from you" : "No course commissioned yet"}
                </h2>
                {data.courses.length === 0 ? (
                  <p className="mt-3 text-sm text-brand-navySoft">
                    The desk will assign your first course shortly; it will be waiting in your space.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-brand-line">
                    {data.courses.map((course) => (
                      <li key={course.id} className="py-3">
                        <p className="text-sm font-bold text-brand-navy">{course.title}</p>
                        <p className="text-xs text-brand-navySoft">
                          {course.lot_code ?? "—"} · {course.subject_area ?? "—"} · due {formatDate(course.due_date)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </PortalCard>

              <PortalCard>
                <h2 className="text-lg font-extrabold text-brand-navy">Confirm it is you</h2>
                <p className="mt-2 text-sm text-brand-navySoft">
                  Set a password for {profile.email}. This link works once and then stops working.
                </p>
                <form onSubmit={submit} className="mt-5 max-w-md space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="claim-password">Password</Label>
                    <Input
                      id="claim-password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-11"
                      aria-invalid={Boolean(errors.password)}
                    />
                    {errors.password ? <p className="text-sm font-semibold text-portal-red">{errors.password}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="claim-confirm">Repeat the password</Label>
                    <Input
                      id="claim-confirm"
                      type="password"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(event) => setConfirm(event.target.value)}
                      className="h-11"
                      aria-invalid={Boolean(errors.confirm)}
                    />
                    {errors.confirm ? <p className="text-sm font-semibold text-portal-red">{errors.confirm}</p> : null}
                  </div>
                  <Button type="submit" variant="pill" size="pillSm" disabled={busy}>
                    {busy ? "Opening your space…" : "This is me — open my space"}
                  </Button>
                </form>
                <Button
                  type="button"
                  variant="ghost"
                  size="pillSm"
                  className="mt-3"
                  disabled={busy}
                  onClick={magicLink}
                >
                  Email me a sign-in link instead
                </Button>
                {sent ? (
                  <p className="mt-3 text-sm text-brand-navySoft">
                    Check {profile.email} for the sign-in link, then open it on this device.
                  </p>
                ) : null}
              </PortalCard>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
