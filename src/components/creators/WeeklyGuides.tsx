import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { t as ct } from "@/i18n/creator-app";

type Media = { id: string; url: string | null; file_path: string | null; caption: string | null; signed?: string | null };
type Guide = { id: string; week_start: string; title: string; body: string; creator_guide_media: Media[] };

export function WeeklyGuides() {
  const { data } = useQuery({
    queryKey: ["creator", "weekly-guides"],
    queryFn: async () => {
      const rows = ((await supabase.from("creator_weekly_guides").select("id, week_start, title, body, creator_guide_media(*)").order("week_start", { ascending: false })).data ?? []) as Guide[];
      for (const g of rows) {
        for (const m of g.creator_guide_media) {
          if (m.file_path) m.signed = (await supabase.storage.from("guide-media").createSignedUrl(m.file_path, 3600)).data?.signedUrl ?? null;
        }
      }
      return rows;
    },
  });
  const guides = data ?? [];
  return (
    <section className="space-y-2">
      <h2 className="font-bold text-brand-navy">{ct("Weekly guides")}</h2>
      {guides.length === 0 && <p className="text-sm text-brand-navySoft">{ct("No weekly guide yet.")}</p>}
      {guides.map((g, i) => (
        <details key={g.id} open={i === 0} className="rounded-2xl border border-brand-line p-4">
          <summary className="cursor-pointer font-semibold text-brand-navy">Week of {g.week_start} — {g.title}</summary>
          <p className="mt-2 whitespace-pre-wrap text-sm">{g.body}</p>
          <div className="mt-3 space-y-3">
            {g.creator_guide_media.map((m) =>
              {ct("m.file_path ? (")}
                <figure key={m.id}>
                  {m.signed && <video src={m.signed} controls preload="metadata" className="w-full max-w-sm rounded-xl" />}
                  {m.caption && <figcaption className="text-xs text-brand-navySoft">{m.caption}</figcaption>}
                </figure>
              ) : (
                <a key={m.id} href={m.url ?? "#"} target="_blank" rel="noopener noreferrer" className="block text-sm font-semibold text-portal-accent">
                  {m.caption ?? m.url}
                </a>
              ),
            )}
          </div>
        </details>
      ))}
    </section>
  );
}
