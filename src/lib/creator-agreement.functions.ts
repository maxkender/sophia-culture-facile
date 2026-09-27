import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function requestMeta(userAgent?: string) {
  const headers = getRequest()?.headers;
  const forwarded = headers?.get("x-forwarded-for") ?? "";
  const ip = headers?.get("cf-connecting-ip") ?? (forwarded ? forwarded.split(",")[0]?.trim() : null) ?? null;
  return { ip, ua: userAgent ?? headers?.get("user-agent") ?? null };
}

const signInput = z.object({
  signedName: z.string().trim().min(2).max(160),
  documentVersion: z.string().min(1).max(40),
  userAgent: z.string().max(400).optional(),
});

async function currentVersion(admin: any) {
  const { data } = await admin.from("documents").select("current_version, published").eq("slug", "creator-agreement").maybeSingle();
  if (!data?.published) throw new Error("The agreement is not published yet.");
  return String(data.current_version);
}

// UGC creator signs inside their creator space.
export const signCreatorAgreement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => signInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { data: creator } = await supabase.from("creators").select("id, track").eq("user_id", userId).maybeSingle();
    if (!creator) throw new Error("Not a creator");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const version = await currentVersion(supabaseAdmin);
    if (version !== data.documentVersion) throw new Error("A new version was published. Reload the page.");
    const { data: existing } = await supabaseAdmin.from("creator_signatures").select("signed_at").eq("creator_id", creator.id).maybeSingle();
    if (existing) return { alreadySigned: true };
    const { ip, ua } = requestMeta(data.userAgent);
    const { error } = await supabaseAdmin.from("creator_signatures").insert({
      creator_id: creator.id,
      variant: creator.track === "slideshow" ? "slideshow" : "ugc",
      document_version: version,
      signed_name: data.signedName,
      signature_ip: ip,
      user_agent: ua,
    });
    if (error) throw new Error("The signature could not be recorded.");
    return { alreadySigned: false };
  });

// Onboarding steps 1 and 2 for UGC creators.
export const markCreatorStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ step: z.enum(["examples", "guide"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", userId).maybeSingle();
    if (!creator) throw new Error("Not a creator");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const col = data.step === "examples" ? "examples_read_at" : "guide_read_at";
    await supabaseAdmin.from("creators").update({ [col]: new Date().toISOString() }).eq("id", creator.id).is(col, null);
    return { ok: true };
  });

// Public: load the slideshow signing page from its single-use token.
export const getSigningPage = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(20).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app } = await supabaseAdmin
      .from("slideshow_applications")
      .select("full_name, country, email, status")
      .eq("signing_token", data.token)
      .maybeSingle();
    if (!app || app.status !== "approved") return { state: "invalid" as const };
    const { data: doc } = await supabaseAdmin.from("documents").select("title, content, current_version, published").eq("slug", "creator-agreement").maybeSingle();
    if (!doc?.published) return { state: "unpublished" as const };
    return {
      state: "ready" as const,
      name: app.full_name,
      country: app.country,
      email: app.email,
      title: doc.title,
      content: doc.content,
      version: String(doc.current_version),
    };
  });

// Public: sign with the token. The token dies on use.
export const signWithToken = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => signInput.extend({ token: z.string().min(20).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app } = await supabaseAdmin
      .from("slideshow_applications")
      .select("id, status")
      .eq("signing_token", data.token)
      .maybeSingle();
    if (!app || app.status !== "approved") throw new Error("This link is no longer valid.");
    const version = await currentVersion(supabaseAdmin);
    if (version !== data.documentVersion) throw new Error("A new version was published. Reload the page.");
    const { ip, ua } = requestMeta(data.userAgent);
    const { error } = await supabaseAdmin.from("creator_signatures").insert({
      slideshow_application_id: app.id,
      variant: "slideshow",
      document_version: version,
      signed_name: data.signedName,
      signature_ip: ip,
      user_agent: ua,
    });
    if (error) throw new Error("This agreement has already been signed.");
    await supabaseAdmin
      .from("slideshow_applications")
      .update({ signing_token: null, agreement_signed_at: new Date().toISOString() })
      .eq("id", app.id);
    return { ok: true };
  });

// Admin: create (or replace) the single-use signing link for an accepted slideshow application.
export const generateSigningLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ applicationId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { data: me } = await supabase.from("profiles").select("role").eq("user_id", userId).maybeSingle();
    if (me?.role !== "admin") throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app } = await supabaseAdmin.from("slideshow_applications").select("status, agreement_signed_at").eq("id", data.applicationId).maybeSingle();
    if (!app || app.status !== "approved") throw new Error("Accept the application first.");
    if (app.agreement_signed_at) throw new Error("Already signed.");
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    await supabaseAdmin
      .from("slideshow_applications")
      .update({ signing_token: token, signing_token_created_at: new Date().toISOString() })
      .eq("id", data.applicationId);
    return { token };
  });
