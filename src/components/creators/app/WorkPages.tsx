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
import { friendlyCreatorError, isHttpUrl } from "@/lib/creator-validation";
import { Banner, EmptyState, PageTitle, PortalCard } from "@/components/portal/ui";
import { logPostChecked, markBriefSkipped, markMyMessagesRead, reportPostViews } from "@/lib/creator-app.functions";
import { CATEGORY_LEGEND, briefStatus, fileToBase64, useCreator, type CreatorData } from "./useCreator";

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

/* ---------- Log a post ---------- */
export function LogPostForm({ briefId: initialBrief = "", refId = null, url: initialUrl = "", onDone }: { briefId?: string; refId?: string | null; url?: string; onDone?: () => void }) {
  const { briefs, refs, reload } = useCreator();
  const submit = useServerFn(logPostChecked);
  const [url, setUrl] = useState(initialUrl);
  const [platform, setPlatform] = useState<"tiktok" | "instagram">("tiktok");
  const [briefId, setBriefId] = useState(initialBrief);
  const [date, setDate] = useState(today());
  const [busy, setBusy] = useState(false);
  useEffect(() => setBriefId(initialBrief), [initialBrief]);
  const ref = refs.find((r) => r.id === refId);
  return (
    <div className="space-y-3">
      {ref && <p className="rounded-xl bg-portal-accent/10 px-3 py-2 text-sm font-semibold text-portal-accent">Linked to reference: {ref.title || ref.url}</p>}
      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
        <div><Label>Post link</Label><Input placeholder="https://www.tiktok.com/@…/video/…" value={url} onChange={(e) => setUrl(e.target.value)} /></div>
        <div><Label>Platform</Label>
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={platform} onChange={(e) => setPlatform(e.target.value as "tiktok")}>
            <option value="tiktok">TikTok</option><option value="instagram">Instagram</option>
          </select>
        </div>
        <div><Label>Brief</Label>
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={briefId} onChange={(e) => setBriefId(e.target.value)}>
            <option value="">No brief</option>
            {briefs.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
        </div>
        <div><Label>Date posted</Label><Input type="date" max={today()} value={date} onChange={(e) => setDate(e.target.value)} /></div>
      </div>
      <Button disabled={busy} onClick={async () => {
        if (!isHttpUrl(url) || !url.trim().startsWith("https://")) return void toast.error("Paste the complete secure link to your post, beginning with https://.");
        setBusy(true);
        try {
          await submit({ data: { url: url.trim(), platform, briefId: briefId || null, referenceVideoId: refId, postedOn: date } });
          toast.success("Post logged."); setUrl(""); await reload(); onDone?.();
        } catch (e: unknown) { toast.error(friendlyCreatorError(e)); }
        setBusy(false);
      }}>Log post</Button>
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
  const label = { pov: "POV", reaction: fr ? "Réaction" : "Reaction", talking_head: "Face cam" } as Record<string, string>;
  return (
    <div>
      <p className="mb-4 rounded-2xl bg-portal-accent/10 px-4 py-3 text-sm font-bold text-brand-navy">{fr ? "Choisis 3 formats, refais-les 20 fois." : "Pick 3 formats, redo them 20 times."}</p>
      {formats.length === 0 ? <EmptyState title={fr ? "Pas encore de formats" : "No formats yet"} text="" /> : (
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
                  <p className="mt-1 text-sm text-brand-navySoft">{f.title}</p>
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
        {([["formats", "Formats"], ["briefs", "Briefs"], ["refs", "Reference videos"]] as const).map(([k, l]) => (
          <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)} className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold ${tab === k ? "bg-brand-navy text-card" : "bg-card text-brand-navy"}`}>{l}</button>
        ))}
      </div>
      {tab === "formats" ? <><PageTitle title="Formats" lead="Repeatable video mechanics. The pay per post depends on the format." /><FormatsTab /></> : tab === "refs" ? (
        <><PageTitle title="Reference videos" lead="Videos that worked. Use them as inspiration." /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{d.refs.map((r) => <RefCard key={r.id} r={r} />)}</div></>
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
      <PageTitle title="Briefs" lead="Your briefs for the week, then everything else. If an assigned brief doesn't suit you, swap it for one from the library." />
      <AssignedBriefs />
      <div className="mb-6 flex flex-wrap gap-2">
        <select aria-label="App" className="h-10 rounded-md border border-input bg-card px-3 text-sm" value={app} onChange={(e) => setApp(e.target.value)}>
          <option value="all">All apps</option>{apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select aria-label="Status" className="h-10 rounded-md border border-input bg-card px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          {["all", "new", "seen", "posted", "skipped"].map((s) => <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>)}
        </select>
      </div>
      {list.length === 0 ? <EmptyState title="No brief here" text="New briefs appear here and in your notifications." /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((b) => (
            <Link key={b.id} to="/creators/app/briefs/$briefId" params={{ briefId: b.id }} className="block">
              <PortalCard className="h-full transition hover:ring-2 hover:ring-portal-accent/30">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-extrabold text-brand-navy">{b.title}</h3>
                  <Pill s={briefStatus(d, b.id)} />
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-brand-navySoft"><AppBadge appId={b.app_id} />{b.due_date ? `Due ${fmtDate(b.due_date)}` : "No deadline"}</p>
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
  const [mode, setMode] = useState<"none" | "post" | "skip">("none");
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (!brief || d.reads.some((r) => r.brief_id === brief.id)) return;
    supabase.from("brief_reads").insert({ brief_id: brief.id, creator_id: d.me.id }).then(() => d.reload());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brief?.id]);
  if (!brief) return <EmptyState title="Brief not found" text="It may have been withdrawn." />;
  const status = briefStatus(d, brief.id);
  const refs = d.refs.filter((r) => (brief.reference_video_ids ?? []).includes(r.id));
  return (
    <div>
      <Link to="/creators/app/briefs" className="text-sm font-semibold text-portal-accent">← All briefs</Link>
      <div className="mt-3"><PageTitle title={brief.title} lead={brief.due_date ? `Due ${fmtDate(brief.due_date)}` : ""} action={<Pill s={status} />} /></div>
      <div className="mb-4"><AppBadge appId={brief.app_id} className="text-sm" /></div>
      <PortalCard>
        {brief.hook && (
          <div className="mb-4 rounded-2xl bg-portal-accent/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-portal-accent">Hooks</p>
            <p className="mt-1 whitespace-pre-wrap text-base font-semibold text-brand-navy">{brief.hook}</p>
          </div>
        )}
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-navy">{brief.body}</p>
      </PortalCard>
      {refs.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-lg font-extrabold text-brand-navy">Reference videos</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">{refs.map((r) => <RefCard key={r.id} r={r} compact />)}</div>
        </>
      )}
      <div className="mt-8 flex flex-wrap gap-2">
        <Button onClick={() => setMode(mode === "post" ? "none" : "post")}>I posted this</Button>
        {status !== "posted" && status !== "skipped" && <Button variant="outline" onClick={() => setMode(mode === "skip" ? "none" : "skip")}>Skip</Button>}
      </div>
      {mode === "post" && <PortalCard className="mt-4"><LogPostForm briefId={brief.id} onDone={() => setMode("none")} /></PortalCard>}
      {mode === "skip" && (
        <PortalCard className="mt-4 space-y-3">
          <Label>Why are you skipping this brief?</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          <Button variant="outline" disabled={reason.trim().length < 3} onClick={async () => {
            try { await skip({ data: { briefId: brief.id, reason } }); toast.success("Skipped. The team has your reason."); setMode("none"); d.reload(); }
            catch (e: unknown) { toast.error(friendlyCreatorError(e)); }
          }}>Skip this brief</Button>
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
      {cat && <span className="mb-2 w-fit rounded-full bg-portal-bg px-2.5 py-0.5 text-[11px] font-bold text-brand-navy" title={cat.line}>{cat.label}</span>}
      <p className="font-extrabold text-brand-navy">{r.title || r.note || "Untitled video"}</p>
      {r.why_it_works && <p className="mt-1 text-sm text-brand-navySoft"><b>Why it works:</b> {r.why_it_works}</p>}
      {r.format_notes && <p className="mt-1 text-sm text-brand-navySoft"><b>Format:</b> {r.format_notes}</p>}
      <div className="mt-auto flex flex-wrap gap-2 pt-3">
        <Button asChild size="sm" variant="outline"><a href={r.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-3.5" /> Open</a></Button>
        <Button size="sm" onClick={() => navigate({ to: "/creators/app/posts", search: { ref: r.id } })}>Use this</Button>
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
      <PageTitle title="Library" lead="Videos to study and reproduce. Use one as the starting point for a post and we will know which references work." />
      <Tabs value={platform} onValueChange={(v) => setPlatform(v as "tiktok")}>
        <TabsList><TabsTrigger value="tiktok">TikTok</TabsTrigger><TabsTrigger value="instagram">Instagram</TabsTrigger></TabsList>
      </Tabs>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {Object.entries(CATEGORY_LEGEND).map(([k, v]) => (
          <button key={k} type="button" onClick={() => setCat(cat === k ? "all" : k)} className={cn("rounded-xl border px-3 py-2 text-left text-sm transition", cat === k ? "border-brand-navy bg-brand-navy text-card" : "border-brand-line bg-card text-brand-navy hover:border-portal-accent/40")}>
            <b>{v.label}</b> <span className={cat === k ? "opacity-80" : "text-brand-navySoft"}>— {v.line}</span>
          </button>
        ))}
      </div>
      <div className="mt-6">
        {list.length === 0 ? <EmptyState title="No video here yet" text="The Sophia team adds references regularly." /> : (
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
      <Input type="number" min={0} placeholder="Views" value={views} onChange={(e) => setViews(e.target.value)} />
      <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <Button size="sm" onClick={async () => {
        const v = Number(views);
        if (!Number.isFinite(v) || v < 0 || views === "") return void toast.error("Enter the view count.");
        if (!file) return void toast.error("Add a screenshot showing the views.");
        if (file.size > 5_000_000) return void toast.error("Screenshot must be under 5 MB.");
        try { await report({ data: { postId: post.id, views: Math.round(v), screenshotBase64: await fileToBase64(file), contentType: file.type as "image/png" } }); toast.success("Views reported."); reload(); }
        catch (e: unknown) { toast.error(friendlyCreatorError(e)); }
      }}>Send</Button>
    </div>
  );
}

function FeedbackReply({ post }: { post: Post }) {
  const { me, reload } = useCreator();
  const [text, setText] = useState("");
  return (
    <div className="mt-3 flex gap-2">
      <Input placeholder="Reply to this feedback" value={text} onChange={(e) => setText(e.target.value)} />
      <Button size="sm" disabled={!text.trim()} onClick={async () => {
        const { error } = await supabase.from("creator_messages").insert({ creator_id: me.id, from_admin: false, body: text.trim(), post_id: post.id });
        if (error) return void toast.error("Your reply was not sent. Check your connection and try again.");
        setText(""); toast.success("Reply sent."); reload();
      }}>Reply</Button>
    </div>
  );
}

export function PostsPage({ refId }: { refId?: string | undefined }) {
  const { posts, briefs } = useCreator();
  return (
    <div>
      <PageTitle title="My posts" lead="Log every post the day you publish it. A post that is not logged is not paid." />
      <PortalCard className="mb-8"><h2 className="mb-3 text-lg font-extrabold text-brand-navy">Log a post</h2><LogPostForm refId={refId ?? null} /></PortalCard>
      {posts.length === 0 ? <EmptyState title="No post logged yet" /> : (
        <div className="space-y-3">
          {posts.map((p) => {
            const day7 = Date.now() - new Date(p.posted_on).getTime() >= 7 * 86400000;
            const brief = briefs.find((b) => b.id === p.brief_id);
            return (
              <PortalCard key={p.id} className={cn("p-5", p.status === "flagged" && "border-2 border-portal-amber")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex flex-wrap items-center gap-2"><PlatformBadge platform={p.platform} /><AppBadge appId={p.app_id} /><a href={p.url} target="_blank" rel="noopener noreferrer" className="font-bold text-portal-accent hover:underline">{fmtDate(p.posted_on)}</a></span>
                  <Pill s={p.status === "flagged" ? "feedback" : p.status} />
                </div>
                <p className="mt-1 text-sm text-brand-navySoft">{brief ? `Brief: ${brief.title}` : "No brief"}{p.pay_status === "due" ? ` · ${money(p.amount_usd)}` : p.pay_status === "held" ? " · payment on hold (no rate set yet)" : ""}</p>
                {p.feedback && (
                  <div className="mt-3 rounded-xl bg-portal-amber/10 p-3 text-sm text-brand-navy">
                    <p className="text-xs font-bold uppercase tracking-wide text-portal-amber">Feedback</p>
                    <p className="mt-1">{p.feedback}</p>
                    <FeedbackReply post={p} />
                  </div>
                )}
                {p.views != null ? <p className="mt-2 text-sm font-semibold text-brand-navy">{p.views.toLocaleString()} views reported</p> : day7 ? <ReportViews post={p} /> : (
                  <p className="mt-2 text-xs text-brand-navySoft">Report views from {fmtDate(new Date(new Date(p.posted_on).getTime() + 7 * 86400000).toISOString())}</p>
                )}
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
      <PageTitle title="Calls" lead="RSVP to every call, and come to the ones you said yes to." />
      <h2 className="mb-3 text-lg font-extrabold text-brand-navy">Upcoming</h2>
      {upcoming.length === 0 ? <EmptyState title="No call scheduled" /> : (
        <div className="space-y-3">
          {upcoming.map((c) => {
            const mine = rsvps.find((r) => r.call_id === c.id)?.answer;
            return (
              <PortalCard key={c.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-brand-navy">{c.title}</p>
                    <p className="text-sm text-brand-navySoft">{new Date(c.starts_at).toLocaleString()}</p>
                    {c.notes && <p className="mt-1 text-sm text-brand-navySoft">{c.notes}</p>}
                  </div>
                  {c.link && <Button asChild size="sm" variant="outline"><a href={c.link} target="_blank" rel="noopener noreferrer">Join link</a></Button>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["yes", "maybe", "no"] as const).map((a) => (
                    <Button key={a} size="sm" variant={mine === a ? "default" : "outline"} onClick={async () => {
                      const { error } = await supabase.from("creator_call_rsvps").upsert({ call_id: c.id, creator_id: me.id, answer: a }, { onConflict: "call_id,creator_id" });
                      if (error) toast.error("Your RSVP was not saved. Check your connection and try again."); else reload();
                    }}>{a === "yes" ? "Yes" : a === "no" ? "No" : "Maybe"}</Button>
                  ))}
                </div>
              </PortalCard>
            );
          })}
        </div>
      )}
      <h2 className="mb-3 mt-10 text-lg font-extrabold text-brand-navy">Past</h2>
      {past.length === 0 ? <p className="text-sm text-brand-navySoft">No past call.</p> : (
        <PortalCard className="divide-y divide-brand-line p-0">
          {past.map((c) => {
            const r = rsvps.find((x) => x.call_id === c.id);
            return (
              <div key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span><b className="text-brand-navy">{c.title}</b> <span className="text-brand-navySoft">· {fmtDate(c.starts_at)}</span></span>
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
      <PageTitle title="Earnings" lead="Paid monthly: a fixed amount per approved post, plus a bonus by views." />
      <PortalCard>
        <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Accrued this month</p>
        <p className="mt-1 text-3xl font-extrabold text-brand-navy">{money(accrued)}</p>
        {apps.filter((a) => thisMonth.some((p) => p.app_id === a.id)).map((a) => (
          <p key={a.id} className="mt-1 text-sm text-brand-navySoft">{a.name}: <b className="text-brand-navy">{money(thisMonth.filter((p) => p.app_id === a.id && p.pay_status === "due").reduce((s, p) => s + Number(p.amount_usd ?? 0) + Number(p.bonus_usd ?? 0), 0))}</b></p>
        ))}
      </PortalCard>
      {held.length > 0 && <div className="mt-4"><Banner tone="warning" title={`${held.length} approved post${held.length > 1 ? "s are" : " is"} on hold`}>No rate has been set yet for your country. They will be paid at the right rate as soon as it is set; nothing is lost.</Banner></div>}
      {waitingViews.length > 0 && <div className="mt-4"><Banner tone="info" title={`${waitingViews.length} post${waitingViews.length > 1 ? "s are" : " is"} waiting for a view count`}>Report views with a screenshot on <Link to="/creators/app/posts" className="underline">My posts</Link>. Without it, the bonus for that post is zero.</Banner></div>}
      <h2 className="mb-3 mt-8 text-lg font-extrabold text-brand-navy">This month</h2>
      <PortalCard className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-portal-bg text-left text-xs uppercase tracking-wide text-brand-navySoft"><tr><th className="px-4 py-2">Post</th><th className="px-4 py-2">App</th><th className="px-4 py-2">Date</th><th className="px-4 py-2">Fixed</th><th className="px-4 py-2">Bonus</th><th className="px-4 py-2">Status</th></tr></thead>
          <tbody className="divide-y divide-brand-line">
            {thisMonth.length === 0 ? <tr><td colSpan={6} className="px-4 py-6 text-center text-brand-navySoft">No post this month yet.</td></tr> : thisMonth.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2"><a href={p.url} target="_blank" rel="noopener noreferrer" className="text-portal-accent underline">{platformName(p.platform)}</a></td>
                <td className="px-4 py-2"><AppBadge appId={p.app_id} /></td>
                <td className="px-4 py-2">{fmtDate(p.posted_on)}</td>
                <td className="px-4 py-2">{p.pay_status === "due" ? money(p.amount_usd) : "—"}</td>
                <td className="px-4 py-2">{money(p.bonus_usd)}</td>
                <td className="px-4 py-2">{p.pay_status === "due" ? "Due" : p.pay_status === "held" ? "On hold: no rate yet" : p.status === "flagged" ? "Needs changes" : p.status === "approved" ? "Approved" : "Waiting for review"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PortalCard>
      <h2 className="mb-3 mt-8 text-lg font-extrabold text-brand-navy">Past months</h2>
      {payoutItems.length === 0 ? <p className="text-sm text-brand-navySoft">No statement yet.</p> : (
        <PortalCard className="divide-y divide-brand-line p-0">
          {payoutItems.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
              <span className="flex flex-wrap items-center gap-2"><b className="text-brand-navy">{i.payout_batches?.period}</b> <AppBadge appId={i.app_id} /> <span className="text-brand-navySoft"> {i.posts_count} post(s) · {money(i.amount_usd)} · {i.status}</span></span>
              <Button size="sm" variant="outline" onClick={() => download(i)}>Download statement</Button>
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
    if (error) return void toast.error("Your message was not sent. Check your connection and try again.");
    setText(""); qc.invalidateQueries({ queryKey: ["creator-messages-all", me.id] });
  }
  return (
    <div>
      <PageTitle title="Messages" lead="Your conversations with the Sophia team: a general thread, plus one per post." />
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <PortalCard className="p-2">
          {threads.map((t) => (
            <button key={t.id} type="button" onClick={() => setThread(t.id)} className={cn("flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold", thread === t.id ? "bg-brand-navy text-white" : "text-brand-navy hover:bg-brand-navy/10")}>
              <span className="truncate">{t.label}</span>
              {t.unread > 0 && <span className="rounded-full bg-portal-amber px-2 text-[11px] font-bold text-brand-navy">{t.unread}</span>}
            </button>
          ))}
        </PortalCard>
        <PortalCard className="flex min-h-[420px] flex-col">
          {post && (
            <div className="mb-3 rounded-xl bg-portal-bg p-3 text-sm">
              <a href={post.url} target="_blank" rel="noopener noreferrer" className="font-bold text-portal-accent underline">Open the post</a>
              {post.feedback && <p className="mt-1 text-brand-navy"><b>Feedback:</b> {post.feedback}</p>}
            </div>
          )}
          <div className="flex-1 space-y-2 overflow-y-auto">
            {list.length === 0 ? <p className="text-sm text-brand-navySoft">No message yet.</p> : list.map((m) => (
              <div key={m.id} className={cn("max-w-[80%] rounded-2xl px-4 py-2 text-sm", m.from_admin ? "bg-portal-bg text-brand-navy" : "ml-auto bg-brand-navy text-card")}>
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className="mt-1 text-[10px] opacity-70">{m.from_admin ? "Sophia team" : "You"} · {new Date(m.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Textarea rows={2} placeholder="Write a message" value={text} onChange={(e) => setText(e.target.value)} />
            <Button onClick={() => void send()} disabled={!text.trim()}>Send</Button>
          </div>
        </PortalCard>
      </div>
    </div>
  );
}
