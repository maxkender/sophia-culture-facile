import { platformName, platformRightsNote } from "./apps";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { deliverableLabel, parseDeliverables, RIGHTS, RIGHTS_LABEL, type Rights } from "@/lib/influencer-deals";

type Ctx = { supabase: any; userId: string };
async function db() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin as any;
}
async function adminProfile(context: Ctx) {
  const { data } = await context.supabase.from("profiles").select("id, role").eq("user_id", context.userId).maybeSingle();
  if (data?.role !== "admin") throw new Error("Forbidden");
  return data.id as string;
}
async function meInfluencer(context: Ctx) {
  const { data } = await context.supabase.from("influencers").select("*").eq("user_id", context.userId).maybeSingle();
  if (!data) throw new Error("No influencer account is linked to this login.");
  return data;
}
async function notify(influencerId: string, body: string) {
  const a = await db();
  await a.from("influencer_messages").insert({ influencer_id: influencerId, from_admin: true, body });
}
function ipUa() {
  const h = getRequest()?.headers;
  return {
    ip: h?.get("cf-connecting-ip") ?? h?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    ua: h?.get("user-agent") ?? null,
  };
}

/** Builds the deal, its deliverable rows and the Deal Sheet snapshot from an accepted offer. */
async function createDeal(offerId: string, agreedPrice: number) {
  const a = await db();
  const { data: offer } = await a.from("influencer_offers").select("*").eq("id", offerId).single();
  const [{ data: brief }, { data: inf }, { data: settings }, { data: master }] = await Promise.all([
    a.from("influencer_briefs").select("*").eq("id", offer.brief_id).single(),
    a.from("influencers").select("*").eq("id", offer.influencer_id).single(),
    a.from("influencer_settings").select("disclosure").eq("id", 1).maybeSingle(),
    a.from("documents").select("current_version").eq("slug", "influencer-agreement").maybeSingle(),
  ]);
  const deliverables = parseDeliverables(offer.deliverables);
  const rights = offer.rights_package as Rights;
  const country = String(inf.country ?? "").toUpperCase();
  const disclosureMap = (settings?.disclosure ?? {}) as Record<string, string>;
  const code = country.length === 2 ? country : country.startsWith("FRANCE") ? "FR" : country;
  const snapshot = {
    influencer_name: inf.legal_name || inf.display_name,
    agency: inf.agency_name ?? null,
    brief_title: brief.title,
    brief_type: brief.brief_type,
    brief_text: brief.body,
    angle: brief.angle,
    deliverables: deliverables.map(deliverableLabel),
    must_mention: brief.must_mention,
    draft_approval_required: brief.draft_approval_required,
    earliest_post_date: brief.earliest_post_date,
    latest_post_date: offer.deadline ?? brief.latest_post_date,
    agreed_price: agreedPrice,
    currency: "EUR",
    split: offer.split_payment ? "50% on acceptance, 50% on posting" : null,
    rights_package: rights,
    rights_text: `${RIGHTS_LABEL[rights].plain}${RIGHTS_LABEL[rights].days ? ` Duration: ${RIGHTS_LABEL[rights].days} days from publication.` : ""} Territory: worldwide.`,
    exclusivity: brief.exclusivity_days > 0 ? `${brief.exclusivity_days} days, in the general-knowledge and learning app category.` : null,
    disclosure: (() => {
      const plats = [...new Set(deliverables.map((d) => platformName(d.platform)))];
      const pick = (c: string, p: string) => disclosureMap[`${c}|${p}`] ?? disclosureMap[`${c}|All`] ?? disclosureMap[c];
      const lines = plats.map((p) => { const t = pick(code, p) ?? pick("FR", p); return t ? `${p}: ${t}` : null; }).filter(Boolean);
      return lines.length ? lines.join(" ") : "Disclose the partnership as the law of your country requires.";
    })(),
    platform_rights: [...new Set(deliverables.map((d) => platformRightsNote(d.platform)).filter(Boolean))].join(" "),
    app_id: brief.app_id,
    master_agreement_version: String(master?.current_version ?? "1"),
    generated_at: new Date().toISOString(),
  };
  const { data: deal, error } = await a
    .from("influencer_deals")
    .insert({
      offer_id: offer.id, brief_id: offer.brief_id, influencer_id: offer.influencer_id, agreed_price: agreedPrice,
      split_payment: offer.split_payment, rights_package: rights, deliverables: offer.deliverables,
      deadline: offer.deadline ?? brief.latest_post_date, status: "accepted", deal_sheet_snapshot: snapshot,
    })
    .select("id")
    .single();
  if (error || !deal) throw new Error("The deal could not be created.");
  const rows = deliverables.flatMap((d) => Array.from({ length: d.count }, () => ({ deal_id: deal.id, platform: d.platform, format: d.format })));
  if (rows.length) await a.from("influencer_deliverables").insert(rows);
  return deal.id as string;
}

async function rollDealStatus(dealId: string) {
  const a = await db();
  const { data: deal } = await a.from("influencer_deals").select("status").eq("id", dealId).single();
  if (["cancelled", "completed", "accepted"].includes(deal.status)) return;
  const { data: items } = await a.from("influencer_deliverables").select("status").eq("deal_id", dealId);
  const st = (items ?? []).map((i: { status: string }) => i.status);
  if (!st.length) return;
  const all = (s: string[]) => st.every((x: string) => s.includes(x));
  let next = "in_production";
  if (all(["verified"])) next = "metrics_pending";
  else if (all(["posted", "verified"])) next = "posted";
  else if (st.includes("changes_requested")) next = "changes_requested";
  else if (st.includes("draft_submitted")) next = "draft_submitted";
  else if (all(["draft_approved", "posted", "verified"])) next = "draft_approved";
  if (deal.status === "metrics_pending" && next === "metrics_pending") return;
  await a.from("influencer_deals").update({ status: next }).eq("id", dealId);
}

/** One payout item per deal, or two halves when the offer was split. Idempotent via UNIQUE (deal_id, part). */
async function createPayoutItems(deal: { id: string; influencer_id: string; agreed_price: number | string; split_payment: boolean }) {
  const a = await db();
  const { data: inf } = await a.from("influencers").select("payout_method, payee").eq("id", deal.influencer_id).single();
  const total = Number(deal.agreed_price);
  const base = { deal_id: deal.id, influencer_id: deal.influencer_id, currency: "EUR", method: inf?.payout_method ?? "stripe", payee: inf?.payee === "agency" ? "agency" : "influencer" };
  const first = Math.round((total / 2) * 100) / 100;
  const rows = deal.split_payment
    ? [{ ...base, part: "acceptance", amount: first }, { ...base, part: "posting", amount: Math.round((total - first) * 100) / 100 }]
    : [{ ...base, part: "full", amount: total }];
  const { error } = await a.from("influencer_payout_items").upsert(rows, { onConflict: "deal_id,part", ignoreDuplicates: true });
  if (error) throw new Error("The deal was completed but the payout item could not be created.");
}

/* ================= Admin ================= */

export const sendInfluencerOffers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      briefId: z.string().uuid(),
      expiryDays: z.number().int().min(1).max(60),
      deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
      items: z.array(z.object({
        influencerId: z.string().uuid(),
        price: z.number().positive().max(1_000_000),
        fixed: z.number().min(0).max(1_000_000),
        rightsFee: z.number().min(0).max(1_000_000),
        split: z.boolean(),
        message: z.string().max(2000).optional(),
      })).min(1).max(10),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const adminId = await adminProfile(context as Ctx);
    const a = await db();
    const { data: brief } = await a.from("influencer_briefs").select("*").eq("id", data.briefId).single();
    if (!brief || brief.status !== "open") throw new Error("Open the brief before sending offers.");
    const expires = new Date(Date.now() + data.expiryDays * 86400e3).toISOString();
    const rows = data.items.map((i) => ({
      brief_id: brief.id, influencer_id: i.influencerId, price: i.price, currency: "EUR",
      price_breakdown: { fixed: i.fixed, rights_fee: i.rightsFee, bonus_terms: null }, split_payment: i.split,
      deliverables: brief.deliverables, rights_package: brief.rights_package, deadline: data.deadline ?? brief.latest_post_date,
      message: i.message || null, status: "sent", expires_at: expires, created_by: adminId,
    }));
    const { error } = await a.from("influencer_offers").insert(rows);
    if (error) throw new Error("The offers could not be sent.");
    await Promise.all(data.items.map((i) => notify(i.influencerId, `New offer: ${brief.title}, €${i.price}. Open Offers to accept, counter or decline.`)));
    return { sent: rows.length };
  });

export const adminOfferAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      offerId: z.string().uuid(),
      action: z.enum(["accept_counter", "recounter", "withdraw"]),
      price: z.number().positive().max(1_000_000).optional(),
      message: z.string().max(2000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await adminProfile(context as Ctx);
    const a = await db();
    const { data: offer } = await a.from("influencer_offers").select("*, influencer_briefs(title)").eq("id", data.offerId).single();
    if (!offer) throw new Error("Offer not found");
    const title = offer.influencer_briefs?.title ?? "your offer";
    if (data.action === "withdraw") {
      if (["accepted", "declined", "withdrawn"].includes(offer.status)) throw new Error("This offer is already closed.");
      await a.from("influencer_offers").update({ status: "withdrawn", responded_at: new Date().toISOString() }).eq("id", offer.id);
      await notify(offer.influencer_id, `The offer for ${title} was withdrawn.`);
      return { ok: true };
    }
    if (offer.status !== "countered") throw new Error("There is no counter to answer.");
    if (data.action === "accept_counter") {
      await a.from("influencer_offers").update({ status: "accepted", price: offer.counter_price, responded_at: new Date().toISOString() }).eq("id", offer.id);
      const dealId = await createDeal(offer.id, Number(offer.counter_price));
      await notify(offer.influencer_id, `Your counter for ${title} was accepted (€${offer.counter_price}). Open Deals to sign the Deal Sheet.`);
      return { ok: true, dealId };
    }
    if (!data.price) throw new Error("Enter the new price.");
    await a.from("influencer_offers").update({
      status: "sent", price: data.price, message: data.message || offer.message, counter_round: offer.counter_round + 1,
      viewed_at: null, expires_at: new Date(Date.now() + 5 * 86400e3).toISOString(),
    }).eq("id", offer.id);
    await notify(offer.influencer_id, `New price for ${title}: €${data.price}. Open Offers to answer.`);
    return { ok: true };
  });

export const adminDealAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      dealId: z.string().uuid(),
      action: z.enum(["approve_draft", "request_changes", "verify", "cancel", "extend", "complete", "spark"]),
      deliverableId: z.string().uuid().optional(),
      comment: z.string().max(2000).optional(),
      deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      code: z.string().max(500).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await adminProfile(context as Ctx);
    const a = await db();
    const { data: deal } = await a.from("influencer_deals").select("*").eq("id", data.dealId).single();
    if (!deal) throw new Error("Deal not found");
    const now = new Date().toISOString();
    const title = (deal.deal_sheet_snapshot as { brief_title?: string } | null)?.brief_title ?? "your deal";
    const needItem = async () => {
      if (!data.deliverableId) throw new Error("Pick a deliverable.");
      const { data: item } = await a.from("influencer_deliverables").select("*").eq("id", data.deliverableId).eq("deal_id", deal.id).single();
      if (!item) throw new Error("Deliverable not found");
      return item;
    };
    switch (data.action) {
      case "approve_draft": {
        const item = await needItem();
        if (item.status !== "draft_submitted") throw new Error("There is no draft waiting.");
        await a.from("influencer_deliverables").update({ status: "draft_approved", draft_approved_at: now, draft_feedback: data.comment || null }).eq("id", item.id);
        await notify(deal.influencer_id, `Your draft for ${title} is approved. You can post it.`);
        break;
      }
      case "request_changes": {
        const item = await needItem();
        if (!data.comment?.trim()) throw new Error("Write what needs to change.");
        await a.from("influencer_deliverables").update({ status: "changes_requested", draft_feedback: data.comment }).eq("id", item.id);
        await notify(deal.influencer_id, `Changes requested on your draft for ${title}: ${data.comment}`);
        break;
      }
      case "verify": {
        const item = await needItem();
        if (item.status !== "posted") throw new Error("This deliverable is not posted yet.");
        await a.from("influencer_deliverables").update({ status: "verified", verified_at: now }).eq("id", item.id);
        break;
      }
      case "cancel":
        if (!data.comment?.trim()) throw new Error("Give a reason for cancelling.");
        await a.from("influencer_deals").update({ status: "cancelled", cancelled_reason: data.comment }).eq("id", deal.id);
        await notify(deal.influencer_id, `The deal for ${title} was cancelled: ${data.comment}`);
        return { ok: true };
      case "extend":
        if (!data.deadline) throw new Error("Pick the new deadline.");
        await a.from("influencer_deals").update({ deadline: data.deadline, extended_count: deal.extended_count + 1 }).eq("id", deal.id);
        await notify(deal.influencer_id, `New deadline for ${title}: ${data.deadline}.`);
        return { ok: true };
      case "complete":
        if (deal.status === "cancelled") throw new Error("This deal is cancelled.");
        await a.from("influencer_deals").update({ status: "completed", completed_at: now }).eq("id", deal.id);
        await createPayoutItems(deal);
        await notify(deal.influencer_id, `The deal for ${title} is completed. Thank you!`);
        return { ok: true };
      case "spark":
        await a.from("influencer_deals").update({ spark_ads_code: data.code?.trim() || null }).eq("id", deal.id);
        return { ok: true };
    }
    await rollDealStatus(deal.id);
    return { ok: true };
  });

/* ================= Influencer ================= */

async function myOffer(context: Ctx, offerId: string) {
  const inf = await meInfluencer(context);
  const a = await db();
  const { data: offer } = await a.from("influencer_offers").select("*").eq("id", offerId).eq("influencer_id", inf.id).single();
  if (!offer) throw new Error("Offer not found");
  return { inf, offer, a };
}
async function myDeal(context: Ctx, dealId: string) {
  const inf = await meInfluencer(context);
  const a = await db();
  const { data: deal } = await a.from("influencer_deals").select("*").eq("id", dealId).eq("influencer_id", inf.id).single();
  if (!deal) throw new Error("Deal not found");
  return { inf, deal, a };
}
async function myDeliverable(context: Ctx, deliverableId: string) {
  const inf = await meInfluencer(context);
  const a = await db();
  const { data: item } = await a.from("influencer_deliverables").select("*, influencer_deals!inner(*)").eq("id", deliverableId).single();
  if (!item || item.influencer_deals.influencer_id !== inf.id) throw new Error("Deliverable not found");
  return { inf, item, deal: item.influencer_deals, a };
}

export const markOfferViewed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ offerId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { offer, a } = await myOffer(context as Ctx, data.offerId);
    if (offer.status === "sent" && !offer.viewed_at) await a.from("influencer_offers").update({ status: "viewed", viewed_at: new Date().toISOString() }).eq("id", offer.id);
    return { ok: true };
  });

export const respondToOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      offerId: z.string().uuid(),
      action: z.enum(["accept", "counter", "decline"]),
      price: z.number().positive().max(1_000_000).optional(),
      message: z.string().max(2000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { offer, a } = await myOffer(context as Ctx, data.offerId);
    if (!["sent", "viewed"].includes(offer.status)) throw new Error("This offer can no longer be answered.");
    if (offer.expires_at && new Date(offer.expires_at).getTime() < Date.now()) {
      await a.from("influencer_offers").update({ status: "expired" }).eq("id", offer.id);
      throw new Error("This offer has expired. Message the Sophia team if you still want to do it.");
    }
    const now = new Date().toISOString();
    if (data.action === "decline") {
      await a.from("influencer_offers").update({ status: "declined", decline_reason: data.message || null, responded_at: now }).eq("id", offer.id);
      return { ok: true };
    }
    if (data.action === "counter") {
      if (!data.price) throw new Error("Enter your price.");
      await a.from("influencer_offers").update({ status: "countered", counter_price: data.price, counter_message: data.message || null, responded_at: now }).eq("id", offer.id);
      return { ok: true };
    }
    await a.from("influencer_offers").update({ status: "accepted", responded_at: now }).eq("id", offer.id);
    const dealId = await createDeal(offer.id, Number(offer.price));
    return { ok: true, dealId };
  });

export const flagBriefInterest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ briefId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const inf = await meInfluencer(context as Ctx);
    const { data: ok } = await (context as Ctx).supabase.rpc("influencer_can_see_brief", { _brief_id: data.briefId });
    if (!ok) throw new Error("This brief is not open to you.");
    const a = await db();
    await a.from("influencer_brief_interest").upsert({ brief_id: data.briefId, influencer_id: inf.id }, { onConflict: "brief_id,influencer_id", ignoreDuplicates: true });
    return { ok: true };
  });

export const signDealSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ dealId: z.string().uuid(), signedName: z.string().trim().min(2).max(160) }).parse(d))
  .handler(async ({ data, context }) => {
    const { inf, deal, a } = await myDeal(context as Ctx, data.dealId);
    if (!inf.agreement_signed_at) throw new Error("Sign the master agreement first.");
    if (deal.deal_sheet_signed_at) return { ok: true };
    if (deal.status === "cancelled") throw new Error("This deal is cancelled.");
    const now = new Date().toISOString();
    const { ip, ua } = ipUa();
    const snap = deal.deal_sheet_snapshot as { master_agreement_version?: string } | null;
    await a.from("influencer_signatures").insert({
      influencer_id: inf.id, kind: "deal_sheet", deal_id: deal.id, document_version: snap?.master_agreement_version ?? "1",
      signed_name: data.signedName, snapshot: deal.deal_sheet_snapshot, signature_ip: ip, user_agent: ua,
    });
    await a.from("influencer_deals").update({ deal_sheet_signed_at: now, deal_sheet_signed_name: data.signedName, status: "in_production" }).eq("id", deal.id);
    return { ok: true };
  });

export const dealUploadSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ deliverableId: z.string().uuid(), kind: z.enum(["draft", "screenshot"]), name: z.string().max(200), size: z.number().int().positive() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { deal, a } = await myDeliverable(context as Ctx, data.deliverableId);
    const re = data.kind === "draft" ? /\.(mp4|mov|webm|m4v)$/ : /\.(png|jpe?g|webp|heic)$/;
    const m = data.name.toLowerCase().match(re);
    if (!m) return { ok: false as const, reason: "type" as const };
    if (data.size > 50 * 1024 * 1024) return { ok: false as const, reason: "size" as const };
    const path = `deals/${deal.id}/${data.deliverableId}/${data.kind}-${Date.now()}.${m[1]}`;
    const { data: slot, error } = await a.storage.from("influencer-files").createSignedUploadUrl(path);
    if (error || !slot) return { ok: false as const, reason: "server" as const };
    return { ok: true as const, path, signedUrl: slot.signedUrl };
  });

export const submitDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ deliverableId: z.string().uuid(), path: z.string().max(300).optional(), url: z.union([z.string().url().max(500), z.literal("")]).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { item, deal, a } = await myDeliverable(context as Ctx, data.deliverableId);
    if (!deal.deal_sheet_signed_at) throw new Error("Sign the Deal Sheet first.");
    if (!["pending", "changes_requested"].includes(item.status)) throw new Error("A draft is already waiting or approved.");
    if (!data.path && !data.url) throw new Error("Upload your video or paste a link to it.");
    if (data.path && !data.path.startsWith(`deals/${deal.id}/${item.id}/`)) throw new Error("Forbidden");
    await a.from("influencer_deliverables").update({
      draft_file_path: data.path ?? null, draft_url: data.url || null, draft_submitted_at: new Date().toISOString(), status: "draft_submitted",
    }).eq("id", item.id);
    await rollDealStatus(deal.id);
    return { ok: true };
  });

export const markPosted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ deliverableId: z.string().uuid(), url: z.string().url().max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const { item, deal, a } = await myDeliverable(context as Ctx, data.deliverableId);
    if (!deal.deal_sheet_signed_at) throw new Error("Sign the Deal Sheet first.");
    const { data: brief } = await a.from("influencer_briefs").select("draft_approval_required").eq("id", deal.brief_id).single();
    if (brief?.draft_approval_required && item.status !== "draft_approved") throw new Error("Wait for your draft to be approved before posting.");
    if (["posted", "verified"].includes(item.status)) throw new Error("Already marked as posted.");
    await a.from("influencer_deliverables").update({ post_url: data.url, posted_at: new Date().toISOString(), status: "posted" }).eq("id", item.id);
    await rollDealStatus(deal.id);
    return { ok: true };
  });

export const reportMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      deliverableId: z.string().uuid(),
      checkpoint: z.enum(["48h", "7d", "30d"]),
      views: z.number().int().min(0).max(2_000_000_000),
      likes: z.number().int().min(0).max(2_000_000_000).nullable(),
      comments: z.number().int().min(0).max(2_000_000_000).nullable(),
      shares: z.number().int().min(0).max(2_000_000_000).nullable(),
      saves: z.number().int().min(0).max(2_000_000_000).nullable(),
      screenshotPath: z.string().max(300),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { item, deal, a } = await myDeliverable(context as Ctx, data.deliverableId);
    if (!item.posted_at) throw new Error("Mark the post as published first.");
    const hours = { "48h": 48, "7d": 168, "30d": 720 }[data.checkpoint];
    if (Date.now() - new Date(item.posted_at).getTime() < hours * 3600e3) throw new Error(`The ${data.checkpoint} form opens ${data.checkpoint} after posting.`);
    if (!data.screenshotPath.startsWith(`deals/${deal.id}/${item.id}/`)) throw new Error("Upload a screenshot of your stats.");
    const { error } = await a.from("influencer_deliverable_metrics").upsert({
      deliverable_id: item.id, checkpoint: data.checkpoint, views: data.views, likes: data.likes, comments: data.comments,
      shares: data.shares, saves: data.saves, screenshot_path: data.screenshotPath, reported_by: "influencer", reported_at: new Date().toISOString(),
    }, { onConflict: "deliverable_id,checkpoint" });
    if (error) throw new Error("Your numbers could not be saved.");
    return { ok: true };
  });

export const setSparkCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ dealId: z.string().uuid(), code: z.string().trim().min(4).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const { deal, a } = await myDeal(context as Ctx, data.dealId);
    if (!RIGHTS_LABEL[deal.rights_package as Rights]?.ads) throw new Error("This deal does not include ad rights.");
    await a.from("influencer_deals").update({ spark_ads_code: data.code }).eq("id", deal.id);
    return { ok: true };
  });

export const openDealFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ dealId: z.string().uuid(), path: z.string().max(300) }).parse(d))
  .handler(async ({ data, context }) => {
    const { deal, a } = await myDeal(context as Ctx, data.dealId);
    if (!data.path.startsWith(`deals/${deal.id}/`)) throw new Error("Forbidden");
    const { data: s } = await a.storage.from("influencer-files").createSignedUrl(data.path, 600);
    return { url: s?.signedUrl ?? null };
  });

export const markPayoutPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ itemIds: z.array(z.string().uuid()).min(1).max(100), paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), reference: z.string().trim().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await adminProfile(context as Ctx);
    const a = await db();
    const { data: items } = await a.from("influencer_payout_items").select("id, invoice_id, status").in("id", data.itemIds);
    if ((items ?? []).some((i: { status: string }) => i.status === "paid")) throw new Error("One of these is already paid.");
    await a.from("influencer_payout_items").update({ status: "paid", paid_on: data.paidOn, paid_reference: data.reference }).in("id", data.itemIds);
    const invoices = [...new Set((items ?? []).map((i: { invoice_id: string | null }) => i.invoice_id).filter(Boolean))];
    if (invoices.length) await a.from("influencer_invoices").update({ status: "paid", paid_on: data.paidOn, paid_reference: data.reference }).in("id", invoices);
    return { ok: true };
  });

export const invoiceUploadSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ name: z.string().max(200), size: z.number().int().positive() }).parse(d))
  .handler(async ({ data, context }) => {
    const inf = await meInfluencer(context as Ctx);
    if (!/\.pdf$/i.test(data.name)) return { ok: false as const, reason: "type" as const };
    if (data.size > 10 * 1024 * 1024) return { ok: false as const, reason: "size" as const };
    const a = await db();
    const path = `${inf.id}/invoices/${Date.now()}.pdf`;
    const { data: slot, error } = await a.storage.from("influencer-files").createSignedUploadUrl(path);
    if (error || !slot) return { ok: false as const, reason: "server" as const };
    return { ok: true as const, path, signedUrl: slot.signedUrl };
  });

/** Attaches an uploaded invoice PDF to one or more due payout items (same deal). */
export const submitInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ itemIds: z.array(z.string().uuid()).min(1).max(20), path: z.string().max(300) }).parse(d))
  .handler(async ({ data, context }) => {
    const inf = await meInfluencer(context as Ctx);
    if (!data.path.startsWith(`${inf.id}/invoices/`)) throw new Error("Forbidden");
    const a = await db();
    const { data: items } = await a.from("influencer_payout_items").select("*").in("id", data.itemIds).eq("influencer_id", inf.id);
    if (!items?.length || items.length !== data.itemIds.length) throw new Error("Payment not found.");
    if (items.some((i: { status: string }) => i.status !== "due")) throw new Error("An invoice was already sent for this payment.");
    const amount = items.reduce((s: number, i: { amount: number }) => s + Number(i.amount), 0);
    const { data: inv, error } = await a.from("influencer_invoices").insert({
      influencer_id: inf.id, deal_id: items[0].deal_id, amount, file_path: data.path, payee: items[0].payee, status: "submitted",
    }).select("id").single();
    if (error || !inv) throw new Error("The invoice could not be saved.");
    await a.from("influencer_payout_items").update({ status: "invoiced", invoice_id: inv.id }).in("id", data.itemIds);
    return { ok: true };
  });

export const openMyInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string().max(300) }).parse(d))
  .handler(async ({ data, context }) => {
    const inf = await meInfluencer(context as Ctx);
    if (!data.path.startsWith(`${inf.id}/`)) throw new Error("Forbidden");
    const a = await db();
    const { data: s } = await a.storage.from("influencer-files").createSignedUrl(data.path, 600);
    return { url: s?.signedUrl ?? null };
  });

export const RIGHTS_VALUES = RIGHTS;
