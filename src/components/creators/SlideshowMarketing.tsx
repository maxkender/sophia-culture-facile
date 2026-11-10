import {useEffect,useState} from "react";
import {Button} from "@/components/ui/button";
import {CONSENT_KEY,CONSENT_VERSION,browserConsent,marketingAllowed,type MarketingConsent} from "@/lib/slideshow-marketing-consent";
import {ATTRIBUTION_STORAGE_KEY,captureAttribution} from "@/lib/slideshow-attribution";
import {initializeSlideshowPixel,revokeSlideshowPixel} from "@/lib/slideshow-meta-pixel";
import {slideshowMetaConfig} from "@/lib/slideshow-meta.functions";
import {slideshowStrings} from "@/i18n/slideshow-pages";

export function browserAttribution(){try{return captureAttribution(window.localStorage,window.location.href,marketingAllowed());}catch{return captureAttribution({getItem:()=>null,setItem:()=>{},removeItem:()=>{}},window.location.href,false);}}
export function SlideshowMarketing({lang}:{lang:string}) {
  const t=slideshowStrings(lang).apply;
  const [open,setOpen]=useState(false);
  const [choice,setChoice]=useState<MarketingConsent|null>(null);
  useEffect(()=>{
    setOpen(!browserConsent());
    const sync=()=>{const c=browserConsent();setChoice(c);browserAttribution();if(!marketingAllowed())revokeSlideshowPixel();else void slideshowMetaConfig().then(config=>{if(marketingAllowed()&&config.connected)initializeSlideshowPixel(config.pixelId);}).catch(()=>{});};
    const onStorage=(event:StorageEvent)=>{if(event.key===CONSENT_KEY){sync();setOpen(false);}};
    sync();window.addEventListener("storage",onStorage);window.addEventListener("slideshow-consent",sync);return()=>{window.removeEventListener("storage",onStorage);window.removeEventListener("slideshow-consent",sync);};
  },[]);
  function choose(accepted:boolean){
    const gpc=Boolean((navigator as Navigator&{globalPrivacyControl?:boolean}).globalPrivacyControl);
    const c:MarketingConsent={id:choice?.id??crypto.randomUUID(),accepted:accepted&&!gpc,at:new Date().toISOString(),version:CONSENT_VERSION,gpc};
    try {localStorage.setItem(CONSENT_KEY,JSON.stringify(c));if(!c.accepted){const raw=JSON.parse(localStorage.getItem(ATTRIBUTION_STORAGE_KEY)??"null");if(raw?.data){delete raw.data.fbclid;localStorage.setItem(ATTRIBUTION_STORAGE_KEY,JSON.stringify(raw));}for(const name of ["_fbp","_fbc"])document.cookie=`${name}=; Max-Age=0; path=/; SameSite=Lax`;}}catch{/* choice still applies to this visit */}
    setChoice(c);setOpen(false);window.dispatchEvent(new Event("slideshow-consent"));
    if(!c.accepted){revokeSlideshowPixel();const url=new URL(window.location.href);url.searchParams.delete("fbclid");window.history.replaceState(window.history.state,"",url.pathname+url.search+url.hash);}
  }
  return <div className="mx-auto w-full max-w-[700px] px-4 pb-6 text-sm">
    <Button variant="link" size="sm" className="px-0 text-doc-muted" onClick={()=>setOpen(true)}>{t.cookieSettings}</Button>
    {open && <section aria-label={t.cookieSettings} className="fixed inset-x-0 bottom-0 z-50 max-h-[45dvh] overflow-y-auto border-t border-doc-line bg-doc-paper px-4 py-3"><div className="mx-auto max-w-[700px]"><p className="text-sm leading-relaxed text-doc-muted">{t.cookieNotice}</p><div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={()=>choose(false)}>{t.cookieReject}</Button><Button variant="outline" size="sm" onClick={()=>choose(true)}>{t.cookieAccept}</Button></div></div></section>}
  </div>;
}