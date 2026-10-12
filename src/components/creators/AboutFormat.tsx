import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatText, useUgcFormats } from "@/lib/ugc-formats";
import { creatorLang, L } from "@/i18n/creator-app";
import type { BriefStyle } from "@/lib/brief-studio";
export function AboutFormat({ formatKey }: { formatKey: BriefStyle }) {
  const [open, setOpen] = useState(false);
  const { data = [] } = useUgcFormats();
  const f = data.find((x) => x.key === formatKey);
  const lang = creatorLang();
  return <><Button size="sm" variant="link" className="h-auto px-0 text-xs" onClick={() => setOpen(true)}>{L("About this format", "À propos de ce format")}</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>{f ? (lang === "fr" ? f.name_fr : f.name_en) : L("Format", "Format")}</DialogTitle></DialogHeader>{f ? <div className="space-y-4 text-sm"><p>{formatText(f.description, lang)}</p><section><h3 className="font-semibold">{L("When to use it", "Quand l’utiliser")}</h3><p>{formatText(f.when_to_use, lang)}</p></section><section><h3 className="font-semibold">{L("Tips", "Conseils")}</h3><p className="whitespace-pre-wrap">{formatText(f.tips, lang)}</p></section></div> : <p>{L("Loading…", "Chargement…")}</p>}</DialogContent></Dialog></>;
}
