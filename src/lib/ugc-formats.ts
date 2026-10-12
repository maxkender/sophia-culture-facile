import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { blankPlan, styleDefaults, type BriefStyle, type Plan, type StyleData } from "@/lib/brief-studio";

export type FormatShot = Plan & { label: string };
export type FormatStructure = { shots: FormatShot[]; fields: string[] };
export type UgcFormat = { id: string; key: BriefStyle; name_fr: string; name_en: string; description: string; when_to_use: string; structure: FormatStructure; tips: string; example_inspiration_ids: string[]; sort_order: number };
export const formatQuery = () => ({ queryKey: ["ugc-formats"], queryFn: async () => { const { data, error } = await supabase.from("ugc_formats").select("*").order("sort_order"); if (error) throw error; return (data ?? []) as unknown as UgcFormat[]; }, staleTime: 60_000 });
export const useUgcFormats = () => useQuery(formatQuery());
export function formatText(text: string, lang: "fr" | "en" = "en") { try { const v = JSON.parse(text); return typeof v === "object" && v ? String(v[lang] ?? v.en ?? "") : text; } catch { return text; } }
export function setFormatText(text: string, lang: "fr" | "en", value: string) { let v: Record<string, string>; try { const x = JSON.parse(text); v = typeof x === "object" && x ? x : { en: text, fr: text }; } catch { v = { en: text, fr: text }; } return JSON.stringify({ ...v, [lang]: value }); }
export function formatDefaults(format: UgcFormat, data: StyleData = {}): StyleData {
  const base = styleDefaults(format.key, data);
  return { ...base, plans: format.structure.shots.map((shot) => { const { label: _label, ...plan } = shot; return { ...blankPlan(), ...plan, assets: [...(plan.assets ?? [])] }; }) };
}
