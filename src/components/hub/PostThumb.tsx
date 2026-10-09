import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { cn } from "@/lib/utils";
import { postThumbnail } from "@/lib/hub.functions";

/** Post thumbnail from TikTok oEmbed; plain block when none is available. */
export function PostThumb({ url, className }: { url: string | null | undefined; className?: string }) {
  const fn = useServerFn(postThumbnail);
  const { data } = useQuery({ queryKey: ["oembed", url], enabled: Boolean(url), staleTime: 6 * 3600_000, queryFn: () => fn({ data: url! }) });
  if (!data?.thumb) return <div className={cn("bg-gradient-to-b from-brand-navy/40 to-brand-navy", className)} aria-hidden="true" />;
  return <img src={data.thumb} alt={data.title ?? ""} loading="lazy" className={cn("object-cover", className)} />;
}
