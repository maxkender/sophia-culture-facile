import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { newInviteToken } from "@/lib/portal";
import { PageTitle, PortalCard } from "../ui";

export function CreateAuthor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    title: "",
    institution: "",
    country: "",
    platform: "ios",
    bio: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const platform = form.platform as "ios" | "android";
      const { data: codes } = await supabase
        .from("access_codes")
        .select("*")
        .eq("state", "available")
        .eq("platform", platform)
        .order("code")
        .limit(1);
      const code = codes?.[0] ?? null;

      const inviteToken = newInviteToken();
      const { data: profile, error } = await supabase
        .from("profiles")
        .insert({
          email: form.email.trim().toLowerCase(),
          role: "author",
          full_name: form.full_name.trim(),
          title: form.title.trim() || null,
          institution: form.institution.trim() || null,
          country: form.country.trim() || null,
          platform: form.platform as "ios" | "android",
          bio: form.bio.trim() || null,
          access_code: code?.code ?? null,
          access_redeem_url: code?.redeem_url ?? null,
          invite_token: inviteToken,
          invited_at: new Date().toISOString(),
        })
        .select("*")
        .single();
      if (error || !profile) throw error ?? new Error("insert failed");

      if (code) {
        await supabase
          .from("access_codes")
          .update({ state: "assigned", assigned_to: profile.id, assigned_at: new Date().toISOString() })
          .eq("id", code.id)
          .eq("state", "available");
      }

      if (photo) {
        const path = `${profile.id}/${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9.]/g, "-")}`;
        const { error: uploadError } = await supabase.storage.from("author-photos").upload(path, photo, {
          upsert: true,
        });
        if (!uploadError) {
          await supabase.from("profiles").update({ photo_url: path }).eq("id", profile.id);
        }
      }

      if (!code)
        toast.warning(
          `Author created, but there is no available ${platform === "android" ? "Google Play" : "App Store"} code left.`,
        );
      else toast.success("Author created and access code assigned.");
      await queryClient.invalidateQueries({ queryKey: ["portal", "admin"] });
      await navigate({ to: "/auteurs/admin/authors/$authorId", params: { authorId: profile.id } });
    } catch {
      toast.error("The author could not be created. Check the email is not already used.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageTitle
        title="New author"
        lead="Create the record now; the author attaches their sign-in later through the invite link."
      />
      <PortalCard className="max-w-3xl">
        <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" required value={form.full_name} onChange={(e) => update("full_name", e.target.value)} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="institution">Institution</Label>
            <Input id="institution" value={form.institution} onChange={(e) => update("institution", e.target.value)} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" value={form.country} onChange={(e) => update("country", e.target.value)} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select value={form.platform} onValueChange={(value) => update("platform", value)}>
              <SelectTrigger id="platform" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ios">iOS</SelectItem>
                <SelectItem value="android">Android</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bio">Short bio</Label>
            <Textarea id="bio" rows={4} value={form.bio} onChange={(e) => update("bio", e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="photo">Photo</Label>
            <Input id="photo" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="h-11" />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" variant="pill" size="pillSm" disabled={busy}>
              {busy ? "Creating…" : "Create author"}
            </Button>
          </div>
        </form>
      </PortalCard>
    </div>
  );
}
