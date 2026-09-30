import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Copy, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DocumentBody } from "@/components/portal/DocumentBody";
import { CountrySelect } from "@/components/creators/CountrySelect";
import { INFLUENCER_COPY, NICHES, POST_LANGUAGES } from "@/i18n/influencers";
import { cn } from "@/lib/utils";
import {
  acceptInfluencerRules, confirmInfluencerMediaKit, influencerMediaKitSlot, openInfluencerMediaKit, saveInfluencerPayout,
  signInfluencerAgreement, startInfluencerStripe, syncInfluencerStripe, updateInfluencerProfile,
} from "@/lib/influencer-space.functions";
import { fillAgreement, INFLUENCER_KEY, influencerSteps, useInfluencerDoc, useInfluencerQuery, type Influencer } from "./useInfluencer";

const LABELS = INFLUENCER_COPY.en;

function friendly(e: unknown) {
  const m = e instanceof Error ? e.message : "";
  if (!m || m.startsWith("[") || m.includes("{")) return "Something went wrong. Check the fields and try again.";
  return m;
}

function Title({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-brand-navy">{title}</h1>
      {lead ? <p className="mt-2 text-brand-navySoft">{lead}</p> : null}
    </div>
  );
}
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl bg-card p-5 shadow-card md:p-6", className)}>{children}</section>;
}
function useMe() {
  const { data } = useInfluencerQuery();
  return data as Influencer;
}
function useRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: INFLUENCER_KEY });
}

/* ---------- Home ---------- */
export function InfluencerHome() {
  const me = useMe();
  const steps = influencerSteps(me);
  const list = [
    { done: steps.rules, label: "Read the influencer rules", to: "/creators/influencer/app/rules" },
    { done: steps.agreement, label: "Sign the master agreement", to: "/creators/influencer/app/agreement" },
    { done: steps.payouts, label: "Set up payouts", to: "/creators/influencer/app/payouts" },
  ];
  const next = list.find((s) => !s.done);
  function copy(v: string) {
    void navigator.clipboard.writeText(v);
    toast.success("Copied.");
  }
  return (
    <div className="space-y-5">
      <Title title={`Hello ${me.display_name.split(" ")[0]}`} lead="Your Sophia influencer space." />
      {!steps.done ? (
        <Card>
          <p className="text-sm font-bold text-brand-navy">Getting started · {steps.count} of 3 done</p>
          <ol className="mt-4 space-y-2">
            {list.map((s, i) => (
              <li key={s.to}>
                <Link to={s.to} className="flex min-h-11 items-center gap-3 rounded-xl border border-brand-line px-4 py-3 hover:bg-brand-navy/5">
                  <span className={cn("flex size-7 items-center justify-center rounded-full text-xs font-bold", s.done ? "bg-portal-green text-card" : "bg-brand-navy/10 text-brand-navy")}>
                    {s.done ? <Check className="size-4" aria-hidden="true" /> : i + 1}
                  </span>
                  <span className={cn("flex-1 text-sm font-semibold", s.done ? "text-brand-navySoft line-through" : "text-brand-navy")}>{s.label}</span>
                </Link>
              </li>
            ))}
          </ol>
          {next ? (
            <Button asChild variant="pill" size="pill" className="mt-5"><Link to={next.to}>Continue: {next.label.toLowerCase()}</Link></Button>
          ) : null}
        </Card>
      ) : (
        <Card>
          <p className="font-bold text-brand-navy">You are all set.</p>
          <p className="mt-2 text-sm text-brand-navySoft">When a brief fits you, your offer will appear here with the price, the deliverables and the deadline.</p>
        </Card>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <p className="text-sm font-bold text-brand-navy">Pending offers</p>
          <p className="mt-2 text-sm text-brand-navySoft">No offer yet.</p>
        </Card>
        <Card>
          <p className="text-sm font-bold text-brand-navy">Earnings this month</p>
          <p className="mt-2 text-2xl font-extrabold text-brand-navy">€0</p>
        </Card>
      </div>
      <Card>
        <p className="text-sm font-bold text-brand-navy">Your tracked link and promo code</p>
        {me.tracked_link || me.promo_code ? (
          <div className="mt-3 space-y-2">
            {[["Tracked link", me.tracked_link], ["Promo code", me.promo_code]].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-28 text-xs font-bold uppercase text-brand-navySoft">{k}</span>
                <code className="flex-1 truncate rounded-lg bg-brand-navy/5 px-3 py-2 text-sm">{v}</code>
                <Button variant="pillSecondary" size="pillSm" onClick={() => copy(v!)} aria-label={`Copy ${k}`}><Copy className="size-4" /></Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-brand-navySoft">The Sophia team will add them here before your first collaboration.</p>
        )}
      </Card>
    </div>
  );
}

/* ---------- Rules ---------- */
export function InfluencerRules() {
  const me = useMe();
  const { data: doc, isLoading } = useInfluencerDoc("influencer-rules");
  const accept = useServerFn(acceptInfluencerRules);
  const refresh = useRefresh();
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try { await accept({ data: { accepted: true } }); await refresh(); toast.success("Rules accepted."); }
    catch (e) { toast.error(friendly(e)); }
    finally { setBusy(false); }
  }
  return (
    <div>
      <Title title="Influencer rules" lead="Step 1 of 3. Short, and they apply to every collaboration." />
      <Card>
        {isLoading ? <p className="text-sm">Loading…</p> : doc ? <DocumentBody blocks={doc.blocks} /> : <p className="text-sm">The rules are not published yet.</p>}
      </Card>
      <Card className="mt-5">
        {me.rules_accepted_at ? (
          <p className="text-sm font-semibold text-portal-green">You accepted the rules on {new Date(me.rules_accepted_at).toLocaleDateString("en-GB")}.</p>
        ) : (
          <>
            <label className="flex items-start gap-3 text-sm text-brand-navy">
              <input type="checkbox" className="mt-1 size-4" checked={ok} onChange={(e) => setOk(e.target.checked)} />
              I have read these rules and I will follow them.
            </label>
            <Button variant="pill" size="pill" className="mt-4" disabled={!ok || busy} onClick={go}>Accept the rules</Button>
          </>
        )}
        {me.rules_accepted_at && !me.agreement_signed_at ? (
          <Button asChild variant="pill" size="pill" className="mt-4"><Link to="/creators/influencer/app/agreement">Next: sign the agreement</Link></Button>
        ) : null}
      </Card>
    </div>
  );
}

/* ---------- Agreement ---------- */
export function InfluencerAgreement() {
  const me = useMe();
  const { data: doc, isLoading } = useInfluencerDoc("influencer-agreement");
  const sign = useServerFn(signInfluencerAgreement);
  const refresh = useRefresh();
  const [name, setName] = useState("");
  const [read, setRead] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { data: sig } = useQuery({
    queryKey: ["influencer", "signature", me.id],
    queryFn: async () => (await supabase.from("influencer_signatures").select("signed_name, signed_at, document_version").eq("influencer_id", me.id).eq("kind", "master").maybeSingle()).data,
  });
  async function go() {
    setErr(null);
    if (name.trim().length < 2) return setErr("Type your full legal name to sign.");
    if (!read) return setErr("Confirm that you are at least 18 and have read the whole document.");
    if (!doc) return;
    setBusy(true);
    try {
      await sign({ data: { signedName: name.trim(), documentVersion: String(doc.version), userAgent: navigator.userAgent } });
      await refresh();
      toast.success("Agreement signed.");
    } catch (e) { setErr(friendly(e)); }
    finally { setBusy(false); }
  }
  if (!me.rules_accepted_at) {
    return (
      <div>
        <Title title="Master agreement" lead="Step 2 of 3." />
        <Card><p className="text-sm text-brand-navySoft">Read and accept the rules first.</p>
          <Button asChild variant="pill" size="pill" className="mt-4"><Link to="/creators/influencer/app/rules">Go to the rules</Link></Button></Card>
      </div>
    );
  }
  return (
    <div>
      <Title title="Influencer Master Agreement" lead="Step 2 of 3. Signed once; each collaboration then has its own Deal Sheet." />
      <Card>
        {isLoading ? <p className="text-sm">Loading…</p> : doc ? (
          <>
            <h2 className="mb-4 text-lg font-extrabold text-brand-navy">{doc.title}</h2>
            <DocumentBody blocks={fillAgreement(doc.blocks, me)} />
            <p className="mt-4 text-xs text-brand-navySoft">Version {doc.version}</p>
          </>
        ) : <p className="text-sm">The agreement is not published yet.</p>}
      </Card>
      <Card className="mt-5">
        {sig ? (
          <p className="text-sm font-semibold text-portal-green">
            Signed by {sig.signed_name} on {new Date(sig.signed_at).toLocaleString("en-GB")} (version {sig.document_version}).
          </p>
        ) : (
          <div className="space-y-3">
            <Label htmlFor="sig-name">Type your full legal name to sign</Label>
            <Input id="sig-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={me.legal_name ?? ""} aria-invalid={Boolean(err)} aria-describedby={err ? "sig-err" : undefined} />
            <label className="flex items-start gap-3 text-sm text-brand-navy">
              <input type="checkbox" className="mt-1 size-4" checked={read} onChange={(e) => setRead(e.target.checked)} />
              I confirm I am at least 18 and have read the whole document.
            </label>
            {err ? <p id="sig-err" role="alert" className="text-sm font-semibold text-portal-red">{err}</p> : null}
            <Button variant="pill" size="pill" disabled={busy || !doc} onClick={go}>Sign electronically</Button>
            <p className="text-xs text-brand-navySoft">We record your name, the date and time, your IP address, your browser and the version you signed.</p>
          </div>
        )}
        {sig && !me.payout_setup_at ? (
          <Button asChild variant="pill" size="pill" className="mt-4"><Link to="/creators/influencer/app/payouts">Next: set up payouts</Link></Button>
        ) : null}
      </Card>
    </div>
  );
}

/* ---------- Payouts ---------- */
export function InfluencerPayouts() {
  const me = useMe();
  const refresh = useRefresh();
  const save = useServerFn(saveInfluencerPayout);
  const startStripe = useServerFn(startInfluencerStripe);
  const sync = useServerFn(syncInfluencerStripe);
  const d = (me.payout_details ?? {}) as Record<string, string>;
  const [method, setMethod] = useState<"stripe" | "invoice" | "agency">((me.payout_method as never) ?? (me.agency_name ? "agency" : "stripe"));
  const [f, setF] = useState<Record<string, string>>({
    legal_entity: d["legal_entity"] ?? me.legal_name ?? "", address: d["address"] ?? "", iban: d["iban"] ?? "", tax_id: d["tax_id"] ?? "",
    agency_name: d["agency_name"] ?? me.agency_name ?? "", billing_contact: d["billing_contact"] ?? "", billing_email: d["billing_email"] ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (me.stripe_account_id && !me.stripe_onboarded) sync({} as never).then(() => refresh()).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function saveBank() {
    setErr(null);
    const iban = f["iban"]!.replace(/\s+/g, "");
    if (iban.length < 10) return setErr("Enter a full IBAN (it starts with two letters, e.g. FR76…).");
    if ((f["address"] ?? "").trim().length < 5) return setErr("Enter the full billing address.");
    if (method === "invoice" && (f["legal_entity"] ?? "").trim().length < 2) return setErr("Enter the name or company you will invoice from.");
    if (method === "agency" && !/^\S+@\S+\.\S+$/.test(f["billing_email"] ?? "")) return setErr("Enter a valid billing email for the agency, like name@agency.com.");
    if (method === "agency" && ((f["agency_name"] ?? "").trim().length < 2 || (f["billing_contact"] ?? "").trim().length < 2)) return setErr("Enter the agency name and a billing contact.");
    setBusy(true);
    try {
      if (method === "invoice") await save({ data: { method, legal_entity: f["legal_entity"]!, address: f["address"]!, iban, tax_id: f["tax_id"] || undefined } });
      else await save({ data: { method: "agency", agency_name: f["agency_name"]!, billing_contact: f["billing_contact"]!, billing_email: f["billing_email"]!, address: f["address"]!, iban } });
      await refresh();
      toast.success("Payout details saved.");
    } catch (e) { setErr(friendly(e)); }
    finally { setBusy(false); }
  }
  async function goStripe() {
    setErr(null);
    setBusy(true);
    try { const r = await startStripe({} as never); window.location.assign(r.url); }
    catch (e) { setErr(friendly(e)); setBusy(false); }
  }
  const OPTIONS = [
    { id: "stripe", title: "Stripe (default)", text: "Paid straight to your bank account through Stripe. You fill in your details once on Stripe's secure page." },
    { id: "invoice", title: "Bank transfer with invoice", text: "You upload an invoice for each deal; we pay it by bank transfer and mark it paid with a date and reference." },
    { id: "agency", title: "Through my agency", text: "Your agency invoices us and is paid on your behalf." },
  ] as const;
  return (
    <div>
      <Title title="Payouts" lead="Step 3 of 3. How you want to be paid for your collaborations." />
      {me.payout_setup_at ? (
        <Card className="mb-5"><p className="text-sm font-semibold text-portal-green">
          Payouts are set up: {me.payout_method === "stripe" ? "Stripe" : me.payout_method === "agency" ? "through your agency" : "bank transfer with invoice"}. You can change this at any time.
        </p></Card>
      ) : null}
      <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Payout method">
        {OPTIONS.map((o) => (
          <button key={o.id} role="radio" aria-checked={method === o.id} onClick={() => setMethod(o.id)}
            className={cn("rounded-2xl border-2 bg-card p-4 text-left transition", method === o.id ? "border-brand-navy" : "border-transparent shadow-card")}>
            <p className="font-bold text-brand-navy">{o.title}</p>
            <p className="mt-1 text-sm text-brand-navySoft">{o.text}</p>
          </button>
        ))}
      </div>
      <Card className="mt-5 space-y-3">
        {method === "stripe" ? (
          <>
            <p className="text-sm text-brand-navySoft">{me.stripe_onboarded ? "Your Stripe account is ready." : me.stripe_account_id ? "Your Stripe setup is not finished yet." : "You will be taken to Stripe, then brought back here."}</p>
            {!me.stripe_onboarded ? <Button variant="pill" size="pill" disabled={busy} onClick={goStripe}>{me.stripe_account_id ? "Continue on Stripe" : "Set up with Stripe"}</Button> : null}
          </>
        ) : (
          <>
            {method === "invoice" ? (
              <>
                <div><Label htmlFor="p-le">Name or company on your invoices</Label><Input id="p-le" value={f["legal_entity"]} onChange={set("legal_entity")} /></div>
                <div><Label htmlFor="p-tax">SIRET or VAT number (optional)</Label><Input id="p-tax" value={f["tax_id"]} onChange={set("tax_id")} /></div>
              </>
            ) : (
              <>
                <div><Label htmlFor="p-an">Agency name</Label><Input id="p-an" value={f["agency_name"]} onChange={set("agency_name")} /></div>
                <div><Label htmlFor="p-bc">Billing contact</Label><Input id="p-bc" value={f["billing_contact"]} onChange={set("billing_contact")} /></div>
                <div><Label htmlFor="p-be">Billing email</Label><Input id="p-be" type="email" value={f["billing_email"]} onChange={set("billing_email")} /></div>
              </>
            )}
            <div><Label htmlFor="p-ad">Billing address</Label><Textarea id="p-ad" value={f["address"]} onChange={set("address")} /></div>
            <div><Label htmlFor="p-iban">IBAN</Label><Input id="p-iban" value={f["iban"]} onChange={set("iban")} autoComplete="off" /></div>
            <Button variant="pill" size="pill" disabled={busy} onClick={saveBank}>Save payout details</Button>
          </>
        )}
        {err ? <p role="alert" className="text-sm font-semibold text-portal-red">{err}</p> : null}
      </Card>
    </div>
  );
}

/* ---------- Profile ---------- */
function toNum(v: string) {
  const t = v.replace(/\s/g, "");
  return t === "" ? null : Number(t);
}
export function InfluencerProfile() {
  const me = useMe();
  const refresh = useRefresh();
  const update = useServerFn(updateInfluencerProfile);
  const slot = useServerFn(influencerMediaKitSlot);
  const confirmKit = useServerFn(confirmInfluencerMediaKit);
  const openKit = useServerFn(openInfluencerMediaKit);
  const fileRef = useRef<HTMLInputElement>(null);
  const s = (v: unknown) => (v == null ? "" : String(v));
  const [f, setF] = useState({
    display_name: me.display_name, legal_name: s(me.legal_name), phone: s(me.phone), country: s(me.country), city: s(me.city),
    tiktok_url: s(me.tiktok_url), tiktok_followers: s(me.tiktok_followers), tiktok_avg_views: s(me.tiktok_avg_views),
    instagram_url: s(me.instagram_url), instagram_followers: s(me.instagram_followers),
    youtube_url: s(me.youtube_url), youtube_subscribers: s(me.youtube_subscribers),
    rate_tiktok: s(me.rate_tiktok), rate_reel: s(me.rate_reel), rate_youtube: s(me.rate_youtube),
    accepts_recurring: (me.accepts_recurring ?? "depends") as "yes" | "no" | "depends",
    availability: (me.availability === "booked" ? "booked" : "available") as "available" | "booked", booked_until: s(me.booked_until),
    agency_name: s(me.agency_name), agency_contact: s(me.agency_contact), media_kit_url: s(me.media_kit_url),
  });
  const [langs, setLangs] = useState<string[]>(me.languages);
  const [niches, setNiches] = useState<string[]>(me.niche_tags);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const toggle = (list: string[], v: string, max: number, fn: (l: string[]) => void) =>
    fn(list.includes(v) ? list.filter((x) => x !== v) : list.length >= max ? list : [...list, v]);

  async function saveAll() {
    setErr(null);
    const urls = [["TikTok", f.tiktok_url], ["Instagram", f.instagram_url], ["YouTube", f.youtube_url], ["Media kit", f.media_kit_url]];
    for (const [k, v] of urls) if (v && !/^https?:\/\/\S+\.\S+/.test(v)) return setErr(`${k} link: paste the full address, starting with https://`);
    if (!/^\+?[\d\s().-]{8,}$/.test(f.phone)) return setErr("Phone: include your country code, for example +33 6 12 34 56 78.");
    if (!niches.length) return setErr("Pick at least one niche.");
    if (!langs.length) return setErr("Pick at least one language you post in.");
    if (f.availability === "booked" && !f.booked_until) return setErr("Tell us until when you are booked.");
    const nums = ["tiktok_followers", "tiktok_avg_views", "instagram_followers", "youtube_subscribers", "rate_tiktok", "rate_reel", "rate_youtube"] as const;
    for (const k of nums) if (f[k] && Number.isNaN(Number(f[k].replace(/\s/g, "")))) return setErr("Follower counts, views and rates must be numbers only (no € sign or letters).");
    setBusy(true);
    try {
      await update({ data: {
        display_name: f.display_name, legal_name: f.legal_name, phone: f.phone, country: f.country, city: f.city,
        languages: langs, niche_tags: niches as never,
        tiktok_url: f.tiktok_url, tiktok_followers: toNum(f.tiktok_followers), tiktok_avg_views: toNum(f.tiktok_avg_views),
        instagram_url: f.instagram_url, instagram_followers: toNum(f.instagram_followers),
        youtube_url: f.youtube_url, youtube_subscribers: toNum(f.youtube_subscribers),
        rate_tiktok: toNum(f.rate_tiktok), rate_reel: toNum(f.rate_reel), rate_youtube: toNum(f.rate_youtube),
        accepts_recurring: f.accepts_recurring, availability: f.availability, booked_until: f.booked_until || null,
        agency_name: f.agency_name, agency_contact: f.agency_contact, media_kit_url: f.media_kit_url,
      } });
      await refresh();
      toast.success("Profile saved.");
    } catch (e) { setErr(friendly(e)); }
    finally { setBusy(false); }
  }
  async function uploadKit(file: File) {
    const r = await slot({ data: { name: file.name, size: file.size } });
    if (!r.ok) return void toast.error(r.reason === "type" ? "The media kit must be a PDF or an image (PNG, JPG, WEBP)." : r.reason === "size" ? "The file is larger than 20 MB." : "The upload could not start. Try again.");
    const up = await fetch(r.signedUrl, { method: "PUT", body: file, headers: { "content-type": file.type || "application/octet-stream" } });
    if (!up.ok) return void toast.error("The upload failed. Try again.");
    await confirmKit({ data: { path: r.path } });
    await refresh();
    toast.success("Media kit uploaded.");
  }
  const field = (id: keyof typeof f, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div><Label htmlFor={`pf-${id}`}>{label}</Label><Input id={`pf-${id}`} value={f[id] as string} onChange={set(id)} {...props} /></div>
  );
  return (
    <div className="space-y-5">
      <Title title="Profile" lead="Keep this up to date: we use it to match you with briefs." />
      <Card>
        <p className="mb-3 font-bold text-brand-navy">Availability</p>
        <div className="flex flex-wrap gap-2">
          {(["available", "booked"] as const).map((a) => (
            <Button key={a} variant={f.availability === a ? "pill" : "pillSecondary"} size="pillSm" onClick={() => setF({ ...f, availability: a })}>
              {a === "available" ? "Available" : "Booked until…"}
            </Button>
          ))}
        </div>
        {f.availability === "booked" ? <div className="mt-3 max-w-xs">{field("booked_until", "Booked until", { type: "date" })}</div> : null}
      </Card>
      <Card className="grid gap-4 md:grid-cols-2">
        <p className="font-bold text-brand-navy md:col-span-2">About you</p>
        {field("display_name", "Display name")}
        {field("legal_name", "Legal name (used on contracts)")}
        {field("phone", "Phone", { type: "tel" })}
        <div><Label>Country</Label><CountrySelect value={f.country} onChange={(v: string) => setF({ ...f, country: v })} /></div>
        {field("city", "City")}
      </Card>
      <Card className="grid gap-4 md:grid-cols-2">
        <p className="font-bold text-brand-navy md:col-span-2">Platforms</p>
        {field("tiktok_url", "TikTok link", { inputMode: "url" })}
        {field("tiktok_followers", "TikTok followers", { inputMode: "numeric" })}
        {field("tiktok_avg_views", "Average views, last 10 TikToks", { inputMode: "numeric" })}
        <span className="hidden md:block" />
        {field("instagram_url", "Instagram link", { inputMode: "url" })}
        {field("instagram_followers", "Instagram followers", { inputMode: "numeric" })}
        {field("youtube_url", "YouTube link", { inputMode: "url" })}
        {field("youtube_subscribers", "YouTube subscribers", { inputMode: "numeric" })}
      </Card>
      <Card className="space-y-4">
        <p className="font-bold text-brand-navy">Niches (up to 4) and languages</p>
        <div className="flex flex-wrap gap-2">
          {NICHES.map((n) => (
            <Button key={n} variant={niches.includes(n) ? "pill" : "pillSecondary"} size="pillSm" aria-pressed={niches.includes(n)} onClick={() => toggle(niches, n, 4, setNiches)}>{LABELS.niches[n]}</Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {POST_LANGUAGES.map((l) => (
            <Button key={l} variant={langs.includes(l) ? "pill" : "pillSecondary"} size="pillSm" aria-pressed={langs.includes(l)} onClick={() => toggle(langs, l, 10, setLangs)}>{LABELS.languages[l]}</Button>
          ))}
        </div>
      </Card>
      <Card className="grid gap-4 md:grid-cols-3">
        <p className="font-bold text-brand-navy md:col-span-3">Rate card (euros)</p>
        {field("rate_tiktok", "Per TikTok post", { inputMode: "decimal" })}
        {field("rate_reel", "Per Instagram Reel", { inputMode: "decimal" })}
        {field("rate_youtube", "Per YouTube video", { inputMode: "decimal" })}
        <div className="md:col-span-3">
          <Label>Monthly partnership?</Label>
          <div className="mt-2 flex gap-2">
            {(["yes", "no", "depends"] as const).map((v) => (
              <Button key={v} variant={f.accepts_recurring === v ? "pill" : "pillSecondary"} size="pillSm" onClick={() => setF({ ...f, accepts_recurring: v })}>
                {v === "yes" ? "Yes" : v === "no" ? "No" : "Depends"}
              </Button>
            ))}
          </div>
        </div>
      </Card>
      <Card className="space-y-4">
        <p className="font-bold text-brand-navy">Media kit</p>
        <div className="flex flex-wrap gap-2">
          {me.media_kit_path ? (
            <Button variant="pillSecondary" size="pillSm" onClick={async () => { const r = await openKit({} as never); if (r.url) window.open(r.url, "_blank", "noopener"); }}>
              <FileText className="size-4" /> Open current media kit
            </Button>
          ) : null}
          <Button variant="pillSecondary" size="pillSm" onClick={() => fileRef.current?.click()}>{me.media_kit_path ? "Replace file" : "Upload PDF or image"}</Button>
          <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadKit(file); e.target.value = ""; }} />
        </div>
        {field("media_kit_url", "Or a link to your media kit", { inputMode: "url" })}
      </Card>
      <Card className="grid gap-4 md:grid-cols-2">
        <p className="font-bold text-brand-navy md:col-span-2">Agency (if you are represented)</p>
        {field("agency_name", "Agency name")}
        {field("agency_contact", "Agency contact (name, email or phone)")}
      </Card>
      <Card>
        <p className="font-bold text-brand-navy">Payout details</p>
        <p className="mt-1 text-sm text-brand-navySoft">
          {me.payout_setup_at ? `Set up: ${me.payout_method === "stripe" ? "Stripe" : me.payout_method === "agency" ? "through your agency" : "bank transfer with invoice"}.` : "Not set up yet."}
        </p>
        <Button asChild variant="pillSecondary" size="pillSm" className="mt-3"><Link to="/creators/influencer/app/payouts">Change payout details</Link></Button>
      </Card>
      <div className="sticky bottom-3 flex flex-col gap-2 rounded-2xl bg-card p-3 shadow-card sm:flex-row sm:items-center">
        {err ? <p role="alert" className="flex-1 text-sm font-semibold text-portal-red">{err}</p> : <span className="flex-1" />}
        <Button variant="pill" size="pill" disabled={busy} onClick={saveAll}>Save profile</Button>
      </div>
    </div>
  );
}

/* ---------- Messages ---------- */
export function InfluencerMessages() {
  const me = useMe();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const key = ["influencer", "messages", me.id];
  const { data = [] } = useQuery({
    queryKey: key,
    refetchInterval: 30_000,
    queryFn: async () => (await supabase.from("influencer_messages").select("*").eq("influencer_id", me.id).order("created_at")).data ?? [],
  });
  const { data: announcements = [] } = useQuery({
    queryKey: ["influencer", "announcements"],
    queryFn: async () => (await supabase.from("creator_announcements").select("id, title, body, created_at").eq("active", true).eq("track", "influencer").order("created_at", { ascending: false })).data ?? [],
  });
  async function send() {
    const body = text.trim();
    if (!body) return void toast.error("Write a message first.");
    setBusy(true);
    const { error } = await supabase.from("influencer_messages").insert({ influencer_id: me.id, body });
    setBusy(false);
    if (error) return void toast.error("Your message could not be sent. Try again.");
    setText("");
    await qc.invalidateQueries({ queryKey: key });
  }
  return (
    <div className="space-y-5">
      <Title title="Messages" lead="Talk to the Sophia team." />
      {announcements.map((a) => (
        <Card key={a.id} className="border-l-4 border-portal-accent"><p className="font-bold text-brand-navy">{a.title}</p><p className="mt-1 whitespace-pre-line text-sm text-brand-navySoft">{a.body}</p></Card>
      ))}
      <Card className="space-y-3">
        {data.length ? data.map((m) => (
          <div key={m.id} className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm", m.from_admin ? "bg-brand-navy/5 text-brand-navy" : "ml-auto bg-brand-navy text-card")}>
            <p className="whitespace-pre-line">{m.body}</p>
            <p className="mt-1 text-[11px] opacity-70">{m.from_admin ? "Sophia · " : ""}{new Date(m.created_at).toLocaleString("en-GB")}</p>
          </div>
        )) : <p className="text-sm text-brand-navySoft">No messages yet.</p>}
      </Card>
      <Card className="space-y-3">
        <Label htmlFor="inf-msg">New message</Label>
        <Textarea id="inf-msg" value={text} onChange={(e) => setText(e.target.value)} maxLength={5000} />
        <Button variant="pill" size="pill" disabled={busy} onClick={send}>Send</Button>
      </Card>
    </div>
  );
}
