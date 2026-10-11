import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { APPS_KEY, appLogoUrl, useApps, type AppRow } from "@/lib/apps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageTitle, PortalCard } from "../ui";

const FIELDS: { k: keyof AppRow; label: string; long?: boolean; hint?: string }[] = [
  { k: "name", label: "Name" },
  { k: "tagline", label: "Tagline" },
  { k: "short_description", label: "Short description (used on public pages)", long: true },
  { k: "users_line", label: "Users line", hint: "e.g. 200,000 active users. Leave empty to hide the sentence." },
  { k: "creators_line", label: "Creators line", hint: "Leave empty to hide the sentence." },
  { k: "primary_color", label: "Primary colour (hex)" },
  { k: "accent_color", label: "Accent colour (hex)" },
  { k: "domain", label: "Domain", hint: "e.g. unswipe.app — once it points at this site, pages on it use this app's branding." },
  { k: "app_store_url", label: "App Store link" },
  { k: "play_store_url", label: "Google Play link" },
  { k: "taap_url", label: "Smart link (taap.it)" },
];

export function AppsSettings() {
  const { data: apps = [] } = useApps();
  const qc = useQueryClient();
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  async function create() {
    const slug = newSlug.trim().toLowerCase();
    if (!/^[a-z][a-z0-9-]{1,30}$/.test(slug) || !newName.trim()) return void toast.error("Give a short id (lowercase letters, numbers, dashes) and a name.");
    const { error } = await supabase.from("apps").insert({ slug, name: newName.trim() });
    if (error) return void toast.error(error.code === "23505" ? "That id is already used." : "Could not add the app.");
    setNewSlug(""); setNewName(""); toast.success("App added."); void qc.invalidateQueries({ queryKey: APPS_KEY });
  }
  return (
    <div className="space-y-6">
      <PageTitle title="Apps" lead="Every app the creators can work for. Briefs, posts, deals, applications and payouts are tagged with one of these." />
      {apps.map((a) => <AppEditor key={a.id} app={a} />)}
      <PortalCard className="space-y-3">
        <p className="font-bold text-brand-navy">Add an app</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><Label htmlFor="new-slug">Short id</Label><Input id="new-slug" placeholder="e.g. newapp" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} /></div>
          <div><Label htmlFor="new-name">Name</Label><Input id="new-name" value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
          <div className="flex items-end"><Button onClick={create}>Add app</Button></div>
        </div>
        <p className="text-xs text-brand-navySoft">Its public creator pages will live at /creators/{newSlug || "id"} until a domain is connected.</p>
      </PortalCard>
    </div>
  );
}

function AppEditor({ app }: { app: AppRow }) {
  const qc = useQueryClient();
  const [f, setF] = useState<Record<string, string>>(() => Object.fromEntries(FIELDS.map(({ k }) => [k, String(app[k] ?? "")])));
  const [active, setActive] = useState(app.active);
  const [busy, setBusy] = useState(false);
  async function save() {
    const color = /^#[0-9a-f]{6}$/i;
    for (const k of ["primary_color", "accent_color"]) if (f[k] && !color.test(f[k]!)) return void toast.error("Colours must look like #1A2B3C.");
    for (const k of ["app_store_url", "play_store_url", "taap_url"]) if (f[k] && !/^https:\/\//.test(f[k]!)) return void toast.error("Store links must start with https://");
    if (!f["name"]?.trim()) return void toast.error("The app needs a name.");
    setBusy(true);
    const patch = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim() || null]));
    const { error } = await supabase.from("apps").update({ ...patch, domain: patch["domain"]?.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "") ?? null, active } as never).eq("id", app.id);
    setBusy(false);
    if (error) return void toast.error("Could not save.");
    toast.success(`${f["name"]} saved.`); void qc.invalidateQueries({ queryKey: APPS_KEY });
  }
  async function upload(file: File) {
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type) || file.size > 300 * 1024) return void toast.error("Use a PNG, JPG, WebP or SVG under 300 KB.");
    const dataUrl = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file); });
    const { error } = await supabase.from("apps").update({ logo_path: dataUrl }).eq("id", app.id);
    if (error) return void toast.error("Could not save the logo.");
    toast.success("Logo updated."); void qc.invalidateQueries({ queryKey: APPS_KEY });
  }
  const logo = appLogoUrl(app.logo_path);
  return (
    <PortalCard className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {logo ? <img src={logo} alt={`${app.name} logo`} className="size-12 rounded-xl object-cover" /> : <span className="flex size-12 items-center justify-center rounded-xl text-lg font-extrabold text-card" style={{ background: app.primary_color ?? "var(--brand-navy)" }}>{app.name.slice(0, 1)}</span>}
        <div className="flex-1"><p className="text-lg font-extrabold text-brand-navy">{app.name}</p><p className="text-xs text-brand-navySoft">id: {app.slug} · public creator pages: /creators/{app.slug === "sophia" ? "" : app.slug}</p></div>
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" className="size-5" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active</label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {FIELDS.map(({ k, label, long, hint }) => (
          <div key={k} className={long ? "md:col-span-2" : undefined}>
            <Label htmlFor={`${app.id}-${k}`}>{label}</Label>
            {long ? <Textarea id={`${app.id}-${k}`} rows={3} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /> : <Input id={`${app.id}-${k}`} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />}
            {hint ? <p className="mt-1 text-xs text-brand-navySoft">{hint}</p> : null}
            {k === "app_store_url" && !f[k] ? <p className="mt-1 text-xs font-semibold text-destructive">lien store à renseigner</p> : null}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        <label className="text-sm font-semibold text-portal-accent">Upload logo<input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} /></label>
      </div>
    </PortalCard>
  );
}
