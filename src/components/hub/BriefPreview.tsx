import { useState } from "react";
import type React from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Download, FileText, Image as ImageIcon, Link2, Music, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { assetLinks } from "@/lib/brief-studio.functions";
import { ROLE_LABEL, STYLE_LABEL, hasStyledContent, STYLE_NUM, TEXT_FORMATS, type AssetRef, type StudioBrief, type StyleData, type TextFormat } from "@/lib/brief-studio";
import { PostThumb } from "./PostThumb";
import { t as ct } from "@/i18n/creator-app";

export type BriefAsset = { id: string; kind: string; title: string; storage_path: string | null; url: string | null; text_content: string | null; thumbnail_url: string | null; role: string };
export type BriefRef = { id: string; title: string | null; url: string; thumbnail_url?: string | null };
const EFFORT_FR: Record<string, string> = { pov: "POV", reaction: "Réaction", talking_head: "Face cam" };
const KIND_ICON = { video: Video, image: ImageIcon, audio: Music, pdf: FileText, text: FileText, link: Link2 } as Record<string, typeof Video>;

/** Signed-link download for one asset (links open in a new tab). */
export function useAssetDownload() {
  const links = useServerFn(assetLinks);
  return async (a: Pick<BriefAsset, "id" | "kind" | "url">) => {
    if (a.kind === "link" && a.url) { window.open(a.url, "_blank", "noopener"); return; }
    const u = (await links({ data: { ids: [a.id] } })).urls[a.id];
    if (!u) { toast.error(ct("Ce fichier n'est pas encore disponible.")); return; }
    const el = document.createElement("a"); el.href = u; el.rel = "noopener"; el.click();
  };
}

const FMT_FR: Record<string, string> = { title: "Gros titre centré", subtitle: "Sous-titre en bas", sticker: "Sticker", caption: "Bandeau légende", none: "Pas de texte" };
void TEXT_FORMATS;
function OnScreen({ text, fmt }: { text: string; fmt?: TextFormat | undefined }) {
  if (!text?.trim() && (!fmt || fmt.kind === "none")) return null;
  return <div className="rounded-lg bg-brand-navy p-2 text-sm text-card"><p className="text-[10px] font-bold uppercase opacity-70">Texte à l'écran · {FMT_FR[fmt?.kind ?? "subtitle"]}{fmt?.note ? ` · ${fmt.note}` : ""}</p>{text ? <p className="font-extrabold">{text}</p> : null}</div>;
}
function AssetLine({ r, assets }: { r: AssetRef; assets: BriefAsset[] }) {
  const dl = useAssetDownload();
  const a = assets.find((x) => x.id === r.asset_id);
  return (
    <li className="flex items-center gap-2 rounded-lg border border-brand-line p-2 text-sm" data-testid="plan-asset">
      {a?.thumbnail_url ? <img src={a.thumbnail_url} alt="" className="size-9 rounded object-cover" /> : <span className="flex size-9 items-center justify-center rounded bg-portal-bg"><FileText className="size-4 text-brand-navySoft" /></span>}
      <div className="min-w-0 flex-1"><p className="truncate font-bold text-brand-navy">{a?.title ?? "Fichier"}</p>{r.when ? <p className="text-xs text-brand-navySoft">Quand : {r.when}</p> : null}</div>
      {a ? <Button size="sm" variant="outline" onClick={() => void dl(a)}><Download className="size-3.5" />{a.kind === "link" ? "Ouvrir" : "Télécharger"}</Button> : null}
    </li>
  );
}
function PlanCard({ n, label, children }: { n: number; label: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border-2 border-brand-line bg-card p-3" data-testid="plan-card"><p className="mb-2 flex items-center gap-2 text-sm font-extrabold text-brand-navy"><span className="flex size-6 items-center justify-center rounded-full bg-portal-accent text-xs text-card">{n}</span>{label}</p><div className="space-y-2 text-sm text-brand-navy">{children}</div></section>;
}
const Say = ({ t }: { t: string }) => (t?.trim() ? <p>🎙️ <b>{ct("À dire :")}</b> {t}</p> : null);
const Do = ({ t }: { t: string }) => (t?.trim() ? <div><p className="font-bold">{ct("👉 À faire :")}</p><p className="whitespace-pre-wrap">{t}</p></div> : null);

/** The plans as the creator sees them, following the brief's style. */
export function StyledPlans({ b, assets }: { b: StudioBrief; assets: BriefAsset[] }) {
  const d: StyleData = b.style_data ?? {}; const plans = d.plans ?? [];
  const list = (rs: AssetRef[]) => {ct("(rs.length ?")} <ul className="space-y-1">{rs.map((r, i) => <AssetLine key={`${r.asset_id}-${i}`} r={r} assets={assets} />)}</ul> : null);
  const cta = d.cta?.trim() ? <p className="rounded-xl bg-portal-green/10 p-3 text-sm text-brand-navy"><b>{ct("CTA :")}</b> {d.cta}</p> : null;
  const body = d.body?.trim() ? <p className="rounded-xl bg-portal-bg p-3 text-sm text-brand-navy"><b>{ct("Le fond :")}</b> {d.body}</p> : null;
  if (b.style === "reaction_demo") return <div className="space-y-3">{body}
    <PlanCard n={1} label={ct("Face (caméra sur ton visage)")}>{plans[0]?.reaction ? <p>😮 <b>{ct("Réaction :")}</b> {plans[0].reaction}</p> : null}<OnScreen text={plans[0]?.on_screen ?? ""} fmt={plans[0]?.fmt} /><Say t={plans[0]?.say ?? ""} />{list(plans[0]?.assets ?? [])}</PlanCard>
    <PlanCard n={2} label={ct("Téléphone / démo (caméra sur le téléphone)")}><Do t={plans[1]?.do ?? ""} /><Say t={plans[1]?.say ?? ""} />{list(plans[1]?.assets ?? [])}</PlanCard>
    {d.flips?.on ? <p className="rounded-xl border-2 border-dashed border-portal-accent/40 p-3 text-sm">🔄 <b>{ct("Retournements de caméra :")}</b> {d.flips.note}</p> : null}{cta}</div>;
  if (b.style === "sole_footage") { const x = d.sole; return <div className="space-y-3">
    <PlanCard n={1} label={`Le plan${x?.duration_s ? ` · ${x.duration_s} s` : ""}`}>{x?.what ? <p className="whitespace-pre-wrap">🎬 {x.what}</p> : null}<OnScreen text={x?.text ?? ""} fmt={x?.fmt} />
      {x?.music_title || x?.music_link ? <p>🎵 <b>{ct("Musique :")}</b> {x.music_title}{x.music_link ? <> · <a href={x.music_link} target="_blank" rel="noreferrer" className="font-bold text-portal-accent underline">{ct("Ouvrir la musique")}</a></> : null}</p> : null}
      {x?.music_asset_id ? list([{ asset_id: x.music_asset_id, when: "" }]) : null}</PlanCard>{cta}</div>; }
  if (b.style === "educational") return <div className="space-y-3">
    <p className="rounded-xl bg-portal-bg p-3 text-sm">{ct("🪑 Face cam, assis·e, un carnet dans le cadre au début.")}</p>
    {d.script_fmt && d.script_fmt.kind !== "none" ? <OnScreen text="" fmt={d.script_fmt} /> : null}
    <section className="rounded-2xl border-2 border-brand-line p-4"><p className="mb-2 text-sm font-extrabold uppercase text-brand-navySoft">{ct("Le script")}</p><p className="whitespace-pre-wrap text-base leading-relaxed text-brand-navy" data-testid="edu-script">{d.script}</p></section>
    {d.flashes?.length ? <section><p className="mb-1 text-sm font-extrabold text-brand-navy">{ct("À afficher à l'écran")}</p>{list(d.flashes)}</section> : null}{cta}</div>;
  return <div className="space-y-3">{body}
    {plans.map((p, i) => <PlanCard key={i} n={i + 1} label={`Plan ${i + 1}`}><OnScreen text={p.on_screen} fmt={p.fmt} /><Say t={p.say} /><Do t={p.do} />{p.camera ? <p>🎥 <b>{ct("Caméra :")}</b> {p.camera}</p> : null}{list(p.assets)}</PlanCard>)}
    {b.style === "talked_hook_demo" && d.demo ? <PlanCard n={plans.length + 1} label={d.demo.mode === "asset" ? "Démo (enregistrement d'écran fourni)" : "Démo (filmée par toi)"}>
      {d.demo.mode === "asset" && d.demo.asset ? list([d.demo.asset]) : <Do t={d.demo.do} />}<Say t={d.demo.say} /></PlanCard> : null}{cta}</div>;
}

export function FilesSection({ assets, title = "Fichiers" }: { assets: BriefAsset[]; title?: string }) {
  const links = useServerFn(assetLinks);
  const [busy, setBusy] = useState(false);
  async function urlsFor(ids: string[]) { return ids.length ? (await links({ data: { ids } })).urls : {}; }
  async function download(a: BriefAsset) {
    if (a.kind === "link" && a.url) { window.open(a.url, "_blank", "noopener"); return; }
    const u = (await urlsFor([a.id]))[a.id];
    if (!u) { toast.error(ct("Ce fichier n'est pas encore disponible.")); return; }
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
    } catch { toast.error(ct("Le zip n'a pas pu être créé. Télécharge les fichiers un par un.")); }
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
            {a.kind === "link" && a.url ? <PostThumb url={a.url} className="size-12 shrink-0 rounded-lg" /> {ct(": a.thumbnail_url ?")} <img src={a.thumbnail_url} alt="" loading="lazy" className="size-12 shrink-0 rounded-lg object-cover" /> : <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-portal-bg"><Icon className="size-5 text-brand-navySoft" /></span>}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-brand-navy">{a.title}</p>
              <p className="text-xs text-brand-navySoft">{ROLE_LABEL[a.role] ?? a.role}</p>
              {a.kind === "text" ? <p className="mt-1 line-clamp-2 text-xs text-brand-navy">{a.text_content}</p> : null}
            </div>
            {a.kind === "text"
              ? <Button size="sm" variant="outline" onClick={async () => { await navigator.clipboard.writeText(a.text_content ?? ""); toast.success(ct("Texte copié")); }}><Copy className="size-3.5" />{ct("Copier")}</Button>
              : <Button size="sm" variant="outline" onClick={() => void download(a)}><Download className="size-3.5" />{a.kind === "link" ? "Ouvrir" : "Télécharger"}</Button>}
          </li>
        );
      })}</ul>
    </section>
  );
}

/** Exactly what the creator sees on /creators/app/briefs/<id>; the Studio renders it inside a phone frame. */
export function BriefView({ b, assets, refs, pay }: { b: StudioBrief; assets: BriefAsset[]; refs: BriefRef[]; pay?: string | null }) {
  const styled = Boolean(b.style) && hasStyledContent(b.style_data);
  const beats = styled ? [] : (b.beats ?? []).filter((x) => x?.trim());
  return (
    <div className="space-y-5">
      {b.style ? <span className="inline-flex rounded-full bg-portal-accent/15 px-3 py-1 text-xs font-extrabold text-portal-accent" data-testid="style-badge">Style {STYLE_NUM[b.style]} · {STYLE_LABEL[b.style]}</span> : null}
      <div className="rounded-2xl bg-brand-navy p-5 text-card">
        <div className="mb-3 flex flex-wrap gap-2 text-xs font-bold">
          {b.effort ? <span className="rounded-full bg-card/15 px-2.5 py-1">{EFFORT_FR[b.effort]}</span> : null}
          {pay ? <span className="rounded-full bg-portal-green px-2.5 py-1 text-card">{pay}</span> : null}
          {b.duration_target ? <span className="rounded-full bg-card/15 px-2.5 py-1">{b.duration_target}</span> : null}
        </div>
        <p className="text-2xl font-extrabold leading-tight">{b.hook_text || b.title || "Ton hook ici"}</p>
        {b.oral_hook && !styled ? <p className="mt-3 text-sm opacity-90">🎙️ « {b.oral_hook} »</p> : null}
        {b.hook_visual && !styled ? <p className="mt-1 text-sm opacity-80">👀 {b.hook_visual}</p> : null}
      </div>
      {beats.length ? (
        <section><h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-brand-navySoft">{ct("Le script en 3 temps")}</h3>
          <ol className="space-y-2">{beats.map((x, i) => <li key={i} className="rounded-xl bg-portal-bg p-3 text-sm text-brand-navy"><span className="mr-2 font-extrabold text-portal-accent">{["0-3 s", "3-20 s", "20-30 s"][i]}</span>{x}</li>)}</ol>
        </section>
      ) : null}
      {styled ? <StyledPlans b={b} assets={assets} /> : null}
      {!styled && (b.product_gesture || b.product_moment) ? (
        <section className="rounded-xl border-2 border-portal-accent/30 p-3 text-sm text-brand-navy">
          <p className="font-extrabold">📱 Moment produit{b.product_second ? ` · à ${b.product_second} s` : ""}</p>
          <p className="mt-1">{b.product_gesture}{b.product_gesture && b.product_moment ? " — " : ""}{b.product_moment}</p>
          {b.say_name ? <p className="mt-1 text-xs text-brand-navySoft">{ct("Dis le nom de l'app une fois, à la fin.")}</p> : null}
        </section>
      ) : null}
      <FilesSection assets={assets} />
      {refs.length ? (
        <section><h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-brand-navySoft">{ct("Références")}</h3>
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
    style: r.style ?? null, style_data: (r.style_data && typeof r.style_data === "object" ? r.style_data : {}) as StyleData,
  };
}
