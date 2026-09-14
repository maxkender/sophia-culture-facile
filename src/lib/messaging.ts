import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

/** Returns the id of the author's general or per-course thread, creating it if needed. */
export async function openConversation(profileId: string, courseId: string | null): Promise<string> {
  const query = supabase.from("conversations").select("id").eq("profile_id", profileId);
  const { data: existing } = await (courseId ? query.eq("course_id", courseId) : query.is("course_id", null))
    .limit(1)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ profile_id: profileId, course_id: courseId })
    .select("id")
    .single();
  if (!error) return created.id;

  // Another tab or a double render created it first: read it back.
  const retry = supabase.from("conversations").select("id").eq("profile_id", profileId);
  const { data: raced } = await (courseId ? retry.eq("course_id", courseId) : retry.is("course_id", null))
    .limit(1)
    .maybeSingle();
  if (raced?.id) return raced.id;
  throw error;
}

export async function markConversationRead(conversationId: string, isAdmin: boolean) {
  await supabase
    .from("conversations")
    .update(isAdmin ? { admin_unread: 0 } : { author_unread: 0 })
    .eq("id", conversationId);
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body });
  if (error) throw error;
}

export function formatMessageTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Announcements that are live now for this author and not yet read. */
export function isAnnouncementLive(announcement: Announcement, now = new Date()): boolean {
  const started = !announcement.starts_at || new Date(announcement.starts_at) <= now;
  const ended = announcement.ends_at ? new Date(announcement.ends_at) < now : false;
  return started && !ended;
}

export function targetsProfile(announcement: Announcement, profileId: string): boolean {
  if (announcement.audience === "all") return true;
  return (announcement.target_profile_ids ?? []).includes(profileId);
}
