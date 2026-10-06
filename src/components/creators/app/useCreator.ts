import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { creatorSteps } from "@/lib/creator-steps";

export const CREATOR_KEY = ["creator-space"] as const;

export async function loadCreator() {
  const { data: me } = await supabase.from("creators").select("*").maybeSingle();
  if (!me) return null;
  const [enrol, codes] = await Promise.all([
    supabase.from("creator_apps").select("app_id, status").eq("creator_id", me.id),
    supabase.from("access_codes").select("code, redeem_url, platform, app_id").eq("assigned_creator_id", me.id),
  ]);
  const apps = (enrol.data ?? []).filter((e) => e.status === "active").map((e) => e.app_id);
  const [briefs, reads, posts, calls, rsvps, refs, payoutProfile, payoutItems, signature, notes, messages, rulesDoc] = await Promise.all([
    supabase.from("briefs").select("*").eq("status", "published").order("created_at", { ascending: false }),
    supabase.from("brief_reads").select("*").eq("creator_id", me.id),
    supabase.from("creator_posts").select("*").order("posted_on", { ascending: false }),
    supabase.from("creator_calls").select("*").order("starts_at", { ascending: false }),
    supabase.from("creator_call_rsvps").select("*").eq("creator_id", me.id),
    supabase.from("reference_videos").select("*").eq("active", true).order("pinned", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("creator_payout_profiles").select("*").eq("creator_id", me.id).maybeSingle(),
    supabase.from("payout_items").select("*, payout_batches(period, status, paid_at)").eq("creator_id", me.id).order("created_at", { ascending: false }),
    supabase.from("creator_signatures").select("signed_at, variant, document_version").eq("creator_id", me.id).maybeSingle(),
    supabase.from("creator_notifications").select("*").order("created_at", { ascending: false }).limit(30),
    supabase.from("creator_messages").select("id, from_admin, read_at, post_id").eq("creator_id", me.id),
    supabase.from("documents").select("current_version").eq("slug", "creator-rules").maybeSingle(),
  ]);
  return {
    me,
    signature: signature.data ?? null,
    briefs: briefs.data ?? [],
    reads: reads.data ?? [],
    posts: posts.data ?? [],
    calls: calls.data ?? [],
    rsvps: rsvps.data ?? [],
    refs: (refs.data ?? []).filter((r) => apps.includes(r.app_id)),
    enrolledApps: apps,
    codes: codes.data ?? [],
    payoutProfile: payoutProfile.data ?? null,
    payoutItems: payoutItems.data ?? [],
    notes: notes.data ?? [],
    messages: messages.data ?? [],
    rulesVersion: rulesDoc.data?.current_version ?? 1,
  };
}

export type CreatorData = NonNullable<Awaited<ReturnType<typeof loadCreator>>>;

export function useCreatorQuery() {
  return useQuery({ queryKey: CREATOR_KEY, queryFn: loadCreator, refetchInterval: 60_000 });
}

/** Only call inside the creator app layout, where data is guaranteed loaded. */
export function useCreator() {
  const { data } = useCreatorQuery();
  const qc = useQueryClient();
  const d = data as CreatorData;
  const steps = creatorSteps(d.me, Boolean(d.signature), d.payoutProfile, d.signature?.document_version);
  const now = Date.now();
  const counts = {
    briefs: d.briefs.filter((b) => !d.reads.some((r) => r.brief_id === b.id)).length,
    posts: d.posts.filter((p) => p.status === "flagged").length,
    calls: d.calls.filter((c) => new Date(c.starts_at).getTime() > now).length,
    messages: d.messages.filter((m) => m.from_admin && !m.read_at).length,
  };
  return { ...d, steps, counts, reload: () => qc.invalidateQueries({ queryKey: CREATOR_KEY }) };
}

export function briefStatus(d: CreatorData, briefId: string): "new" | "seen" | "posted" | "skipped" {
  if (d.posts.some((p) => p.brief_id === briefId)) return "posted";
  const r = d.reads.find((x) => x.brief_id === briefId);
  if (!r) return "new";
  return r.skipped_at ? "skipped" : "seen";
}

export function weekStart() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export async function fileToBase64(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  let s = "";
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}

export const TAAP_LINK = "https://taap.it/sophia.culture";

export const CATEGORY_LEGEND: Record<string, { label: string; line: string }> = {
  direct_competitor: { label: "Direct competitor", line: "Same product as ours. Copy the format, swap in Sophia." },
  adjacent_niche: { label: "Adjacent niche", line: "Close to us. Adapt the angle to Sophia." },
  adapt_content: { label: "Content to adapt", line: "The subject is what matters. Make it a Sophia video." },
  format_inspiration: { label: "Format inspiration", line: "Nothing to do with our subject. Steal the format." },
};
