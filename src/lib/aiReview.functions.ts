import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { courseContentHash, type AiReviewRow } from "@/lib/aiReview";
import type { ReferenceCourse } from "@/lib/aiReview.server";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("profiles").select("id, role").eq("user_id", userId).maybeSingle();
  if (!data || data.role !== "admin") throw new Error("forbidden");
  return { supabaseAdmin, profileId: data.id };
}

/**
 * Admin only. Runs the AI first pass over one course and stores the notes against the
 * exact text they were written for, so re-opening the course never re-runs the model.
 * Nothing here changes a course status, notifies the author, or blocks acceptance.
 */
export const runAiReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ courseId: z.string().uuid(), force: z.boolean().optional() }).parse(data))
  .handler(async ({ data, context }): Promise<{ review: AiReviewRow; cached: boolean }> => {
    const { supabaseAdmin, profileId } = await assertAdmin(context.userId);
    const {
      buildSystemPrompt,
      buildUserPrompt,
      callReviewModel,
      measureLength,
      reviewExampleIds,
      reviewModel,
    } = await import("@/lib/aiReview.server");

    const [{ data: course }, { data: screenRows }, { data: sourceRows }] = await Promise.all([
      supabaseAdmin.from("courses").select("id, title, subtitle, brief_note").eq("id", data.courseId).maybeSingle(),
      supabaseAdmin
        .from("screens")
        .select("screen_number, screen_title, body")
        .eq("course_id", data.courseId)
        .order("screen_number"),
      supabaseAdmin.from("sources").select("claim, reference, page").eq("course_id", data.courseId),
    ]);
    if (!course) throw new Error("Course not found.");

    const screens = screenRows ?? [];
    const hash = courseContentHash({ title: course.title, subtitle: course.subtitle, screens });

    if (!data.force) {
      const { data: cached } = await supabaseAdmin
        .from("ai_reviews")
        .select("*")
        .eq("course_id", data.courseId)
        .eq("content_hash", hash)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cached) return { review: cached as unknown as AiReviewRow, cached: true };
    }

    // The reference courses come from the database, so the prompt carries their real text.
    const exampleIds = reviewExampleIds();
    const examples: ReferenceCourse[] = [];
    if (exampleIds.length > 0) {
      const [{ data: exampleCourses }, { data: exampleScreens }] = await Promise.all([
        supabaseAdmin.from("courses").select("id, title, subtitle").in("id", exampleIds),
        supabaseAdmin.from("screens").select("course_id, screen_number, screen_title, body").in("course_id", exampleIds),
      ]);
      for (const item of exampleCourses ?? []) {
        examples.push({
          title: item.title,
          subtitle: item.subtitle,
          screens: (exampleScreens ?? []).filter((screen) => screen.course_id === item.id),
        });
      }
    }

    const judged = await callReviewModel(
      buildSystemPrompt(examples),
      buildUserPrompt({
        title: course.title,
        subtitle: course.subtitle,
        brief: course.brief_note,
        screens,
        sources: sourceRows ?? [],
      }),
    );

    const result = { length: measureLength(screens), ...judged };

    const { data: saved, error } = await supabaseAdmin
      .from("ai_reviews")
      .insert({
        course_id: data.courseId,
        content_hash: hash,
        model: reviewModel(),
        result,
        created_by: profileId,
      })
      .select("*")
      .single();

    if (error) {
      console.error("[ai-review] save error", error);
      throw new Error("The review could not be saved.");
    }

    return { review: saved as unknown as AiReviewRow, cached: false };
  });
