import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { Course } from "@/lib/portal";
import { usePortalProfile } from "../usePortal";
import { PortalCard } from "../ui";

/**
 * Publication publique d'un cours. Jamais automatique : l'admin confirme,
 * et peut restreindre la page publique au premier écran.
 */
export function PublishControls({ course }: { course: Course }) {
  const queryClient = useQueryClient();
  const { data: me } = usePortalProfile();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const published = course.status === "published";
  const publicUrl = course.slug ? `/cours/${course.slug}` : null;

  async function log(action: string, comment: string) {
    await supabase.from("activity_log").insert({
      actor_id: me?.profile?.id ?? null,
      entity: "course",
      entity_id: course.id,
      action,
      comment,
    });
  }

  async function publish() {
    setBusy(true);
    const slug = course.slug ?? null;
    const { error } = await supabase
      .from("courses")
      .update({
        status: "published",
        published_at: course.published_at ?? new Date().toISOString(),
        ...(slug ? {} : { slug: slugify(course.title) }),
      })
      .eq("id", course.id);
    setBusy(false);
    setConfirming(false);
    if (error) {
      toast.error("The course could not be published.");
      return;
    }
    await log("published", "Course made publicly visible");
    await queryClient.invalidateQueries({ queryKey: ["portal"] });
    toast.success("The course is now public.");
  }

  async function unpublish() {
    setBusy(true);
    const { error } = await supabase.from("courses").update({ status: "accepted" }).eq("id", course.id);
    setBusy(false);
    if (error) {
      toast.error("The course could not be unpublished.");
      return;
    }
    await log("unpublished", "Public page removed");
    await queryClient.invalidateQueries({ queryKey: ["portal"] });
    toast.success("The course is no longer public.");
  }

  async function toggleFullText(value: boolean) {
    const { error } = await supabase.from("courses").update({ public_full_text: value }).eq("id", course.id);
    if (error) {
      toast.error("The setting could not be saved.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["portal"] });
  }

  if (course.status !== "accepted" && !published) {
    return (
      <PortalCard>
        <h2 className="text-sm font-bold text-brand-navy">Publication</h2>
        <p className="mt-2 text-sm text-brand-navySoft">
          A course can only be published once it has been accepted.
        </p>
      </PortalCard>
    );
  }

  return (
    <PortalCard>
      <h2 className="text-sm font-bold text-brand-navy">Publication</h2>
      <p className="mt-2 text-sm text-brand-navySoft">
        {published ? (
          <>
            Public since {new Date(course.published_at ?? Date.now()).toLocaleDateString("en-GB")}.{" "}
            {publicUrl ? (
              <a href={publicUrl} target="_blank" rel="noreferrer" className="font-semibold text-portal-accent">
                View the public page
              </a>
            ) : null}
          </>
        ) : (
          "This course is accepted but not visible to the public."
        )}
      </p>

      <div className="mt-5 flex items-start justify-between gap-4 rounded-2xl bg-brand-surface p-4">
        <div>
          <p className="text-sm font-bold text-brand-navy">Publish the full text</p>
          <p className="mt-1 text-xs text-brand-navySoft">
            Off: the public page shows only the first screen and the app download block.
          </p>
        </div>
        <Switch
          checked={course.public_full_text}
          onCheckedChange={toggleFullText}
          aria-label="Publish the full text publicly"
        />
      </div>

      {published ? (
        <Button type="button" variant="pillSecondary" size="pillSm" className="mt-5" disabled={busy} onClick={unpublish}>
          Unpublish
        </Button>
      ) : confirming ? (
        <div className="mt-5 rounded-2xl border border-portal-amber/40 bg-portal-amber/10 p-4">
          <p className="text-sm font-semibold text-brand-navy">
            This course will become publicly visible at /cours/{course.slug ?? slugify(course.title)} and indexable
            by search engines, with the author's byline.
          </p>
          <div className="mt-4 flex gap-3">
            <Button type="button" variant="pill" size="pillSm" disabled={busy} onClick={publish}>
              Yes, publish it
            </Button>
            <Button type="button" variant="pillSecondary" size="pillSm" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="pill" size="pillSm" className="mt-5" onClick={() => setConfirming(true)}>
          Publish publicly
        </Button>
      )}
    </PortalCard>
  );
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
