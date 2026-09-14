import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  acceptInvite,
  claimInvite,
  getInvite,
  prepareMagicClaim,
  setInvitePlatform,
  updateInviteProfile,
  type InvitePreview,
} from "@/lib/portal.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/portal";
import { Banner, PortalCard } from "./ui";

const CONTACT = "Contact the Sophia editorial desk on Upwork and we will send you a fresh link.";

type InviteCourse = InvitePreview["courses"][number];
type InviteLot = {
  key: string;
  lot_code: string | null;
  lot_name: string | null;
  subject_area: string | null;
  courses: InviteCourse[];
};

/** Groups the commissioned courses by lot, keeping the assigned order. */
function groupByLot(courses: InviteCourse[]): InviteLot[] {
  const lots: InviteLot[] = [];
  for (const course of courses) {
    const key = course.lot_code ?? course.lot_name ?? "none";
    let lot = lots.find((entry) => entry.key === key);
    if (!lot) {
      lot = {
        key,
        lot_code: course.lot_code,
        lot_name: course.lot_name,
        subject_area: course.subject_area,
        courses: [],
      };
      lots.push(lot);
    }
    lot.courses.push(course);
  }
  return lots;
}

/** Small coloured tag telling the author whether a field must be filled in. */
function Tag({ kind }: { kind: "optional" | "required" }) {
  return (
    <span
      className={
        kind === "optional"
          ? "ml-2 rounded-full bg-portal-accent/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-portal-accent"
          : "ml-2 rounded-full bg-portal-red/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-portal-red"
      }
    >
      {kind === "optional" ? "Optional" : "Required"}
    </span>
  );
}

type EducationRow = { degree: string; field: string; institution: string; year: string };

function patchRow(rows: EducationRow[], index: number, patch: Partial<EducationRow>): EducationRow[] {
  return rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
}

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
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; email?: string }>({});
  const [busy, setBusy] = useState(false);
  const [declared, setDeclared] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);
  const savePlatform = useServerFn(setInvitePlatform);
  const [sent, setSent] = useState(false);
  const saveProfile = useServerFn(updateInviteProfile);
  const [details, setDetails] = useState({
    title: "",
    display_name: "",
    display_title: "",
    institution: "",
    country: "",
    bio: "",
    short_bio: "",
    orcid: "",
    personal_site: "",
    scholar_url: "",
  });
  const [education, setEducation] = useState<EducationRow[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["invite", token],
    enabled: token.length > 3,
    retry: false,
    queryFn: () => load({ data: { token } }),
  });

  const loadedProfileId = data?.profile?.id ?? null;
  useEffect(() => {
    const p = data?.profile;
    if (!p) return;
    setDetails({
      title: p.title ?? "",
      display_name: p.display_name ?? p.full_name ?? "",
      display_title: p.display_title ?? "",
      institution: p.institution ?? "",
      country: p.country ?? "",
      bio: p.bio ?? "",
      short_bio: p.short_bio ?? "",
      orcid: p.orcid ?? "",
      personal_site: p.personal_site ?? "",
      scholar_url: p.scholar_url ?? "",
    });
    setPlatform(p.platform === "ios" || p.platform === "android" ? p.platform : null);
    setEducation(
      (data?.education ?? []).map((row) => ({
        degree: row.degree ?? "",
        field: row.field ?? "",
        institution: row.institution ?? "",
        year: row.year ?? "",
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedProfileId]);

  function onPhoto(file: File | null) {
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("The photo must be smaller than 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      setPhotoFile({ name: file.name, dataUrl });
      setPhotoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async function saveDetails() {
    setSavingDetails(true);
    try {
      const result = await saveProfile({
        data: { token, ...details, education, ...(photoFile ? { photo: photoFile } : {}) },
      });
      if (!result.ok) {
        toast.error("Your details could not be saved.");
        return;
      }
      toast.success("Your details are saved.");
    } catch {
      toast.error("Your details could not be saved.");
    } finally {
      setSavingDetails(false);
    }
  }


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
          await navigate({ to: "/auteurs", replace: true });
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

  const knownEmail = data?.profile?.email ?? null;
  const needsEmail = Boolean(data?.profile) && !knownEmail;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: { password?: string; confirm?: string; email?: string } = {};
    if (needsEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter the email address you want to sign in with.";
    }
    if (password.length < 8) next.password = "Use at least 8 characters.";
    if (confirm !== password) next.confirm = "The two passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (!declared) return;

    setBusy(true);
    try {
      // Save the details first so the declaration snapshot matches what they just confirmed.
      try {
        await saveProfile({
          data: { token, ...details, education, ...(photoFile ? { photo: photoFile } : {}) },
        });
      } catch {
        /* the claim itself matters more than a failed detail save */
      }
      const result = await claim({
        data: {
          token,
          password,
          declaration: true,
          userAgent: navigator.userAgent,
          ...(needsEmail ? { email: email.trim().toLowerCase() } : {}),
        },
      });
      if (!result.ok) {
        toast.error(
          result.state === "account"
            ? "An account already exists for this email. Use the sign-in link below instead."
            : result.state === "taken"
              ? "This email address is already used by another author."
              : result.state === "missing"
                ? "Enter your email address first."
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
      await navigate({ to: "/auteurs", replace: true });
    } catch {
      toast.error("Your account could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function magicLink() {
    if (needsEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors({ email: "Enter the email address you want to sign in with." });
      return;
    }
    setBusy(true);
    try {
      const prepared = await prepareMagic({
        data: { token, ...(needsEmail ? { email: email.trim().toLowerCase() } : {}) },
      });
      if (!prepared.ok) {
        toast.error(
          prepared.state === "taken"
            ? "This email address is already used by another author."
            : "This invitation is no longer valid.",
        );
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
                  {photoPreview ?? profile.photo_url ? (
                    <img
                      src={photoPreview ?? profile.photo_url ?? ""}
                      alt=""
                      className="size-20 rounded-full object-cover"
                      width={80}
                      height={80}
                    />
                  ) : null}
                  <div>
                    <h2 className="text-2xl font-extrabold text-brand-navy">{profile.full_name}</h2>
                    <p className="mt-1 text-sm text-brand-navySoft">{profile.email ?? "Email to be confirmed by you"}</p>
                  </div>
                </div>

                <p className="mt-6 text-sm font-bold text-brand-navy">Your published byline</p>
                <p className="mt-1 text-xs text-brand-navySoft">
                  This is the exact line printed under every course you write. Correct it if anything is wrong.
                </p>
                <p className="mt-3 text-xs font-semibold text-brand-navySoft">
                  Everything in this card is <span className="text-portal-accent">optional</span> and can be changed later
                  from your space. Only the email address and password at the bottom of the page are{" "}
                  <span className="text-portal-red">required</span> to open your account.
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="inv-display">Byline<Tag kind="optional" /></Label>
                    <Input
                      id="inv-display"
                      className="h-11"
                      value={details.display_title}
                      onChange={(event) => setDetails({ ...details, display_title: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inv-title">Title<Tag kind="optional" /></Label>
                    <Input
                      id="inv-title"
                      className="h-11"
                      value={details.title}
                      onChange={(event) => setDetails({ ...details, title: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inv-institution">Institution<Tag kind="optional" /></Label>
                    <Input
                      id="inv-institution"
                      className="h-11"
                      value={details.institution}
                      onChange={(event) => setDetails({ ...details, institution: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inv-country">Country<Tag kind="optional" /></Label>
                    <Input
                      id="inv-country"
                      className="h-11"
                      value={details.country}
                      onChange={(event) => setDetails({ ...details, country: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inv-photo">Photo<Tag kind="optional" /></Label>
                    <Input
                      id="inv-photo"
                      type="file"
                      accept="image/*"
                      className="h-11"
                      onChange={(event) => onPhoto(event.target.files?.[0] ?? null)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="inv-bio">Short biography<Tag kind="optional" /></Label>
                    <Textarea
                      id="inv-bio"
                      rows={4}
                      value={details.bio}
                      onChange={(event) => setDetails({ ...details, bio: event.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="inv-name">Name you publish under<Tag kind="optional" /></Label>
                    <Input
                      id="inv-name"
                      className="h-11"
                      value={details.display_name}
                      onChange={(event) => setDetails({ ...details, display_name: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="inv-short">Published biography (300 characters)<Tag kind="optional" /></Label>
                    <Textarea
                      id="inv-short"
                      rows={3}
                      maxLength={300}
                      value={details.short_bio}
                      onChange={(event) => setDetails({ ...details, short_bio: event.target.value })}
                    />
                    <p className="text-xs text-brand-navySoft">{details.short_bio.length} / 300</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inv-orcid">ORCID<Tag kind="optional" /></Label>
                    <Input
                      id="inv-orcid"
                      className="h-11"
                      value={details.orcid}
                      onChange={(event) => setDetails({ ...details, orcid: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inv-site">Personal site<Tag kind="optional" /></Label>
                    <Input
                      id="inv-site"
                      className="h-11"
                      value={details.personal_site}
                      onChange={(event) => setDetails({ ...details, personal_site: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="inv-scholar">Google Scholar or publication list<Tag kind="optional" /></Label>
                    <Input
                      id="inv-scholar"
                      className="h-11"
                      value={details.scholar_url}
                      onChange={(event) => setDetails({ ...details, scholar_url: event.target.value })}
                    />
                  </div>
                </div>

                <p className="mt-6 text-sm font-bold text-brand-navy">Education</p>
                <p className="mt-1 text-xs text-brand-navySoft">
                  Most recent first. This is published on your page.
                  <span className="ml-1 font-semibold text-portal-accent">Optional.</span>
                </p>
                <div className="mt-3 space-y-3">
                  {education.map((row, index) => (
                    <div key={index} className="grid gap-3 md:grid-cols-[1fr_1fr_1.4fr_auto_auto]">
                      <Input
                        className="h-11"
                        placeholder="Degree"
                        value={row.degree}
                        onChange={(event) => setEducation(patchRow(education, index, { degree: event.target.value }))}
                      />
                      <Input
                        className="h-11"
                        placeholder="Field"
                        value={row.field}
                        onChange={(event) => setEducation(patchRow(education, index, { field: event.target.value }))}
                      />
                      <Input
                        className="h-11"
                        placeholder="Institution"
                        value={row.institution}
                        onChange={(event) =>
                          setEducation(patchRow(education, index, { institution: event.target.value }))
                        }
                      />
                      <Input
                        className="h-11 md:w-24"
                        placeholder="Year"
                        value={row.year}
                        onChange={(event) => setEducation(patchRow(education, index, { year: event.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="pillSecondary"
                        size="pillSm"
                        onClick={() => setEducation(education.filter((_, i) => i !== index))}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="pillSecondary"
                    size="pillSm"
                    onClick={() =>
                      setEducation([...education, { degree: "", field: "", institution: "", year: "" }])
                    }
                  >
                    Add a degree
                  </Button>
                </div>

                <div className="mt-6 rounded-2xl bg-brand-surface p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">
                    How readers will see you
                  </p>
                  <p className="mt-3 text-base font-extrabold text-brand-navy">
                    {details.display_name.trim() || profile.full_name}
                  </p>
                  <p className="text-sm text-brand-navySoft">
                    {details.display_title.trim() || "Byline to be confirmed"}
                  </p>
                  {details.institution.trim() ? (
                    <p className="text-sm text-brand-navySoft">{details.institution}</p>
                  ) : null}
                </div>

                <Button
                  type="button"
                  variant="pillSecondary"
                  size="pillSm"
                  className="mt-4"
                  disabled={savingDetails}
                  onClick={saveDetails}
                >
                  {savingDetails ? "Saving…" : "Save my details"}
                </Button>
                <p className="mt-4 text-xs text-brand-navySoft">
                  You can change all of this later from your space. Your commissioned courses are fixed.
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
                  <div className="mt-4 space-y-6">
                    {groupByLot(data.courses).map((lot) => (
                      <div key={lot.key}>
                        <h3 className="text-sm font-extrabold text-brand-navy">
                          {lot.lot_code ? `${lot.lot_code} — ` : ""}
                          {lot.lot_name ?? "Commissioned courses"}
                          <span className="ml-2 text-xs font-bold uppercase tracking-wide text-brand-navySoft">
                            {lot.subject_area ?? ""}
                          </span>
                        </h3>
                        <ul className="mt-1 divide-y divide-brand-line">
                          {lot.courses.map((course) => (
                            <li key={course.id} className="py-3">
                              <p className="text-sm font-bold text-brand-navy">{course.title}</p>
                              <p className="text-xs text-brand-navySoft">Due {formatDate(course.due_date)}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </PortalCard>

              <PortalCard>
                <h2 className="text-lg font-extrabold text-brand-navy">Confirm it is you</h2>
                <p className="mt-2 text-sm text-brand-navySoft">
                  {needsEmail
                    ? "We do not have an email address for you: Upwork does not show it to us. Choose the address you want to sign in with, then set a password. This link works once and then stops working."
                    : `Set a password for ${profile.email}. This link works once and then stops working.`}
                </p>
                <form onSubmit={submit} className="mt-5 max-w-md space-y-5">
                  {needsEmail ? (
                    <div className="space-y-2">
                      <Label htmlFor="claim-email">Your email address<Tag kind="required" /></Label>
                      <Input
                        id="claim-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="h-11"
                        aria-invalid={Boolean(errors.email)}
                      />
                      {errors.email ? <p className="text-sm font-semibold text-portal-red">{errors.email}</p> : null}
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <Label htmlFor="claim-password">Password<Tag kind="required" /></Label>
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
                    <Label htmlFor="claim-confirm">Repeat the password<Tag kind="required" /></Label>
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
                  <div className="rounded-2xl bg-brand-surface p-4">
                    <label htmlFor="claim-declaration" className="flex cursor-pointer items-start gap-3">
                      <input
                        id="claim-declaration"
                        type="checkbox"
                        checked={declared}
                        onChange={(event) => setDeclared(event.target.checked)}
                        className="mt-1 size-4 shrink-0 accent-brand-navy"
                      />
                      <span className="text-sm font-semibold leading-relaxed text-brand-navy">
                        I confirm that the details above are accurate, and that the qualifications and titles I have
                        given are genuinely mine.
                      </span>
                    </label>
                    <p className="mt-2 pl-7 text-xs leading-relaxed text-brand-navySoft">
                      Your courses are published under your name and your credentials, so this is how we stand behind
                      them.
                    </p>
                  </div>
                  <Button type="submit" variant="pill" size="pillSm" disabled={busy || !declared}>
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
                    Check {profile.email ?? email} for the sign-in link, then open it on this device.
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
