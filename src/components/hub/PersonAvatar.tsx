import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCreatorPhotos } from "@/lib/creator-photos.functions";

export function useCreatorPhotos(ids: string[]) {
  const fn = useServerFn(adminCreatorPhotos);
  const key = [...ids].sort().join("|");
  return useQuery({ queryKey: ["hub", "creator-photos", key], enabled: ids.length > 0, staleTime: 50 * 60_000, queryFn: () => fn({ data: { ids } }) }).data ?? {};
}

/** 32px photo, or initials in a small circle. */
export function PersonAvatar({ name, url, size = 32 }: { name: string; url?: string | null | undefined; size?: number }) {
  const s = { width: size, height: size };
  if (url) return <img src={url} alt="" style={s} className="shrink-0 rounded-full object-cover" loading="lazy" />;
  const ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
  return <span style={s} className="flex shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-brand-navy">{ini}</span>;
}

const clean = (h: string | null | undefined) => (h ?? "").replace(/^https?:\/\/(www\.)?(tiktok|instagram)\.com\/@?/i, "").replace(/[/?].*$/, "").replace(/^@/, "").trim();
/** TikTok / Instagram handles as links. */
export function HandleLinksInline({ tiktok, instagram }: { tiktok?: string | null; instagram?: string | null }) {
  const t = clean(tiktok); const i = clean(instagram);
  if (!t && !i) return <span className="text-brand-navySoft">—</span>;
  return <span className="flex flex-wrap gap-x-2 text-xs" onClick={(e) => e.stopPropagation()}>
    {t ? <a href={`https://www.tiktok.com/@${t}`} target="_blank" rel="noreferrer" className="font-semibold text-portal-accent hover:underline">TikTok @{t}</a> : null}
    {i ? <a href={`https://www.instagram.com/${i}`} target="_blank" rel="noreferrer" className="font-semibold text-portal-accent hover:underline">IG @{i}</a> : null}
  </span>;
}
