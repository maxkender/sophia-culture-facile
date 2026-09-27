import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, PageTitle, PortalCard } from "../ui";

import { WeeklyGuidesAdmin } from "./WeeklyGuidesAdmin";
import { saveCreatorEmailSettings } from "@/lib/creator-onboarding.functions";

type Tab = "creators" | "briefs" | "guides" | "posts" | "calls" | "library" | "email";

export function CreatorOps() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("creators");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");

  const { data } = useQuery({
    queryKey: ["portal", "admin", "creator-ops", tab],
    queryFn: async () => {
      if (tab === "creators") return (await supabase.from("creators").select("*").order("created_at", { ascending: false })).data ?? [];
      if (tab === "briefs") return (await supabase.from("briefs").select("*").order("created_at", { ascending: false })).data ?? [];
      if (tab === "posts") return (await supabase.from("creator_posts").select("*, creators(full_name)").order("created_at", { ascending: false })).data ?? [];
      if (tab === "library") return (await supabase.from("reference_videos").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false })).data ?? [];
      if (tab === "email") return (await supabase.from("creator_email_settings").select("*").eq("template_key", "ugc-acceptance").maybeSingle()).data;
      return (await supabase.from("creator_calls").select("*").order("starts_at", { ascending: false })).data ?? [];
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["portal", "admin", "creator-ops"] });

  async function add(): Promise<unknown> {
    let error;
    if (tab === "creators") {
      if (!a.trim() || !b.trim()) return toast.error("Name and email required.");
      ({ error } = await supabase.from("creators").insert({ full_name: a.trim(), email: b.trim(), country: c.trim() || null }));
    } else if (tab === "briefs") {
      if (!a.trim()) return toast.error("Title required.");
      ({ error } = await supabase.from("briefs").insert({ title: a.trim(), body: b, hook: c.trim() || null }));
    } else if (tab === "library") {
      const urls = a.split(/\s+/).filter((u) => /^https?:\/\//.test(u));
      if (!urls.length) return toast.error("Paste one or more video links.");
      ({ error } = await supabase.from("reference_videos").insert(urls.map((url) => ({ url, platform: url.includes("instagram") ? "instagram" : "tiktok", category: b.trim() || "hook", note: c.trim() || null }))));
    } else if (tab === "calls") {
      if (!a.trim() || !b) return toast.error("Title and date required.");
      ({ error } = await supabase.from("creator_calls").insert({ title: a.trim(), starts_at: new Date(b).toISOString(), link: c.trim() || null }));
    }
    if (error) return toast.error("Could not save.");
    setA(""); setB(""); setC(""); toast.success("Saved."); return refresh();
  }

  async function update(table: "briefs" | "creator_posts" | "reference_videos", id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from(table).update(patch as never).eq("id", id);
    if (error) toast.error("Could not update."); else refresh();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-6">
      <PageTitle title="Creator operations" lead="Creators, briefs, posts and calls — separate from authors." />
      <div className="flex flex-wrap gap-2">
        {(["creators", "briefs", "guides", "posts", "calls", "library", "email"] as Tab[]).map((t) => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>{t === "guides" ? "weekly guides" : t}</Button>
        ))}
      </div>

      {tab === "guides" ? <WeeklyGuidesAdmin /> : tab === "email" ? <AcceptanceEmailEditor row={data} onSaved={refresh} /> : <>
      {tab !== "posts" && (
        <PortalCard className="grid gap-2 p-4 sm:grid-cols-4">
          <Input placeholder={tab === "creators" ? "Full name" : tab === "library" ? "Video links (space separated)" : "Title"} value={a} onChange={(e) => setA(e.target.value)} />
          {tab === "briefs" ? (
            <Textarea placeholder="Brief" value={b} onChange={(e) => setB(e.target.value)} />
          ) : (
            <Input type={tab === "calls" ? "datetime-local" : tab === "library" ? "text" : "email"} placeholder={tab === "library" ? "Category" : "Email"} value={b} onChange={(e) => setB(e.target.value)} />
          )}
          <Input placeholder={tab === "creators" ? "Country" : tab === "briefs" ? "Hook" : tab === "library" ? "Note" : "Meeting link"} value={c} onChange={(e) => setC(e.target.value)} />
          <Button onClick={add}>Add</Button>
        </PortalCard>
      )}

      <PortalCard className="p-4">
        {rows.length === 0 ? <EmptyState title="Nothing yet" text="Items will appear here." /> : (
          <ul className="divide-y divide-brand-line">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-brand-navy">{r.full_name ?? r.title ?? r.url}</span>
                  <span className="block text-xs text-brand-navySoft">
                    {tab === "creators" && `${r.email} · ${r.status} · ${creatorProgress(r)} / 4 onboarding steps`}
                    {tab === "briefs" && `${r.status} · ${formatDateTime(r.created_at)}`}
                    {tab === "posts" && `${r.creators?.full_name ?? ""} · ${r.platform} · ${r.posted_on} · ${r.status}`}
                    {tab === "calls" && formatDateTime(r.starts_at)}
                    {tab === "library" && `${r.platform} · ${r.category}${r.pinned ? " · pinned" : ""}${r.active ? "" : " · inactive"}`}
                  </span>
                </span>
                {tab === "creators" && r.invite_token && !r.user_id && (
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${origin}/creators/app?invite=${r.invite_token}`); toast.success("Invite link copied."); }}>Copy invite</Button>
                )}
                {tab === "briefs" && (
                  <Button size="sm" variant="outline" onClick={() => update("briefs", r.id, { status: r.status === "published" ? "draft" : "published" })}>
                    {r.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                )}
                {tab === "library" && (
                  <>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-portal-accent">Open</a>
                    <Button size="sm" variant="outline" onClick={() => update("reference_videos", r.id, { pinned: !r.pinned })}>{r.pinned ? "Unpin" : "Pin"}</Button>
                    <Button size="sm" variant="outline" onClick={() => update("reference_videos", r.id, { active: !r.active })}>{r.active ? "Deactivate" : "Activate"}</Button>
                  </>
                )}
                {tab === "posts" && (
                  <>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-portal-accent">Open</a>
                    <Button size="sm" variant="outline" onClick={() => update("creator_posts", r.id, { status: "approved" })}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => { const f = prompt("Feedback"); if (f) update("creator_posts", r.id, { status: "flagged", feedback: f }); }}>Flag</Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </PortalCard>
      </>}
    </div>
  );
}

function creatorProgress(creator: any) {
  return [creator.motivation_confirmed_at, creator.social_account_created_at, creator.onboarding_completed_at].filter(Boolean).length + (creator.social_account_created_at ? 1 : 0);
}

function AcceptanceEmailEditor({ row, onSaved }: { row: any; onSaved: () => void }) {
  const save = useServerFn(saveCreatorEmailSettings);
  const [subject, setSubject] = useState("");
  const [intro, setIntro] = useState("");
  const [instructions, setInstructions] = useState("");
  const [buttonLabel, setButtonLabel] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!row) return;
    setSubject(row.subject ?? ""); setIntro(row.intro ?? ""); setInstructions(row.instructions ?? ""); setButtonLabel(row.button_label ?? "");
  }, [row]);
  return (
    <PortalCard className="space-y-4 p-5">
      <div>
        <h2 className="font-bold text-brand-navy">UGC acceptance email</h2>
        <p className="mt-1 text-sm text-brand-navySoft">This copy is used automatically after approval. Delivery activates after Sophia’s sender domain is configured.</p>
      </div>
      <Input aria-label="Email subject" placeholder="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
      <Textarea aria-label="Email introduction" placeholder="Introduction" value={intro} onChange={(event) => setIntro(event.target.value)} rows={4} />
      <Textarea aria-label="Email instructions" placeholder="Instructions" value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={5} />
      <Input aria-label="Email button label" placeholder="Button label" value={buttonLabel} onChange={(event) => setButtonLabel(event.target.value)} />
      <Button disabled={busy || !subject.trim() || !intro.trim() || !instructions.trim() || !buttonLabel.trim()} onClick={async () => {
        setBusy(true);
        try {
          await save({ data: { subject, intro, instructions, buttonLabel } });
          toast.success("Acceptance email saved."); onSaved();
        } catch (error: any) { toast.error(error?.message ?? "Could not save the email."); }
        finally { setBusy(false); }
      }}>Save email</Button>
    </PortalCard>
  );
}
