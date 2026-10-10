async function hmac(secret: string, msg: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
}
export async function signTikTokState(appId: string, secret: string) {
  const body = `${appId}.${Date.now()}`;
  return `${body}.${await hmac(secret, body)}`;
}
export async function readTikTokState(state: string, secret: string): Promise<string | null> {
  const [appId, ts, sig] = state.split(".");
  if (!appId || !ts || !sig) return null;
  if (Date.now() - Number(ts) > 15 * 60_000) return null;
  const expected = await hmac(secret, `${appId}.${ts}`);
  if (expected.length !== sig.length) return null;
  let diff = 0; for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0 && /^[0-9a-f-]{36}$/.test(appId) ? appId : null;
}
