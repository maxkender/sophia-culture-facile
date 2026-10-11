/** Caption + hashtags the creator pastes under the post, plus an optional pinned-comment note.
 * Per brief (briefs.style_data.post_desc) with a per-app default (apps.post_description) used when the brief has none. */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { APPS_KEY, useApps } from "@/lib/apps";
import { cn } from "@/lib/utils";
import { L, useCreatorLang } from "@/i18n/creator-app";

export type PostDesc = { fr?: string; en?: string; comment_fr?: string; comment_en?: string };
const clean = (s?: string | null) => (s ?? "").trim();
const hasAny = (d?: PostDesc | null) => Boolean(d && (clean(d.fr) || clean(d.en) || clean(d.comment_fr) || clean(d.comment_en)));

/** Brief text wins; otherwise the app default. Preferred language first, then the other one. */
export function resolvePostDesc(brief: PostDesc | null | undefined, appDefault: PostDesc | null | undefined, lang: string) {
  const src = hasAny(brief) ? brief! : (appDefault ?? {});
  const other = lang === "en" ? "fr" : "en";
  const pick = (k: "" | "comment_") => clean(src[`${k}${lang === "en" ? "en" : "fr"}` as keyof PostDesc]) || clean(src[`${k}${other}` as keyof PostDesc]);
  return { caption: pick(""), comment: pick("comment_"), fromDefault: !hasAny(brief) };
}

async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); toast.success(L("Copied", "Copié")); }
  catch { toast.error(L("Copy failed — select the text and copy it by hand.", "La copie n’a pas marché : sélectionne le texte et copie-le à la main.")); }
}

/** Creator-facing block: "Description à coller" with one-tap Copy. Renders nothing when no text exists. */
export function PostDescriptionBlock({ appId, desc, briefLang, compact }: { appId: string | null | undefined; desc: PostDesc | null | undefined; briefLang?: string | null | undefined; compact?: boolean }) {
  const lang = useCreatorLang();
  const { data: apps = [] } = useApps();
  const app = apps.find((a) => a.id === appId) as { post_description?: PostDesc } | undefined;
  const r = resolvePostDesc(desc, app?.post_description, briefLang || lang);
  if (!r.caption && !r.comment) return null;
  return (
    <section data-testid="post-description" className={cn("rounded-2xl border border-portal-accent/30 bg-portal-accent/5", compact ? "p-3" : "p-4")}>
      <h3 className="text-sm font-extrabold uppercase tracking-wide text-brand-navy">{L("Description to paste", "Description à coller")}</h3>
      {r.caption ? <>
        <p className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-card p-3 text-sm text-brand-navy">{r.caption}</p>
        <Button size="lg" className="mt-2 w-full sm:w-auto" onClick={() => void copy(r.caption)}><Copy className="size-4" />{L("Copy description", "Copier la description")}</Button>
      </> : null}
      {r.comment ? <div className="mt-3">
        <p className="text-xs font-bold uppercase text-brand-navySoft">{L("Comments / pinned comment", "En commentaire / commentaire épinglé")}</p>
        <p className="mt-1 whitespace-pre-wrap break-words rounded-xl bg-card p-3 text-sm text-brand-navy">{r.comment}</p>
        <Button size="sm" variant="outline" className="mt-2" onClick={() => void copy(r.comment)}><Copy className="size-4" />{L("Copy comment", "Copier le commentaire")}</Button>
      </div> : null}
    </section>
  );
}

const field = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
/** Admin editor (Hub, English). Controlled; the parent saves on its own Save button. */
export function PostDescriptionFields({ value, onChange, placeholderNote }: { value: PostDesc; onChange: (v: PostDesc) => void; placeholderNote?: string }) {
  const set = (k: keyof PostDesc, v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm font-semibold">Caption + hashtags · FR<textarea rows={4} className={field} value={value.fr ?? ""} onChange={(e) => set("fr", e.target.value)} placeholder={placeholderNote} /></label>
      <label className="block text-sm font-semibold">Caption + hashtags · EN<textarea rows={4} className={field} value={value.en ?? ""} onChange={(e) => set("en", e.target.value)} placeholder={placeholderNote} /></label>
      <label className="block text-sm font-semibold">Comment / pinned comment · FR (optional)<textarea rows={2} className={field} value={value.comment_fr ?? ""} onChange={(e) => set("comment_fr", e.target.value)} /></label>
      <label className="block text-sm font-semibold">Comment / pinned comment · EN (optional)<textarea rows={2} className={field} value={value.comment_en ?? ""} onChange={(e) => set("comment_en", e.target.value)} /></label>
    </div>
  );
}

function AppDefaultRow({ id, name, initial }: { id: string; name: string; initial: PostDesc }) {
  const qc = useQueryClient();
  const [v, setV] = useState<PostDesc>(initial);
  const [busy, setBusy] = useState(false);
  return (
    <div className="rounded-2xl bg-card p-4 shadow-portal">
      <h3 className="mb-2 font-extrabold text-brand-navy">{name}</h3>
      <PostDescriptionFields value={v} onChange={setV} />
      <Button className="mt-3" disabled={busy} onClick={async () => {
        setBusy(true);
        const { error } = await supabase.from("apps").update({ post_description: v as never }).eq("id", id);
        setBusy(false);
        if (error) toast.error("Could not save."); else { toast.success("Default description saved"); void qc.invalidateQueries({ queryKey: APPS_KEY }); }
      }}>Save</Button>
    </div>
  );
}

/** Settings tab: one default description per app, used by every brief that has none. */
export function PostDescriptionSettings() {
  const { data: apps = [] } = useApps();
  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-navySoft">Shown to creators under “Description à coller” when a brief has no description of its own.</p>
      {apps.map((a) => <AppDefaultRow key={a.id} id={a.id} name={a.name} initial={((a as { post_description?: PostDesc }).post_description ?? {}) as PostDesc} />)}
    </div>
  );
}
