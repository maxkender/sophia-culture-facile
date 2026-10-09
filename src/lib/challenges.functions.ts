import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Picks the weekly challenge winner: closes the challenge, adds the reward as a payout line, awards "Challenge winner" and notifies the creator. */
export const pickChallengeWinner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ challengeId: z.string().uuid(), postId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as { supabase: Admin; userId: string };
    const { data: me } = await ctx.supabase.from("profiles").select("id, role").eq("user_id", ctx.userId).maybeSingle();
    if (me?.role !== "admin") throw new Error("Admins only");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const a = supabaseAdmin as Admin;
    const { data: ch } = await a.from("challenges").select("*").eq("id", data.challengeId).maybeSingle();
    if (!ch) throw new Error("Challenge not found");
    if (ch.winner_post_id) throw new Error("A winner was already picked for this challenge.");
    const { data: post } = await a.from("creator_posts").select("id, creator_id, app_id").eq("id", data.postId).maybeSingle();
    if (!post) throw new Error("Post not found");
    const period = new Date().toISOString().slice(0, 7);
    await a.from("challenges").update({ winner_post_id: post.id, winner_creator_id: post.creator_id, status: "closed" }).eq("id", ch.id);
    if (Number(ch.reward_eur) > 0) await a.from("payout_adjustments").insert({ creator_id: post.creator_id, period, amount: Number(ch.reward_eur), reason: `Challenge winner: ${ch.title}`, created_by: me.id });
    await a.from("awards").insert({ creator_id: post.creator_id, kind: "challenge_winner", period: `${period}:${ch.id.slice(0, 8)}` });
    await a.from("creator_notifications").insert({ creator_id: post.creator_id, body: `You won the challenge "${ch.title}"${Number(ch.reward_eur) > 0 ? ` — ${ch.reward_eur} € added to your next payout` : ""}. Well done!` });
    return { ok: true };
  });
