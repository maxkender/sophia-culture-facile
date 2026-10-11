import { AppBadge, useApps, type AppRow } from "@/lib/apps";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentBody } from "@/components/portal/DocumentBody";
import { Banner, PageTitle, PortalCard } from "@/components/portal/ui";
import { parseBlocks } from "@/lib/documents";
import { creatorAgreementBlocks, TRACK_LABEL } from "@/lib/creator-agreement";
import { signCreatorAgreement } from "@/lib/creator-agreement.functions";
import {
  acceptCreatorRules, getMySocialAccount, registerSocialAccount, revealMyPassword, saveCreatorProfile,
  tickWarmupDay, toggleSetupGuideCheck,
} from "@/lib/creator-app.functions";
import { startStripeOnboarding, syncStripeStatus, stripeModeInfo } from "@/lib/creator-payouts.functions";
import { savePayoutFallback } from "@/lib/creator-extras.functions";
import { joinCreatorSlack, SLACK_INVITE_URL } from "@/lib/creator-onboarding.functions";
import { ACCOUNT_SUBSTEPS, SLACK_INVITE, UGC_HANDLE_GUIDANCE, UGC_PROFILE_GUIDANCE, WARMUP_DAYS } from "@/lib/creator-steps";
import { saveUgcAccountStep, setWhatsappOptIn } from "@/lib/ugc-creator.functions";
import { friendlyCreatorError, isValidEmail, isValidInternationalPhone } from "@/lib/creator-validation";
import { CountrySelect } from "../CountrySelect";
import { CreatorAgreementForm } from "../CreatorAgreementForm";
import { AccessCodeCard } from "./HomePage";
import { GuidelinesList } from "../Guidelines";
import { CREATOR_KEY, fileToBase64, useCreator } from "./useCreator";
import { t as ct } from "@/i18n/creator-app";

const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

function useDoc(slug: string) {
  return useQuery({
    queryKey: ["creator-doc", slug],
    queryFn: async () => (await supabase.from("documents").select("title, content, current_version, published, updated_at").eq("slug", slug).maybeSingle()).data,
  });
}

export function RulesPage() {
  const { me, reload } = useCreator();
  const { data: doc } = useDoc("creator-rules");
  const accept = useServerFn(acceptCreatorRules);
  const [ticked, setTicked] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!doc) return <p className="text-sm text-brand-navySoft">{ct("Loading…")}</p>;
  return (
    <div>
      <PageTitle title={ct("Creator rules")} lead={`Version ${doc.current_version} · updated ${fmt(doc.updated_at)}`} />
      {me.rules_accepted_at && <div className="mb-6"><Banner tone="success" title={`You accepted these rules on ${fmt(me.rules_accepted_at)}`} /></div>}
      <PortalCard>
        <h2 className="mb-4 text-2xl font-extrabold text-brand-navy">{ct(doc.title)}</h2>
        <DocumentBody blocks={parseBlocks(doc.content)} />
        <div className="mt-8 border-t border-brand-line pt-6"><h3 className="mb-3 text-xl font-extrabold text-brand-navy">{ct("Consignes de tournage")}</h3><GuidelinesList /></div>
        <p className="mt-4 text-sm"><a href={SLACK_INVITE_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-portal-accent underline">Join the creators Slack (optional)</a></p>
        {!me.rules_accepted_at && (
          <div className="mt-8 border-t border-brand-line pt-6">
            <label className="flex items-start gap-3 text-sm font-semibold text-brand-navy">
              <Checkbox checked={ticked} onCheckedChange={(v) => setTicked(v === true)} className="mt-0.5" />
              {ct("I have read the rules and I agree to them")}
            </label>
            <Button className="mt-4" disabled={!ticked || busy} onClick={async () => {
              setBusy(true);
              try { await accept({ data: { version: doc.current_version } }); toast.success(ct("Rules accepted.")); await reload(); }
               catch (e: unknown) { toast.error(friendlyCreatorError(e)); }
              setBusy(false);
            }}>{ct("Accept the rules")}</Button>
          </div>
        )}
      </PortalCard>
    </div>
  );
}

export function ContractPage() {
  const { me, signature: sig, steps, reload } = useCreator();
  const signature = steps.resignPending ? null : sig;
  const { data: doc } = useDoc("creator-agreement");
  const sign = useServerFn(signCreatorAgreement);
  if (!doc) return <p className="text-sm text-brand-navySoft">{ct("Loading…")}</p>;
  const blocks = creatorAgreementBlocks(parseBlocks(doc.content), "ugc");
  const merge = { legal_name: me.full_name, country: me.country, email: me.email, track: TRACK_LABEL.ugc };
  return (
    <div>
      <PageTitle title={ct("Creator Account Agreement")} lead={ct("The accounts you set up belong to Sophia. Read the agreement in full, then sign.")} />
      {steps.resignPending && <div className="mb-6"><Banner tone="warning" title={`You signed version ${sig?.document_version}. Please sign version ${doc.current_version}.`}>{ct("Clauses 2 and 4 changed.")}</Banner></div>}
      {signature ? (
        <>
          <div className="mb-6"><Banner tone="success" title={`Signed on ${fmt(signature.signed_at)} · version ${signature.document_version} · ${signature.variant} variant`} /></div>
          <PortalCard><DocumentBody blocks={blocks} merge={merge} /></PortalCard>
        </>
      ) : !doc.published ? (
        <Banner tone="info" title={ct("The agreement is being finalised")}>{ct("You will be able to sign it here soon.")}</Banner>
      ) : (
        <CreatorAgreementForm
          title={ct(doc.title)}
          version={String(doc.current_version)}
          blocks={blocks}
          merge={merge}
          onSign={async (signedName) => {
            try {
              await sign({ data: { signedName, documentVersion: String(doc.current_version), userAgent: navigator.userAgent.slice(0, 400) } });
              toast.success(ct("Agreement signed."));
              await reload();
             } catch (e: unknown) { toast.error(friendlyCreatorError(e)); }
          }}
        />
      )}
    </div>
  );
}

function ManagedAccountCard({ app, account }: { app: AppRow; account: { handle: string; account_email: string; phone: string | null; device: string | null; registered_at: string } | null }) {
  const { reload } = useCreator();
  const qc = useQueryClient();
  const register = useServerFn(registerSocialAccount);
  const reveal = useServerFn(revealMyPassword);
  const [form, setForm] = useState({ handle: "", email: "", password: "", phone: "", device: "" });
  const [editing, setEditing] = useState(false);
  const [shown, setShown] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (account) setForm({ handle: account.handle, email: account.account_email, password: "", phone: account.phone ?? "", device: account.device ?? "" });
  }, [account]);
  async function save() {
    if (!form.handle.trim()) return void toast.error(ct("Choose a TikTok username."));
    if (!isValidEmail(form.email)) return void toast.error(ct("Enter a complete email address, for example name@example.com."));
    if (form.phone.trim() && !isValidInternationalPhone(form.phone)) return void toast.error(ct("Enter a valid phone number with the country code, for example +44 7700 900123."));
    if (!account && !form.password) return void toast.error(ct("Enter the TikTok account password."));
    setBusy(true);
    try {
      await register({ data: { appId: app.id, handle: form.handle, email: form.email, password: form.password || undefined, phone: form.phone || null, device: form.device || null } });
      toast.success(`${app.name} account registered.`);
      setEditing(false); setShown(null);
      await qc.invalidateQueries({ queryKey: ["creator-social-account"] });
      await reload();
    } catch (e: unknown) { toast.error(friendlyCreatorError(e)); }
    setBusy(false);
  }
  const showForm = !account || editing;
  return (
    <div>
      <div className="mb-2"><AppBadge appId={app.id} className="text-sm" /></div>
      <PortalCard>
        {showForm ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>{ct("TikTok username *")}</Label><Input placeholder="@lea" autoComplete="off" value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} /><p className="mt-1 text-xs text-brand-navySoft">{UGC_HANDLE_GUIDANCE}</p></div>
            <div><Label>{ct("Email used for the account *")}</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Password *{account ? " (leave empty to keep)" : ""}</Label><Input type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div><Label>Phone number linked (if any)</Label><Input type="tel" placeholder="+44 7700 900123" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><p className="mt-1 text-xs text-brand-navySoft">{ct("If entered, include the country code.")}</p></div>
            <div className="sm:col-span-2"><Label>{ct("Device used")}</Label><Input placeholder={ct("e.g. iPhone 12, second phone")} value={form.device} onChange={(e) => setForm({ ...form, device: e.target.value })} /></div>
            <p className="text-xs text-brand-navySoft sm:col-span-2">{ct("The password is stored encrypted. Only the team and you can reveal it. From the moment you save, the account is registered as Vik Studios'.")}</p>
            <div className="flex gap-2 sm:col-span-2">
              <Button disabled={busy || !form.handle.trim() || !form.email.trim() || (!account && !form.password)} onClick={() => void save()}>{ct("Save")}</Button>
              {account && <Button variant="outline" onClick={() => setEditing(false)}>{ct("Cancel")}</Button>}
            </div>
          </div>
        ) : (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-brand-navySoft">{ct("Handle")}</dt><dd className="font-bold text-brand-navy">{account!.handle}</dd></div>
            <div><dt className="text-brand-navySoft">{ct("Email")}</dt><dd className="font-bold text-brand-navy">{account!.account_email}</dd></div>
            <div><dt className="text-brand-navySoft">{ct("Password")}</dt><dd className="flex items-center gap-2 font-mono font-bold text-brand-navy">
              {shown ?? "••••••••••"}
               <Button size="sm" variant="ghost" onClick={async () => { if (shown) return setShown(null); try { setShown((await reveal({ data: { appId: app.id } })).password); } catch (e: unknown) { toast.error(friendlyCreatorError(e)); } }}>
                {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />} {shown ? "Hide" : "Reveal"}
              </Button>
            </dd></div>
            <div><dt className="text-brand-navySoft">{ct("Phone")}</dt><dd className="font-bold text-brand-navy">{account!.phone || "—"}</dd></div>
            <div><dt className="text-brand-navySoft">{ct("Device")}</dt><dd className="font-bold text-brand-navy">{account!.device || "—"}</dd></div>
            <div><dt className="text-brand-navySoft">{ct("Registered")}</dt><dd className="font-bold text-brand-navy">{fmt(account!.registered_at)}</dd></div>
            <div className="sm:col-span-2"><Button size="sm" variant="outline" onClick={() => setEditing(true)}>{ct("Edit")}</Button></div>
          </dl>
        )}
      </PortalCard>

    </div>
  );
}

/** Module-level so inputs inside keep focus (a component defined in render remounts on every keystroke). */
function SetupSub({ k, done, children }: { k: string; done: boolean; children: React.ReactNode }) {
    const sub = ACCOUNT_SUBSTEPS.find((x) => x.key === k);
    if (!sub) return null;
    return (
      <PortalCard>
        <div className="flex items-start gap-3">
          <Checkbox className="mt-1" checked={done} disabled aria-label={`${ct(sub.title)} done`} />
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-brand-navy">{ct(sub.title)}</p>
            <p className="mt-1 text-sm text-brand-navySoft">{ct(sub.text)}</p>
            {(k === "acc_tiktok" || k === "acc_instagram") && (
              <div className="mt-3 space-y-2 text-sm text-brand-navySoft">
                <p>Use the new email registered above.{k === "acc_instagram" ? " Switch it to a Creator account (Settings → Account type and tools)." : ""}</p>
                {UGC_PROFILE_GUIDANCE.map((item) => <p key={ct(item.label)}><span className="font-semibold">{ct(item.label)}: </span>{ct(item.text)}</p>)}
              </div>
            )}
            <div className="mt-4">{children}</div>
          </div>
        </div>
      </PortalCard>
    );
  }

export function AccountSetupPage() {
  const { me, steps, reload } = useCreator();
  const tick = useServerFn(tickWarmupDay);
  const saveStep = useServerFn(saveUgcAccountStep);
  const joinSlack = useServerFn(joinCreatorSlack);
  const setWa = useServerFn(setWhatsappOptIn);
  const getAccount = useServerFn(getMySocialAccount);
  const { data: accounts = [] } = useQuery({ queryKey: ["creator-social-account"], queryFn: () => getAccount() });
  const account = accounts.find((x: any) => x.app_id === "00000000-0000-4000-8000-000000000001") as any;
  const checks = (me.setup_guide_checks ?? {}) as Record<string, string>;
  const warm = (me.warmup ?? {}) as Record<string, string>;
  const [email, setEmail] = useState(account?.account_email ?? "");
  const [password, setPassword] = useState("");
  const [tt, setTt] = useState((me as any).tiktok_handle ?? "");
  const [ig, setIg] = useState((me as any).instagram_handle ?? "");
  const [igCreator, setIgCreator] = useState(false);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try { await fn(); toast.success(ok); reload(); qc.invalidateQueries({ queryKey: ["creator-social-account"] }); }
    catch (e: unknown) { toast.error(friendlyCreatorError(e)); }
    finally { setBusy(false); }
  };
  const req = (me as any).required_platforms ?? "both";
  return (
    <div>
      <PageTitle title={ct("Account setup")} lead={ct("Step 3 creates the Sophia email, TikTok and Instagram accounts. Steps 4 to 6 follow below: warm-up, payouts and Slack.")} />
      {steps.accounts && <div className="mb-6"><Banner tone="success" title={ct("Your accounts are registered.")} /></div>}

      <h2 className="mb-3 text-xl font-extrabold text-brand-navy">{ct("3. Create your accounts")}</h2>
      <div className="space-y-4">
        <SetupSub k="acc_email" done={Boolean(checks["acc_email"])}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label htmlFor="acc-email">{ct("Sophia email address")}</Label><Input id="acc-email" type="email" placeholder={ct("lea.creator@gmail.com")} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label htmlFor="acc-pw">Password{account ? " (enter again to change)" : ""}</Label><Input id="acc-pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          </div>
          <p className="mt-2 text-xs text-brand-navySoft">{ct("Stored encrypted. Only the Sophia team can reveal it, and every reveal is logged.")}</p>
          <Button className="mt-3" disabled={busy || !email || !password} onClick={() => run(() => saveStep({ data: { step: "email", email, password } }), ct("Email registered."))}>{ct("Register the email")}</Button>
        </SetupSub>
        {req !== "instagram" && (
          <SetupSub k="acc_tiktok" done={Boolean(checks["acc_tiktok"])}>
            <div className="max-w-sm"><Label htmlFor="acc-tt">{ct("TikTok handle")}</Label><Input id="acc-tt" placeholder="@lea" value={tt} onChange={(e) => setTt(e.target.value)} /></div>
            <Button className="mt-3" disabled={busy || !tt || !checks["acc_email"]} onClick={() => run(() => saveStep({ data: { step: "tiktok", handle: tt } }), ct("TikTok handle registered."))}>{ct("Register TikTok")}</Button>
            {!checks["acc_email"] && <p className="mt-2 text-xs text-brand-navySoft">{ct("Register the email first.")}</p>}
          </SetupSub>
        )}
        {req !== "tiktok" && (
          <SetupSub k="acc_instagram" done={Boolean(checks["acc_instagram"])}>
            <div className="max-w-sm"><Label htmlFor="acc-ig">{ct("Instagram handle")}</Label><Input id="acc-ig" placeholder="@lea" value={ig} onChange={(e) => setIg(e.target.value)} /></div>
            <label className="mt-3 flex items-center gap-2 text-sm"><Checkbox checked={igCreator} onCheckedChange={(v) => setIgCreator(v === true)} /> {ct("The account is set to Creator account type")}</label>
            <Button className="mt-3" disabled={busy || !ig || !igCreator || !checks["acc_email"]} onClick={() => run(() => saveStep({ data: { step: "instagram", handle: ig, creatorType: true } }), ct("Instagram handle registered."))}>{ct("Register Instagram")}</Button>
          </SetupSub>
        )}
        <SetupSub k="acc_confirm" done={Boolean(checks["acc_confirm"])}>
          <Button disabled={busy || Boolean(checks["acc_confirm"])} onClick={() => run(() => saveStep({ data: { step: "confirm", publicConfirmed: true } }), ct("Accounts confirmed."))}>{ct("Both accounts are public and registered")}</Button>
        </SetupSub>
      </div>

      <h2 className="mb-3 mt-10 text-xl font-extrabold text-brand-navy">4. Warm-up (24 hours)</h2>
      {!steps.accounts && <p className="mb-3 text-sm text-brand-navySoft">{ct("Confirm your accounts above to start the warm-up.")}</p>}
      <PortalCard className="divide-y divide-brand-line p-0">
        {WARMUP_DAYS.map((d) => (
          <label key={d.day} className="flex items-start gap-3 px-6 py-4">
            <Checkbox className="mt-1" disabled={!steps.accounts} checked={Boolean(warm[String(d.day)])} onCheckedChange={async (v) => {
              try { await tick({ data: { day: d.day, checked: v === true } }); reload(); } catch (e: unknown) { toast.error(friendlyCreatorError(e)); }
            }} />
            <span className="flex-1 text-sm text-brand-navy">{ct(d.text)}</span>
            {warm[String(d.day)] && <span className="text-xs font-semibold text-portal-green">{fmt(warm[String(d.day)]!)}</span>}
          </label>
        ))}
      </PortalCard>

      <h2 className="mb-3 mt-10 text-xl font-extrabold text-brand-navy">{ct("5. Payouts")}</h2>
      <PortalCard>
        {steps.payouts ? <p className="text-sm font-semibold text-portal-green">{ct("Payout details saved.")}</p> : <><p className="text-sm text-brand-navySoft">Stripe by default; bank transfer with invoice if Stripe does not work for you.</p><Button asChild className="mt-3"><Link to="/creators/app/profile" hash="payouts">{ct("Set up payouts")}</Link></Button></>}
      </PortalCard>

      <h2 className="mb-3 mt-10 text-xl font-extrabold text-brand-navy">{ct("6. Join Slack")}</h2>
      <PortalCard>
        <Button asChild><a href={SLACK_INVITE} target="_blank" rel="noopener noreferrer">{ct("Open the Slack invite")}</a></Button>
        <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-navy">
          <Checkbox checked={Boolean(me.slack_joined_at)} disabled={Boolean(me.slack_joined_at)} onCheckedChange={(v) => { if (v === true) void run(() => joinSlack(), ct("Thanks — Slack step done.")); }} /> {ct("I've joined")}
        </label>
        {me.phone && (
          <div className="mt-6 border-t border-brand-line pt-4">
            <p className="text-sm text-brand-navy">{ct("We may also add you to the WhatsApp group.")}</p>
            <label className="mt-2 flex items-center gap-2 text-sm">
              <Checkbox checked={(me as any).whatsapp_opt_in !== false} onCheckedChange={(v) => void run(() => setWa({ data: { optIn: v === true } }), v === true ? ct("You're in for WhatsApp.") : ct("We won't add you to WhatsApp."))} />
              {ct("Yes, add me to the WhatsApp group")}
            </label>
          </div>
        )}
      </PortalCard>
    </div>
  );
}

export function ProfilePage() {
  const { me, reload } = useCreator();
  const save = useServerFn(saveCreatorProfile);
  const [country, setCountry] = useState(me.country ?? "");
  const [phone, setPhone] = useState(me.phone ?? "");
  const [platform, setPlatform] = useState<"" | "ios" | "android">((me.platform as "ios" | "android") ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  return (
    <div>
      <PageTitle title={ct("Profile")} lead={ct("Your details, your Sophia app access, the creators Slack and your payout details.")} />
      <SetPasswordCard />
      <PortalCard>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>{ct("Name")}</Label><Input value={me.full_name} readOnly /></div>
          <div><Label>{ct("Email")}</Label><Input value={me.email} readOnly /></div>
          <div><Label>{ct("Country")}</Label><CountrySelect value={country} onChange={setCountry} lang="en" labels={{ select: ct("Choose a country"), search: "Search…", empty: ct("No country found") }} /></div>
           <div><Label>{ct("Phone")}</Label><Input type="tel" placeholder="+44 7700 900123" value={phone} onChange={(e) => setPhone(e.target.value)} /><p className="mt-1 text-xs text-brand-navySoft">{ct("Include the country code.")}</p></div>
          <div><Label>{ct("Phone type")}</Label>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={platform} onChange={(e) => setPlatform(e.target.value as typeof platform)}>
              <option value="">{ct("Choose…")}</option><option value="ios">{ct("iPhone")}</option><option value="android">{ct("Android")}</option>
            </select>
          </div>
          <div><Label>{ct("Photo")}</Label><Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
        </div>
        <Button className="mt-4" disabled={busy} onClick={async () => {
          if (file && file.size > 5_000_000) return void toast.error(ct("Photo must be under 5 MB."));
           if (phone.trim() && !isValidInternationalPhone(phone)) return void toast.error(ct("Enter a valid phone number with the country code, for example +44 7700 900123."));
          setBusy(true);
          try {
            await save({ data: { country: country || null, phone: phone || null, platform: platform || null, ...(file ? { photoBase64: await fileToBase64(file), photoType: file.type as "image/png" } : {}) } });
            toast.success(ct("Profile saved.")); setFile(null);
            await reload(); qc.invalidateQueries({ queryKey: ["creator-photo"] });
           } catch (e: unknown) { toast.error(friendlyCreatorError(e)); }
          setBusy(false);
        }}>{ct("Save profile")}</Button>
      </PortalCard>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <AccessCodeCard />
        <PortalCard>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">{ct("Creators Slack")}</p>
          <p className="mt-2 text-sm text-brand-navySoft">{ct("Optional, useful for quick questions and to meet the other creators. The invitation does not expire.")}</p>
          <Button asChild className="mt-4" variant="outline"><a href={SLACK_INVITE_URL} target="_blank" rel="noopener noreferrer">{ct("Join the Slack")}</a></Button>
        </PortalCard>
      </div>

      <div id="payouts" className="mt-10"><PayoutDetails /></div>
    </div>
  );
}

function PayoutDetails() {
  const { payoutProfile: profile, me } = useCreator();
  const qc = useQueryClient();
  const onboard = useServerFn(startStripeOnboarding);
  const sync = useServerFn(syncStripeStatus);
  const fallback = useServerFn(savePayoutFallback);
  const [busy, setBusy] = useState(false);
  const modeFn = useServerFn(stripeModeInfo);
  const { data: stripeMode } = useQuery({ queryKey: ["creator", "stripe-mode"], queryFn: () => modeFn() });
  const [alt, setAlt] = useState<"wise" | "paypal">(profile?.method === "paypal" ? "paypal" : "wise");
  const [altEmail, setAltEmail] = useState(profile?.wise_email ?? profile?.paypal_email ?? "");
  useEffect(() => {
    if (profile?.stripe_account_id && !profile.stripe_onboarded) sync({} as never).then(() => qc.invalidateQueries({ queryKey: CREATOR_KEY })).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.stripe_account_id]);
  return (
    <>
      <h2 className="mb-3 text-xl font-extrabold text-brand-navy">{ct("Payout details")}</h2>
      <PortalCard className="space-y-4 text-sm">
        {profile?.stripe_onboarded ? (
          <Banner tone="success" title={ct("Your Stripe account is connected")}>{ct("Monthly payouts are sent automatically.")}</Banner>
        ) : (
          <div>
            {stripeMode?.mode === "test" && <p className="mb-2 text-xs text-muted-foreground">{ct("Mode test — ne saisis pas de vraies coordonnées")}</p>}
            <p className="text-brand-navySoft">Connect a Stripe account to receive your monthly payouts. Stripe asks for your identity and bank details directly; Sophia never sees them.</p>
            <Button className="mt-3" disabled={busy} onClick={async () => {
              setBusy(true);
              try { const { url } = await onboard({} as never); window.location.href = url; }
              catch (e: unknown) { toast.error(friendlyCreatorError(e)); setBusy(false); }
            }}>{busy ? ct("Opening Stripe…") : profile?.stripe_account_id ? ct("Continue Stripe setup") : ct("Set up payouts with Stripe")}</Button>
          </div>
        )}
        <div className="border-t border-brand-line pt-4">
          <p className="font-bold text-brand-navy">{ct("Bank-transfer alternative")}</p>
          <p className="mt-1 text-brand-navySoft">If Stripe is not available in {me.country ?? "your country"}, we can pay you by Wise or PayPal.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <select className="rounded-md border px-2 text-sm" value={alt} onChange={(e) => setAlt(e.target.value as "wise" | "paypal")}>
              <option value="wise">{ct("Wise")}</option><option value="paypal">{ct("PayPal")}</option>
            </select>
            <Input className="min-w-56 flex-1" type="email" placeholder={`${alt === "wise" ? "Wise" : "PayPal"} email`} value={altEmail} onChange={(e) => setAltEmail(e.target.value)} />
            <Button variant="outline" onClick={async () => {
               if (!isValidEmail(altEmail)) return void toast.error(`Enter the email address used for your ${alt === "wise" ? "Wise" : "PayPal"} account, for example name@example.com.`);
               try { await fallback({ data: { method: alt, email: altEmail } }); toast.success(ct("Payout details saved.")); qc.invalidateQueries({ queryKey: CREATOR_KEY }); }
               catch (e: unknown) { toast.error(friendlyCreatorError(e)); }
            }}>{ct("Save")}</Button>
          </div>
          {(profile?.method === "wise" || profile?.method === "paypal") && <p className="mt-2 text-xs font-semibold text-portal-green">Saved: {profile.method} · {profile.wise_email ?? profile.paypal_email}</p>}
        </div>
      </PortalCard>
    </>
  );
}

function SetPasswordCard() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <PortalCard className="mb-6">
      <h2 className="text-lg font-extrabold text-brand-navy">{ct("Définir un mot de passe")}</h2>
      <p className="mt-1 text-sm text-brand-navySoft">{ct("Optional. You can always sign in with an email link instead.")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Input type="password" aria-label={ct("New password")} placeholder="New password (8+ characters)" className="max-w-xs" value={pw} onChange={(e) => setPw(e.target.value)} />
        <Button disabled={busy} onClick={async () => {
          if (pw.length < 8) return void toast.error(ct("Use at least 8 characters."));
          setBusy(true);
          const { error } = await supabase.auth.updateUser({ password: pw });
          setBusy(false);
          if (error) toast.error(ct("The password could not be saved. Try a longer one, or sign in again with an email link first.")); else { toast.success(ct("Password saved.")); setPw(""); }
        }}>{ct("Save password")}</Button>
      </div>
    </PortalCard>
  );
}
