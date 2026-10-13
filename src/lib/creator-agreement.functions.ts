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
    const { data: creator } = await supabase.from("creators").select("id, track, resign_required_at").eq("user_id", userId).maybeSingle();
    if (!creator) throw new Error("Not a creator");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const version = await currentVersion(supabaseAdmin);
    if (version !== data.documentVersion) throw new Error("A new version was published. Reload the page.");
    const { data: existing } = await supabaseAdmin.from("creator_signatures").select("id, signed_at, document_version, signed_name").eq("creator_id", creator.id).maybeSingle();
    const { ip, ua } = requestMeta(data.userAgent);
    if (existing) {
      if (!creator.resign_required_at || Number(existing.document_version) >= Number(version)) return { alreadySigned: true };
      // Re-signature: keep the old signature on record, then replace it with the new version.
      await supabaseAdmin.from("activity_log").insert({ actor_id: null, entity: "creator", entity_id: creator.id, action: "agreement_resigned", comment: `v${existing.document_version} signed ${existing.signed_at} by ${existing.signed_name} → v${version}` });
      const { error } = await supabaseAdmin.from("creator_signatures").update({ document_version: version, signed_name: data.signedName, signature_ip: ip, user_agent: ua, signed_at: new Date().toISOString() }).eq("id", existing.id);
      if (error) throw new Error("The signature could not be recorded.");
      await supabaseAdmin.from("creators").update({ resign_required_at: null }).eq("id", creator.id);
      return { alreadySigned: false };
    }
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

// Creator motivation/examples confirmation.
export const markCreatorStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ step: z.literal("examples"), motivated: z.literal(true) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", userId).maybeSingle();
    if (!creator) throw new Error("Not a creator");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    await supabaseAdmin.from("creators").update({ examples_read_at: now, motivation_confirmed_at: now, status: "onboarding" }).eq("id", creator.id);
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
    if (!app) {
      const { data: signed } = await supabaseAdmin.from("slideshow_applications").select("status").eq("guide_token", data.token).maybeSingle();
      return signed && ["approved", "contract_signed", "os_created", "started"].includes(signed.status) ? { state: "signed" as const } : { state: "invalid" as const };
    }
    if (!["approved", "accepted"].includes(app.status)) return { state: "invalid" as const };
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
    if (!app || !["approved", "accepted"].includes(app.status)) throw new Error("This link is no longer valid.");
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
      .update({ signing_token: null, guide_token: data.token, agreement_signed_at: new Date().toISOString() })
      .eq("id", app.id);
    if (app.status === "accepted") {
      // New flow: contract signed → create the poster in the OS (failures stay on the card with Retry).
      const now = new Date().toISOString();
      const { data: cur } = await supabaseAdmin.from("slideshow_applications").select("timeline").eq("id", app.id).maybeSingle();
      await supabaseAdmin.from("slideshow_applications").update({ status: "contract_signed", contract_signed_at: now, timeline: { ...((cur?.timeline as object) ?? {}), contract_signed: { at: now, by: "Poster" } } }).eq("id", app.id);
      // OS link is dormant: the flow stops here and Max ticks the manual checklist (create OS account, send logins, add to Slack).
      // No OS call, regardless of environment settings.
    }
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

/* ---------- UGC Creator Agreement (ugc-agreement / ugc-agreement-fr) ---------- */
export const UGC_AGREEMENT_SLUGS = ["ugc-agreement", "ugc-agreement-fr"] as const;

export const signUgcAgreement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    signedName: z.string().trim().min(2).max(160),
    lang: z.enum(["fr", "en"]),
    accepted: z.literal(true),
    userAgent: z.string().max(400).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { data: creator } = await supabase.from("creators").select("id, track, status, country, email").eq("user_id", userId).maybeSingle();
    if (!creator || creator.track !== "ugc") throw new Error("Not a UGC creator");
    if (creator.status === "pending") throw new Error("Your application is still being reviewed.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const slug = data.lang === "fr" ? "ugc-agreement-fr" : "ugc-agreement";
    const { data: doc } = await supabaseAdmin.from("documents").select("title, content, current_version, published").eq("slug", slug).maybeSingle();
    if (!doc?.published) throw new Error("The agreement is not published yet.");
    const { data: existing } = await supabaseAdmin.from("creator_signatures").select("id").eq("creator_id", creator.id).in("document_slug", UGC_AGREEMENT_SLUGS as unknown as string[]).limit(1);
    if (existing?.length) return { alreadySigned: true };
    const { parseBlocks, applyMerge, documentPlainText } = await import("./documents");
    const blocks = applyMerge(parseBlocks(doc.content), { legal_name: data.signedName, country: creator.country, email: creator.email } as never);
    const { ip, ua } = requestMeta(data.userAgent);
    const now = new Date().toISOString();
    const snapshot = `${documentPlainText(doc.title, blocks)}\n\n${data.lang === "fr" ? "Signé par" : "Signed by"}: ${data.signedName}\n${data.lang === "fr" ? "Date" : "Date"}: ${now}\n${data.lang === "fr" ? "Version" : "Version"}: ${doc.current_version} (${data.lang.toUpperCase()})`;
    const { error } = await supabaseAdmin.from("creator_signatures").insert({
      creator_id: creator.id, variant: "ugc", document_version: String(doc.current_version), document_slug: slug, contract_lang: data.lang,
      contract_snapshot: snapshot, signed_name: data.signedName, signature_ip: ip, user_agent: ua, signed_at: now,
    });
    if (error) throw new Error("The signature could not be recorded.");
    await supabaseAdmin.from("creators").update({ resign_required_at: null }).eq("id", creator.id);
    return { alreadySigned: false };
  });

/** First-login step after the contract: "Got it" on the shooting guidelines. */
export const acceptUgcGuidelines = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", userId).maybeSingle();
    if (!creator) throw new Error("Not a creator");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("creators").update({ guidelines_accepted_at: new Date().toISOString() }).eq("id", creator.id);
    return { ok: true };
  });
