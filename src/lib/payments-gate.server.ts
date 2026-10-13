// Server-only: hub_settings.payments_enabled is the master switch for every payout, Stripe transfer/onboarding and payout-method action.
export async function paymentsEnabled(): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("hub_settings").select("value").eq("key", "payments_enabled").maybeSingle();
  return data?.value === "true";
}
export async function assertPaymentsOn() {
  if (!(await paymentsEnabled())) throw new Error("Payments are off");
}
