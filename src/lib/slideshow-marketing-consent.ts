import { z } from "zod";
export const CONSENT_KEY="sophia_slideshow_marketing_consent";
export const CONSENT_VERSION="slideshow-meta-v1";
export const marketingConsentSchema=z.object({id:z.string().uuid(),accepted:z.boolean(),at:z.string().datetime(),version:z.literal(CONSENT_VERSION),gpc:z.boolean()});
export type MarketingConsent=z.infer<typeof marketingConsentSchema>;
export function validMarketingConsent(value:unknown,now=Date.now()):boolean { const r=marketingConsentSchema.safeParse(value); return r.success && r.data.accepted && !r.data.gpc && Date.parse(r.data.at)<=now && now-Date.parse(r.data.at)<30*86400000; }
export function browserConsent():MarketingConsent|null {
  try { const r=marketingConsentSchema.safeParse(JSON.parse(localStorage.getItem(CONSENT_KEY)??"null"));return r.success?r.data:null; }catch{return null;}
}
export function marketingAllowed():boolean {return !(navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl && validMarketingConsent(browserConsent());}