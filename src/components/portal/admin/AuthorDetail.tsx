import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Check, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthorByline } from "@/components/site/AuthorByline";
import { formatDate, formatDateTime, inviteUrl, newInviteToken, type Course, type Profile } from "@/lib/portal";
import type { CourseStatus } from "@/config/portal";
import { AuthorAvatar, useSignedPhotos } from "../AuthorPhoto";
import { Banner, CopyButton, PageTitle, PortalCard, StatusPill } from "../ui";
import { OpenThreadButton } from "../OpenThreadButton";
import { StudioCreatorCard } from "@/components/studio/StudioDesk";

type Lot = {
  key: string;
  lot_code: string | null;
  lot_name: string | null;
  subject_area: string | null;
  courses: Course[];
};

type EducationRow = {
  id: string;
  degree: string;
  field: string;
  institution: string;
  year: string;
  isNew?: boolean;
};

const BIO_MAX = 300;

/** Groups an author's courses by lot, keeping the assigned order. */
function groupByLot(courses: Course[]): Lot[] {
  const lots: Lot[] = [];
  for (const course of courses) {
    const key = course.lot_code ?? course.lot_name ?? "none";
    let lot = lots.find((entry) => entry.key === key);
    if (!lot) {
      lot = {
        key,
        lot_code: course.lot_code,
        lot_name: course.lot_name,
        subject_area: course.subject_area,
        courses: [],
      };
      lots.push(lot);
    }
    lot.courses.push(course);
  }
  return lots;
}

function Step({ done, label, date }: { done: boolean; label: string; date?: string | null }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
        done ? "bg-portal-green/10 text-portal-green" : "bg-brand-line text-brand-navySoft"
      }`}
    >
      {done ? <Check className="size-3.5" aria-hidden="true" /> : <X className="size-3.5" aria-hidden="true" />}
      {label}
      {done && date ? <span className="font-semibold opacity-80">{formatDate(date)}</span> : null}
    </span>
  );
}

export function AuthorDetail({ authorId }: { authorId: string }) {
  const queryClient = useQueryClient();
  const [bulk, setBulk] = useState("");
  const [fee, setFee] = useState<string | null>(null);
  const [showDeclaration, setShowDeclaration] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [noteState, setNoteState] = useState<"idle" | "saving" | "saved">("idle");
  const [form, setForm] = useState({
    full_name: "",
    display_name: "",
    display_title: "",
    institution: "",
    country: "",
    platform: "",
    short_bio: "",
    orcid: "",
    personal_site: "",
    scholar_url: "",
  });
  const [education, setEducation] = useState<EducationRow[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [courseForm, setCourseForm] = useState({
    lot_code: "",
    subject_area: "",
    title: "",
    subtitle: "",
    brief_note: "",
    due_date: "",
  });

  const { data } = useQuery({
    queryKey: ["portal", "admin", "author", authorId],
    queryFn: async () => {
      const [{ data: author }, { data: courses }, { data: contract }, { data: records }, { data: code }] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", authorId).maybeSingle(),
          supabase.from("courses").select("*").eq("author_id", authorId).order("order_index"),
          supabase
            .from("contracts")
            .select("*")
            .eq("author_id", authorId)
            .order("signed_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase.from("education_records").select("*").eq("profile_id", authorId).order("order_index"),
          supabase.from("access_codes").select("code, platform, state").eq("assigned_to", authorId).maybeSingle(),
        ]);

      const courseIds = (courses ?? []).map((row) => row.id);
      const filters = [`actor_id.eq.${authorId}`, `entity_id.eq.${authorId}`];
      if (courseIds.length > 0) filters.push(`entity_id.in.(${courseIds.join(",")})`);
      const { data: activity } = await supabase
        .from("activity_log")
        .select("*")
        .or(filters.join(","))
        .order("created_at", { ascending: false })
        .limit(50);

      const actorIds = Array.from(new Set((activity ?? []).map((row) => row.actor_id).filter(Boolean))) as string[];
      const { data: actors } = actorIds.length
        ? await supabase.from("profiles").select("id, full_name").in("id", actorIds)
        : { data: [] as { id: string; full_name: string }[] };

      return {
        author: (author ?? null) as Profile | null,
        courses: (courses ?? []) as Course[],
        contract,
        records: records ?? [],
        code,
        activity: activity ?? [],
        actorNames: new Map((actors ?? []).map((row) => [row.id, row.full_name])),
      };
    },
  });

  const author = data?.author ?? null;
  const courses = data?.courses ?? [];
  const records = data?.records;

  const { data: photos } = useSignedPhotos([author?.photo_url]);
  const storedPhoto = author?.photo_url ? (photos?.get(author.photo_url) ?? null) : null;
  const previewPhoto = photo ? URL.createObjectURL(photo) : storedPhoto;

  useEffect(() => {
    if (!author) return;
    setForm({
      full_name: author.full_name ?? "",
      display_name: author.display_name ?? author.full_name ?? "",
      display_title: author.display_title ?? "",
      institution: author.institution ?? "",
      country: author.country ?? "",
      platform: author.platform ?? "",
      short_bio: author.short_bio ?? "",
      orcid: author.orcid ?? "",
      personal_site: author.personal_site ?? "",
      scholar_url: author.scholar_url ?? "",
    });
    setNote(null);
  }, [author?.id, author?.updated_at]);

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

  // Admin notes autosave, quietly, a beat after typing stops.
  const noteTimer = useRef<number | null>(null);
  useEffect(() => {
    if (note === null) return;
    if (noteTimer.current) window.clearTimeout(noteTimer.current);
    setNoteState("saving");
    noteTimer.current = window.setTimeout(async () => {
      await supabase.from("profiles").update({ admin_note: note.trim() || null }).eq("id", authorId);
      setNoteState("saved");
    }, 800);
    return () => {
      if (noteTimer.current) window.clearTimeout(noteTimer.current);
    };
  }, [note, authorId]);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["portal", "admin"] });
  }

  async function saveProfile() {
    if (!author) return;
    setBusy(true);
    try {
      let photoPath = author.photo_url;
      if (photo) {
        const path = `${author.id}/${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9.]/g, "-")}`;
        const { error: uploadError } = await supabase.storage.from("author-photos").upload(path, photo);
        if (uploadError) {
          toast.error("The photo could not be uploaded.");
          return;
        }
        photoPath = path;
      }
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim() || author.full_name,
          display_name: form.display_name.trim() || null,
          display_title: form.display_title.trim() || null,
          institution: form.institution.trim() || null,
          country: form.country.trim() || null,
          platform: form.platform === "" ? null : (form.platform as "ios" | "android"),
          short_bio: form.short_bio.trim() || null,
          orcid: form.orcid.trim() || null,
          personal_site: form.personal_site.trim() || null,
          scholar_url: form.scholar_url.trim() || null,
          photo_url: photoPath,
        })
        .eq("id", author.id);
      if (error) {
        toast.error("The profile could not be saved.");
        return;
      }

      if (removed.length > 0) {
        await supabase.from("education_records").delete().in("id", removed);
        setRemoved([]);
      }
      const rows = education.filter((row) => row.degree.trim() || row.field.trim() || row.institution.trim());
      for (const [index, row] of rows.entries()) {
        const payload = {
          profile_id: author.id,
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
      setEditing(false);
      await refresh();
      toast.success("Profile saved.");
    } finally {
      setBusy(false);
    }
  }

  async function addCourse(event: FormEvent) {
    event.preventDefault();
    const { error } = await supabase.from("courses").insert({
      author_id: authorId,
      lot_code: courseForm.lot_code.trim() || null,
      subject_area: courseForm.subject_area.trim() || null,
      title: courseForm.title.trim(),
      subtitle: courseForm.subtitle.trim() || null,
      brief_note: courseForm.brief_note.trim() || null,
      due_date: courseForm.due_date || null,
      order_index: courses.length + 1,
      status: "assigned",
    });
    if (error) {
      toast.error("The course could not be added.");
      return;
    }
    setCourseForm({ lot_code: "", subject_area: "", title: "", subtitle: "", brief_note: "", due_date: "" });
    await refresh();
    toast.success("Course assigned.");
  }

  async function addBulk() {
    const lines = bulk.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const rows = lines.map((line, index) => {
      const [lot, subject, title, subtitle, due] = line.split(";").map((part) => part?.trim() ?? "");
      return {
        author_id: authorId,
        lot_code: lot || null,
        subject_area: subject || null,
        title: title || lot || "Untitled course",
        subtitle: subtitle || null,
        due_date: due || null,
        order_index: courses.length + index + 1,
        status: "assigned" as const,
      };
    });
    const { error } = await supabase.from("courses").insert(rows);
    if (error) {
      toast.error("Some rows could not be added. Check the format.");
      return;
    }
    setBulk("");
    await refresh();
    toast.success(`${rows.length} courses assigned.`);
  }

  /** Returns a course to the open pool. Anything already written is kept. */
  async function moveToPool(courseId: string) {
    const { error } = await supabase
      .from("courses")
      .update({
        author_id: null,
        status: "unassigned",
        released_from: authorId,
        released_at: new Date().toISOString(),
      })
      .eq("id", courseId);
    if (error) {
      toast.error("The course could not be moved back to the pool.");
      return;
    }
    await refresh();
    toast.success("Course moved back to the pool.");
  }

  async function saveFee() {
    if (fee === null) return;
    const { error } = await supabase.from("profiles").update({ fee: fee.trim() || null }).eq("id", authorId);
    if (error) {
      toast.error("The fee could not be saved.");
      return;
    }
    await refresh();
    toast.success("Fee saved.");
  }

  async function regenerateInvite() {
    const token = newInviteToken();
    await supabase
      .from("profiles")
      .update({ invite_token: token, invited_at: new Date().toISOString(), invite_expires_at: null })
      .eq("id", authorId);
    await refresh();
    toast.success("New invite link generated.");
  }

  if (!author) return <Banner tone="error" title="Author not found" />;

  const codePlatform = (data?.code?.platform as string | undefined) ?? null;
  const publishedName = author.display_name || author.full_name;
  const links = [
    author.orcid ? { label: "ORCID", href: `https://orcid.org/${author.orcid.replace(/^https?:\/\/orcid\.org\//, "")}` } : null,
    author.personal_site ? { label: "Personal site", href: author.personal_site } : null,
    author.scholar_url ? { label: "Google Scholar", href: author.scholar_url } : null,
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <div>
      <Link to="/auteurs/admin/authors" className="mb-6 inline-block text-sm font-semibold text-portal-accent">
        ← All authors
      </Link>
      {author.is_test ? (
        <p className="mb-3 inline-block rounded-full bg-brand-line px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-navySoft">
          Test account — excluded from dashboard figures
        </p>
      ) : null}
      <PageTitle
        title={author.full_name}
        lead={[author.display_title, author.institution, author.country].filter(Boolean).join(" · ")}
        action={<OpenThreadButton profileId={author.id} />}
      />
      <div className="mb-6"><StudioCreatorCard authorId={author.id} /></div>

      {/* ————— Identity ————— */}
      <PortalCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-5">
            <AuthorAvatar url={previewPhoto} name={publishedName} className="size-24" />
            <div>
              <p className="text-2xl font-extrabold leading-tight text-brand-navy">{publishedName}</p>
              {author.display_name && author.display_name !== author.full_name ? (
                <p className="text-sm text-brand-navySoft">Legal name: {author.full_name}</p>
              ) : null}
              <p className="mt-2 text-sm font-semibold text-brand-navy">
                {author.display_title ?? <span className="text-portal-amber">Byline to confirm</span>}
              </p>
              <p className="text-sm text-brand-navySoft">
                {author.institution ?? <span className="font-semibold text-portal-amber">Employer to confirm</span>}
                {author.country ? ` · ${author.country}` : ""}
              </p>
              <p className="mt-1 text-sm text-brand-navySoft">{author.email ?? "No email — contracted through Upwork"}</p>
            </div>
          </div>
          <Button type="button" variant="pillSecondary" size="pillSm" onClick={() => setEditing((open) => !open)}>
            {editing ? "Close editing" : "Edit this profile"}
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              author.upwork_status === "accepted"
                ? "bg-portal-green/10 text-portal-green"
                : author.upwork_status === "declined"
                  ? "bg-portal-red/10 text-portal-red"
                  : "bg-brand-line text-brand-navySoft"
            }`}
          >
            {author.upwork_status === "accepted"
              ? "Accepted on Upwork"
              : author.upwork_status === "declined"
                ? "Declined"
                : "Contacted on Upwork"}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              author.platform ? "bg-brand-line text-brand-navySoft" : "bg-portal-amber/15 text-portal-amber"
            }`}
          >
            {author.platform === "android" ? "Android" : author.platform === "ios" ? "iPhone" : "Phone unknown"}
          </span>
          <Step done={Boolean(author.activated_at)} label="Claimed" date={author.activated_at} />
          <Step done={Boolean(author.examples_reviewed_at)} label="Examples" date={author.examples_reviewed_at} />
          <Step done={Boolean(data?.contract)} label="Agreement" date={data?.contract?.signed_at ?? null} />
        </div>

        {editing ? (
          <div className="mt-6 border-t border-brand-line pt-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="a-legal">Legal name</Label>
                <Input
                  id="a-legal"
                  className="h-11"
                  value={form.full_name}
                  onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-display">Published name</Label>
                <Input
                  id="a-display"
                  className="h-11"
                  value={form.display_name}
                  onChange={(event) => setForm({ ...form, display_name: event.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="a-byline">Byline (one line, exactly as published)</Label>
                <Input
                  id="a-byline"
                  className="h-11"
                  value={form.display_title}
                  onChange={(event) => setForm({ ...form, display_title: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-institution">Where they work now</Label>
                <Input
                  id="a-institution"
                  className="h-11"
                  value={form.institution}
                  onChange={(event) => setForm({ ...form, institution: event.target.value })}
                />
                <p className="text-xs text-brand-navySoft">
                  Current post only. The university where they took a degree belongs under “Where they studied”.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-country">Country</Label>
                <Input
                  id="a-country"
                  className="h-11"
                  value={form.country}
                  onChange={(event) => setForm({ ...form, country: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-platform">Phone</Label>
                <Select
                  value={form.platform || "unknown"}
                  onValueChange={(value) => setForm({ ...form, platform: value === "unknown" ? "" : value })}
                >
                  <SelectTrigger id="a-platform" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">Not chosen</SelectItem>
                    <SelectItem value="ios">iPhone</SelectItem>
                    <SelectItem value="android">Android</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-photo">Photo</Label>
                <Input
                  id="a-photo"
                  type="file"
                  accept="image/*"
                  className="h-11"
                  onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="a-bio">Short biography (published)</Label>
                <Textarea
                  id="a-bio"
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
                <Label htmlFor="a-orcid">ORCID</Label>
                <Input
                  id="a-orcid"
                  className="h-11"
                  value={form.orcid}
                  onChange={(event) => setForm({ ...form, orcid: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-site">Personal site</Label>
                <Input
                  id="a-site"
                  className="h-11"
                  value={form.personal_site}
                  onChange={(event) => setForm({ ...form, personal_site: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-scholar">Google Scholar</Label>
                <Input
                  id="a-scholar"
                  className="h-11"
                  value={form.scholar_url}
                  onChange={(event) => setForm({ ...form, scholar_url: event.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-brand-navySoft">
                    Where they studied (most recent first)
                  </h3>
                  <Button
                    type="button"
                    variant="pillSecondary"
                    size="pillSm"
                    onClick={() =>
                      setEducation((rows) => [
                        ...rows,
                        {
                          id: `new-${Date.now()}-${rows.length}`,
                          degree: "",
                          field: "",
                          institution: "",
                          year: "",
                          isNew: true,
                        },
                      ])
                    }
                  >
                    <Plus aria-hidden="true" className="mr-1 size-4" /> Add a degree
                  </Button>
                </div>
                <div className="mt-4 space-y-3">
                  {education.map((row) => (
                    <div key={row.id} className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_90px_40px]">
                      <Input
                        aria-label="Degree"
                        placeholder="PhD"
                        className="h-11"
                        value={row.degree}
                        onChange={(event) =>
                          setEducation((rows) =>
                            rows.map((r) => (r.id === row.id ? { ...r, degree: event.target.value } : r)),
                          )
                        }
                      />
                      <Input
                        aria-label="Field of study"
                        placeholder="Political Science"
                        className="h-11"
                        value={row.field}
                        onChange={(event) =>
                          setEducation((rows) =>
                            rows.map((r) => (r.id === row.id ? { ...r, field: event.target.value } : r)),
                          )
                        }
                      />
                      <Input
                        aria-label="Institution"
                        placeholder="University of Minnesota"
                        className="h-11"
                        value={row.institution}
                        onChange={(event) =>
                          setEducation((rows) =>
                            rows.map((r) => (r.id === row.id ? { ...r, institution: event.target.value } : r)),
                          )
                        }
                      />
                      <Input
                        aria-label="Year"
                        placeholder="2019"
                        className="h-11"
                        value={row.year}
                        onChange={(event) =>
                          setEducation((rows) =>
                            rows.map((r) => (r.id === row.id ? { ...r, year: event.target.value } : r)),
                          )
                        }
                      />
                      <button
                        type="button"
                        aria-label="Remove this degree"
                        onClick={() => {
                          setEducation((rows) => rows.filter((r) => r.id !== row.id));
                          if (!row.id.startsWith("new-")) setRemoved((ids) => [...ids, row.id]);
                        }}
                        className="grid h-11 place-items-center rounded-xl text-brand-navySoft hover:bg-brand-navy/10"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <Button type="button" variant="pill" size="pillSm" disabled={busy} onClick={saveProfile}>
                {busy ? "Saving…" : "Save profile"}
              </Button>
              <Button type="button" variant="ghost" size="pillSm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </PortalCard>

      {/* ————— Bio and links ————— */}
      <PortalCard className="mt-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-navySoft">Short biography</h2>
        <p className="mt-3 text-sm leading-relaxed text-brand-navy">
          {author.short_bio || author.bio || <span className="text-brand-navySoft">Nothing written yet.</span>}
        </p>
        {links.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-4">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold uppercase tracking-wide text-portal-accent hover:underline"
              >
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
      </PortalCard>

      {/* ————— Education ————— */}
      <PortalCard className="mt-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-navySoft">Where they studied</h2>
        {(records ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-brand-navySoft">No degree recorded.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm text-brand-navy">
            {(records ?? []).map((record) => (
              <li key={record.id}>
                {[[record.degree, record.field].filter(Boolean).join(", "), record.institution, record.year]
                  .filter(Boolean)
                  .join(" — ")}
              </li>
            ))}
          </ul>
        )}
      </PortalCard>

      {/* ————— Public preview ————— */}
      <PortalCard className="mt-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-navySoft">
          How this author appears under a published course
        </h2>
        <div className="mt-4 rounded-2xl bg-brand-surface p-5">
          <p className="text-lg font-extrabold leading-snug text-brand-navy">Their course title</p>
          <div className="mt-4 border-t border-brand-line pt-4">
            <AuthorByline
              linked={false}
              author={{
                display_name: publishedName,
                display_title: author.display_title || author.institution,
                photo_url: storedPhoto,
              }}
            />
          </div>
          {author.short_bio ? (
            <p className="mt-4 text-sm leading-relaxed text-brand-navySoft">{author.short_bio}</p>
          ) : null}
        </div>
      </PortalCard>

      {/* ————— Declaration ————— */}
      <PortalCard className="mt-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-navySoft">Declaration</h2>
        {author.declaration_accepted_at ? (
          <>
            <p className="mt-3 text-sm font-semibold text-portal-green">
              Accepted on {formatDate(author.declaration_accepted_at)}
              <button
                type="button"
                className="ml-2 text-sm font-semibold text-portal-accent underline-offset-4 hover:underline"
                onClick={() => setShowDeclaration((open) => !open)}
              >
                {showDeclaration ? "Hide snapshot" : "View snapshot"}
              </button>
            </p>
            {showDeclaration ? (
              <div className="mt-3 rounded-2xl bg-brand-surface p-4 text-sm text-brand-navy">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">
                  Declared on {formatDateTime(author.declaration_accepted_at)}
                </p>
                <pre className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-brand-navySoft">
                  {JSON.stringify(author.declaration_snapshot ?? {}, null, 2)}
                </pre>
                <p className="mt-2 text-xs text-brand-navySoft">
                  IP {author.declaration_ip ?? "unknown"} — {author.declaration_user_agent ?? "unknown device"}
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <p className="mt-3 text-sm font-semibold text-portal-amber">Not declared</p>
        )}
      </PortalCard>

      {/* ————— Agreement ————— */}
      <div className="mt-5">
        {data?.contract ? (
          <Banner tone="success" title={`Agreement signed by ${data.contract.signed_name}`}>
            {formatDateTime(data.contract.signed_at)} · version {data.contract.document_version}
          </Banner>
        ) : (
          <Banner tone="warning" title="Agreement not signed">
            This author cannot edit their courses until they sign.
          </Banner>
        )}
      </div>

      {/* ————— Courses ————— */}
      <h2 className="mt-10 text-xl font-extrabold text-brand-navy">
        Commissioned courses <span className="text-base font-bold text-brand-navySoft">({courses.length})</span>
      </h2>
      {courses.length === 0 ? (
        <PortalCard className="mt-4">
          <p className="text-sm text-brand-navySoft">No course assigned yet.</p>
        </PortalCard>
      ) : (
        <div className="mt-4 space-y-5">
          {groupByLot(courses).map((lot) => (
            <PortalCard key={lot.key}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-extrabold text-brand-navy">
                  {lot.lot_code ? `${lot.lot_code} — ` : ""}
                  {lot.lot_name ?? "Unsorted courses"}
                </h3>
                <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">
                  {lot.subject_area ?? "—"} · {lot.courses.length} courses
                </p>
              </div>
              <ul className="mt-2 divide-y divide-brand-line">
                {lot.courses.map((course) => (
                  <li key={course.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-bold text-brand-navy">{course.title}</p>
                      <p className="text-xs text-brand-navySoft">Due {formatDate(course.due_date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill status={course.status as CourseStatus} />
                      <Button type="button" variant="pillSecondary" size="pillSm" onClick={() => moveToPool(course.id)}>
                        Move back to the pool
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </PortalCard>
          ))}
        </div>
      )}

      {/* ————— Access code, invite, fee ————— */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <PortalCard>
          <h2 className="text-sm font-bold text-brand-navy">Access code</h2>
          {author.access_code ? (
            <>
              <p className="mt-3 font-mono text-base font-bold text-brand-navy">{author.access_code}</p>
              <p className="mt-1 text-sm text-brand-navySoft">
                {codePlatform === "android" ? "Google Play" : codePlatform === "ios" ? "Apple App Store" : "Store unknown"}
              </p>
              {author.platform && codePlatform && codePlatform !== author.platform ? (
                <p className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-portal-amber">
                  <AlertTriangle className="size-4" aria-hidden="true" /> Wrong store for their phone
                </p>
              ) : author.platform ? (
                <p className="mt-2 text-sm font-semibold text-portal-green">Matches their phone</p>
              ) : (
                <p className="mt-2 text-sm font-semibold text-portal-amber">They have not chosen a phone yet</p>
              )}
              <div className="mt-3">
                <CopyButton value={author.access_code} label="Copy code" />
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm font-semibold text-brand-navySoft">No code</p>
              <p className="mt-1 text-xs text-brand-navySoft">
                Codes are only ever taken from the imported file.{" "}
                <Link to="/auteurs/admin/codes" className="font-semibold text-portal-accent hover:underline">
                  Access codes
                </Link>
              </p>
            </>
          )}
        </PortalCard>

        <PortalCard>
          <h2 className="text-sm font-bold text-brand-navy">Invite link</h2>
          <p className="mt-3 text-sm text-brand-navySoft">
            {author.activated_at ? `Activated ${formatDate(author.activated_at)}` : "Not activated yet"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {author.invite_token ? <CopyButton value={inviteUrl(author.invite_token)} label="Copy invite link" /> : null}
            <Button type="button" variant="ghost" size="pillSm" onClick={regenerateInvite}>
              Regenerate
            </Button>
          </div>
        </PortalCard>

        <PortalCard>
          <h2 className="text-sm font-bold text-brand-navy">Fee</h2>
          <p className="mt-1 text-xs text-brand-navySoft">Shown in their contract.</p>
          <div className="mt-3 flex gap-2">
            <Input
              aria-label="Fee"
              className="h-11"
              placeholder="e.g. USD 600"
              defaultValue={author.fee ?? ""}
              onChange={(event) => setFee(event.target.value)}
            />
            <Button type="button" variant="pillSecondary" size="pillSm" onClick={saveFee}>
              Save
            </Button>
          </div>
        </PortalCard>
      </div>

      {/* ————— Admin notes ————— */}
      <PortalCard className="mt-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand-navySoft">
            Admin notes — never shown to the author
          </h2>
          <span className="text-xs text-brand-navySoft">
            {noteState === "saving" ? "Saving…" : noteState === "saved" ? "Saved" : ""}
          </span>
        </div>
        <Textarea
          className="mt-3"
          rows={4}
          placeholder="Chased on 16 September. Prefers to draft in Word."
          value={note ?? author.admin_note ?? ""}
          onChange={(event) => setNote(event.target.value)}
          aria-label="Admin notes"
        />
      </PortalCard>

      {/* ————— Assign courses ————— */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <PortalCard>
          <h3 className="text-lg font-extrabold text-brand-navy">Assign a course</h3>
          <form onSubmit={addCourse} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lot">Lot code</Label>
                <Input id="lot" value={courseForm.lot_code} onChange={(e) => setCourseForm({ ...courseForm, lot_code: e.target.value })} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject area</Label>
                <Input id="subject" value={courseForm.subject_area} onChange={(e) => setCourseForm({ ...courseForm, subject_area: e.target.value })} className="h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" required value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input id="subtitle" value={courseForm.subtitle} onChange={(e) => setCourseForm({ ...courseForm, subtitle: e.target.value })} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brief">Brief note</Label>
              <Textarea id="brief" rows={3} value={courseForm.brief_note} onChange={(e) => setCourseForm({ ...courseForm, brief_note: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due">Due date</Label>
              <Input id="due" type="date" value={courseForm.due_date} onChange={(e) => setCourseForm({ ...courseForm, due_date: e.target.value })} className="h-11" />
            </div>
            <Button type="submit" variant="pill" size="pillSm">Assign course</Button>
          </form>
        </PortalCard>

        <PortalCard>
          <h3 className="text-lg font-extrabold text-brand-navy">Paste several courses</h3>
          <p className="mt-2 text-sm text-brand-navySoft">
            One course per line: lot code; subject area; title; subtitle; due date (YYYY-MM-DD).
          </p>
          <Textarea rows={10} className="mt-4" value={bulk} onChange={(event) => setBulk(event.target.value)} aria-label="Bulk course list" />
          <Button type="button" variant="pillSecondary" size="pillSm" className="mt-4" onClick={addBulk}>
            Add all
          </Button>
        </PortalCard>
      </div>

      {/* ————— Activity ————— */}
      <PortalCard className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-navySoft">Activity</h2>
        {(data?.activity ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-brand-navySoft">Nothing recorded yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-brand-line text-sm">
            {(data?.activity ?? []).map((entry) => (
              <li key={entry.id} className="py-3">
                <p className="font-semibold text-brand-navy">
                  {entry.entity} · {entry.action}
                </p>
                {entry.comment ? <p className="text-brand-navySoft">{entry.comment}</p> : null}
                <p className="text-xs text-brand-navySoft">
                  {formatDateTime(entry.created_at)}
                  {entry.actor_id ? ` · ${data?.actorNames.get(entry.actor_id) ?? "someone"}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </PortalCard>
    </div>
  );
}
