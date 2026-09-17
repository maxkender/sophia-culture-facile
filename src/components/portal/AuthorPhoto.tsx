import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/** Signed URLs for a batch of author photo paths. Admins may read every path. */
export function useSignedPhotos(paths: (string | null | undefined)[]) {
  const list = Array.from(new Set(paths.filter(Boolean) as string[])).sort();
  const key = list.join("|");
  return useQuery({
    queryKey: ["portal", "photo-urls", key],
    enabled: list.length > 0,
    staleTime: 20 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.storage.from("author-photos").createSignedUrls(list, 1800);
      const map = new Map<string, string>();
      for (const row of data ?? []) if (row.path && row.signedUrl) map.set(row.path, row.signedUrl);
      return map;
    },
  });
}

export function initialsOf(name: string | null | undefined) {
  return (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

/** Round portrait, falling back to initials on a muted background. */
export function AuthorAvatar({
  url,
  name,
  className,
}: {
  url?: string | null | undefined;
  name?: string | null | undefined;
  className?: string | undefined;
}) {
  const box = cn("shrink-0 rounded-full object-cover", className ?? "size-10");
  if (url) return <img src={url} alt="" loading="lazy" decoding="async" className={box} />;
  return (
    <span
      aria-hidden="true"
      className={cn(
        box,
        "grid place-items-center bg-brand-surfaceStrong text-xs font-extrabold text-brand-navySoft",
      )}
    >
      {initialsOf(name) || "·"}
    </span>
  );
}
