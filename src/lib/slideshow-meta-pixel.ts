import { marketingAllowed } from "./slideshow-marketing-consent";
type Pixel=((...args:unknown[])=>void)&{callMethod?: (...args:unknown[])=>void;queue?:unknown[][];push?:Pixel;loaded?:boolean;version?:string};
declare global {interface Window {fbq?:Pixel;_fbq?:Pixel}}
let activePixel:string|null=null;
const sent=new Set<string>();
export function initializeSlideshowPixel(pixelId:string|null):void {
  if(!pixelId || !/^\d+$/.test(pixelId) || !marketingAllowed()) return;
  if(!window.fbq) {
    const q:Pixel=function(...args:unknown[]) {if(q.callMethod) q.callMethod.apply(q,args);else q.queue?.push(args);};
    q.queue=[];q.push=q;q.loaded=true;q.version="2.0";window.fbq=q;window._fbq=q;
    const script=document.createElement("script");script.src="https://connect.facebook.net/en_US/fbevents.js";script.async=true;script.id="slideshow-meta-pixel";document.head.appendChild(script);
  }
  window.fbq("consent","grant");
  if(activePixel!==pixelId){window.fbq("init",pixelId,{}, {agent:"lovable"});activePixel=pixelId;}
}
export function revokeSlideshowPixel():void {window.fbq?.("consent","revoke");}
export function slideshowPixelLead(eventId:string|undefined):void {
  if(!eventId || !activePixel || !marketingAllowed() || sent.has(eventId))return;
  sent.add(eventId);window.fbq?.("track","Lead",{}, {eventID:eventId});
}