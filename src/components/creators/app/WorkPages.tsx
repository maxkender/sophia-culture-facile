import { AppBadge, PlatformBadge, platformName, useApps } from "@/lib/apps";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { effortRates, useHubExtras } from "./HubPages";
import { cn } from "@/lib/utils";
import { BriefView, toStudio, type BriefAsset } from "@/components/hub/BriefPreview";
import { friendlyCreatorError, isHttpUrl } from "@/lib/creator-validation";
import { Banner, EmptyState, PageTitle, PortalCard } from "@/components/portal/ui";
import { markBriefSkipped, markMyMessagesRead, reportPostViews } from "@/lib/creator-app.functions";
import { submitPostLinks } from "@/lib/ugc-loop.functions";
import { GuidelinesBlock, GuidelinesChecklist, useGuidelines } from "../Guidelines";
import { parisWeekStart } from "@/lib/ugc-pay";
import { CATEGORY_LEGEND, briefStatus, fileToBase64, useCreator, type CreatorData } from "./useCreator";
import { t as ct } from "@/i18n/creator-app";

type Post = CreatorData["posts"][number];
type Ref = CreatorData["refs"][number];

const STATUS_CLASS: Record<string, string> = {
  new: "bg-portal-accent/10 text-portal-accent",
  seen: "bg-brand-surfaceStrong text-brand-navySoft",
  posted: "bg-portal-green/10 text-portal-green",
  skipped: "bg-portal-amber/15 text-portal-amber",
};
const Pill = ({ s }: { s: string }) => <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize", STATUS_CLASS[s] ?? "bg-brand-surfaceStrong text-brand-navySoft")}>{s}</span>;
const fmtDate = (d: string) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const money = (n: unknown) => (n == null ? "—" : `$${Number(n).toFixed(2)}`);
const today = () => new Date().toISOString().slice(0, 10);

/* ---------- Add links (the only place to enter post links) ---------- */
export function LogPostForm({ briefId: initialBrief = "", onDone }: { briefId?: string; refId?: string | null; url?: string; onDone?: () => void }) {
  const { briefs, reload } = useCreator();
  const submit = useServerFn(submitPostLinks);
  const [text, setText] = useState("");
  const [briefId, setBriefId] = useState(initialBrief);
  const [checked, setChecked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ url: string; ok: boolean; reason?: string | undefined }[]>([]);
  useEffect(() => setBriefId(initialBrief), [initialBrief]);
  const appId = briefs.find((b) => b.id === briefId)?.app_id ?? null;
  const { data: guidelines = [] } = useGuidelines(appId);
  const urls = text.split(/[\s,]+/).map((u) => u.trim()).filter(Boolean);
  const allTicked = guidelines.every((g) => checked.includes(g.id));
  return (
    <div className="space-y-4">
      <div><Label htmlFor="links" className="text-base font-extrabold">{ct("Ajouter un lien")}</Label>
        <Textarea id="links" rows={3} className="mt-1 text-base" placeholder={"https://www.tiktok.com/@…/video/…\nhttps://www.instagram.com/reel/…"} value={text} onChange={(e) => setText(e.target.value)} />
        <p className="mt-1 text-xs text-brand-navySoft">TikTok ou Instagram, un ou plusieurs liens (un par ligne).</p></div>
      <div><Label htmlFor="link-brief">Brief (optionnel)</Label>
        <select id="link-brief" className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={briefId} onChange={(e) => setBriefId(e.target.value)}>
          <option value="">{ct("Sans brief")}</option>{briefs.map((b) => <option key={b.id} value={b.id}>{ct(b.title)}</option>)}
        </select></div>
      <GuidelinesChecklist appId={appId} value={checked} onChange={setChecked} />
      <Button size="lg" disabled={busy || !urls.length || !allTicked} title={!allTicked ? ct("Coche chaque consigne avant d’envoyer") : undefined} onClick={async () => {
        const bad = urls.find((u) => !isHttpUrl(u) || !u.startsWith("https://"));
        if (bad) return void toast.error(ct("Colle le lien complet, qui commence par https://."));
        setBusy(true);
        try {
          const r = await submit({ data: { urls, briefId: briefId || null, guidelines: checked } });
          setOut(r.results); const ok = r.results.filter((x) => x.ok).length;
          if (ok) { toast.success(`${ok} lien${ok > 1 ? "s" : ""} envoyé${ok > 1 ? "s" : ""}.`); setText(r.results.filter((x) => !x.ok).map((x) => x.url).join("\n")); setChecked([]); await reload(); onDone?.(); }
          else toast.error(ct("Aucun lien n’a été envoyé."));
        } catch (e: unknown) { toast.error(friendlyCreatorError(e)); }
        setBusy(false);
      }}>{ct("Envoyer")}</Button>
      {out.some((x) => !x.ok) ? <ul className="space-y-1 text-sm" data-testid="link-errors">{out.filter((x) => !x.ok).map((x) => <li key={x.url} className="text-portal-red">{x.url} — {x.reason === "Already submitted." ? "déjà envoyé" : x.reason === "Not a TikTok or Instagram video link." ? "ce n’est pas un lien de vidéo TikTok ou Instagram" : "n’a pas pu être enregistré"}</li>)}</ul> : null}
    </div>
  );
}

/* ---------- Briefs ---------- */
import { AssignedBriefs } from "./UgcPages";

function FormatsTab() {
  const d = useCreator();
  const { data } = useHubExtras();
  const formats = d.briefs.filter((b) => (b as { brief_type?: string }).brief_type === "format")
    .sort((a, b) => Number((b as { pinned?: boolean }).pinned) - Number((a as { pinned?: boolean }).pinned) || Number((a as { sort_order?: number }).sort_order ?? 99) - Number((b as { sort_order?: number }).sort_order ?? 99));
  const fr = (d.me as { language?: string }).language !== "en";
  const eur = (n: number) => `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2, minimumFractionDigits: n % 1 ? 2 : 0 }).format(n)} €`;
  const label = { pov: "POV", reaction: fr ? "Réaction" : "Reaction", talking_head: ct("Face cam") } as Record<string, string>;
  return (
    <div>
      <p className="mb-4 rounded-2xl bg-portal-accent/10 px-4 py-3 text-sm font-bold text-brand-navy">{fr ? ct("Choisis 3 formats, refais-les 20 fois.") : ct("Pick 3 formats, redo them 20 times.")}</p>
      {formats.length === 0 ? <EmptyState title={fr ? ct("Pas encore de formats") : ct("No formats yet")} text="" /> : (
        <div className="grid gap-4 md:grid-cols-2" data-testid="formats-grid">
          {formats.map((f) => {
            const x = f as typeof f & { effort?: string; hook_text?: string; beats?: string[] };
            const rates = effortRates(d.me as never, (data?.tiers ?? []) as never, f.app_id);
            const rate = rates[(x.effort ?? "talking_head") as keyof typeof rates];
            return (
              <Link key={f.id} to="/creators/app/briefs/$briefId" params={{ briefId: f.id }} className="block">
                <PortalCard className="h-full transition hover:ring-2 hover:ring-portal-accent/30">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className="rounded-full bg-portal-bg px-2 py-0.5">{label[x.effort ?? "talking_head"]}</span>
                    <span className="rounded-full bg-portal-green/15 px-2 py-0.5 text-portal-green" data-testid="pay-badge">{eur(rate)} + {fr ? "vues" : "views"}</span>
                    <AppBadge appId={f.app_id} />
                  </div>
                  <p className="mt-3 text-xl font-extrabold leading-tight text-brand-navy">{x.hook_text ?? f.hook}</p>
                  <p className="mt-1 text-sm text-brand-navySoft">{ct(f.title)}</p>
                  {x.beats?.length ? <ol className="mt-2 list-decimal pl-5 text-xs text-brand-navySoft">{x.beats.map((b, i) => <li key={i}>{b}</li>)}</ol> : null}
                </PortalCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function BriefsPage() {
  const [tab, setTab] = useState<"formats" | "briefs" | "refs">("formats");
  const d = useCreator();
  return (
    <div>
      <div className="mb-5 flex gap-2 overflow-x-auto">
        {([["formats", "Formats"], ["briefs", "Briefs"], ["refs", ct("Reference videos")]] as const).map(([k, l]) => (
          <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)} className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold ${tab === k ? "bg-brand-navy text-card" : "bg-card text-brand-navy"}`}>{l}</button>
        ))}
      </div>
      {tab === "formats" ? <><PageTitle title={ct("Formats")} lead={ct("Repeatable video mechanics. The pay per post depends on the format.")} /><FormatsTab /></> : tab === "refs" ? (
        <><PageTitle title={ct("Reference videos")} lead={ct("Videos that worked. Use them as inspiration.")} /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{d.refs.map((r) => <RefCard key={r.id} r={r} />)}</div></>
      ) : <FactBriefs />}
    </div>
  );
}

function FactBriefs() {
  const d = useCreator();
  const [app, setApp] = useState("all");
  const [status, setStatus] = useState("all");
  const { data: allApps = [] } = useApps();
  const apps = allApps.filter((a) => d.briefs.some((b) => b.app_id === a.id));
  const list = d.briefs.filter((b) => (b as { brief_type?: string }).brief_type !== "format" && (app === "all" || b.app_id === app) && (status === "all" || briefStatus(d, b.id) === status));
  return (
    <div>
      <PageTitle title={ct("Briefs")} lead={ct("Briefs Max sends you, one by one.")} />
      <AssignedBriefs />
      <div className="mb-6 flex flex-wrap gap-2">
        <select aria-label={ct("App")} className="h-10 rounded-md border border-input bg-card px-3 text-sm" value={app} onChange={(e) => setApp(e.target.value)}>
          <option value="all">{ct("All apps")}</option>{apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select aria-label={ct("Status")} className="h-10 rounded-md border border-input bg-card px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          {["all", "new", "seen", "posted", "skipped"].map((s) => <option key={s} value={s}>{s === "all" ? ct("All statuses") : s}</option>)}
        </select>
      </div>
      {list.length === 0 ? <EmptyState title={ct("No brief yet")} text="Your briefs arrive here when Max sends you one." /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((b) => (
            <Link key={b.id} to="/creators/app/briefs/$briefId" params={{ briefId: b.id }} className="block">
              <PortalCard className="h-full transition hover:ring-2 hover:ring-portal-accent/30">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-extrabold text-brand-navy">{ct(b.title)}</h3>
                  <Pill s={briefStatus(d, b.id)} />
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-brand-navySoft"><AppBadge appId={b.app_id} />{b.due_date ? `Due ${fmtDate(b.due_date)}` : ct("No deadline")}</p>
              </PortalCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function BriefDetailPage({ briefId }: { briefId: string }) {
  const d = useCreator();
  const brief = d.briefs.find((b) => b.id === briefId);
  const skip = useServerFn(markBriefSkipped);
  const { data: extras } = useHubExtras();
  const { data: files = [] } = useQuery({
    queryKey: ["creator-brief-files", briefId],
    queryFn: async () => (await supabase.from("brief_assets").select("role, sort_order, assets(id, kind, title, storage_path, url, text_content, thumbnail_url)").eq("brief_id", briefId).order("sort_order")).data?.filter((x) => x.assets).map((x) => ({ ...(x.assets as unknown as BriefAsset), role: x.role })) ?? [],
  });
  const [mode, setMode] = useState<"none" | "post" | "skip">("none");
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (!brief || d.reads.some((r) => r.brief_id === brief.id)) return;
    supabase.from("brief_reads").insert({ brief_id: brief.id, creator_id: d.me.id }).then(() => d.reload());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brief?.id]);
  if (!brief) return <EmptyState title={ct("Brief not found")} text="It may have been withdrawn." />;
  const status = briefStatus(d, brief.id);
  const refs = d.refs.filter((r) => (brief.reference_video_ids ?? []).includes(r.id));
  const eff = (brief as { effort?: string | null }).effort;
  const rates = extras ? effortRates(d.me as Record<string, unknown>, (extras.tiers ?? []) as never, brief.app_id) : null;
  const pay = rates && eff ? `${(rates as Record<string, number>)[eff]?.toLocaleString("fr-FR")} € / post` : null;
  return (
    <div>
      <Link to="/creators/app/briefs" className="text-sm font-semibold text-portal-accent">{ct("← All briefs")}</Link>
      <div className="mt-3"><PageTitle title={ct(brief.title)} lead={brief.due_date ? `Due ${fmtDate(brief.due_date)}` : ""} action={<Pill s={status} />} /></div>
      <div className="mb-4"><AppBadge appId={brief.app_id} className="text-sm" /></div>
      <PortalCard><BriefView b={toStudio(brief as Record<string, unknown>)} assets={files} refs={refs} pay={pay} /></PortalCard>
      <div className="mt-4"><GuidelinesBlock appId={brief.app_id} /></div>
      <div className="mt-8 flex flex-wrap gap-2">
        <Button onClick={() => setMode(mode === "post" ? "none" : "post")}>J’ai posté : coller mon lien</Button>
        {status !== "posted" && status !== "skipped" && <Button variant="outline" onClick={() => setMode(mode === "skip" ? "none" : "skip")}>{ct("Skip")}</Button>}
      </div>
      {mode === "post" && <PortalCard className="mt-4"><LogPostForm briefId={brief.id} onDone={() => setMode("none")} /></PortalCard>}
      {mode === "skip" && (
        <PortalCard className="mt-4 space-y-3">
          <Label>{ct("Why are you skipping this brief?")}</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          <Button variant="outline" disabled={reason.trim().length < 3} onClick={async () => {
            try { await skip({ data: { briefId: brief.id, reason } }); toast.success(ct("Skipped. The team has your reason.")); setMode("none"); d.reload(); }
            catch (e: unknown) { toast.error(friendlyCreatorError(e)); }
          }}>{ct("Skip this brief")}</Button>
        </PortalCard>
      )}
    </div>
  );
}

/* ---------- Library ---------- */
function RefCard({ r, compact = false }: { r: Ref; compact?: boolean }) {
  const navigate = useNavigate();
  const cat = CATEGORY_LEGEND[r.category];
  return (
    <PortalCard className={cn("flex flex-col p-4", compact && "w-60 shrink-0")}>
      {r.thumbnail_url ? (
        <img src={r.thumbnail_url} alt="" loading="lazy" className="mb-3 aspect-[9/12] w-full rounded-xl object-cover" />
      ) : (
        <div className={cn("mb-3 flex aspect-[9/12] w-full items-center justify-center rounded-xl text-sm font-bold", r.platform === "instagram" ? "bg-portal-accent/10 text-portal-accent" : "bg-brand-navy/10 text-brand-navy")}>{r.platform === "instagram" ? "Instagram" : "TikTok"}</div>
      )}
      <div className="mb-2 flex flex-wrap gap-1"><PlatformBadge platform={r.platform} /><AppBadge appId={r.app_id} /></div>
      {cat && <span className="mb-2 w-fit rounded-full bg-portal-bg px-2.5 py-0.5 text-[11px] font-bold text-brand-navy" title={cat.line}>{ct(cat.label)}</span>}
      <p className="font-extrabold text-brand-navy">{r.title || r.note || ct("Untitled video")}</p>
      {r.why_it_works && <p className="mt-1 text-sm text-brand-navySoft"><b>{ct("Why it works:")}</b> {r.why_it_works}</p>}
      {r.format_notes && <p className="mt-1 text-sm text-brand-navySoft"><b>{ct("Format:")}</b> {r.format_notes}</p>}
      <div className="mt-auto flex flex-wrap gap-2 pt-3">
        <Button asChild size="sm" variant="outline"><a href={r.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-3.5" /> {ct("Open")}</a></Button>
        <Button size="sm" onClick={() => navigate({ to: "/creators/app/posts", search: { ref: r.id } })}>{ct("Use this")}</Button>
      </div>
    </PortalCard>
  );
}

export function LibraryPage() {
  const { refs } = useCreator();
  const [platform, setPlatform] = useState<"tiktok" | "instagram">("tiktok");
  const [cat, setCat] = useState("all");
  const list = refs.filter((r) => r.platform === platform && (cat === "all" || r.category === cat));
  return (
    <div>
      <PageTitle title={ct("Library")} lead={ct("Videos to study and reproduce. Use one as the starting point for a post and we will know which references work.")} />
      <Tabs value={platform} onValueChange={(v) => setPlatform(v as "tiktok")}>
        <TabsList><TabsTrigger value="tiktok">{ct("TikTok")}</TabsTrigger><TabsTrigger value="instagram">{ct("Instagram")}</TabsTrigger></TabsList>
      </Tabs>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {Object.entries(CATEGORY_LEGEND).map(([k, v]) => (
          <button key={k} type="button" onClick={() => setCat(cat === k ? "all" : k)} className={cn("rounded-xl border px-3 py-2 text-left text-sm transition", cat === k ? "border-brand-navy bg-brand-navy text-card" : "border-brand-line bg-card text-brand-navy hover:border-portal-accent/40")}>
            <b>{ct(v.label)}</b> <span className={cat === k ? "opacity-80" : "text-brand-navySoft"}>— {v.line}</span>
          </button>
        ))}
      </div>
      <div className="mt-6">
        {list.length === 0 ? <EmptyState title={ct("No video here yet")} text="The Sophia team adds references regularly." /> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((r) => <RefCard key={r.id} r={r} />)}</div>
        )}
      </div>
    </div>
  );
}

/* ---------- My posts ---------- */
function ReportViews({ post }: { post: Post }) {
  const { reload } = useCreator();
  const report = useServerFn(reportPostViews);
  const [open, setOpen] = useState(false);
  const [views, setViews] = useState("");
  const [file, setFile] = useState<File | null>(null);
  if (!open) return <button className="mt-2 text-sm font-bold text-portal-accent underline" onClick={() => setOpen(true)}>Report views (day 7)</button>;
  return (
    <div className="mt-3 grid gap-2 rounded-xl bg-portal-bg p-3 sm:grid-cols-[140px_1fr_auto]">
      <Input type="number" min={0} placeholder={ct("Views")} value={views} onChange={(e) => setViews(e.target.value)} />
      <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <Button size="sm" onClick={async () => {
        const v = Number(views);
        if (!Number.isFinite(v) || v < 0 || views === "") return void toast.error(ct("Enter the view count."));
        if (!file) return void toast.error(ct("Add a screenshot showing the views."));
        if (file.size > 5_000_000) return void toast.error(ct("Screenshot must be under 5 MB."));
        try { await report({ data: { postId: post.id, views: Math.round(v), screenshotBase64: await fileToBase64(file), contentType: file.type as "image/png" } }); toast.success(ct("Views reported.")); reload(); }
        catch (e: unknown) { toast.error(friendlyCreatorError(e)); }
      }}>{ct("Send")}</Button>
    </div>
  );
}

function FeedbackReply({ post }: { post: Post }) {
  const { me, reload } = useCreator();
  const [text, setText] = useState("");
  return (
    <div className="mt-3 flex gap-2">
      <Input placeholder={ct("Reply to this feedback")} value={text} onChange={(e) => setText(e.target.value)} />
      <Button size="sm" disabled={!text.trim()} onClick={async () => {
        const { error } = await supabase.from("creator_messages").insert({ creator_id: me.id, from_admin: false, body: text.trim(), post_id: post.id });
        if (error) return void toast.error(ct("Your reply was not sent. Check your connection and try again."));
        setText(""); toast.success(ct("Reply sent.")); reload();
      }}>{ct("Reply")}</Button>
    </div>
  );
}

const eurFr = (n: unknown) => `${Number(n ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
type LoopPost = Post & { pay_status?: string | null; views_frozen?: number | null; pay_amount?: number | null; validated_at?: string | null; submitted_at?: string | null; payout_item_id?: string | null };
/** Envoyé → Validé (or Refusé) → Vues à J+7 → Prêt pour paiement → Payé le … */
export function postStage(p: Post, paidAt?: string | null): { label: string; tone: string; detail?: string | undefined } {
  const x = p as LoopPost;
  const v = (n: number | null | undefined) => Number(n ?? 0).toLocaleString("fr-FR");
  if (p.status === "rejected") return { label: "Refusé", tone: "bg-portal-red/10 text-portal-red", detail: p.feedback ? `Raison : ${p.feedback}` : undefined };
  if (p.status === "pending" || p.status === "flagged") return { label: "Envoyé", tone: "bg-brand-surfaceStrong text-brand-navySoft", detail: "en attente de validation" };
  if (x.pay_status === "paid") return { label: paidAt ? `Payé le ${fmtDate(paidAt)}` : "Payé", tone: "bg-portal-green/15 text-portal-green", detail: `${eurFr(x.pay_amount)} · vues à J+7 : ${v(x.views_frozen)}` };
  if (x.pay_status === "approved") return { label: `Paiement en cours : ${eurFr(x.pay_amount)}`, tone: "bg-portal-green/10 text-portal-green", detail: `vues à J+7 : ${v(x.views_frozen)}` };
  if (x.pay_status === "ready") return { label: `Prêt pour paiement : ${eurFr(x.pay_amount)}`, tone: "bg-portal-green/10 text-portal-green", detail: `vues à J+7 : ${v(x.views_frozen)}` };
  if (x.pay_status === "no_data") return { label: ct("Validé · vues introuvables"), tone: "bg-portal-amber/15 text-portal-amber", detail: "l’équipe vérifie le lien avant de payer" };
  const j7 = x.validated_at ? new Date(new Date(x.validated_at).getTime() + 7 * 86400000).toISOString() : null;
  return { label: "Validé", tone: "bg-portal-accent/10 text-portal-accent", detail: `${p.views != null ? `${v(p.views)} vues pour l’instant · ` : ""}vues comptées le ${j7 ? fmtDate(j7) : "—"} (J+7)` };
}

export function WeeklyBar() {
  const { me, posts } = useCreator();
  const start = parisWeekStart();
  const target = Number((me as { weekly_target?: number }).weekly_target ?? 5) || 5;
  const done = posts.filter((p) => p.status !== "rejected" && ((p as LoopPost).submitted_at ?? p.created_at) >= start).length;
  return (
    <PortalCard className="p-4">
      <div data-testid="weekly-bar" className="flex items-baseline justify-between"><p className="text-lg font-extrabold text-brand-navy">{done} / {target} cette semaine</p><p className="text-xs text-brand-navySoft">{ct("du lundi au dimanche")}</p></div>
      <div className="mt-2 h-3 rounded-full bg-brand-line"><div className="h-3 rounded-full bg-portal-accent transition-all" style={{ width: `${Math.min(100, (done / target) * 100)}%` }} /></div>
    </PortalCard>
  );
}

export function PostsPage({ refId }: { refId?: string | undefined }) {
  const { posts, briefs, payoutItems } = useCreator();
  void refId;
  const paidAt = (p: Post) => (payoutItems as { id: string; paid_at?: string | null }[]).find((i) => i.id === (p as LoopPost).payout_item_id)?.paid_at ?? null;
  return (
    <div>
      <PageTitle title={ct("Mes posts")} lead={ct("Colle ici le lien de chaque vidéo publiée. C’est le seul endroit pour envoyer tes liens.")} />
      <div className="mb-6"><WeeklyBar /></div>
      <PortalCard className="mb-8"><LogPostForm /></PortalCard>
      {posts.length === 0 ? <EmptyState title={ct("Aucun lien envoyé pour l’instant")} /> : (
        <div className="space-y-3">
          {posts.map((p) => {
            const brief = briefs.find((b) => b.id === p.brief_id);
            const st = postStage(p, paidAt(p));
            return (
              <PortalCard key={p.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2" data-testid="post-row">
                  <span className="flex min-w-0 flex-wrap items-center gap-2"><PlatformBadge platform={p.platform} /><a href={p.url} target="_blank" rel="noopener noreferrer" className="truncate font-bold text-portal-accent hover:underline">{p.url.replace(/^https:\/\/(www\.)?/, "").slice(0, 48)}</a></span>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-bold", st.tone)}>{ct(st.label)}</span>
                </div>
                <p className="mt-1 text-sm text-brand-navySoft">{brief ? `Brief : ${ct(brief.title)}` : ct("Sans brief")} · envoyé le {fmtDate((p as LoopPost).submitted_at ?? p.created_at)}{st.detail ? ` · ${st.detail}` : ""}</p>
                {p.status === "flagged" && p.feedback ? <div className="mt-3 rounded-xl bg-portal-amber/10 p-3 text-sm"><p>{p.feedback}</p><FeedbackReply post={p} /></div> : null}
              </PortalCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Calls ---------- */
export function CallsPage() {
  const { calls, rsvps, me, reload } = useCreator();
  const now = Date.now();
  const upcoming = calls.filter((c) => new Date(c.starts_at).getTime() > now).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = calls.filter((c) => new Date(c.starts_at).getTime() <= now);
  return (
    <div>
      <PageTitle title={ct("Calls")} lead={ct("RSVP to every call, and come to the ones you said yes to.")} />
      <h2 className="mb-3 text-lg font-extrabold text-brand-navy">{ct("Upcoming")}</h2>
      {upcoming.length === 0 ? <EmptyState title={ct("No call scheduled")} /> : (
        <div className="space-y-3">
          {upcoming.map((c) => {
            const mine = rsvps.find((r) => r.call_id === c.id)?.answer;
            return (
              <PortalCard key={c.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-brand-navy">{ct(c.title)}</p>
                    <p className="text-sm text-brand-navySoft">{new Date(c.starts_at).toLocaleString()}</p>
                    {c.notes && <p className="mt-1 text-sm text-brand-navySoft">{c.notes}</p>}
                  </div>
                  {c.link && <Button asChild size="sm" variant="outline"><a href={c.link} target="_blank" rel="noopener noreferrer">{ct("Join link")}</a></Button>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["yes", "maybe", "no"] as const).map((a) => (
                    <Button key={a} size="sm" variant={mine === a ? "default" : "outline"} onClick={async () => {
                      const { error } = await supabase.from("creator_call_rsvps").upsert({ call_id: c.id, creator_id: me.id, answer: a }, { onConflict: "call_id,creator_id" });
                      if (error) toast.error(ct("Your RSVP was not saved. Check your connection and try again.")); else reload();
                    }}>{a === "yes" ? "Yes" : a === "no" ? "No" : "Maybe"}</Button>
                  ))}
                </div>
              </PortalCard>
            );
          })}
        </div>
      )}
      <h2 className="mb-3 mt-10 text-lg font-extrabold text-brand-navy">{ct("Past")}</h2>
      {past.length === 0 ? <p className="text-sm text-brand-navySoft">{ct("No past call.")}</p> : (
        <PortalCard className="divide-y divide-brand-line p-0">
          {past.map((c) => {
            const r = rsvps.find((x) => x.call_id === c.id);
            return (
              <div key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span><b className="text-brand-navy">{ct(c.title)}</b> <span className="text-brand-navySoft">· {fmtDate(c.starts_at)}</span></span>
                <span className="text-brand-navySoft">{r?.attended == null ? `RSVP: ${r?.answer ?? "none"}` : r.attended ? "Attended" : "Missed"}</span>
              </div>
            );
          })}
        </PortalCard>
      )}
    </div>
  );
}

/* ---------- Earnings ---------- */
export function EarningsPage() {
  const { posts, payoutItems, me } = useCreator();
  const { data: apps = [] } = useApps();
  const appName = (id: string | null | undefined) => apps.find((a) => a.id === id)?.name ?? "—";
  const month = new Date().toISOString().slice(0, 7);
  const thisMonth = posts.filter((p) => p.posted_on.startsWith(month));
  const accrued = thisMonth.reduce((s, p) => s + (p.pay_status === "due" ? Number(p.amount_usd ?? 0) + Number(p.bonus_usd ?? 0) : 0), 0);
  const held = posts.filter((p) => p.pay_status === "held");
  const waitingViews = posts.filter((p) => p.views == null && p.status !== "flagged" && Date.now() - new Date(p.posted_on).getTime() >= 7 * 86400000);
  function download(item: CreatorData["payoutItems"][number]) {
    const period = item.payout_batches?.period ?? "";
    const lines = [
      `Vik Studios creator statement`, `Creator: ${me.full_name}`, `Period: ${period}`, `App: ${appName(item.app_id)}`, ``,
      `Approved posts: ${item.posts_count}`, `Rate: ${money(item.rate_usd)}`, `Amount: ${money(item.amount_usd)}`, `Status: ${item.status}`,
      ...(item.payout_batches?.paid_at ? [`Paid on: ${fmtDate(item.payout_batches.paid_at)}`] : []),
      ``, `Posts:`, ...posts.filter((p) => p.posted_on.startsWith(period) && p.pay_status === "due" && p.app_id === item.app_id).map((p) => `${p.posted_on}  ${appName(p.app_id)}  ${money(p.amount_usd)}  bonus ${money(p.bonus_usd)}  ${p.url}`),
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }));
    const a = document.createElement("a"); a.href = url; a.download = `statement-${period}-${appName(item.app_id).toLowerCase()}.txt`; a.click(); URL.revokeObjectURL(url);
  }
  return (
    <div>
      <PageTitle title={ct("Earnings")} lead={ct("Paid monthly: a fixed amount per approved post, plus a bonus by views.")} />
      <PortalCard>
        <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">{ct("Accrued this month")}</p>
        <p className="mt-1 text-3xl font-extrabold text-brand-navy">{money(accrued)}</p>
        {apps.filter((a) => thisMonth.some((p) => p.app_id === a.id)).map((a) => (
          <p key={a.id} className="mt-1 text-sm text-brand-navySoft">{a.name}: <b className="text-brand-navy">{money(thisMonth.filter((p) => p.app_id === a.id && p.pay_status === "due").reduce((s, p) => s + Number(p.amount_usd ?? 0) + Number(p.bonus_usd ?? 0), 0))}</b></p>
        ))}
      </PortalCard>
      {held.length > 0 && <div className="mt-4"><Banner tone="warning" title={`${held.length} approved post${held.length > 1 ? "s are" : " is"} on hold`}>No rate has been set yet for your country. They will be paid at the right rate as soon as it is set; nothing is lost.</Banner></div>}
      {waitingViews.length > 0 && <div className="mt-4"><Banner tone="info" title={`${waitingViews.length} post${waitingViews.length > 1 ? "s are" : " is"} waiting for a view count`}>{ct("Report views with a screenshot on")} <Link to="/creators/app/posts" className="underline">{ct("My posts")}</Link>{ct(". Without it, the bonus for that post is zero.")}</Banner></div>}
      <h2 className="mb-3 mt-8 text-lg font-extrabold text-brand-navy">{ct("This month")}</h2>
      <PortalCard className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-portal-bg text-left text-xs uppercase tracking-wide text-brand-navySoft"><tr><th className="px-4 py-2">{ct("Post")}</th><th className="px-4 py-2">{ct("App")}</th><th className="px-4 py-2">{ct("Date")}</th><th className="px-4 py-2">{ct("Fixed")}</th><th className="px-4 py-2">{ct("Bonus")}</th><th className="px-4 py-2">{ct("Status")}</th></tr></thead>
          <tbody className="divide-y divide-brand-line">
            {thisMonth.length === 0 ? <tr><td colSpan={6} className="px-4 py-6 text-center text-brand-navySoft">{ct("No post this month yet.")}</td></tr> : thisMonth.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2"><a href={p.url} target="_blank" rel="noopener noreferrer" className="text-portal-accent underline">{platformName(p.platform)}</a></td>
                <td className="px-4 py-2"><AppBadge appId={p.app_id} /></td>
                <td className="px-4 py-2">{fmtDate(p.posted_on)}</td>
                <td className="px-4 py-2">{p.pay_status === "due" ? money(p.amount_usd) : "—"}</td>
                <td className="px-4 py-2">{money(p.bonus_usd)}</td>
                <td className="px-4 py-2">{p.pay_status === "due" ? "Due" : p.pay_status === "held" ? ct("On hold: no rate yet") : p.status === "flagged" ? ct("Needs changes") : p.status === "approved" ? "Approved" : ct("Waiting for review")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PortalCard>
      <h2 className="mb-3 mt-8 text-lg font-extrabold text-brand-navy">{ct("Past months")}</h2>
      {payoutItems.length === 0 ? <p className="text-sm text-brand-navySoft">{ct("No statement yet.")}</p> : (
        <PortalCard className="divide-y divide-brand-line p-0">
          {payoutItems.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
              <span className="flex flex-wrap items-center gap-2"><b className="text-brand-navy">{i.payout_batches?.period}</b> <AppBadge appId={i.app_id} /> <span className="text-brand-navySoft"> {i.posts_count} post(s) · {money(i.amount_usd)} · {i.status}</span></span>
              <Button size="sm" variant="outline" onClick={() => download(i)}>{ct("Download statement")}</Button>
            </div>
          ))}
        </PortalCard>
      )}
    </div>
  );
}

/* ---------- Messages ---------- */
export function MessagesPage() {
  const { me, posts, reload } = useCreator();
  const qc = useQueryClient();
  const markRead = useServerFn(markMyMessagesRead);
  const [thread, setThread] = useState<string>("general");
  const [text, setText] = useState("");
  const { data: msgs = [] } = useQuery({
    queryKey: ["creator-messages-all", me.id],
    refetchInterval: 30_000,
    queryFn: async () => (await supabase.from("creator_messages").select("*").eq("creator_id", me.id).order("created_at")).data ?? [],
  });
  const threads = useMemo(() => {
    const ids = new Set(msgs.filter((m) => m.post_id).map((m) => m.post_id as string));
    posts.filter((p) => p.feedback).forEach((p) => ids.add(p.id));
    return [
      { id: "general", label: "General", unread: msgs.filter((m) => !m.post_id && m.from_admin && !m.read_at).length },
      ...posts.filter((p) => ids.has(p.id)).map((p) => ({ id: p.id, label: `Post · ${fmtDate(p.posted_on)}`, unread: msgs.filter((m) => m.post_id === p.id && m.from_admin && !m.read_at).length })),
    ];
  }, [msgs, posts]);
  const postId = thread === "general" ? null : thread;
  const list = msgs.filter((m) => (postId ? m.post_id === postId : !m.post_id));
  const post = posts.find((p) => p.id === postId);
  useEffect(() => {
    if (list.some((m) => m.from_admin && !m.read_at)) markRead({ data: { postId } }).then(() => { qc.invalidateQueries({ queryKey: ["creator-messages-all", me.id] }); reload(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread, msgs.length]);
  async function send() {
    if (!text.trim()) return;
    const { error } = await supabase.from("creator_messages").insert({ creator_id: me.id, from_admin: false, body: text.trim(), post_id: postId });
    if (error) return void toast.error(ct("Your message was not sent. Check your connection and try again."));
    setText(""); qc.invalidateQueries({ queryKey: ["creator-messages-all", me.id] });
  }
  return (
    <div>
      <PageTitle title={ct("Messages")} lead={ct("Your conversations with the Sophia team: a general thread, plus one per post.")} />
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <PortalCard className="p-2">
          {threads.map((t) => (
            <button key={t.id} type="button" onClick={() => setThread(t.id)} className={cn("flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold", thread === t.id ? "bg-brand-navy text-white" : "text-brand-navy hover:bg-brand-navy/10")}>
              <span className="truncate">{ct(t.label)}</span>
              {t.unread > 0 && <span className="rounded-full bg-portal-amber px-2 text-[11px] font-bold text-brand-navy">{t.unread}</span>}
            </button>
          ))}
        </PortalCard>
        <PortalCard className="flex min-h-[420px] flex-col">
          {post && (
            <div className="mb-3 rounded-xl bg-portal-bg p-3 text-sm">
              <a href={post.url} target="_blank" rel="noopener noreferrer" className="font-bold text-portal-accent underline">{ct("Open the post")}</a>
              {post.feedback && <p className="mt-1 text-brand-navy"><b>{ct("Feedback:")}</b> {post.feedback}</p>}
            </div>
          )}
          <div className="flex-1 space-y-2 overflow-y-auto">
            {list.length === 0 ? <p className="text-sm text-brand-navySoft">{ct("No message yet.")}</p> : list.map((m) => (
              <div key={m.id} className={cn("max-w-[80%] rounded-2xl px-4 py-2 text-sm", m.from_admin ? "bg-portal-bg text-brand-navy" : "ml-auto bg-brand-navy text-card")}>
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className="mt-1 text-[10px] opacity-70">{m.from_admin ? ct("Sophia team") : "You"} · {new Date(m.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Textarea rows={2} placeholder={ct("Write a message")} value={text} onChange={(e) => setText(e.target.value)} />
            <Button onClick={() => void send()} disabled={!text.trim()}>{ct("Send")}</Button>
          </div>
        </PortalCard>
      </div>
    </div>
  );
}
