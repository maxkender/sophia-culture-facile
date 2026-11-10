import { validMarketingConsent } from "./slideshow-marketing-consent";
import { safeLandingUrl } from "./slideshow-attribution";

export type MetaLeadInput={id:string;created_at:string;marketing_consent:unknown;landing_url:string|null};
export function buildMetaLead(record:MetaLeadInput,request:Request,latestConsent:unknown) {
  if(request.headers.get("sec-gpc")==="1" || !validMarketingConsent(record.marketing_consent) || !validMarketingConsent(latestConsent)) return null;
  const sourceUrl=safeLandingUrl(record.landing_url??"");
  const agent=request.headers.get("user-agent");
  if(!sourceUrl || !agent) return null;
  return {event_name:"Lead",event_id:record.id,event_time:Math.floor(Date.parse(record.created_at)/1000),action_source:"website",event_source_url:sourceUrl,user_data:{client_user_agent:agent,client_ip_address:request.headers.get("cf-connecting-ip")??request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()}};
}
/** No provider call until an accessible Meta app connection supplies a verified transport.
 * This adapter intentionally does not repurpose META_ADS_TOKEN or invent gateway credentials.
 * A future transport must recheck stored consent before every send/retry.
 */
export async function sendSlideshowMetaLead(_record:MetaLeadInput,_request:Request,_latestConsent:unknown):Promise<{sent:false;reason:"not_connected"}> {return {sent:false,reason:"not_connected"};}