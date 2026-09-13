import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const acceptInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ token: z.string().min(4).max(200) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, user_id, activated_at")
      .eq("invite_token", data.token)
      .maybeSingle();

    if (!profile) return { ok: false as const, reason: "invalid" as const };

    const claimEmail = String((context.claims as Record<string, unknown>)["email"] ?? "").toLowerCase();
    if (profile.email.toLowerCase() !== claimEmail) {
      return { ok: false as const, reason: "email" as const, expected: profile.email };
    }
    if (profile.user_id && profile.user_id !== context.userId) {
      return { ok: false as const, reason: "taken" as const };
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        user_id: context.userId,
        activated_at: profile.activated_at ?? new Date().toISOString(),
      })
      .eq("id", profile.id);
    if (error) throw new Error("The invite could not be activated.");
    return { ok: true as const };
  });

export const signAgreement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        signedName: z.string().min(2).max(160),
        documentVersion: z.string().min(1).max(40),
        userAgent: z.string().max(400).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const request = getRequest();
    const headers = request?.headers;
    const forwarded = headers?.get("x-forwarded-for") ?? "";
    const ip =
      headers?.get("cf-connecting-ip") ?? (forwarded ? forwarded.split(",")[0]?.trim() : null) ?? null;
    const userAgent = data.userAgent ?? headers?.get("user-agent") ?? null;

    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (profileError || !profile) throw new Error("No author record is linked to this account.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contracts").insert({
      author_id: profile.id,
      document_version: data.documentVersion,
      signed_name: data.signedName,
      signature_ip: ip,
      user_agent: userAgent,
    });
    if (error) throw new Error("The signature could not be recorded.");
    return { ok: true as const, signedAt: new Date().toISOString() };
  });
