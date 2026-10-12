import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PortalCard } from "@/components/portal/ui";
import { friendlyCreatorError, isHttpUrl } from "@/lib/creator-validation";
import { draftUploadSlot, submitDraft } from "@/lib/ugc-drafts.functions";
import { creatorLocale, L } from "@/i18n/creator-app";

export type Draft = { id: string; brief_id: string; version: number; status: string; video_path: string | null; link_url: string | null; note: string | null; admin_comment: string | null; created_at: string };

export function useDraftRequired() {
  return useQuery({ queryKey: ["creator-draft-required"], queryFn: async () => (await supabase.rpc("ugc_draft_required")).data !== false });
}
/** All my drafts, latest first. */
export function useMyDrafts() {
  return useQuery({
    queryKey: ["creator-drafts"],
    queryFn: async () => ((await supabase.from("creator_drafts").select("id, brief_id, version, status, video_path, link_url, note, admin_comment, created_at").order("version", { ascending: false })).data ?? []) as Draft[],
  });
}
/** Brief ids with a validated draft (posting is open for them). */
export function useValidatedBriefs() {
  const { data = [] } = useMyDrafts();
  return new Set(data.filter((d) => d.status === "validated").map((d) => d.brief_id));
}

function put(url: string, file: File, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", file.type);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("upload failed")));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

const TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const;
const MAX = 500 * 1024 * 1024;

export function statusLine(d: Draft) {
  if (d.status === "validated") return L("Validated ✅ — post it and paste your link", "Validé ✅ — poste-la et colle ton lien");
  if (d.status === "changes_requested") return `${L("Changes requested", "Modifications demandées")} — ${d.admin_comment ?? ""}`;
  return L("Sent — waiting for validation", "Envoyé — en attente de validation");
}

/** "Your draft" block on a brief page: one button, file or link, versions kept. */
export function DraftBlock({ briefId }: { briefId: string }) {
  const qc = useQueryClient();
  const { data: all = [] } = useMyDrafts();
  const drafts = all.filter((d) => d.brief_id === briefId);
  const latest = drafts[0];
  const slot = useServerFn(draftUploadSlot);
  const send = useServerFn(submitDraft);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const canSend = !latest || latest.status === "changes_requested";

  async function submit() {
    if (!file && !link.trim()) return void toast.error(L("Add a video or a link.", "Ajoute une vidéo ou un lien."));
    if (!file && (!isHttpUrl(link.trim()) || !link.trim().startsWith("https://"))) return void toast.error(L("Paste the full link, starting with https://.", "Colle le lien complet, qui commence par https://."));
    setBusy(true);
    try {
      let videoPath: string | undefined;
      if (file) {
        const s = await slot({ data: { briefId, contentType: file.type as (typeof TYPES)[number], size: file.size } });
        setProgress(0);
        await put(s.signedUrl, file, setProgress);
        videoPath = s.path;
      }
      await send({ data: { briefId, ...(videoPath ? { videoPath } : { linkUrl: link.trim() }), ...(note.trim() ? { note: note.trim() } : {}) } });
      toast.success(L("Draft sent.", "Brouillon envoyé."));
      setOpen(false); setFile(null); setLink(""); setNote(""); setProgress(null);
      await qc.invalidateQueries({ queryKey: ["creator-drafts"] });
    } catch (e) {
      toast.error((e as Error).message === "network" || (e as Error).message === "upload failed" ? L("The upload failed. Check your connection and try again.", "L’envoi a échoué. Vérifie ta connexion et réessaie.") : friendlyCreatorError(e));
      setProgress(null);
    } finally { setBusy(false); }
  }

  return (
    <PortalCard className="mt-4 space-y-3" data-testid="draft-block">
      <p className="text-lg font-extrabold text-brand-navy">{L("Your draft", "Ton brouillon")}</p>
      {latest ? <p className="text-sm font-semibold text-brand-navy" data-testid="draft-status">v{latest.version} · {statusLine(latest)}</p> : null}
      {canSend && !open ? (
        <Button size="lg" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
          {latest ? L("Send a new version", "Envoyer une nouvelle version") : L("Send my draft", "Envoyer mon brouillon")}
        </Button>
      ) : null}
      {open ? (
        <div className="space-y-3">
          <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-brand-line bg-portal-bg px-4 text-center text-sm font-bold text-brand-navy">
            {file ? file.name : L("Choose a video (MP4, MOV, WebM · max 500 MB)", "Choisir une vidéo (MP4, MOV, WebM · 500 Mo max)")}
            <input type="file" accept="video/mp4,video/quicktime,video/webm" className="sr-only" disabled={busy} onChange={(e) => {
              const f = e.target.files?.[0]; if (!f) return;
              if (!TYPES.includes(f.type as never)) return void toast.error(L("Please choose an MP4, MOV or WebM video.", "Choisis une vidéo MP4, MOV ou WebM."));
              if (f.size > MAX) return void toast.error(L("This video is over 500 MB. Send a link instead.", "Cette vidéo dépasse 500 Mo. Envoie plutôt un lien."));
              setFile(f); setLink("");
            }} />
          </label>
          {!file ? <Input aria-label={L("Or paste a link", "Ou colle un lien")} placeholder={L("Or paste a link (Drive, WeTransfer, private TikTok)", "Ou colle un lien (Drive, WeTransfer, TikTok privé)")} value={link} onChange={(e) => setLink(e.target.value)} className="min-h-12 text-base" /> : null}
          <Textarea aria-label={L("Note (optional)", "Note (optionnel)")} placeholder={L("Note (optional)", "Note (optionnel)")} rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="text-base" />
          {progress != null ? <div className="h-2 overflow-hidden rounded-full bg-portal-bg"><div className="h-full bg-portal-accent transition-all" style={{ width: `${progress}%` }} /></div> : null}
          <div className="flex gap-2">
            <Button size="lg" disabled={busy} onClick={() => void submit()}>{busy ? (progress != null ? `${progress}%` : "…") : L("Send", "Envoyer")}</Button>
            <Button size="lg" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>{L("Cancel", "Annuler")}</Button>
          </div>
        </div>
      ) : null}
      {drafts.length ? (
        <ul className="space-y-1 border-t border-brand-line pt-2 text-xs text-brand-navySoft">
          {drafts.map((d) => (
            <li key={d.id}>v{d.version} · {new Date(d.created_at).toLocaleDateString(creatorLocale(), { day: "numeric", month: "short" })} · {d.link_url ? <a href={d.link_url} target="_blank" rel="noopener noreferrer" className="underline">{L("link", "lien")}</a> : L("video", "vidéo")} · {statusLine(d)}</li>
          ))}
        </ul>
      ) : null}
    </PortalCard>
  );
}
