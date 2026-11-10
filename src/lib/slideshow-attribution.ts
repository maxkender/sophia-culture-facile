import { z } from "zod";

export const UTM_KEYS = ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"] as const;
export const ATTRIBUTION_KEYS = [...UTM_KEYS,"fbclid","landing_url"] as const;
export type Attribution = Partial<Record<typeof ATTRIBUTION_KEYS[number], string | null>>;
export type ApplicationSource = "meta" | "referral" | "other_utm" | "direct";
export const SOURCE_LABELS: Record<ApplicationSource,string> = { meta:"Meta",referral:"Referral",direct:"Direct",other_utm:"Other" };
export const ATTRIBUTION_STORAGE_KEY = "sophia_slideshow_attribution";
export const ATTRIBUTION_TTL = 30*86400000;
const field = z.string().trim().max(500).nullish();
export const attributionSchema = z.object({utm_source:field,utm_medium:field,utm_campaign:field,utm_content:field,utm_term:field,fbclid:z.string().trim().max(1000).nullish(),landing_url:z.string().max(3000).url().nullish()});
type Store = Pick<Storage,"getItem"|"setItem"|"removeItem">;
export function applicationSource(a: Attribution & {ref?:string|null;source?:string|null}): ApplicationSource {
  if (a.ref?.trim()) return "referral";
  if (["facebook","fb","instagram","ig","meta"].includes(a.utm_source?.trim().toLowerCase() ?? "") || a.fbclid) return "meta";
  if (UTM_KEYS.some(k=>Boolean(a[k]))) return "other_utm";
  return a.source === "referral" ? "referral" : "direct";
}
export function paidTouch(a: Attribution): boolean { return Boolean(a.utm_source && /^(paid|paid_social|paid-social|cpc|ppc|cpm)$/i.test(a.utm_medium ?? "")); }
export function safeLandingUrl(raw:string):string {
  try { const u=new URL(raw); const q=new URLSearchParams(); for(const k of UTM_KEYS) { const v=u.searchParams.get(k); if(v) q.set(k,v.slice(0,500)); } u.search=q.toString(); u.hash=""; return u.toString().slice(0,3000); } catch { return ""; }
}
export function captureAttribution(store:Store, raw:string, marketing:boolean, now=Date.now()):Attribution {
  let current:Attribution={};
  try { const u=new URL(raw); for(const k of [...UTM_KEYS,"fbclid"] as const) { const v=u.searchParams.get(k); if(v && (k!=="fbclid" || marketing)) current[k]=v.trim().slice(0,k==="fbclid"?1000:500); } current.landing_url=safeLandingUrl(raw); } catch { return {}; }
  try {
    const saved=JSON.parse(store.getItem(ATTRIBUTION_STORAGE_KEY)??"null") as {data:Attribution;expiresAt:number}|null;
    const valid=saved && saved.expiresAt>now && attributionSchema.safeParse(saved.data).success;
    let data=valid ? {...saved.data} : current;
    if(valid && paidTouch(current) && !paidTouch(data)) data=current;
    // A click identifier can be consented to later on the same landing; never import one from a different touch.
    if(marketing && current.fbclid && data.landing_url===current.landing_url) data.fbclid=current.fbclid;
    if(!marketing) delete data.fbclid;
    store.setItem(ATTRIBUTION_STORAGE_KEY,JSON.stringify({data,expiresAt:valid && data.landing_url===saved.data.landing_url ? saved.expiresAt : now+ATTRIBUTION_TTL}));
    return data;
  } catch { return current; }
}
export function withAttribution(href:string, data:Attribution):string {
  const u=new URL(href,"https://local.invalid"); for(const k of [...UTM_KEYS,"fbclid"] as const) if(data[k]) u.searchParams.set(k,String(data[k]));
  return u.pathname+u.search+u.hash;
}
export function attributionCsv(rows:(Attribution & {full_name:string;email:string;country:string;ref?:string|null;source?:string|null})[]):string {
  const cell=(v:unknown)=>{const s=String(v??"");return '"'+(/^[=+\-@\t\r]/.test(s)?"'":"")+s.replaceAll('"','""')+'"';};
  return '\uFEFF'+[["Name","Email","Country","Source",...ATTRIBUTION_KEYS],...rows.map(r=>[r.full_name,r.email,r.country,applicationSource(r),...ATTRIBUTION_KEYS.map(k=>r[k])])].map(r=>r.map(cell).join(",")).join("\r\n");
}