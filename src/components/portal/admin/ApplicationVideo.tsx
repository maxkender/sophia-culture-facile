import { useEffect, useState } from "react";
import { Download, ExternalLink, FileVideo, Instagram, Link2, Music2, Video, VideoOff, Youtube } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

/** Returns an embeddable iframe URL for TikTok, Instagram or YouTube links, else null. */
export function embedUrl(raw: string): string | null {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  const host = u.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
  if (host.endsWith("youtube.com")) {
    const id = u.searchParams.get("v") ?? u.pathname.match(/\/(?:shorts|embed|live)\/([\w-]+)/)?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host.endsWith("tiktok.com")) {
    const id = u.pathname.match(/\/video\/(\d+)/)?.[1];
    return id ? `https://www.tiktok.com/embed/v2/${id}` : null;
  }
  if (host.endsWith("instagram.com")) {
    const m = u.pathname.match(/\/(p|reel|reels|tv)\/([\w-]+)/);
    return m ? `https://www.instagram.com/${m[1] === "reels" ? "reel" : m[1]}/${m[2]}/embed` : null;
  }
  return null;
}

export function VideoStatusIcon({ file, url }: { file: string | null; url: string | null }) {
  if (file) return <span title="Video file uploaded" className="inline-flex items-center gap-1 text-[11px] font-bold text-portal-green"><FileVideo className="size-4" />File</span>;
  if (url) return <span title="Video link given" className="inline-flex items-center gap-1 text-[11px] font-bold text-portal-accent"><Link2 className="size-4" />Link</span>;
  return <span title="No video" className="inline-flex items-center gap-1 text-[11px] font-bold text-portal-red"><VideoOff className="size-4" />None</span>;
}

function OpenVideoButton({ url }: { url: string }) {
  return (
    <Button asChild variant="pill" className="h-12 w-full text-base">
      <a href={url} target="_blank" rel="noopener noreferrer"><Video className="size-5" /> Open video <ExternalLink className="size-4" /></a>
    </Button>
  );
}

export function TalkingVideo({ file, url }: { file: string | null; url: string | null }) {
  const [signed, setSigned] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setSigned(null); setFailed(false);
    if (!file) return;
    void supabase.storage.from("creator-videos").createSignedUrl(file, 60 * 60).then(({ data }) => {
      if (data?.signedUrl) setSigned(data.signedUrl); else setFailed(true);
    });
  }, [file]);
  const embed = url ? embedUrl(url) : null;

  return (
    <section className="space-y-3 rounded-lg border border-brand-line p-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Talking video</h3>
      {!file && !url ? <p className="text-sm font-bold text-portal-red">No video submitted</p> : null}
      {file ? (
        <div className="space-y-2">
          {signed ? (
            <video src={signed} controls playsInline preload="metadata" className="mx-auto aspect-[9/16] max-h-[480px] rounded-lg bg-brand-navy" />
          ) : failed ? (
            <p className="text-sm font-bold text-portal-red">The uploaded video could not be loaded.</p>
          ) : (
            <p className="text-sm text-brand-navySoft">Loading video…</p>
          )}
          {signed ? (
            <a href={signed} download className="inline-flex items-center gap-1 text-sm font-semibold text-portal-accent hover:underline"><Download className="size-4" /> Download video</a>
          ) : null}
        </div>
      ) : null}
      {url ? (
        file || !embed ? <OpenVideoButton url={url} /> : (
          <div className="space-y-2">
            <iframe src={embed} title="Applicant video" allow="autoplay; encrypted-media; fullscreen" allowFullScreen className="mx-auto aspect-[9/16] max-h-[480px] w-full max-w-[270px] rounded-lg border-0" />
            <OpenVideoButton url={url} />
          </div>
        )
      ) : null}
    </section>
  );
}

function iconFor(url: string) {
  const h = url.toLowerCase();
  if (h.includes("tiktok.com")) return Music2;
  if (h.includes("instagram.com")) return Instagram;
  if (h.includes("youtu")) return Youtube;
  return Link2;
}

export function SocialLinks({ tiktok, instagram, other }: { tiktok: string | null; instagram: string | null; other: string | null }) {
  const found = other?.match(/https?:\/\/[^\s,;]+/g) ?? [];
  const leftover = other?.replace(/https?:\/\/[^\s,;]+/g, "").trim();
  const Btn = ({ href, label }: { href: string; label: string }) => {
    const Icon = iconFor(href);
    return (
      <Button asChild variant="outline" className="h-11 max-w-full justify-start">
        <a href={href} target="_blank" rel="noopener noreferrer"><Icon className="size-4 shrink-0" /><span className="truncate">{label}</span><ExternalLink className="size-3 shrink-0" /></a>
      </Button>
    );
  };
  const short = (u: string) => { try { const x = new URL(u); return x.hostname.replace(/^www\./, "") + x.pathname.replace(/\/$/, ""); } catch { return u; } };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tiktok ? <Btn href={tiktok} label="TikTok" /> : null}
        {instagram ? <Btn href={instagram} label="Instagram" /> : null}
      </div>
      {other ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Other links</p>
          {leftover ? <p className="whitespace-pre-line text-sm text-brand-navy">{leftover}</p> : null}
          <div className="flex flex-wrap gap-2">{found.map((u) => <Btn key={u} href={u} label={short(u)} />)}</div>
        </div>
      ) : null}
    </div>
  );
}
