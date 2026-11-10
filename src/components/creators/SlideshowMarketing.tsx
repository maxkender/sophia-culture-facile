import {useEffect,useState} from "react";
import {Button} from "@/components/ui/button";
import {CONSENT_KEY,CONSENT_VERSION,browserConsent,marketingAllowed,type MarketingConsent} from "@/lib/slideshow-marketing-consent";
import {ATTRIBUTION_STORAGE_KEY,captureAttribution} from "@/lib/slideshow-attribution";
import {initializeSlideshowPixel,revokeSlideshowPixel} from "@/lib/slideshow-meta-pixel";
import {slideshowMetaConfig} from "@/lib/slideshow-meta.functions";
import {slideshowStrings} from "@/i18n/slideshow-pages";

export function browserAttribution(){return captureAttribution(window.localStorage,window.location.href,marketingAllowed());}
export function SlideshowMarketing({lang}:{lang:string}) {
  const t=slideshowStrings(lang).apply;
  const [open,setOpen]=useState(false);
  const [choice,setChoice]=useState<MarketingConsent|null>(null);
  useEffect(()=>{
    const sync=()=>{const c=browserConsent();setChoice(c);setOpen(!c);browserAttribution();if(!marketingAllowed())revokeSlideshowPixel();else void slideshowMetaConfig().then(config=>{if(marketingAllowed()&&config.connected)initializeSlideshowPixel(config.pixelId);}).catch(()=>{});};
    sync();window.addEventListener("storage",sync);window.addEventListener("slideshow-consent",sync);return()=>{window.removeEventListener("storage",sync);window.removeEventListener("slideshow-consent",sync);};
  },[]);
  function choose(accepted:boolean){
    const gpc=Boolean((navigator as Navigator&{globalPrivacyControl?:boolean}).globalPrivacyControl);
    const c:MarketingConsent={id:choice?.id??crypto.randomUUID(),accepted:accepted&&!gpc,at:new Date().toISOString(),version:CONSENT_VERSION,gpc};
    try {localStorage.setItem(CONSENT_KEY,JSON.stringify(c));if(!c.accepted){const raw=JSON.parse(localStorage.getItem(ATTRIBUTION_STORAGE_KEY)??"null");if(raw?.data){delete raw.data.fbclid;localStorage.setItem(ATTRIBUTION_STORAGE_KEY,JSON.stringify(raw));}for(const name of ["_fbp","_fbc"])document.cookie=`${name}=; Max-Age=0; path=/; SameSite=Lax`;}}catch{/* choice still applies to this visit */}
    setChoice(c);setOpen(false);window.dispatchEvent(new Event("slideshow-consent"));
  }
  return <div className="mx-auto w-full max-w-[700px] px-4 pb-6 text-sm">
    <Button variant="link" size="sm" className="px-0 text-doc-muted" onClick={()=>setOpen(true)}>{t.cookieSettings}</Button>
    {open && <section aria-label={t.cookieSettings} className="border-t border-doc-line py-4"><p className="text-sm leading-relaxed text-doc-muted">{t.cookieNotice}</p><div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={()=>choose(false)}>{t.cookieReject}</Button><Button variant="outline" size="sm" onClick={()=>choose(true)}>{t.cookieAccept}</Button></div></section>}
  </div>;
}