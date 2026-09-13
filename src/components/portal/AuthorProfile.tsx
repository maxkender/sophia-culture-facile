import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePortalProfile } from "./usePortal";
import { PageTitle, PortalCard } from "./ui";

export function AuthorProfile() {
  const queryClient = useQueryClient();
  const { data: me } = usePortalProfile();
  const profile = me?.profile ?? null;

  const [form, setForm] = useState({ title: "", institution: "", country: "", bio: "" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setForm({
      title: profile.title ?? "",
      institution: profile.institution ?? "",
      country: profile.country ?? "",
      bio: profile.bio ?? "",
    });
  }, [profile?.id]);

  const { data: photoUrl } = useQuery({
    queryKey: ["portal", "my-photo", profile?.photo_url],
    enabled: Boolean(profile?.photo_url),
    queryFn: async () => {
      const { data } = await supabase.storage.from("author-photos").createSignedUrl(profile!.photo_url!, 1800);
      return data?.signedUrl ?? null;
    },
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;
    if (form.bio.length > 1200) {
      setError("Keep the biography under 1200 characters.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      let photoPath = profile.photo_url;
      if (photo) {
        if (photo.size > 5 * 1024 * 1024) {
          setError("The photo must be smaller than 5 MB.");
          return;
        }
        const path = `${profile.id}/${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9.]/g, "-")}`;
        const { error: uploadError } = await supabase.storage.from("author-photos").upload(path, photo);
        if (uploadError) {
          setError("The photo could not be uploaded.");
          return;
        }
        photoPath = path;
      }
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          title: form.title.trim() || null,
          institution: form.institution.trim() || null,
          country: form.country.trim() || null,
          bio: form.bio.trim() || null,
          photo_url: photoPath,
        })
        .eq("id", profile.id);
      if (updateError) {
        setError("Your details could not be saved.");
        return;
      }
      setPhoto(null);
      await queryClient.invalidateQueries({ queryKey: ["portal"] });
      toast.success("Your details are saved.");
    } finally {
      setBusy(false);
    }
  }

  if (!profile) return null;

  return (
    <div>
      <PageTitle
        title="Your details"
        lead="Correct anything the editorial desk got wrong. Your email address and your commissioned courses are fixed."
      />
      <PortalCard className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-5">
          {photoUrl ? (
            <img src={photoUrl} alt="" className="size-20 rounded-full object-cover" width={80} height={80} />
          ) : null}
          <div>
            <p className="text-xl font-extrabold text-brand-navy">{profile.full_name}</p>
            <p className="text-sm text-brand-navySoft">{profile.email}</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="p-title">Title</Label>
            <Input id="p-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-institution">Institution</Label>
            <Input id="p-institution" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-country">Country</Label>
            <Input id="p-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-photo">Replace your photo</Label>
            <Input id="p-photo" type="file" accept="image/*" className="h-11" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="p-bio">Short biography</Label>
            <Textarea id="p-bio" rows={5} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          {error ? <p className="text-sm font-semibold text-portal-red md:col-span-2">{error}</p> : null}
          <div className="md:col-span-2">
            <Button type="submit" variant="pill" size="pillSm" disabled={busy}>
              {busy ? "Saving…" : "Save my details"}
            </Button>
          </div>
        </form>
      </PortalCard>
    </div>
  );
}
