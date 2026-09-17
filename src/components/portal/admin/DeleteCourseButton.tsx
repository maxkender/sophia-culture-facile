import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { deleteCourse } from "@/lib/courses.functions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Deliberately plain and out of the way: a small red text link, never beside the
 * editorial actions. A published course cannot be deleted through this path.
 */
export function DeleteCourseButton({
  courseId,
  title,
  authorName,
  status,
  className,
  redirectTo,
}: {
  courseId: string;
  title: string;
  authorName?: string | null;
  status: string;
  className?: string;
  redirectTo?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const run = useServerFn(deleteCourse);

  const { data: counts } = useQuery({
    enabled: open,
    queryKey: ["portal", "admin", "delete-counts", courseId],
    queryFn: async () => {
      const [{ data: screens }, { count: sources }] = await Promise.all([
        supabase.from("screens").select("body").eq("course_id", courseId),
        supabase.from("sources").select("id", { count: "exact", head: true }).eq("course_id", courseId),
      ]);
      return {
        screens: (screens ?? []).filter((row) => (row.body ?? "").trim().length > 0).length,
        sources: sources ?? 0,
      };
    },
  });

  if (status === "published") {
    return (
      <p className={className ?? "text-xs text-brand-navySoft"}>
        This course is published. It must be unpublished before it can be deleted.
      </p>
    );
  }

  async function confirmDelete() {
    setBusy(true);
    try {
      await run({ data: { courseId } });
      await queryClient.invalidateQueries({ queryKey: ["portal"] });
      toast.success("Course deleted.");
      setOpen(false);
      if (redirectTo) await navigate({ to: redirectTo });
    } catch {
      toast.error("The course could not be deleted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "text-xs font-semibold text-portal-red underline underline-offset-4 hover:opacity-80"}
      >
        Delete course
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{title}” permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              {authorName ? `Author: ${authorName}.` : "No author assigned."} Status: {status.replace("_", " ")}.{" "}
              {counts
                ? `${counts.screens} screen${counts.screens === 1 ? "" : "s"} contain text and there ${
                    counts.sources === 1 ? "is 1 source" : `are ${counts.sources} sources`
                  }.`
                : "Counting screens and sources…"}{" "}
              The course, its screens, sources, message thread, notifications, open-course requests and any AI review
              will be removed. This is permanent and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <button
              type="button"
              disabled={busy}
              onClick={() => void confirmDelete()}
              className="inline-flex h-10 items-center justify-center rounded-full bg-portal-red px-5 text-sm font-bold text-white disabled:opacity-60"
            >
              Delete permanently
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
