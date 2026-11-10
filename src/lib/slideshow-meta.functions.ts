import {createServerFn} from "@tanstack/react-start";
/** Recruiting public config exposes connection status only, never secret values. Pixel is disabled until both paths are connected. */
export const slideshowMetaConfig=createServerFn({method:"GET"}).handler(async()=>({connected:false,pixelId:null as string|null}));