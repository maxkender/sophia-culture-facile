import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CountrySelect } from "@/components/creators/CountrySelect";
import { useApps } from "@/lib/apps";
import { adminInviteCreator } from "@/lib/ugc-admin.functions";

/** Hub → UGC → Creators: invite a creator recruited outside the site (same onboarding as Accept). */
export function AddCreatorDialog() {
  const qc = useQueryClient();
  const invite = useServerFn(adminInviteCreator);
  const { data: apps = [] } = useApps();
  const active = apps.filter((a) => a.active);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", country: "", language: "fr" as "fr" | "en", tiktok: "", instagram: "" });
  const [picked, setPicked] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const appIds = picked ?? active.map((a) => a.id);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit() {
    if (!f.firstName.trim() || !f.lastName.trim()) { toast.error("Enter first and last name."); return; }
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) { toast.error("Enter a valid email."); return; }
    if (!appIds.length) { toast.error("Pick at least one app."); return; }
    setBusy(true);
    try {
      const r = await invite({ data: { ...f, country: f.country || null, tiktok: f.tiktok || null, instagram: f.instagram || null, appIds, origin: window.location.origin } });
      if (!r.ok) { toast.error(r.error); return; }
      if (!r.emailSent) toast.warning("Creator added, but the email could not be sent. Use Resend invitation on their page.");
      setDone(f.email.trim().toLowerCase());
      void qc.invalidateQueries({ queryKey: ["hub", "ugc-creators-simple"] });
    } catch {
      toast.error("The creator could not be added. Check the details and try again.");
    } finally { setBusy(false); }
  }
  function close(o: boolean) {
    setOpen(o);
    if (!o) { setDone(null); setPicked(null); setF({ firstName: "", lastName: "", email: "", country: "", language: "fr", tiktok: "", instagram: "" }); }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Add creator</Button>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add creator</DialogTitle></DialogHeader>
        {done ? (
          <div className="space-y-4">
            <p className="rounded-xl bg-portal-green/10 p-3 text-sm font-semibold text-brand-navy" data-testid="invite-sent">Invitation sent to {done}</p>
            <Button className="w-full" onClick={() => close(false)}>Done</Button>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="First name" value={f.firstName} onChange={set("firstName")} />
              <Input placeholder="Last name" value={f.lastName} onChange={set("lastName")} />
            </div>
            <Input type="email" placeholder="Email" value={f.email} onChange={set("email")} />
            <CountrySelect value={f.country} onChange={(v) => setF({ ...f, country: v })} lang="en" labels={{ select: "Country", search: "Search…", empty: "No country" }} />
            <div className="flex items-center gap-3">
              <span className="text-brand-navySoft">Language</span>
              {(["fr", "en"] as const).map((l) => (
                <label key={l} className="flex items-center gap-1"><input type="radio" checked={f.language === l} onChange={() => setF({ ...f, language: l })} />{l.toUpperCase()}</label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="TikTok (optional)" value={f.tiktok} onChange={set("tiktok")} />
              <Input placeholder="Instagram (optional)" value={f.instagram} onChange={set("instagram")} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-brand-navySoft">Apps</span>
              {active.map((a) => (
                <label key={a.id} className="flex items-center gap-1">
                  <input type="checkbox" checked={appIds.includes(a.id)} onChange={(e) => setPicked(e.target.checked ? [...appIds, a.id] : appIds.filter((x) => x !== a.id))} />{a.name}
                </label>
              ))}
            </div>
            <Button className="w-full" disabled={busy} onClick={() => void submit()}>{busy ? "Sending…" : "Invite"}</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
