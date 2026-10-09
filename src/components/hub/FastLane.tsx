import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAdminApp, SOPHIA_APP_ID } from "@/lib/apps";
import { cn } from "@/lib/utils";
import { createFastLane, emailFastLane, regenerateFastLane, saveCreatorPay } from "@/lib/fast-lane.functions";

export type Pay = { tier: "trial" | "active" | "pro"; perPost: number | null; rpm: number | null; cap: number | null; postsPerMonth: number | null; platforms: "tiktok" | "instagram" | "both"; fixedMonthly: number | null; welcomeBonus: number | null };
export type Preset = { kind: "creator" | "applicant" | "prospect"; id: string; name: string; email: string | null; country: string | null; tiktok: string | null; instagram: string | null };
const SOURCES = ["va", "dm", "sideshift", "upwork", "referral", "other"] as const;
const field = "min-h-10 w-full rounded-lg border border-brand-line bg-card px-3 text-sm";
const fr = (n: number | null) => (n == null ? "—" : `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n)} €`);
const defaultLang = (c: string) => (/^(fr|france|be|belgi|ch|suisse|lu|mc)/i.test(c.trim()) ? "fr" : "en");

function useTiers(appId: string) {
  return useQuery({ queryKey: ["hub", "tiers", appId], queryFn: async () => (await supabase.from("ugc_tiers").select("tier, per_post, cpm, cap_per_post").eq("app_id", appId)).data ?? [] });
}
export function payPreview(p: Pay) {
  const n = p.postsPerMonth ?? 20;
  if (p.fixedMonthly) return `Elle verra : ${fr(p.fixedMonthly)} pour ${n} vidéos par mois (au prorata) · ${fr(p.rpm)} / 1 000 vues${p.cap ? ` · jusqu'à ${fr(p.cap)} par post` : ""}${p.perPost ? ` · + ${fr(p.perPost)} par post` : ""}${p.welcomeBonus ? ` · bonus ${fr(p.welcomeBonus)}` : ""}`;
  return `Elle verra : ${fr(p.perPost)} par post · ${fr(p.rpm)} / 1 000 vues · jusqu'à ${fr(p.cap)} par post · objectif ${n} posts/mois${p.welcomeBonus ? ` · bonus ${fr(p.welcomeBonus)}` : ""}`;
}

export function PayEditor({ pay, setPay, appId }: { pay: Pay; setPay: (p: Pay) => void; appId: string }) {
  const { data: tiers = [] } = useTiers(appId);
  const fromTier = (tier: Pay["tier"]) => { const t = tiers.find((x) => x.tier === tier); setPay({ ...pay, tier, perPost: t ? Number(t.per_post) : pay.perPost, rpm: t ? Number(t.cpm) : pay.rpm, cap: t ? Number(t.cap_per_post) : pay.cap }); };
  const numIn = (k: "perPost" | "rpm" | "cap" | "postsPerMonth" | "fixedMonthly" | "welcomeBonus", label: string) => (
    <label className="text-xs font-semibold text-brand-navySoft">{label}
      <input aria-label={label} type="number" step="0.01" min="0" className={field} value={pay[k] ?? ""} onChange={(e) => setPay({ ...pay, [k]: e.target.value === "" ? null : Number(e.target.value) })} />
    </label>
  );
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-brand-navySoft">Starting tier
          <select aria-label="Starting tier" className={field} value={pay.tier} onChange={(e) => fromTier(e.target.value as Pay["tier"])}><option value="trial">Trial</option><option value="active">Active</option><option value="pro">Pro</option></select>
        </label>
        {numIn("perPost", "€ per post")}{numIn("rpm", "€ per 1,000 views")}{numIn("cap", "Cap per post (€)")}{numIn("postsPerMonth", "Monthly post target")}
        <label className="text-xs font-semibold text-brand-navySoft">Platforms required
          <select aria-label="Platforms required" className={field} value={pay.platforms} onChange={(e) => setPay({ ...pay, platforms: e.target.value as Pay["platforms"] })}><option value="both">Both</option><option value="tiktok">TikTok</option><option value="instagram">Instagram</option></select>
        </label>
        {numIn("fixedMonthly", "Fixed monthly € (optional)")}{numIn("welcomeBonus", "Welcome bonus € (optional)")}
      </div>
      <p className="rounded-xl bg-portal-bg p-3 text-sm font-semibold text-brand-navy">{payPreview(pay)}</p>
    </div>
  );
}

const emptyPay: Pay = { tier: "trial", perPost: null, rpm: null, cap: null, postsPerMonth: 20, platforms: "both", fixedMonthly: null, welcomeBonus: null };
type Result = { name: string; email: string; link: string | null; error: string | null };

export function AddValidatedCreator({ open, onOpenChange, preset }: { open: boolean; onOpenChange: (o: boolean) => void; preset?: Preset | null }) {
  const { appId: selected } = useAdminApp();
  const qc = useQueryClient();
  const [appId, setAppId] = useState(selected ?? SOPHIA_APP_ID);
  const [tab, setTab] = useState<"one" | "bulk">("one");
  const [p, setP] = useState({ firstName: "", lastName: "", email: "", country: "FR", language: "fr" as "fr" | "en", platform: "ios" as "ios" | "android", tiktok: "", instagram: "", source: "other" as (typeof SOURCES)[number], notes: "" });
  const [pay, setPay] = useState<Pay>(emptyPay);
  const [jobId, setJobId] = useState<string>("");
  const [bulk, setBulk] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const create = useServerFn(createFastLane);
  const { data: apps = [] } = useQuery({ queryKey: ["hub", "apps-list"], queryFn: async () => (await supabase.from("apps").select("id, name")).data ?? [] });
  const { data: jobs = [] } = useQuery({ queryKey: ["hub", "fast-jobs", appId], queryFn: async () => (await supabase.from("jobs").select("id, title, open").eq("status", "active").eq("app_id", appId)).data ?? [] });
  const { data: tiers = [] } = useTiers(appId);

  useEffect(() => { if (!open) return; setResults(null); setTab("one");
    if (preset) { const [f = "", ...l] = preset.name.split(/\s+/); setP((x) => ({ ...x, firstName: f, lastName: l.join(" "), email: preset.email ?? "", country: preset.country ?? "FR", language: defaultLang(preset.country ?? "FR"), tiktok: preset.tiktok ?? "", instagram: preset.instagram ?? "" })); }
    else setP((x) => ({ ...x, firstName: "", lastName: "", email: "", tiktok: "", instagram: "", notes: "" }));
  }, [open, preset]);
  useEffect(() => { const j = jobs.find((x) => x.open) ?? jobs[0]; setJobId(j?.id ?? ""); }, [jobs]);
  useEffect(() => { const t = tiers.find((x) => x.tier === pay.tier); if (t && pay.perPost == null && pay.rpm == null && pay.cap == null) setPay((x) => ({ ...x, perPost: Number(t.per_post), rpm: Number(t.cpm), cap: Number(t.cap_per_post) })); }, [tiers]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    let people: Record<string, unknown>[] = [];
    if (tab === "one") {
      if (!p.firstName.trim()) return void toast.error("A first name is needed.");
      if (p.email.trim() && !/^\S+@\S+\.\S+$/.test(p.email.trim())) return void toast.error("This email doesn't look valid. Leave it empty if you don't have it.");
      people = [{ ...p, email: p.email.trim() || null, lastName: p.lastName || null, tiktok: p.tiktok || null, instagram: p.instagram || null, notes: p.notes || null, ref: preset ? { kind: preset.kind, id: preset.id } : null }];
    } else {
      const lines = bulk.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const bad: number[] = [];
      people = lines.map((l, i) => {
        const [firstName = "", email = "", country = "", handle = "", source = ""] = l.split(/[,;\t]/).map((v) => v.trim());
        if (!firstName || (email && !/^\S+@\S+\.\S+$/.test(email))) bad.push(i + 1);
        return { firstName, email: email || null, country: country || null, language: defaultLang(country), tiktok: handle || null, source: (SOURCES as readonly string[]).includes(source.toLowerCase()) ? source.toLowerCase() : "other" };
      });
      if (!people.length) return void toast.error("Paste at least one line.");
      if (bad.length) return void toast.error(`Line ${bad.join(", ")}: a first name and a valid email are needed.`);
    }
    setBusy(true);
    try {
      const r = await create({ data: { appId, jobId: jobId || null, pay, people: people as never, origin: window.location.origin } });
      setResults(r.results);
      const ok = r.results.filter((x) => x.link).length;
      toast.success(`${ok} link${ok > 1 ? "s" : ""} ready`);
      void qc.invalidateQueries({ queryKey: ["hub", "discover"] });
      void qc.invalidateQueries({ queryKey: ["hub", "fast-lane"] });
    } catch { toast.error("The links could not be created. Please try again."); }
    setBusy(false);
  }
  const csv = () => { const rows = [["name", "email", "link"], ...(results ?? []).map((r) => [r.name, r.email, r.link ?? r.error ?? ""])]; const blob = new Blob([rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "fast-lane-links.csv"; a.click(); };

  const txt = (k: keyof typeof p, label: string, type = "text") => (
    <label className="text-xs font-semibold text-brand-navySoft">{label}<input aria-label={label} type={type} className={field} value={p[k]} onChange={(e) => setP({ ...p, [k]: e.target.value, ...(k === "country" ? { language: defaultLang(e.target.value) } : {}) })} /></label>
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogTitle>{preset ? `Generate a link for ${preset.name}` : "Add validated creator"}</DialogTitle>
        {results ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => void navigator.clipboard.writeText(results.filter((r) => r.link).map((r) => `${r.name}\t${r.email}\t${r.link}`).join("\n")).then(() => toast.success("All links copied"))}>Copy all</Button>
              <Button size="sm" variant="outline" onClick={csv}>Export CSV</Button>
              <Button size="sm" variant="ghost" onClick={() => setResults(null)}>Add more</Button>
            </div>
            <table className="w-full text-left text-sm"><thead><tr className="text-xs text-brand-navySoft"><th className="py-1">Name</th><th>Email</th><th>Link</th></tr></thead>
              <tbody>{results.map((r) => <tr key={r.email} className="border-t"><td className="py-2 font-semibold">{r.name}</td><td className="break-all">{r.email || "email à saisir"}</td>
                <td>{r.link ? <div className="flex items-center gap-2"><code className="max-w-[14rem] truncate text-xs" data-testid="fast-link">{r.link}</code><Button size="sm" variant="outline" onClick={() => void navigator.clipboard.writeText(r.link!).then(() => toast.success("Copied"))}>Copy</Button></div> : <span className="text-xs text-destructive">{r.error}</span>}</td></tr>)}</tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-5">
            {!preset ? <div className="flex gap-1 border-b">{([["one", "One person"], ["bulk", "Paste a list"]] as const).map(([k, l]) => <button key={k} type="button" onClick={() => setTab(k)} className={cn("border-b-2 px-3 pb-2 text-sm font-bold", tab === k ? "border-brand-navy text-brand-navy" : "border-transparent text-brand-navySoft")}>{l}</button>)}</div> : null}
            <section className="space-y-3">
              <h3 className="text-sm font-extrabold text-brand-navy">Person</h3>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-brand-navySoft">App<select aria-label="App" className={field} value={appId} onChange={(e) => { setAppId(e.target.value); setPay(emptyPay); }}>{apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
                <label className="text-xs font-semibold text-brand-navySoft">Job<select aria-label="Job" className={field} value={jobId} onChange={(e) => setJobId(e.target.value)}><option value="">No job</option>{jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</select></label>
              </div>
              {tab === "one" ? (
                <div className="grid grid-cols-2 gap-3">
                  {txt("firstName", "First name")}{txt("lastName", "Last name (optional)")}<div>{txt("email", "Email (optional)", "email")}<p className="mt-1 text-[11px] text-brand-navySoft">Si tu ne l'as pas, elle le saisira sur son lien.</p></div>{txt("country", "Country")}
                  <label className="text-xs font-semibold text-brand-navySoft">Language<select aria-label="Language" className={field} value={p.language} onChange={(e) => setP({ ...p, language: e.target.value as "fr" | "en" })}><option value="fr">Français</option><option value="en">English</option></select></label>
                  <label className="text-xs font-semibold text-brand-navySoft">Phone<select aria-label="Phone" className={field} value={p.platform} onChange={(e) => setP({ ...p, platform: e.target.value as "ios" | "android" })}><option value="ios">iPhone</option><option value="android">Android</option></select></label>
                  {txt("tiktok", "Personal TikTok handle (optional)")}{txt("instagram", "Instagram handle (optional)")}
                  <label className="text-xs font-semibold text-brand-navySoft">Source<select aria-label="Source" className={field} value={p.source} onChange={(e) => setP({ ...p, source: e.target.value as never })}>{SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
                  <label className="col-span-2 text-xs font-semibold text-brand-navySoft">Notes<textarea aria-label="Notes" className={cn(field, "min-h-16 py-2")} value={p.notes} onChange={(e) => setP({ ...p, notes: e.target.value })} /></label>
                </div>
              ) : (
                <label className="block text-xs font-semibold text-brand-navySoft">One line per person: prénom, email, pays, handle, source
                  <textarea aria-label="Paste a list" className={cn(field, "min-h-32 py-2 font-mono")} placeholder={"Léa, lea@gmail.com, FR, lea.reads, va\nTom, tom@gmail.com, BE, , dm"} value={bulk} onChange={(e) => setBulk(e.target.value)} />
                </label>
              )}
            </section>
            <section className="space-y-3">
              <h3 className="text-sm font-extrabold text-brand-navy">Pay — what this creator will see</h3>
              <PayEditor pay={pay} setPay={setPay} appId={appId} />
            </section>
            <Button className="w-full bg-brand-navy" disabled={busy} onClick={() => void save()}>{busy ? "Creating…" : tab === "bulk" ? "Create all links" : "Create the link"}</Button>
            <p className="text-xs text-brand-navySoft">No email is sent. You can copy the link or send it by email from the creator's card.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Fast-lane block on the Discover fiche of an existing creator. */
export function FastLaneBlock({ creatorId, firstName }: { creatorId: string; firstName: string }) {
  const qc = useQueryClient();
  const regen = useServerFn(regenerateFastLane);
  const send = useServerFn(emailFastLane);
  const savePay = useServerFn(saveCreatorPay);
  const { data: c } = useQuery({
    queryKey: ["hub", "fast-lane", creatorId],
    queryFn: async () => (await supabase.from("creators").select("fast_lane_token, fast_lane_expires_at, fast_lane_sent_at, fast_lane_opened_at, fast_lane_entered_at, fast_lane_app_id, language, starting_tier, tier, per_post_override, rpm_override, cap_override, posts_per_month, required_platforms, fixed_monthly_override, welcome_bonus").eq("id", creatorId).maybeSingle()).data,
  });
  const [pay, setPay] = useState<Pay | null>(null);
  useEffect(() => { if (c) setPay({ tier: (c.starting_tier ?? c.tier ?? "trial") as Pay["tier"], perPost: c.per_post_override, rpm: c.rpm_override, cap: c.cap_override, postsPerMonth: c.posts_per_month ?? 20, platforms: (c.required_platforms ?? "both") as Pay["platforms"], fixedMonthly: c.fixed_monthly_override, welcomeBonus: c.welcome_bonus }); }, [c]);
  const link = c?.fast_lane_token ? `${window.location.origin}/j/${c.fast_lane_token}` : null;
  const status = useMemo(() => {
    if (!c?.fast_lane_token) return null;
    if (c.fast_lane_entered_at) return "entered";
    if (c.fast_lane_expires_at && new Date(c.fast_lane_expires_at).getTime() < Date.now()) return "expired";
    if (c.fast_lane_opened_at) return "opened";
    if (c.fast_lane_sent_at) return "sent";
    return "created";
  }, [c]);
  const refresh = () => void qc.invalidateQueries({ queryKey: ["hub", "fast-lane", creatorId] });
  const dm = link ? (c?.language === "en" ? `Hi ${firstName}, your space is ready, one click and you're in, 2 minutes: ${link}` : `Salut ${firstName}, ton espace est prêt, tu cliques et tu es dedans, 2 minutes : ${link}`) : "";
  return (
    <section className="space-y-3 rounded-xl border border-brand-line p-3">
      <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-bold text-brand-navy">Fast lane</h3>{status ? <span data-testid="fast-status" className={cn("rounded-full px-2 py-0.5 text-xs font-bold", status === "entered" ? "bg-portal-green/15 text-portal-green" : status === "expired" ? "bg-destructive/10 text-destructive" : "bg-portal-bg text-brand-navy")}>{status}</span> : null}</div>
      {link ? <code className="block break-all rounded-lg bg-portal-bg p-2 text-xs">{link}</code> : <p className="text-xs text-brand-navySoft">No personal link yet.</p>}
      <div className="flex flex-wrap gap-2">
        {link ? <>
          <Button size="sm" variant="outline" onClick={() => void navigator.clipboard.writeText(link).then(() => toast.success("Link copied"))}>Copy</Button>
          <Button size="sm" variant="outline" onClick={() => void navigator.clipboard.writeText(dm).then(() => toast.success("DM text copied"))}>Copy DM text</Button>
          <Button size="sm" variant="outline" onClick={async () => { try { const r = await send({ data: { creatorId, origin: window.location.origin } }); if (r.sent) toast.success("Email sent"); else toast.error(`Not sent: ${r.reason ?? "unknown reason"}`); } catch { toast.error("The email could not be sent."); } refresh(); }}>Send by email</Button>
        </> : null}
        <Button size="sm" variant="outline" onClick={async () => { try { await regen({ data: { creatorId, origin: window.location.origin } }); toast.success("New link ready"); } catch { toast.error("Could not create the link."); } refresh(); }}>{link ? "Regenerate link" : "Générer un lien"}</Button>
      </div>
      {pay ? <details><summary className="cursor-pointer text-sm font-semibold text-brand-navy">Pay (what they see)</summary>
        <div className="mt-3"><PayEditor pay={pay} setPay={setPay} appId={c?.fast_lane_app_id ?? SOPHIA_APP_ID} />
          <Button size="sm" className="mt-2" onClick={async () => { try { await savePay({ data: { creatorId, pay } }); toast.success("Pay saved"); refresh(); } catch { toast.error("Could not save the pay."); } }}>Save pay</Button></div>
      </details> : null}
    </section>
  );
}
