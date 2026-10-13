// Server-only: hand a creator the store code of the app they work on (Sophia or UnSwipe), never another app's.
type Admin = any;
export const SOPHIA_APP = "00000000-0000-4000-8000-000000000001";

export async function assignAppCode(admin: Admin, creatorId: string, appId: string | null | undefined, wanted?: "ios" | "android") {
  const app = appId || SOPHIA_APP;
  // Max one code per app per platform per creator (per app when no platform is asked).
  let hq = admin.from("access_codes").select("id").eq("assigned_creator_id", creatorId).eq("app_id", app);
  if (wanted) hq = hq.eq("platform", wanted);
  const { data: has } = await hq.limit(1);
  if (has?.length) return { ok: true, already: true };
  const { data: c } = await admin.from("creators").select("platform, access_code").eq("id", creatorId).maybeSingle();
  if (!wanted && app === SOPHIA_APP && c?.access_code) return { ok: true, already: true };
  const platform = wanted ?? (c?.platform === "android" ? "android" : "ios");
  const pick = async (p: string) => (await admin.from("access_codes").select("id, code, redeem_url, platform").eq("state", "available").eq("app_id", app).eq("platform", p)
    .is("assigned_to", null).is("assigned_creator_id", null).order("created_at").limit(1).maybeSingle()).data;
  // UnSwipe only has iOS codes today: fall back to iOS when the wanted platform has none.
  const code = (await pick(platform)) ?? (!wanted && platform !== "ios" && app !== SOPHIA_APP ? await pick("ios") : null);
  if (!code) return { ok: false, reason: "pool_empty" as const };
  await admin.from("access_codes").update({ state: "assigned", assigned_creator_id: creatorId, assigned_at: new Date().toISOString() }).eq("id", code.id);
  if (app === SOPHIA_APP && !c?.access_code) await admin.from("creators").update({ access_code: code.code, access_redeem_url: code.redeem_url, platform: code.platform }).eq("id", creatorId);
  return { ok: true, code: code.code };
}
