import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function requireAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("profiles").select("role").eq("user_id", userId).maybeSingle();
  if (data?.role !== "admin") throw new Error("Forbidden");
}

// Safety: live keys are refused unless STRIPE_ALLOW_LIVE=true is explicitly set.
async function stripe() {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("Stripe is not configured");
  if (key.startsWith("sk_live_") && process.env["STRIPE_ALLOW_LIVE"] !== "true") {
    throw new Error("Stripe is in live mode. Add a test key (sk_test_…) to try payouts safely.");
  }
  const Stripe = (await import("stripe")).default;
  return new Stripe(key);
}

// Generate a monthly batch: approved posts per creator in the period, priced by rate card.
export const generatePayoutBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ period: z.string().regex(/^\d{4}-\d{2}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await requireAdmin(supabase, userId);
    const [y = 0, m = 1] = data.period.split("-").map(Number);
    const from = new Date(Date.UTC(y, m - 1, 1)).toISOString().slice(0, 10);
    const to = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);

    // Each approved post is priced at approval by the dated rate card; held posts (no card) are excluded.
    const { data: posts } = await supabase
      .from("creator_posts")
      .select("creator_id, app_id, amount_usd, pay_status")
      .eq("status", "approved")
      .gte("posted_on", from)
      .lt("posted_on", to);
    const { data: creators } = await supabase.from("creators").select("id, full_name");
    const { data: profiles } = await supabase.from("creator_payout_profiles").select("creator_id, method, stripe_onboarded");

    const sums = new Map<string, { count: number; amount: number }>();
    let held = 0;
    for (const p of posts ?? []) {
      if (p.pay_status !== "due" || p.amount_usd === null) { held++; continue; }
      const key = `${p.creator_id}|${p.app_id}`;
      const s = sums.get(key) ?? { count: 0, amount: 0 };
      s.count++; s.amount += Number(p.amount_usd);
      sums.set(key, s);
    }

    const items: any[] = [];
    const missing: string[] = [];
    const byMethod: Record<string, { creators: number; usd: number }> = {};
    for (const [key, s] of sums) {
      const [creatorId = "", appId] = key.split("|");
      const creator = creators?.find((c: any) => c.id === creatorId);
      if (!creator) continue;
      const method = profiles?.find((p: any) => p.creator_id === creatorId)?.method ?? "none";
      byMethod[method] = { creators: (byMethod[method]?.creators ?? 0) + 1, usd: (byMethod[method]?.usd ?? 0) + s.amount };
      items.push({ creator_id: creatorId, app_id: appId, posts_count: s.count, rate_usd: s.count ? s.amount / s.count : 0, amount_usd: s.amount, note: `method:${method}` });
    }
    if (held) missing.push(`${held} approved post(s) held: no rate card in force`);

    const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", userId).maybeSingle();
    const { data: existing } = await supabase.from("payout_batches").select("status").eq("period", data.period).maybeSingle();
    if (existing && existing.status !== "draft") throw new Error("This month's batch is already approved or paid");
    const { data: batch, error } = await supabase
      .from("payout_batches")
      .upsert({ period: data.period, status: "draft", created_by: profile?.id }, { onConflict: "period" })
      .select("id")
      .single();
    if (error) throw new Error("The payout batch could not be prepared. Check the period and try again.");
    await supabase.from("payout_items").delete().eq("batch_id", batch.id);
    if (items.length) await supabase.from("payout_items").insert(items.map((i) => ({ ...i, batch_id: batch.id })));
    return { batchId: batch.id, items: items.length, missingRates: missing, byMethod };
  });

// Creator starts Stripe Connect Express onboarding; returns the Stripe URL.
export const startStripeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const { data: creator } = await supabase.from("creators").select("*").eq("user_id", userId).maybeSingle();
    if (!creator) throw new Error("Not a creator");
    const s = await stripe();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin.from("creator_payout_profiles").select("*").eq("creator_id", creator.id).maybeSingle();
    let accountId = profile?.stripe_account_id as string | undefined;
    if (!accountId) {
      const account = await s.accounts.create(
        {
          type: "express",
          email: creator.email,
          capabilities: { transfers: { requested: true } },
          metadata: { creator_id: creator.id },
        },
        { idempotencyKey: `creator-account-${creator.id}` },
      );
      accountId = account.id;
      if (profile) {
        await supabaseAdmin.from("creator_payout_profiles").update({ stripe_account_id: accountId, method: "stripe" }).eq("id", profile.id);
      } else {
        await supabaseAdmin.from("creator_payout_profiles").insert({ creator_id: creator.id, stripe_account_id: accountId, method: "stripe" });
      }
    }
    const origin = process.env["SITE_URL"] ?? "https://sophia-culture.com";
    const link = await s.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/creators/app/profile`,
      return_url: `${origin}/creators/app/profile`,
      type: "account_onboarding",
    });
    return { url: link.url };
  });

// Refresh a creator's onboarding status from Stripe (called after return).
export const syncStripeStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", userId).maybeSingle();
    if (!creator) throw new Error("Not a creator");
    const { data: profile } = await supabase.from("creator_payout_profiles").select("*").eq("creator_id", creator.id).maybeSingle();
    if (!profile?.stripe_account_id) return { onboarded: false };
    const s = await stripe();
    const account = await s.accounts.retrieve(profile.stripe_account_id);
    const onboarded = Boolean(account.details_submitted && account.payouts_enabled);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("creator_payout_profiles").update({ stripe_onboarded: onboarded }).eq("id", profile.id);
    return { onboarded };
  });

// Pay an approved batch: one Stripe transfer per onboarded creator.
export const payPayoutBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ batchId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await requireAdmin(supabase, userId);
    const { data: batch } = await supabase.from("payout_batches").select("*").eq("id", data.batchId).single();
    if (!batch || batch.status === "paid") throw new Error("Batch not payable");
    if (batch.status !== "approved") throw new Error("Approve the batch first");
    const { data: items } = await supabase.from("payout_items").select("*").eq("batch_id", batch.id).in("status", ["pending", "skipped", "failed"]);
    const { data: profiles } = await supabase.from("creator_payout_profiles").select("*");
    const s = await stripe();

    const results = { paid: 0, skipped: 0, failed: 0 };
    for (const item of items ?? []) {
      const profile = profiles?.find((p: any) => p.creator_id === item.creator_id);
      if (!profile?.stripe_onboarded || !profile.stripe_account_id) {
        await supabase.from("payout_items").update({ status: "skipped", note: "Creator not onboarded to Stripe" }).eq("id", item.id);
        results.skipped++;
        continue;
      }
      try {
        const transfer = await s.transfers.create(
          {
            amount: Math.round(Number(item.amount_usd) * 100),
            currency: "usd",
            destination: profile.stripe_account_id,
            metadata: { batch_id: batch.id, payout_item_id: item.id },
          },
          { idempotencyKey: `payout-item-${item.id}` },
        );
        await supabase.from("payout_items").update({ status: "paid", stripe_transfer_id: transfer.id }).eq("id", item.id);
        results.paid++;
      } catch (e: any) {
        await supabase.from("payout_items").update({ status: "failed", note: e?.message ?? "Stripe error" }).eq("id", item.id);
        results.failed++;
      }
    }
    const complete = results.failed === 0 && results.skipped === 0;
    await supabase
      .from("payout_batches")
      .update(complete ? { status: "paid", paid_at: new Date().toISOString() } : { status: "approved" })
      .eq("id", batch.id);
    return results;
  });
