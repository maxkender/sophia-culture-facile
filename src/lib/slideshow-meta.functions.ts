import {createServerFn} from "@tanstack/react-start";
/** Public pixel identity is safe; server transport remains unavailable until a Meta connection is linked. */
export const slideshowMetaConfig=createServerFn({method:"GET"}).handler(async()=>({connected:false,pixelId:"1755822698850602" as string|null}));