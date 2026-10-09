import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Copy, Filter, LayoutGrid, List, Pencil, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { acceptJobApplication, declineJobApplication } from "@/lib/hub.functions";
import { PostThumb } from "./PostThumb";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppBadge, useAdminApp } from "@/lib/apps";
import { CreatorApplications } from "@/components/portal/admin/CreatorApplications";
import { JobModal, type JobDraft } from "./JobModal";
import { compact, eur, flag } from "./hub-data";

export type CampaignTab = "campaigns" | "applicants" | "requests" | "jobs" | "reviews";
const TABS: [CampaignTab, string][] = [["campaigns", "Campaigns"], ["applicants", "Applicants"], ["requests", "Requests"], ["jobs", "Jobs"], ["reviews", "Video Reviews"]];
const card = "rounded-2xl bg-card p-5 shadow-portal";

function Toolbar({ active, setActive, counts, q, setQ, action, filters }: { active: boolean; setActive: (b: boolean) => void; counts: [number, number]; q: string; setQ: (s: string) => void; action?: React.ReactNode; filters?: React.ReactNode }) {
  const [showFilters, setShowFilters] = useState(false);
  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-full bg-card p-1 shadow-sm">
          {([true, false] as const).map((a, i) => <button key={String(a)} type="button" aria-pressed={active === a} onClick={() => setActive(a)} className={cn("min-h-8 rounded-full px-3 text-xs font-bold", active === a ? "bg-brand-navy text-card" : "text-brand-navy")}>{a ? "Active" : "Archived"} {counts[i]}</button>)}
        </div>
        <label className="flex min-h-10 flex-1 items-center gap-2 rounded-full border border-brand-line bg-card px-3 sm:max-w-xs"><Search className="size-4 text-brand-navySoft" /><input aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-full bg-transparent text-sm outline-none" /></label>
        {filters ? <Button variant="outline" size="sm" onClick={() => setShowFilters((s) => !s)}><Filter className="size-4" />Filters</Button> : null}
        <span className="flex-1" />
        {action}
      </div>
      {showFilters ? <div className="flex flex-wrap gap-2 rounded-xl bg-card p-3 shadow-sm">{filters}</div> : null}
    </div>
  );
}

function CampaignsList() {
  const { appId } = useAdminApp();
  const [active, setActive] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["hub", "campaigns", appId],
    queryFn: async () => {
      let x = supabase.from("campaigns").select("*, jobs(id)").order("created_at", { ascending: false });
      if (appId) x = x.eq("app_id", appId);
      return (await x).data ?? [];
    },
  });
  const isActive = (c: { status: string }) => c.status !== "closed";
  const rows = data.filter((c) => isActive(c) === active && c.name.toLowerCase().includes(q.toLowerCase()) && (!type || c.type === type));
  async function setStatus(id: string, status: string) {
    await supabase.from("campaigns").update({ status }).eq("id", id);
    void qc.invalidateQueries({ queryKey: ["hub"] });
  }
  return (
    <>
      <Toolbar active={active} setActive={setActive} counts={[data.filter(isActive).length, data.filter((c) => !isActive(c)).length]} q={q} setQ={setQ}
        filters={<select aria-label="Type" value={type} onChange={(e) => setType(e.target.value)} className="min-h-9 rounded-lg border px-2 text-sm"><option value="">All types</option><option value="high_volume_ugc">High-volume UGC</option><option value="influencer">Influencer</option><option value="paid_ads">Paid ads</option><option value="analytics_only">Analytics only</option></select>}
        action={<Button asChild className="bg-brand-navy"><Link to="/hub/campaigns/create">Create Campaign</Link></Button>} />
      {rows.length === 0 ? <p className={cn(card, "text-sm text-brand-navySoft")}>No campaigns here yet.</p> : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((c) => (
            <article key={c.id} className={card}>
              <div className="flex items-start justify-between gap-2">
                <div><h3 className="font-extrabold text-brand-navy">{c.name}</h3><p className="text-xs text-brand-navySoft">{c.type.replaceAll("_", " ")} · from {c.starts_at}{c.ongoing ? " · ongoing" : c.ends_at ? ` to ${c.ends_at}` : ""}</p></div>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", c.status === "live" ? "bg-portal-green/10 text-portal-green" : "bg-portal-bg text-brand-navySoft")}>{c.status}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-brand-navy"><AppBadge appId={c.app_id} /><span>{(c.jobs as unknown[] | null)?.length ?? 0} jobs</span>{c.monthly_budget ? <span>{eur(Number(c.monthly_budget))}/month</span> : null}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {c.status === "live" ? <Button size="sm" variant="outline" onClick={() => void setStatus(c.id, "paused")}>Pause</Button> : c.status !== "closed" ? <Button size="sm" variant="outline" onClick={() => void setStatus(c.id, "live")}>Go live</Button> : null}
                {c.status !== "closed" ? <Button size="sm" variant="ghost" onClick={() => void setStatus(c.id, "closed")}><Archive className="size-4" />Close</Button> : <Button size="sm" variant="ghost" onClick={() => void setStatus(c.id, "paused")}>Reopen</Button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

type JobRow = JobDraft & { id: string; slug: string; status: string; app_id: string; slots: number | null; age_min: number | null; age_max: number | null; campaigns: { name: string } | null; job_applications: { status: string }[] };

function JobsList({ autoNew }: { autoNew?: boolean | undefined }) {
  const { appId } = useAdminApp();
  const [active, setActive] = useState(true);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState<{ open: boolean; initial?: Partial<JobDraft> | undefined; id?: string | undefined }>({ open: Boolean(autoNew) });
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["hub", "jobs", appId],
    queryFn: async () => {
      let x = supabase.from("jobs").select("*, campaigns(name), job_applications(status)").order("created_at", { ascending: false });
      if (appId) x = x.eq("app_id", appId);
      return ((await x).data ?? []) as unknown as JobRow[];
    },
  });
  const rows = data.filter((j) => (j.status === "active") === active && j.title.toLowerCase().includes(q.toLowerCase()));
  const draftOf = (j: JobRow): Partial<JobDraft> => ({ ...j, age: j.age_min === 18 && !j.age_max ? "18+" : j.age_min ? `${j.age_min}-${j.age_max}` : "Any Age" });
  async function archive(j: JobRow) { await supabase.from("jobs").update({ status: j.status === "active" ? "archived" : "active" }).eq("id", j.id); void qc.invalidateQueries({ queryKey: ["hub"] }); }
  return (
    <>
      <Toolbar active={active} setActive={setActive} counts={[data.filter((j) => j.status === "active").length, data.filter((j) => j.status !== "active").length]} q={q} setQ={setQ}
        action={<Button className="bg-brand-navy" onClick={() => setModal({ open: true })}>Create Job</Button>} />
      <JobModal open={modal.open} onOpenChange={(o) => setModal((m) => ({ ...m, open: o }))} initial={modal.initial} jobId={modal.id} />
      {rows.length === 0 ? <p className={cn(card, "text-sm text-brand-navySoft")}>No jobs here yet.</p> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((j) => {
            const accepted = j.job_applications.filter((a) => a.status === "accepted").length;
            return (
              <article key={j.id} className="overflow-hidden rounded-2xl bg-card shadow-portal">
                {j.cover_image_path ? <img src={j.cover_image_path} alt="" className="h-28 w-full object-cover" /> : <div className="h-20 bg-gradient-to-r from-brand-navy to-portal-accent" />}
                <div className="space-y-2 p-4">
                  <h3 className="font-extrabold text-brand-navy">{j.title}</h3>
                  <p className="text-xs text-brand-navySoft">{j.campaigns?.name ?? "No campaign"} · {j.position}{j.open ? " · Open" : ""}</p>
                  <p className="text-sm font-bold text-brand-navy">{j.payment_type !== "cpm" ? `${eur(Number(j.base_amount))}${j.base_mode === "retainer" ? `/${j.retainer_frequency}` : "/post"}` : ""}{j.payment_type === "hybrid" || j.payment_type === "cpm" ? ` + ${eur(Number(j.cpm_rate))}/1K views` : ""}</p>
                  <p className="text-xs text-brand-navySoft">{j.job_applications.length} applicants · {accepted}{j.slots ? `/${j.slots}` : ""} slots used</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <Button size="sm" variant="outline" onClick={() => setModal({ open: true, initial: draftOf(j), id: j.id })}><Pencil className="size-3.5" />Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => setModal({ open: true, initial: { ...draftOf(j), title: `${j.title} (copy)` } })}><Copy className="size-3.5" />Duplicate</Button>
                    <Button size="sm" variant="ghost" onClick={() => void archive(j)}><Archive className="size-3.5" />{j.status === "active" ? "Archive" : "Restore"}</Button>
                    <Button size="sm" variant="ghost" onClick={() => { void navigator.clipboard.writeText(`${window.location.origin}/jobs/${j.slug}`); toast.success("Link copied"); }}>Copy link</Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function Applicants() {
  const [source, setSource] = useState<"jobs" | "ugc" | "slideshow">("jobs");
  const [view, setView] = useState<"table" | "cards">("table");
  const [sel, setSel] = useState<string[]>([]);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { appId } = useAdminApp();
  const { data = [] } = useQuery({
    queryKey: ["hub", "job-apps", appId],
    enabled: source === "jobs",
    queryFn: async () => {
      const { data } = await supabase.from("job_applications").select("*, jobs!inner(title, app_id), creators(full_name, country, tiktok_handle, instagram_handle)").order("created_at", { ascending: false });
      return (data ?? []).filter((r) => !appId || (r.jobs as { app_id: string }).app_id === appId);
    },
  });
  const acceptFn = useServerFn(acceptJobApplication);
  const declineFn = useServerFn(declineJobApplication);
  async function decide(ids: string[], status: "accepted" | "declined", reason?: string) {
    let ok = 0; const notes: string[] = [];
    for (const id of ids) {
      try {
        const r = status === "accepted" ? await acceptFn({ data: { id, origin: window.location.origin } }) : await declineFn({ data: { id, reason: reason ?? "" } });
        ok++; if (!r.emailSent) notes.push(r.emailReason ?? "email not sent");
      } catch { notes.push("one decision could not be saved"); }
    }
    if (ok) toast.success(`${ok} ${status === "accepted" ? "accepted" : "declined"}${notes.length ? "" : " — email sent"}`);
    if (notes.length) toast.error(`Check: ${[...new Set(notes)].join("; ")}`);
    setSel([]); void qc.invalidateQueries({ queryKey: ["hub"] });
  }
  async function shortlist(id: string, v: boolean) { await supabase.from("job_applications").update({ shortlisted: v }).eq("id", id); void qc.invalidateQueries({ queryKey: ["hub"] }); }
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {([["jobs", "Job applicants"], ["ugc", "UGC applications"], ["slideshow", "Slideshow applications"]] as const).map(([k, l]) => (
          <button key={k} type="button" aria-pressed={source === k} onClick={() => setSource(k)} className={cn("min-h-9 rounded-full px-4 text-sm font-bold", source === k ? "bg-brand-navy text-card" : "bg-card text-brand-navy")}>{l}</button>
        ))}
        {source === "jobs" ? <><span className="flex-1" /><Button size="icon" variant="ghost" aria-label="Table view" onClick={() => setView("table")}><List className="size-4" /></Button><Button size="icon" variant="ghost" aria-label="Card view" onClick={() => setView("cards")}><LayoutGrid className="size-4" /></Button></> : null}
      </div>
      {source === "ugc" ? <CreatorApplications key="ugc" track="ugc" /> : source === "slideshow" ? <CreatorApplications key="slideshow" track="slideshow" /> : (
        <>
          {sel.length ? <div className="mb-3 flex gap-2 rounded-xl bg-card p-3 text-sm shadow-sm"><b>{sel.length} selected</b><Button size="sm" onClick={() => void decide(sel, "accepted")}>Accept</Button><Button size="sm" variant="outline" onClick={() => { const r = window.prompt("Reason for declining (sent to the applicant)") ?? undefined; void decide(sel, "declined", r); }}>Decline</Button></div> : null}
          {data.length === 0 ? <p className={cn(card, "text-sm text-brand-navySoft")}>No job applicants yet. UGC and slideshow applications are in the other tabs.</p> : (
            <div className={view === "cards" ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "overflow-x-auto rounded-2xl bg-card shadow-portal"}>
              {view === "table" ? (
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="text-left text-xs text-brand-navySoft"><tr><th className="p-3"><span className="sr-only">Select</span></th><th>Name</th><th>Platforms</th><th>Job</th><th>Answers</th><th>Status</th><th /></tr></thead>
                  <tbody className="divide-y divide-brand-line">
                    {data.map((a) => {
                      const c = a.creators as { full_name?: string; country?: string; tiktok_handle?: string; instagram_handle?: string } | null;
                      return (
                        <tr key={a.id}>
                          <td className="p-3"><input type="checkbox" aria-label="Select" checked={sel.includes(a.id)} onChange={(e) => setSel((s) => (e.target.checked ? [...s, a.id] : s.filter((x) => x !== a.id)))} /></td>
                          <td className="font-bold text-brand-navy">{flag(c?.country)} {c?.full_name ?? "Applicant"}</td>
                          <td className="text-xs">{[c?.tiktok_handle && `TT @${c.tiktok_handle}`, c?.instagram_handle && `IG @${c.instagram_handle}`].filter(Boolean).join(" · ") || "—"}</td>
                          <td>{(a.jobs as { title: string }).title}</td>
                          <td className="max-w-48 truncate text-xs">{Object.entries((a.answers ?? {}) as Record<string, string>).filter(([, v]) => v).map(([k, v]) => (k.startsWith("followers_") ? `${k.slice(10)}: ${compact(Number(v))} followers` : v)).join(" · ") || "—"}</td>
                          <td><span className="rounded-full bg-portal-bg px-2 py-0.5 text-xs font-bold">{a.status}</span></td>
                          <td className="whitespace-nowrap p-2">
                            <Button size="icon" variant="ghost" aria-label="Shortlist" onClick={() => void shortlist(a.id, !a.shortlisted)}><Star className={cn("size-4", a.shortlisted && "fill-portal-amber text-portal-amber")} /></Button>
                            {a.status === "pending" ? <><Button size="sm" onClick={() => void decide([a.id], "accepted")}>Accept</Button> <Button size="sm" variant="outline" onClick={() => void decide([a.id], "declined", window.prompt("Reason for declining") ?? undefined)}>Decline</Button></> : null}
                            {a.creator_id ? <Button size="sm" variant="ghost" onClick={() => void navigate({ to: "/hub/messages" })}>Message</Button> : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : data.map((a) => {
                const c = a.creators as { full_name?: string; country?: string } | null;
                return (
                  <article key={a.id} className={card}>
                    <p className="font-extrabold text-brand-navy">{flag(c?.country)} {c?.full_name ?? "Applicant"}</p>
                    <p className="text-xs text-brand-navySoft">{(a.jobs as { title: string }).title} · {a.status}</p>
                    {a.status === "pending" ? <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => void decide([a.id], "accepted")}>Accept</Button><Button size="sm" variant="outline" onClick={() => void decide([a.id], "declined", window.prompt("Reason for declining") ?? undefined)}>Decline</Button></div> : null}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Requests() {
  const [active, setActive] = useState(true);
  const [q, setQ] = useState("");
  const [reply, setReply] = useState<Record<string, string>>({});
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["hub", "requests"], queryFn: async () => (await supabase.from("creator_requests").select("*, creators(full_name)").order("created_at", { ascending: false })).data ?? [] });
  const rows = data.filter((r) => (r.status === "open") === active && r.body.toLowerCase().includes(q.toLowerCase()));
  async function resolve(r: (typeof data)[number]) {
    const text = reply[r.id]?.trim();
    if (!text) { toast.error("Write a short reply first — it goes to the creator's messages."); return; }
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("creator_messages").insert({ creator_id: r.creator_id, from_admin: true, body: text });
    await supabase.from("creator_requests").update({ status: "resolved", reply: text, resolved_by: u.user?.id ?? null, resolved_at: new Date().toISOString() }).eq("id", r.id);
    toast.success("Resolved and replied"); void qc.invalidateQueries({ queryKey: ["hub"] });
  }
  return (
    <>
      <Toolbar active={active} setActive={setActive} counts={[data.filter((r) => r.status === "open").length, data.filter((r) => r.status !== "open").length]} q={q} setQ={setQ} />
      {rows.length === 0 ? <p className={cn(card, "text-sm text-brand-navySoft")}>No creator requests.</p> : (
        <ul className="space-y-3">{rows.map((r) => (
          <li key={r.id} className={card}>
            <p className="text-xs font-bold uppercase text-portal-accent">{r.type} · {(r.creators as { full_name?: string } | null)?.full_name}</p>
            <p className="mt-1 text-sm text-brand-navy">{r.body}</p>
            {r.status === "open" ? (
              <div className="mt-3 flex gap-2"><input aria-label="Reply" className="min-h-10 flex-1 rounded-xl border px-3 text-sm" value={reply[r.id] ?? ""} onChange={(e) => setReply((x) => ({ ...x, [r.id]: e.target.value }))} placeholder="Reply…" /><Button onClick={() => void resolve(r)}>Resolve</Button></div>
            ) : <p className="mt-2 text-xs text-brand-navySoft">Replied: {r.reply}</p>}
          </li>
        ))}</ul>
      )}
    </>
  );
}

const CHECKS = ["App visible", "Name said", "French correct", "No reuse across accounts"];

function VideoReviews() {
  const { appId } = useAdminApp();
  const [flagged, setFlagged] = useState(false);
  const [i, setI] = useState(0);
  const [checks, setChecks] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["hub", "reviews", appId],
    queryFn: async () => {
      let x = supabase.from("creator_posts").select("*, creators(full_name), briefs(title)").eq("status", "pending").order("created_at", { ascending: false });
      if (appId) x = x.eq("app_id", appId);
      return (await x).data ?? [];
    },
  });
  const rows = useMemo(() => data.filter((p) => !flagged || p.skip_reason || (p.fraud_flags ?? []).length || p.hold_reason), [data, flagged]);
  const post = rows[Math.min(i, rows.length - 1)];
  async function decide(status: "approved" | "rejected") {
    if (!post) return;
    if (status === "rejected" && !feedback.trim()) { toast.error("Add short feedback so the creator knows what to fix."); return; }
    const { error } = await supabase.from("creator_posts").update({ status, feedback: feedback || null, ...(status === "rejected" ? { amount_usd: 0 } : {}) }).eq("id", post.id);
    if (error) { toast.error("That could not be saved. Please try again."); return; }
    if (status === "rejected") await supabase.from("creator_notifications").insert({ creator_id: post.creator_id, body: `A post was not approved: ${feedback}` });
    toast.success(status === "approved" ? "Approved" : "Rejected");
    setFeedback(""); setChecks([]);
    void qc.invalidateQueries({ queryKey: ["hub"] });
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "a") void decide("approved");
      if (e.key === "r") void decide("rejected");
      if (e.key === "ArrowRight") setI((x) => x + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button type="button" aria-pressed={!flagged} onClick={() => setFlagged(false)} className={cn("min-h-9 rounded-full px-4 text-sm font-bold", !flagged ? "bg-brand-navy text-card" : "bg-card")}>Pending {data.length}</button>
        <button type="button" aria-pressed={flagged} onClick={() => setFlagged(true)} className={cn("min-h-9 rounded-full px-4 text-sm font-bold", flagged ? "bg-brand-navy text-card" : "bg-card")}>Flagged {data.filter((p) => p.skip_reason || (p.fraud_flags ?? []).length || p.hold_reason).length}</button>
        <span className="hidden flex-1 text-right text-xs text-brand-navySoft sm:block">Shortcuts: A approve · R reject · → next</span>
      </div>
      {!post ? <p className={cn(card, "text-sm text-brand-navySoft")}>No posts waiting for review.</p> : (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <div className="flex aspect-[9/16] max-h-[640px] flex-col items-center justify-center gap-3 rounded-2xl bg-brand-navy p-4 text-center text-card">
            <PostThumb url={post.url} className="w-full flex-1 rounded-xl" />
            <Button asChild variant="secondary"><a href={post.url} target="_blank" rel="noreferrer">Open video ↗</a></Button>
          </div>
          <div className={card}>
            <p className="text-xs text-brand-navySoft">{Math.min(i, rows.length - 1) + 1} of {rows.length}</p>
            <h3 className="text-lg font-extrabold text-brand-navy">{(post.creators as { full_name?: string } | null)?.full_name}</h3>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div><dt className="text-brand-navySoft">Brief</dt><dd className="font-semibold">{(post.briefs as { title?: string } | null)?.title ?? "—"}</dd></div>
              <div><dt className="text-brand-navySoft">Platform</dt><dd className="font-semibold">{post.platform}</dd></div>
              <div><dt className="text-brand-navySoft">Posted</dt><dd className="font-semibold">{post.posted_on ?? "—"}</dd></div>
              <div><dt className="text-brand-navySoft">Views so far</dt><dd className="font-semibold">{compact(Number(post.views ?? 0))}</dd></div>
            </dl>
            {(post.fraud_flags ?? []).length || post.hold_reason ? <p className="mt-3 rounded-xl bg-portal-amber/15 p-3 text-sm text-brand-navy">On hold: {[...(post.fraud_flags ?? []), post.hold_reason].filter(Boolean).join(" · ")}</p> : null}
            {post.skip_reason ? <p className="mt-3 rounded-xl bg-portal-red/10 p-3 text-sm text-portal-red">Flag: {post.skip_reason}</p> : null}
            <fieldset className="mt-4 space-y-2"><legend className="text-sm font-bold text-brand-navy">Compliance</legend>
              {CHECKS.map((c) => <label key={c} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={checks.includes(c)} onChange={(e) => setChecks((x) => (e.target.checked ? [...x, c] : x.filter((y) => y !== c)))} />{c}</label>)}
            </fieldset>
            <textarea aria-label="Feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback for the creator (required to reject)" className="mt-4 min-h-20 w-full rounded-xl border p-3 text-sm" />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => void decide("approved")} disabled={checks.length < CHECKS.length} title={checks.length < CHECKS.length ? "Tick every compliance item first" : undefined}>Approve (A)</Button>
              <Button variant="outline" onClick={() => void decide("rejected")}>Reject (R)</Button>
              <Button variant="ghost" onClick={() => setI((x) => x + 1)}>Next →</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Campaigns({ tab, newJob }: { tab: CampaignTab; newJob?: boolean }) {
  const navigate = useNavigate();
  return (
    <div>
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-brand-line">
        {TABS.map(([k, l]) => (
          <button key={k} type="button" onClick={() => void navigate({ to: "/hub/campaigns", search: { tab: k } })} className={cn("shrink-0 border-b-2 px-3 pb-2.5 text-sm font-bold", tab === k ? "border-brand-navy text-brand-navy" : "border-transparent text-brand-navySoft")}>{l}</button>
        ))}
      </div>
      {tab === "campaigns" ? <CampaignsList /> : tab === "applicants" ? <Applicants /> : tab === "requests" ? <Requests /> : tab === "jobs" ? <JobsList autoNew={newJob} /> : <VideoReviews />}
    </div>
  );
}
