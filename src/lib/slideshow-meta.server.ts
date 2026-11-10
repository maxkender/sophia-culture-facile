import { validMarketingConsent } from "./slideshow-marketing-consent";
import { safeLandingUrl } from "./slideshow-attribution";
import { countryCodeOf } from "@/config/countries";

export type MetaLeadInput={id:string;created_at:string;marketing_consent:unknown;landing_url:string|null;email?:string;country?:string;fbc?:string|null;fbp?:string|null};
export function buildMetaLead(record:MetaLeadInput,request:Request,latestConsent:unknown) {
  if(request.headers.get("sec-gpc")==="1" || !validMarketingConsent(record.marketing_consent) || !validMarketingConsent(latestConsent)) return null;
  const sourceUrl=safeLandingUrl(record.landing_url??"");
  const agent=request.headers.get("user-agent");
  if(!sourceUrl || !agent) return null;
  return {event_name:"Lead",event_id:record.id,event_time:Math.floor(Date.parse(record.created_at)/1000),action_source:"website",event_source_url:sourceUrl,custom_data:{content_name:"slideshow_application"},user_data:{client_user_agent:agent,client_ip_address:request.headers.get("cf-connecting-ip")??request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()}};
}
async function sha256(value:string){const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");}
export async function buildMatchedMetaLead(record:MetaLeadInput,request:Request,latestConsent:unknown){
  const event=buildMetaLead(record,request,latestConsent);if(!event)return null;
  const code=countryCodeOf(record.country??"");
  return {...event,user_data:{...event.user_data,...(record.email?{em:[await sha256(record.email.toLowerCase().replace(/\s/g,""))]}:{}),...(code?{country:[await sha256(code.toLowerCase())]}:{}),...(record.fbc?{fbc:record.fbc}:{}),...(record.fbp?{fbp:record.fbp}:{})}};
}
/** No provider call until an accessible Meta app connection supplies a verified transport.
 * This adapter intentionally does not repurpose META_ADS_TOKEN or invent gateway credentials.
 * A future transport must recheck stored consent before every send/retry.
 */
export async function sendSlideshowMetaLead(record:MetaLeadInput,request:Request,latestConsent:unknown):Promise<{sent:false;reason:"not_connected"}> {
  if(await buildMatchedMetaLead(record,request,latestConsent))console.error("Slideshow Meta CAPI not connected; application saved");
  return {sent:false,reason:"not_connected"};
}