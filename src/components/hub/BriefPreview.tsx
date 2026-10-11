import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Download, FileText, Image as ImageIcon, Link2, Music, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { assetLinks } from "@/lib/brief-studio.functions";
import { ROLE_LABEL, type StudioBrief } from "@/lib/brief-studio";
import { PostThumb } from "./PostThumb";

export type BriefAsset = { id: string; kind: string; title: string; storage_path: string | null; url: string | null; text_content: string | null; thumbnail_url: string | null; role: string };
export type BriefRef = { id: string; title: string | null; url: string; thumbnail_url?: string | null };
const EFFORT_FR: Record<string, string> = { pov: "POV", reaction: "Réaction", talking_head: "Face cam" };
const KIND_ICON = { video: Video, image: ImageIcon, audio: Music, pdf: FileText, text: FileText, link: Link2 } as Record<string, typeof Video>;

export function FilesSection({ assets, title = "Fichiers" }: { assets: BriefAsset[]; title?: string }) {
  const links = useServerFn(assetLinks);
  const [busy, setBusy] = useState(false);
  async function urlsFor(ids: string[]) { return ids.length ? (await links({ data: { ids } })).urls : {}; }
  async function download(a: BriefAsset) {
    if (a.kind === "link" && a.url) { window.open(a.url, "_blank", "noopener"); return; }
    const u = (await urlsFor([a.id]))[a.id];
    if (!u) { toast.error("Ce fichier n'est pas encore disponible."); return; }
    const el = document.createElement("a"); el.href = u; el.rel = "noopener"; el.click();
  }
  async function zipAll() {
    setBusy(true);
    try {
      const files = assets.filter((a) => a.storage_path || a.kind === "text");
      const urls = await urlsFor(files.filter((a) => a.storage_path).map((a) => a.id));
      const { zipSync, strToU8 } = await import("fflate");
      const entries: Record<string, Uint8Array> = {};
      for (const a of files) {
        const safe = a.title.replace(/[^\w\- ]+/g, "").trim() || a.id.slice(0, 8);
        if (a.kind === "text") { entries[`${safe}.txt`] = strToU8(a.text_content ?? ""); continue; }
        const u = urls[a.id]; if (!u) continue;
        const buf = new Uint8Array(await (await fetch(u)).arrayBuffer());
        entries[`${safe}${a.storage_path?.match(/\.[a-z0-9]+$/i)?.[0] ?? ""}`] = buf;
      }
      const blob = new Blob([zipSync(entries, { level: 0 }) as BlobPart], { type: "application/zip" });
      const el = document.createElement("a"); el.href = URL.createObjectURL(blob); el.download = "fichiers-brief.zip"; el.click();
    } catch { toast.error("Le zip n'a pas pu être créé. Télécharge les fichiers un par un."); }
    finally { setBusy(false); }
  }
  if (!assets.length) return null;
  return (
    <section aria-label={title}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-brand-navySoft">{title}</h3>
        {assets.length > 1 ? <Button size="sm" variant="outline" disabled={busy} onClick={() => void zipAll()}><Download className="size-3.5" />{busy ? "Préparation…" : "Tout télécharger"}</Button> : null}
      </div>
      <ul className="space-y-2">{assets.map((a) => {
        const Icon = KIND_ICON[a.kind] ?? FileText;
        return (
          <li key={a.id} className="flex items-center gap-3 rounded-xl border border-brand-line bg-card p-2" data-testid="brief-file">
            {a.kind === "link" && a.url ? <PostThumb url={a.url} className="size-12 shrink-0 rounded-lg" /> : a.thumbnail_url ? <img src={a.thumbnail_url} alt="" loading="lazy" className="size-12 shrink-0 rounded-lg object-cover" /> : <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-portal-bg"><Icon className="size-5 text-brand-navySoft" /></span>}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-brand-navy">{a.title}</p>
              <p className="text-xs text-brand-navySoft">{ROLE_LABEL[a.role] ?? a.role}</p>
              {a.kind === "text" ? <p className="mt-1 line-clamp-2 text-xs text-brand-navy">{a.text_content}</p> : null}
            </div>
            {a.kind === "text"
              ? <Button size="sm" variant="outline" onClick={async () => { await navigator.clipboard.writeText(a.text_content ?? ""); toast.success("Texte copié"); }}><Copy className="size-3.5" />Copier</Button>
              : <Button size="sm" variant="outline" onClick={() => void download(a)}><Download className="size-3.5" />{a.kind === "link" ? "Ouvrir" : "Télécharger"}</Button>}
          </li>
        );
      })}</ul>
    </section>
  );
}

/** Exactly what the creator sees on /creators/app/briefs/<id>; the Studio renders it inside a phone frame. */
export function BriefView({ b, assets, refs, pay }: { b: StudioBrief; assets: BriefAsset[]; refs: BriefRef[]; pay?: string | null }) {
  const beats = (b.beats ?? []).filter((x) => x?.trim());
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-brand-navy p-5 text-card">
        <div className="mb-3 flex flex-wrap gap-2 text-xs font-bold">
          {b.effort ? <span className="rounded-full bg-card/15 px-2.5 py-1">{EFFORT_FR[b.effort]}</span> : null}
          {pay ? <span className="rounded-full bg-portal-green px-2.5 py-1 text-card">{pay}</span> : null}
          {b.duration_target ? <span className="rounded-full bg-card/15 px-2.5 py-1">{b.duration_target}</span> : null}
        </div>
        <p className="text-2xl font-extrabold leading-tight">{b.hook_text || b.title || "Ton hook ici"}</p>
        {b.oral_hook ? <p className="mt-3 text-sm opacity-90">🎙️ « {b.oral_hook} »</p> : null}
        {b.hook_visual ? <p className="mt-1 text-sm opacity-80">👀 {b.hook_visual}</p> : null}
      </div>
      {beats.length ? (
        <section><h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-brand-navySoft">Le script en 3 temps</h3>
          <ol className="space-y-2">{beats.map((x, i) => <li key={i} className="rounded-xl bg-portal-bg p-3 text-sm text-brand-navy"><span className="mr-2 font-extrabold text-portal-accent">{["0-3 s", "3-20 s", "20-30 s"][i]}</span>{x}</li>)}</ol>
        </section>
      ) : null}
      {b.product_gesture || b.product_moment ? (
        <section className="rounded-xl border-2 border-portal-accent/30 p-3 text-sm text-brand-navy">
          <p className="font-extrabold">📱 Moment produit{b.product_second ? ` · à ${b.product_second} s` : ""}</p>
          <p className="mt-1">{b.product_gesture}{b.product_gesture && b.product_moment ? " — " : ""}{b.product_moment}</p>
          {b.say_name ? <p className="mt-1 text-xs text-brand-navySoft">Dis le nom de l'app une fois, à la fin.</p> : null}
        </section>
      ) : null}
      <FilesSection assets={assets} />
      {refs.length ? (
        <section><h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-brand-navySoft">Références</h3>
          <div className="flex gap-2 overflow-x-auto pb-1">{refs.map((r) => <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="w-24 shrink-0">{r.thumbnail_url ? <img src={r.thumbnail_url} alt="" loading="lazy" className="aspect-[9/16] w-full rounded-lg object-cover" /> : <PostThumb url={r.url} className="aspect-[9/16] w-full rounded-lg" />}<p className="mt-1 truncate text-xs text-brand-navy">{r.title ?? "Vidéo"}</p></a>)}</div>
        </section>
      ) : null}
      {b.rules_do.length || b.rules_dont.length || b.rules_text ? (
        <section className="grid gap-2 text-sm sm:grid-cols-2">
          <ul className="space-y-1 rounded-xl bg-portal-green/10 p-3">{b.rules_do.map((r) => <li key={r}>✅ {r}</li>)}</ul>
          <ul className="space-y-1 rounded-xl bg-portal-red/10 p-3">{b.rules_dont.map((r) => <li key={r}>⛔ {r}</li>)}</ul>
          {b.rules_text ? <p className={cn("whitespace-pre-wrap text-brand-navySoft sm:col-span-2")}>{b.rules_text}</p> : null}
        </section>
      ) : null}
    </div>
  );
}

/** Normalizes a briefs row (old or Studio) into the Studio shape. */
export function toStudio(row: unknown): StudioBrief {
  const r = row as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const beats = Array.isArray(r.beats) && r.beats.length ? r.beats.map(String) : [];
  return {
    id: r.id ?? "", app_id: r.app_id, title: r.title ?? "", brief_type: r.brief_type === "format" ? "format" : "precise",
    effort: r.effort ?? null, platform: r.platform ?? "both", duration_target: r.duration_target ?? null,
    hook_text: r.hook_text ?? r.hook ?? null, oral_hook: r.oral_hook ?? null, hook_visual: r.hook_visual ?? null, hooks: r.hooks ?? [],
    beats: beats.length ? [...beats, "", "", ""].slice(0, 3) : [r.script ?? r.body ?? "", "", ""].slice(0, 3),
    product_second: r.product_second ?? null, product_gesture: r.product_gesture ?? null, product_moment: r.product_moment ?? r.must_mention ?? null, say_name: r.say_name ?? true,
    rules_do: r.rules_do ?? [], rules_dont: r.rules_dont ?? [], rules_text: r.rules_text ?? null,
    status: r.status ?? "draft", drop_at: r.drop_at ?? null, audience: r.audience ?? "all", audience_efforts: r.audience_efforts ?? [], due_date: r.due_date ?? null,
    language: r.language ?? "fr", translation_of: r.translation_of ?? null, parent_format_id: r.parent_format_id ?? null, campaign_id: r.campaign_id ?? null, score: r.score ?? null,
  };
}
