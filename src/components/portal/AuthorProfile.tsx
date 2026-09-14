import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AuthorByline } from "@/components/site/AuthorByline";
import { usePortalProfile } from "./usePortal";
import { Banner, PageTitle, PortalCard } from "./ui";

type EducationRow = {
  id: string;
  degree: string;
  field: string;
  institution: string;
  year: string;
  isNew?: boolean;
};

const BIO_MAX = 300;

export function AuthorProfile() {
  const queryClient = useQueryClient();
  const { data: me } = usePortalProfile();
  const profile = me?.profile ?? null;
  const signed = Boolean(me?.signedAt);

  const [form, setForm] = useState({
    display_name: "",
    display_title: "",
    institution: "",
    country: "",
    short_bio: "",
    orcid: "",
    personal_site: "",
    scholar_url: "",
  });
  const [education, setEducation] = useState<EducationRow[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: records } = useQuery({
    queryKey: ["portal", "education", profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const { data } = await supabase
        .from("education_records")
        .select("*")
        .eq("profile_id", profile!.id)
        .order("order_index");
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      display_name: profile.display_name ?? profile.full_name ?? "",
      display_title: profile.display_title ?? "",
      institution: profile.institution ?? "",
      country: profile.country ?? "",
      short_bio: profile.short_bio ?? "",
      orcid: profile.orcid ?? "",
      personal_site: profile.personal_site ?? "",
      scholar_url: profile.scholar_url ?? "",
    });
  }, [profile?.id]);

  useEffect(() => {
    if (!records) return;
    setEducation(
      records.map((record) => ({
        id: record.id,
        degree: record.degree ?? "",
        field: record.field ?? "",
        institution: record.institution ?? "",
        year: record.year ?? "",
      })),
    );
  }, [records]);

  const { data: photoUrl } = useQuery({
    queryKey: ["portal", "my-photo", profile?.photo_url],
    enabled: Boolean(profile?.photo_url),
    queryFn: async () => {
      const { data } = await supabase.storage.from("author-photos").createSignedUrl(profile!.photo_url!, 1800);
      return data?.signedUrl ?? null;
    },
  });

  const previewPhoto = photo ? URL.createObjectURL(photo) : (photoUrl ?? null);

  function addRow() {
    setEducation((rows) => [
      ...rows,
      { id: `new-${Date.now()}-${rows.length}`, degree: "", field: "", institution: "", year: "", isNew: true },
    ]);
  }

  function removeRow(id: string) {
    setEducation((rows) => rows.filter((row) => row.id !== id));
    if (!id.startsWith("new-")) setRemoved((ids) => [...ids, id]);
  }

  function setRow(id: string, patch: Partial<EducationRow>) {
    setEducation((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;
    if (!form.display_name.trim()) {
      setError("Your published name cannot be empty.");
      return;
    }
    if (form.short_bio.length > BIO_MAX) {
      setError(`Keep the short biography under ${BIO_MAX} characters.`);
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
          display_name: form.display_name.trim(),
          display_title: form.display_title.trim() || null,
          institution: form.institution.trim() || null,
          country: form.country.trim() || null,
          short_bio: form.short_bio.trim() || null,
          orcid: form.orcid.trim() || null,
          personal_site: form.personal_site.trim() || null,
          scholar_url: form.scholar_url.trim() || null,
          photo_url: photoPath,
        })
        .eq("id", profile.id);
      if (updateError) {
        setError("Your details could not be saved.");
        return;
      }

      if (removed.length > 0) {
        await supabase.from("education_records").delete().in("id", removed);
        setRemoved([]);
      }

      const rows = education.filter((row) => row.degree.trim() || row.field.trim() || row.institution.trim());
      for (const [index, row] of rows.entries()) {
        const payload = {
          profile_id: profile.id,
          degree: row.degree.trim() || null,
          field: row.field.trim() || null,
          institution: row.institution.trim() || null,
          year: row.year.trim() || null,
          order_index: index,
        };
        if (row.isNew) await supabase.from("education_records").insert(payload);
        else await supabase.from("education_records").update(payload).eq("id", row.id);
      }

      setPhoto(null);
      await queryClient.invalidateQueries({ queryKey: ["portal"] });
      toast.success("Your publication profile is saved.");
    } finally {
      setBusy(false);
    }
  }

  if (!profile) return null;

  return (
    <div>
      <PageTitle
        title="Your publication profile"
        lead="This is what readers see under every course you publish, in the app and on the site. It is yours to control."
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <PortalCard>
            <h2 className="text-sm font-bold uppercase tracking-wide text-brand-navySoft">Published identity</h2>
            <form onSubmit={submit} className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="p-legal">Legal name</Label>
                <Input id="p-legal" value={profile.full_name} disabled className="h-11" />
                <p className="text-xs text-brand-navySoft">
                  Fixed by the editorial desk: the agreement is signed under this name. Write to us if it is wrong.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="p-display">Published name</Label>
                <Input
                  id="p-display"
                  value={form.display_name}
                  onChange={(event) => setForm({ ...form, display_name: event.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-title">Byline (one line)</Label>
                <Input
                  id="p-title"
                  value={form.display_title}
                  onChange={(event) => setForm({ ...form, display_title: event.target.value })}
                  placeholder="PhD in Marine Ecology, Université de Montpellier"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-institution">Institution</Label>
                <Input
                  id="p-institution"
                  value={form.institution}
                  onChange={(event) => setForm({ ...form, institution: event.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-country">Country</Label>
                <Input
                  id="p-country"
                  value={form.country}
                  onChange={(event) => setForm({ ...form, country: event.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="p-bio">Short biography (published)</Label>
                <Textarea
                  id="p-bio"
                  rows={4}
                  maxLength={BIO_MAX}
                  value={form.short_bio}
                  onChange={(event) => setForm({ ...form, short_bio: event.target.value })}
                />
                <p className="text-xs text-brand-navySoft">
                  {form.short_bio.length} / {BIO_MAX} characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-photo">Photo</Label>
                <Input
                  id="p-photo"
                  type="file"
                  accept="image/*"
                  className="h-11"
                  onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-orcid">ORCID</Label>
                <Input
                  id="p-orcid"
                  value={form.orcid}
                  onChange={(event) => setForm({ ...form, orcid: event.target.value })}
                  placeholder="0000-0002-1967-705X"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-site">Personal site</Label>
                <Input
                  id="p-site"
                  value={form.personal_site}
                  onChange={(event) => setForm({ ...form, personal_site: event.target.value })}
                  placeholder="https://"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-scholar">Google Scholar</Label>
                <Input
                  id="p-scholar"
                  value={form.scholar_url}
                  onChange={(event) => setForm({ ...form, scholar_url: event.target.value })}
                  placeholder="https://scholar.google.com/..."
                  className="h-11"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-brand-navySoft">
                    Education (most recent first)
                  </h3>
                  <Button type="button" variant="pillSecondary" size="pillSm" onClick={addRow}>
                    <Plus aria-hidden="true" className="mr-1 size-4" /> Add a degree
                  </Button>
                </div>
                <div className="mt-4 space-y-3">
                  {education.length === 0 ? (
                    <p className="text-sm text-brand-navySoft">
                      No degree listed yet. Readers use this to judge whether to trust the course.
                    </p>
                  ) : null}
                  {education.map((row) => (
                    <div key={row.id} className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_90px_40px]">
                      <Input
                        aria-label="Degree"
                        placeholder="PhD"
                        className="h-11"
                        value={row.degree}
                        onChange={(event) => setRow(row.id, { degree: event.target.value })}
                      />
                      <Input
                        aria-label="Field of study"
                        placeholder="Marine Ecology"
                        className="h-11"
                        value={row.field}
                        onChange={(event) => setRow(row.id, { field: event.target.value })}
                      />
                      <Input
                        aria-label="Institution"
                        placeholder="Université de Montpellier"
                        className="h-11"
                        value={row.institution}
                        onChange={(event) => setRow(row.id, { institution: event.target.value })}
                      />
                      <Input
                        aria-label="Year"
                        placeholder="2019"
                        className="h-11"
                        value={row.year}
                        onChange={(event) => setRow(row.id, { year: event.target.value })}
                      />
                      <button
                        type="button"
                        aria-label="Remove this degree"
                        onClick={() => removeRow(row.id)}
                        className="grid h-11 place-items-center rounded-xl text-brand-navySoft hover:bg-brand-navy/10"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {error ? <p className="text-sm font-semibold text-portal-red md:col-span-2">{error}</p> : null}
              <div className="md:col-span-2">
                <Button type="submit" variant="pill" size="pillSm" disabled={busy}>
                  {busy ? "Saving…" : "Save my profile"}
                </Button>
              </div>
            </form>
          </PortalCard>
        </div>

        <div className="space-y-5">
          <PortalCard>
            <h2 className="text-sm font-bold uppercase tracking-wide text-brand-navySoft">
              How readers will see you
            </h2>
            <div className="mt-5 rounded-2xl bg-brand-surface p-5">
              <p className="text-lg font-extrabold leading-snug text-brand-navy">Your course title</p>
              <div className="mt-4 border-t border-brand-line pt-4">
                <AuthorByline
                  linked={false}
                  author={{
                    display_name: form.display_name,
                    display_title: form.display_title || form.institution,
                    photo_url: previewPhoto,
                  }}
                />
              </div>
              {form.short_bio ? (
                <p className="mt-4 text-sm leading-relaxed text-brand-navySoft">{form.short_bio}</p>
              ) : null}
              {education.filter((row) => row.degree || row.field || row.institution).length > 0 ? (
                <ul className="mt-4 space-y-1 text-xs text-brand-navySoft">
                  {education
                    .filter((row) => row.degree || row.field || row.institution)
                    .map((row) => (
                      <li key={row.id}>
                        {[ [row.degree, row.field].filter(Boolean).join(", "), row.institution, row.year ]
                          .filter(Boolean)
                          .join(" — ")}
                      </li>
                    ))}
                </ul>
              ) : null}
            </div>
            <p className="mt-4 text-xs text-brand-navySoft">
              Updates as you type. This is the byline printed under every course you publish.
            </p>
          </PortalCard>

          {signed ? (
            <Banner tone="warning" title="Your agreement is signed">
              Changing your published name is recorded, because it changes the byline on work already accepted.
            </Banner>
          ) : null}
        </div>
      </div>
    </div>
  );
}
