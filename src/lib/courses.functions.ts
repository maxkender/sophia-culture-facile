import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("profiles").select("id, role, full_name").eq("user_id", userId).maybeSingle();
  if (!data || data.role !== "admin") throw new Error("forbidden");
  return { supabaseAdmin, profileId: data.id, fullName: data.full_name };
}

/**
 * Permanent deletion of one course and everything attached to it. Admin only, and never
 * for a published course: the public page must be taken down first, deliberately.
 * The activity log keeps a trace of what was removed, by whom.
 */
export const deleteCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ courseId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { supabaseAdmin, profileId } = await assertAdmin(context.userId);
    const courseId = data.courseId;

    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("id, title, status, author_id")
      .eq("id", courseId)
      .maybeSingle();
    if (!course) throw new Error("Course not found.");
    if (course.status === "published") throw new Error("A published course must be unpublished first.");

    let authorName = "no author";
    if (course.author_id) {
      const { data: author } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", course.author_id)
        .maybeSingle();
      authorName = author?.full_name ?? "unknown author";
    }

    // Conversations carry messages, so they go first.
    const { data: conversations } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .eq("course_id", courseId);
    const conversationIds = (conversations ?? []).map((row) => row.id);
    if (conversationIds.length > 0) {
      await supabaseAdmin.from("messages").delete().in("conversation_id", conversationIds);
      await supabaseAdmin.from("conversations").delete().in("id", conversationIds);
    }

    await Promise.all([
      supabaseAdmin.from("ai_reviews").delete().eq("course_id", courseId),
      supabaseAdmin.from("notifications").delete().eq("course_id", courseId),
      supabaseAdmin.from("course_requests").delete().eq("course_id", courseId),
      supabaseAdmin.from("sources").delete().eq("course_id", courseId),
      supabaseAdmin.from("screens").delete().eq("course_id", courseId),
    ]);

    const { error } = await supabaseAdmin.from("courses").delete().eq("id", courseId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("activity_log").insert({
      actor_id: profileId,
      entity: "course",
      entity_id: courseId,
      action: "deleted",
      comment: `Deleted "${course.title}" (${authorName}), status at deletion: ${course.status}.`,
    });

    return { ok: true };
  });
