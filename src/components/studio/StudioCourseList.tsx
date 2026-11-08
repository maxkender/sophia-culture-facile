import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PortalCard } from "@/components/portal/ui";
import { SL, useStudioLang } from "@/i18n/studio";
import { courseWords, fromRow } from "@/lib/studio/course-format";
import { StudioStatusPill } from "./editor/StudioEditor";

const k = () => Math.random().toString(36).slice(2, 10);

/** Sophia Studio (V2) courses on "My courses", with the "New course" action. */
export function StudioCourseList({ profileId, writingLang }: { profileId: string; writingLang: string | null }) {
  useStudioLang(writingLang);
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const { data: rows = [] } = useQuery({
    queryKey: ["studio", "my-courses", profileId],
    queryFn: async () => {
      const { data, error } = await supabase.from("studio_courses").select("*").eq("author_id", profileId).order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function create() {
    setCreating(true);
    const lang = writingLang && /^[a-z]{2}(-[A-Z]{2})?$/.test(writingLang) ? writingLang : "fr";
    const { data, error } = await supabase
      .from("studio_courses")
      .insert({
        author_id: profileId,
        origin_lang: lang,
        sections: [
          { _key: k(), title: "Introduction", blocks: [{ _key: k(), type: "paragraph", text: "" }] },
          { _key: k(), title: "", blocks: [{ _key: k(), type: "paragraph", text: "" }, { _key: k(), type: "takeaway", text: "" }] },
        ],
      })
      .select("id")
      .single();
    setCreating(false);
    if (error || !data) {
      toast.error(SL("The course could not be created. Please try again.", "Le cours n'a pas pu être créé. Réessayez."));
      return;
    }
    void navigate({ to: "/auteurs/studio/$id", params: { id: data.id } });
  }

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-brand-navy">Sophia Studio</h2>
        <Button size="pillSm" onClick={() => void create()} disabled={creating}><Plus className="size-4" />{SL("New course", "Nouveau cours")}</Button>
      </div>
      {rows.length === 0 ? (
        <PortalCard className="p-5 text-sm text-brand-navySoft">{SL("Write your first course in the app's format: sections, images, a timeline, a key takeaway.", "Écrivez votre premier cours au format de l'app : sections, images, frise, « À retenir ».")}</PortalCard>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((r) => {
            const c = fromRow(r, k);
            return (
              <Link key={r.id} to="/auteurs/studio/$id" params={{ id: r.id }} className="block">
                <PortalCard className="p-5 transition hover:shadow-lg">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-portal-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase text-portal-accent">Sophia Studio</span>
                    <StudioStatusPill status={r.status} />
                  </div>
                  <p className="font-bold text-brand-navy">{r.title || SL("Untitled course", "Cours sans titre")}</p>
                  <p className="mt-1 text-xs text-brand-navySoft">{SL(`${c.sections.length} sections · ${courseWords(c)} words`, `${c.sections.length} sections · ${courseWords(c)} mots`)}</p>
                </PortalCard>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
