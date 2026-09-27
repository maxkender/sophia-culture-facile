import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Links the signed-in account to a creator invite (email must match). */
export const claimCreatorInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: z.string().min(10).max(100) }).parse(d))
  .handler(async ({ data, context }) => {
    const email = String((context.claims as { email?: string }).email ?? "").toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("creators")
      .select("id, email, user_id")
      .eq("invite_token", data.token)
      .maybeSingle();
    if (!row) return { ok: false, error: "This invite link is not valid." };
    if (row.user_id && row.user_id !== context.userId) return { ok: false, error: "This invite was already used." };
    if (row.email.toLowerCase() !== email) return { ok: false, error: "Sign in with the email this invite was sent to." };
    const { error } = await supabaseAdmin
      .from("creators")
      .update({ user_id: context.userId, status: "onboarding" })
      .eq("id", row.id);
    if (error) return { ok: false, error: "Could not activate your account." };
    return { ok: true, error: null };
  });
