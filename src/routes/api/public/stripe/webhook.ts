import { createFileRoute } from "@tanstack/react-router";

/* Stripe webhook: signature verified over the raw body with STRIPE_WEBHOOK_SECRET before anything is written. */
export const Route = createFileRoute("/api/public/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["STRIPE_WEBHOOK_SECRET"];
        const key = process.env["STRIPE_SECRET_KEY"]?.startsWith("sk_live_") && process.env["STRIPE_ALLOW_LIVE"] !== "true" ? process.env["STRIPE_TEST_API_KEY"] : process.env["STRIPE_SECRET_KEY"];
        if (!secret || !key) return new Response("Webhook not configured", { status: 503 });
        const sig = request.headers.get("stripe-signature");
        if (!sig) return new Response("Missing signature", { status: 400 });
        const body = await request.text();
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(key);
        let event: any; // eslint-disable-line @typescript-eslint/no-explicit-any
        try { event = await stripe.webhooks.constructEventAsync(body, sig, secret, undefined, Stripe.createSubtleCryptoProvider()); }
        catch { return new Response("Bad signature", { status: 400 }); }
        const { supabaseAdmin: a } = await import("@/integrations/supabase/client.server");
        const obj = event.data.object;
        if (event.type === "account.updated") {
          await a.from("creator_payout_profiles").update({ stripe_onboarded: Boolean(obj.details_submitted && obj.payouts_enabled) }).eq("stripe_account_id", obj.id);
        } else if (event.type === "transfer.failed" || event.type === "transfer.reversed") {
          const reason = event.type === "transfer.reversed" ? `Stripe transfer reversed (${obj.amount_reversed ? (obj.amount_reversed / 100).toFixed(2) : "?"} ${String(obj.currency ?? "").toUpperCase()})` : `Stripe transfer failed${obj.failure_message ? `: ${obj.failure_message}` : ""}`;
          const { data: items } = await a.from("payout_items").update({ status: "failed", note: reason.slice(0, 300) }).eq("stripe_transfer_id", obj.id).select("id, period, creators(full_name)");
          const who = (items ?? []).map((i: any) => `${i.creators?.full_name ?? "creator"} (${i.period})`).join(", "); // eslint-disable-line @typescript-eslint/no-explicit-any
          const { data: admins } = await a.from("profiles").select("id").eq("role", "admin");
          if (admins?.length) await a.from("notifications").insert(admins.map((p) => ({ profile_id: p.id, type: "payout_failed", body: `${reason}${who ? ` — ${who}` : ""}` })));
          if (items?.length) await a.from("payout_batches").update({ status: "approved", paid_at: null }).in("id", (await a.from("payout_items").select("batch_id").in("id", items.map((i) => i.id))).data?.map((r) => r.batch_id) ?? []);
        }
        return Response.json({ received: true });
      },
    },
  },
});
