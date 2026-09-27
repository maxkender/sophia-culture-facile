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
import { startStripeOnboarding, syncStripeStatus } from "@/lib/creator-payouts.functions";
import { savePayoutFallback } from "@/lib/creator-extras.functions";
import { SLACK_INVITE_URL } from "@/lib/creator-onboarding.functions";
import { SETUP_GUIDE, WARMUP_DAYS } from "@/lib/creator-steps";
import { friendlyCreatorError, isValidEmail, isValidInternationalPhone } from "@/lib/creator-validation";
import { CountrySelect } from "../CountrySelect";
import { CreatorAgreementForm } from "../CreatorAgreementForm";
import { AccessCodeCard } from "./HomePage";
import { CREATOR_KEY, fileToBase64, useCreator } from "./useCreator";

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
  if (!doc) return <p className="text-sm text-brand-navySoft">Loading…</p>;
  return (
    <div>
      <PageTitle title="Creator rules" lead={`Version ${doc.current_version} · updated ${fmt(doc.updated_at)}`} />
      {me.rules_accepted_at && <div className="mb-6"><Banner tone="success" title={`You accepted these rules on ${fmt(me.rules_accepted_at)}`} /></div>}
      <PortalCard>
        <h2 className="mb-4 text-2xl font-extrabold text-brand-navy">{doc.title}</h2>
        <DocumentBody blocks={parseBlocks(doc.content)} />
        <p className="mt-4 text-sm"><a href={SLACK_INVITE_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-portal-accent underline">Join the creators Slack (optional)</a></p>
        {!me.rules_accepted_at && (
          <div className="mt-8 border-t border-brand-line pt-6">
            <label className="flex items-start gap-3 text-sm font-semibold text-brand-navy">
              <Checkbox checked={ticked} onCheckedChange={(v) => setTicked(v === true)} className="mt-0.5" />
              I have read the rules and I agree to them
            </label>
            <Button className="mt-4" disabled={!ticked || busy} onClick={async () => {
              setBusy(true);
              try { await accept({ data: { version: doc.current_version } }); toast.success("Rules accepted."); await reload(); }
               catch (e: unknown) { toast.error(friendlyCreatorError(e)); }
              setBusy(false);
            }}>Accept the rules</Button>
          </div>
        )}
      </PortalCard>
    </div>
  );
}

export function ContractPage() {
  const { me, signature, reload } = useCreator();
  const { data: doc } = useDoc("creator-agreement");
  const sign = useServerFn(signCreatorAgreement);
  if (!doc) return <p className="text-sm text-brand-navySoft">Loading…</p>;
  const blocks = creatorAgreementBlocks(parseBlocks(doc.content), "ugc");
  const merge = { legal_name: me.full_name, country: me.country, email: me.email, track: TRACK_LABEL.ugc };
  return (
    <div>
      <PageTitle title="Creator Account Agreement" lead="The account you set up belongs to Sophia. Read the agreement in full, then sign." />
      {signature ? (
        <>
          <div className="mb-6"><Banner tone="success" title={`Signed on ${fmt(signature.signed_at)} · version ${signature.document_version} · ${signature.variant} variant`} /></div>
          <PortalCard><DocumentBody blocks={blocks} merge={merge} /></PortalCard>
        </>
      ) : !doc.published ? (
        <Banner tone="info" title="The agreement is being finalised">You will be able to sign it here soon.</Banner>
      ) : (
        <CreatorAgreementForm
          title={doc.title}
          version={String(doc.current_version)}
          blocks={blocks}
          merge={merge}
          onSign={async (signedName) => {
            try {
              await sign({ data: { signedName, documentVersion: String(doc.current_version), userAgent: navigator.userAgent.slice(0, 400) } });
              toast.success("Agreement signed.");
              await reload();
             } catch (e: unknown) { toast.error(friendlyCreatorError(e)); }
          }}
        />
      )}
    </div>
  );
}

export function AccountSetupPage() {
  const { me, steps, reload } = useCreator();
  const qc = useQueryClient();
  const toggle = useServerFn(toggleSetupGuideCheck);
  const register = useServerFn(registerSocialAccount);
  const getAccount = useServerFn(getMySocialAccount);
  const reveal = useServerFn(revealMyPassword);
  const tick = useServerFn(tickWarmupDay);
  const { data: account } = useQuery({ queryKey: ["creator-social-account"], queryFn: () => getAccount() });
  const checks = (me.setup_guide_checks ?? {}) as Record<string, string>;
  const warm = (me.warmup ?? {}) as Record<string, string>;
  const [form, setForm] = useState({ handle: "", email: "", password: "", phone: "", device: "" });
  const [editing, setEditing] = useState(false);
  const [shown, setShown] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (account) setForm({ handle: account.handle, email: account.account_email, password: "", phone: account.phone ?? "", device: account.device ?? "" });
  }, [account]);

  async function save() {
    if (!form.handle.trim()) return void toast.error("Choose a TikTok username.");
    if (!isValidEmail(form.email)) return void toast.error("Enter a complete email address, for example name@example.com.");
    if (form.phone.trim() && !isValidInternationalPhone(form.phone)) return void toast.error("Enter a valid phone number with the country code, for example +44 7700 900123.");
    if (!account && !form.password) return void toast.error("Enter the TikTok account password.");
    setBusy(true);
    try {
      await register({ data: { handle: form.handle, email: form.email, password: form.password || undefined, phone: form.phone || null, device: form.device || null } });
      toast.success("Account registered as Sophia's.");
      setEditing(false); setShown(null);
      await qc.invalidateQueries({ queryKey: ["creator-social-account"] });
      await reload();
    } catch (e: unknown) { toast.error(friendlyCreatorError(e)); }
    setBusy(false);
  }

  const showForm = !account || editing;
  return (
    <div>
      <PageTitle title="Account setup" lead="Create the Sophia TikTok account, register it, then warm it up for five days before your first post." />
      {steps.account && <div className="mb-6"><Banner tone="success" title="Step 3 is done: the account is registered and warmed up." /></div>}

      <h2 className="mb-3 text-xl font-extrabold text-brand-navy">A. The guide</h2>
      <PortalCard>
        <ol className="space-y-4">
          {SETUP_GUIDE.map((g) => (
            <li key={g.key} className="flex items-start gap-3">
              <Checkbox className="mt-1" checked={Boolean(checks[g.key])} onCheckedChange={async (v) => { await toggle({ data: { key: g.key, checked: v === true } }); reload(); }} aria-label={`Step ${g.key} done`} />
              <p className="text-sm leading-relaxed text-brand-navy"><b>{g.key}.</b> {g.text}</p>
            </li>
          ))}
        </ol>
      </PortalCard>

      <h2 className="mb-3 mt-10 text-xl font-extrabold text-brand-navy">B. Register the account</h2>
      <PortalCard>
        {showForm ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>TikTok username *</Label><Input placeholder="@cultureminute" autoComplete="off" value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} /><p className="mt-1 text-xs text-brand-navySoft">Choose any available name suitable for a general-knowledge account. There is no required format.</p></div>
            <div><Label>Email used for the account *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Password *{account ? " (leave empty to keep)" : ""}</Label><Input type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div><Label>Phone number linked (if any)</Label><Input type="tel" placeholder="+44 7700 900123" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><p className="mt-1 text-xs text-brand-navySoft">If entered, include the country code.</p></div>
            <div className="sm:col-span-2"><Label>Device used</Label><Input placeholder="e.g. iPhone 12, second phone" value={form.device} onChange={(e) => setForm({ ...form, device: e.target.value })} /></div>
            <p className="text-xs text-brand-navySoft sm:col-span-2">The password is stored encrypted. Only the Sophia team and you can reveal it. From the moment you save, the account is registered as Sophia's.</p>
            <div className="flex gap-2 sm:col-span-2">
              <Button disabled={busy || !form.handle.trim() || !form.email.trim() || (!account && !form.password)} onClick={() => void save()}>Save</Button>
              {account && <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>}
            </div>
          </div>
        ) : (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-brand-navySoft">Handle</dt><dd className="font-bold text-brand-navy">{account!.handle}</dd></div>
            <div><dt className="text-brand-navySoft">Email</dt><dd className="font-bold text-brand-navy">{account!.account_email}</dd></div>
            <div><dt className="text-brand-navySoft">Password</dt><dd className="flex items-center gap-2 font-mono font-bold text-brand-navy">
              {shown ?? "••••••••••"}
               <Button size="sm" variant="ghost" onClick={async () => { if (shown) return setShown(null); try { setShown((await reveal()).password); } catch (e: unknown) { toast.error(friendlyCreatorError(e)); } }}>
                {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />} {shown ? "Hide" : "Reveal"}
              </Button>
            </dd></div>
            <div><dt className="text-brand-navySoft">Phone</dt><dd className="font-bold text-brand-navy">{account!.phone || "—"}</dd></div>
            <div><dt className="text-brand-navySoft">Device</dt><dd className="font-bold text-brand-navy">{account!.device || "—"}</dd></div>
            <div><dt className="text-brand-navySoft">Registered</dt><dd className="font-bold text-brand-navy">{fmt(account!.registered_at)}</dd></div>
            <div className="sm:col-span-2"><Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button></div>
          </dl>
        )}
      </PortalCard>

      <h2 className="mb-3 mt-10 text-xl font-extrabold text-brand-navy">C. The warm-up</h2>
      {!me.social_account_created_at && <p className="mb-3 text-sm text-brand-navySoft">Register the account above to start the warm-up.</p>}
      <PortalCard className="divide-y divide-brand-line p-0">
        {WARMUP_DAYS.map((d) => (
          <label key={d.day} className="flex items-start gap-3 px-6 py-4">
            <Checkbox className="mt-1" disabled={!me.social_account_created_at || d.day === 6} checked={Boolean(warm[String(d.day)])} onCheckedChange={async (v) => {
               try { await tick({ data: { day: d.day, checked: v === true } }); reload(); } catch (e: unknown) { toast.error(friendlyCreatorError(e)); }
            }} />
            <span className="flex-1 text-sm text-brand-navy"><b>Day {d.day}:</b> {d.text}{d.day === 6 && <> <Link to="/creators/app/briefs" className="font-semibold text-portal-accent underline">Open briefs</Link></>}</span>
            {warm[String(d.day)] && <span className="text-xs font-semibold text-portal-green">{fmt(warm[String(d.day)]!)}</span>}
          </label>
        ))}
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
      <PageTitle title="Profile" lead="Your details, your Sophia app access, the creators Slack and your payout details." />
      <PortalCard>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Name</Label><Input value={me.full_name} readOnly /></div>
          <div><Label>Email</Label><Input value={me.email} readOnly /></div>
          <div><Label>Country</Label><CountrySelect value={country} onChange={setCountry} lang="en" labels={{ select: "Choose a country", search: "Search…", empty: "No country found" }} /></div>
           <div><Label>Phone</Label><Input type="tel" placeholder="+44 7700 900123" value={phone} onChange={(e) => setPhone(e.target.value)} /><p className="mt-1 text-xs text-brand-navySoft">Include the country code.</p></div>
          <div><Label>Phone type</Label>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={platform} onChange={(e) => setPlatform(e.target.value as typeof platform)}>
              <option value="">Choose…</option><option value="ios">iPhone</option><option value="android">Android</option>
            </select>
          </div>
          <div><Label>Photo</Label><Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
        </div>
        <Button className="mt-4" disabled={busy} onClick={async () => {
          if (file && file.size > 5_000_000) return void toast.error("Photo must be under 5 MB.");
           if (phone.trim() && !isValidInternationalPhone(phone)) return void toast.error("Enter a valid phone number with the country code, for example +44 7700 900123.");
          setBusy(true);
          try {
            await save({ data: { country: country || null, phone: phone || null, platform: platform || null, ...(file ? { photoBase64: await fileToBase64(file), photoType: file.type as "image/png" } : {}) } });
            toast.success("Profile saved."); setFile(null);
            await reload(); qc.invalidateQueries({ queryKey: ["creator-photo"] });
           } catch (e: unknown) { toast.error(friendlyCreatorError(e)); }
          setBusy(false);
        }}>Save profile</Button>
      </PortalCard>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <AccessCodeCard />
        <PortalCard>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Creators Slack</p>
          <p className="mt-2 text-sm text-brand-navySoft">Optional, useful for quick questions and to meet the other creators. The invitation does not expire.</p>
          <Button asChild className="mt-4" variant="outline"><a href={SLACK_INVITE_URL} target="_blank" rel="noopener noreferrer">Join the Slack</a></Button>
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
  const [alt, setAlt] = useState<"wise" | "paypal">(profile?.method === "paypal" ? "paypal" : "wise");
  const [altEmail, setAltEmail] = useState(profile?.wise_email ?? profile?.paypal_email ?? "");
  useEffect(() => {
    if (profile?.stripe_account_id && !profile.stripe_onboarded) sync({} as never).then(() => qc.invalidateQueries({ queryKey: CREATOR_KEY })).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.stripe_account_id]);
  return (
    <>
      <h2 className="mb-3 text-xl font-extrabold text-brand-navy">Payout details</h2>
      <PortalCard className="space-y-4 text-sm">
        {profile?.stripe_onboarded ? (
          <Banner tone="success" title="Your Stripe account is connected">Monthly payouts are sent automatically.</Banner>
        ) : (
          <div>
            <p className="text-brand-navySoft">Connect a Stripe account to receive your monthly payouts. Stripe asks for your identity and bank details directly; Sophia never sees them.</p>
            <Button className="mt-3" disabled={busy} onClick={async () => {
              setBusy(true);
              try { const { url } = await onboard({} as never); window.location.href = url; }
              catch (e: unknown) { toast.error(friendlyCreatorError(e)); setBusy(false); }
            }}>{busy ? "Opening Stripe…" : profile?.stripe_account_id ? "Continue Stripe setup" : "Set up payouts with Stripe"}</Button>
          </div>
        )}
        <div className="border-t border-brand-line pt-4">
          <p className="font-bold text-brand-navy">Bank-transfer alternative</p>
          <p className="mt-1 text-brand-navySoft">If Stripe is not available in {me.country ?? "your country"}, we can pay you by Wise or PayPal.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <select className="rounded-md border px-2 text-sm" value={alt} onChange={(e) => setAlt(e.target.value as "wise" | "paypal")}>
              <option value="wise">Wise</option><option value="paypal">PayPal</option>
            </select>
            <Input className="min-w-56 flex-1" type="email" placeholder={`${alt === "wise" ? "Wise" : "PayPal"} email`} value={altEmail} onChange={(e) => setAltEmail(e.target.value)} />
            <Button variant="outline" onClick={async () => {
               if (!isValidEmail(altEmail)) return void toast.error(`Enter the email address used for your ${alt === "wise" ? "Wise" : "PayPal"} account, for example name@example.com.`);
               try { await fallback({ data: { method: alt, email: altEmail } }); toast.success("Payout details saved."); qc.invalidateQueries({ queryKey: CREATOR_KEY }); }
               catch (e: unknown) { toast.error(friendlyCreatorError(e)); }
            }}>Save</Button>
          </div>
          {(profile?.method === "wise" || profile?.method === "paypal") && <p className="mt-2 text-xs font-semibold text-portal-green">Saved: {profile.method} · {profile.wise_email ?? profile.paypal_email}</p>}
        </div>
      </PortalCard>
    </>
  );
}
