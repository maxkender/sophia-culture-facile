import { z } from "zod";

export const UTM_KEYS = ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"] as const;
export const ATTRIBUTION_KEYS = [...UTM_KEYS,"fbclid","fbc","fbp","landing_url"] as const;
export type Attribution = Partial<Record<typeof ATTRIBUTION_KEYS[number], string | null | undefined>>;
export type ApplicationSource = "meta" | "sophia_app" | "referral" | "other_utm" | "direct";
export const SOURCE_LABELS: Record<ApplicationSource,string> = { meta:"Meta",sophia_app:"Sophia app",referral:"Referral",direct:"Direct",other_utm:"Other" };
export const ATTRIBUTION_STORAGE_KEY = "sophia_slideshow_attribution";
export const ATTRIBUTION_TTL = 30*86400000;
const field = z.string().transform(v=>v.trim().replace(/[\u0000-\u001f\u007f]/g,"").slice(0,300)).nullish();
export const attributionSchema = z.object({utm_source:field,utm_medium:field,utm_campaign:field,utm_content:field,utm_term:field,fbclid:field,fbc:field,fbp:field,landing_url:field});
type Store = Pick<Storage,"getItem"|"setItem"|"removeItem">;
type SourceInput = Attribution & {ref?:string|null|undefined;source?:string|null|undefined;referral_source?:string|null|undefined};
export function sourceDeclared(a: SourceInput): boolean {
  return !a.ref?.trim() && !a.utm_source?.trim() && !a.fbclid && ["In the Sophia app","Instagram / Facebook ad"].includes(a.referral_source ?? "");
}
export function applicationSource(a: SourceInput): ApplicationSource {
  if (a.ref?.trim()) return "referral";
  if (["facebook","fb","instagram","ig","meta"].includes(a.utm_source?.trim().toLowerCase() ?? "") || a.fbclid) return "meta";
  if (a.utm_source?.trim().toLowerCase() === "sophia_app") return "sophia_app";
  if (sourceDeclared(a)) return a.referral_source === "In the Sophia app" ? "sophia_app" : "meta";
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
    const newTouch = UTM_KEYS.some(k=>Boolean(current[k])) && (!valid || data.landing_url !== current.landing_url);
    if(newTouch) data=current;
    // A click identifier can be consented to later on the same landing; never import one from a different touch.
    if(marketing && current.fbclid && data.landing_url===current.landing_url) {
      if(data.fbclid!==current.fbclid || !data.fbc) data.fbc=`fb.1.${now}.${current.fbclid}`;
      data.fbclid=current.fbclid;
    }
    if(!marketing) {delete data.fbclid;delete data.fbc;delete data.fbp;}
    store.setItem(ATTRIBUTION_STORAGE_KEY,JSON.stringify({data,expiresAt:valid && !newTouch ? saved.expiresAt : now+ATTRIBUTION_TTL}));
    return data;
  } catch { return current; }
}
export function withAttribution(href:string, data:Attribution):string {
  const u=new URL(href,"https://local.invalid"); for(const k of [...UTM_KEYS,"fbclid"] as const) if(data[k]) u.searchParams.set(k,String(data[k]));
  return u.pathname+u.search+u.hash;
}
export function attributionCsv(rows:(SourceInput & {full_name:string;email:string;country:string})[]):string {
  const cell=(v:unknown)=>{const s=String(v??"");return '"'+(/^[=+\-@\t\r]/.test(s)?"'":"")+s.replaceAll('"','""')+'"';};
  return '\uFEFF'+[["Name","Email","Country","Source","Source declared",...ATTRIBUTION_KEYS],...rows.map(r=>[r.full_name,r.email,r.country,applicationSource(r),sourceDeclared(r),...ATTRIBUTION_KEYS.map(k=>r[k])])].map(r=>r.map(cell).join(",")).join("\r\n");
}