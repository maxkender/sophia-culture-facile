import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDateTime } from "@/lib/portal";
import { isAnnouncementLive, type Announcement } from "@/lib/messaging";
import { usePortalProfile } from "../usePortal";
import { BoldText, ConfirmButton, EmptyState, PageTitle, PortalCard } from "../ui";

type AuthorRow = { id: string; full_name: string };

export function AnnouncementsAdmin() {
  const queryClient = useQueryClient();
  const { data: me } = usePortalProfile();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "selected">("all");
  const [targets, setTargets] = useState<string[]>([]);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [dismissible, setDismissible] = useState(true);
  const [saving, setSaving] = useState(false);

  const { data: authors = [] } = useQuery({
    queryKey: ["portal", "admin", "authors-lite"],
    queryFn: async (): Promise<AuthorRow[]> => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "author")
        .order("full_name");
      return (data ?? []) as AuthorRow[];
    },
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ["portal", "admin", "announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Announcement[];
    },
  });

  const { data: reads = [] } = useQuery({
    queryKey: ["portal", "admin", "announcement-reads"],
    queryFn: async () => {
      const { data } = await supabase.from("announcement_reads").select("announcement_id, profile_id");
      return data ?? [];
    },
  });

  const readCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const read of reads) map.set(read.announcement_id, (map.get(read.announcement_id) ?? 0) + 1);
    return map;
  }, [reads]);

  function targetTotal(announcement: Announcement): number {
    return announcement.audience === "all" ? authors.length : (announcement.target_profile_ids ?? []).length;
  }

  async function create() {
    if (!title.trim() || !body.trim() || saving) return;
    if (audience === "selected" && targets.length === 0) {
      toast.error("Pick at least one author.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("announcements").insert({
      title: title.trim(),
      body: body.trim(),
      audience,
      target_profile_ids: audience === "selected" ? targets : [],
      starts_at: startsAt ? new Date(startsAt).toISOString() : new Date().toISOString(),
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      dismissible,
      created_by: me?.profile?.id ?? null,
    });
    setSaving(false);
    if (error) {
      toast.error("The announcement could not be created.");
      return;
    }
    setTitle("");
    setBody("");
    setTargets([]);
    setAudience("all");
    setStartsAt("");
    setEndsAt("");
    setDismissible(true);
    await queryClient.invalidateQueries({ queryKey: ["portal", "admin", "announcements"] });
    toast.success("Announcement created.");
  }

  async function remove(id: string) {
    await supabase.from("announcements").delete().eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["portal", "admin", "announcements"] });
  }

  return (
    <div>
      <PageTitle
        title="Announcements"
        lead="A short message shown once over every author's space. Use it for deadlines and format changes, not for conversation."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <PortalCard className="space-y-4">
          <h2 className="text-lg font-extrabold text-brand-navy">New announcement</h2>
          <div className="space-y-2">
            <Label htmlFor="a-title">Title</Label>
            <Input id="a-title" value={title} maxLength={120} className="h-11" onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="a-body">Body</Label>
            <Textarea id="a-body" rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
            <p className="text-xs text-brand-navySoft">Use **double asterisks** for bold. Line breaks are kept.</p>
          </div>
          <div className="space-y-2">
            <Label>Audience</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={audience === "all" ? "pill" : "pillSecondary"}
                size="pillSm"
                onClick={() => setAudience("all")}
              >
                Everyone
              </Button>
              <Button
                type="button"
                variant={audience === "selected" ? "pill" : "pillSecondary"}
                size="pillSm"
                onClick={() => setAudience("selected")}
              >
                Selected authors
              </Button>
            </div>
          </div>
          {audience === "selected" ? (
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-brand-line p-3">
              {authors.map((author) => (
                <label key={author.id} className="flex items-center gap-3 text-sm text-brand-navy">
                  <Checkbox
                    checked={targets.includes(author.id)}
                    onCheckedChange={(checked) =>
                      setTargets((current) =>
                        checked ? [...current, author.id] : current.filter((id) => id !== author.id),
                      )
                    }
                  />
                  {author.full_name}
                </label>
              ))}
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="a-start">Starts (optional)</Label>
              <Input id="a-start" type="datetime-local" value={startsAt} className="h-11" onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-end">Ends (optional)</Label>
              <Input id="a-end" type="datetime-local" value={endsAt} className="h-11" onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm text-brand-navy">
            <Checkbox checked={dismissible} onCheckedChange={(checked) => setDismissible(checked === true)} />
            Authors can dismiss it
          </label>
          <Button type="button" variant="pill" size="pillSm" disabled={saving || !title.trim() || !body.trim()} onClick={() => void create()}>
            Create announcement
          </Button>
        </PortalCard>

        <div className="space-y-6">
          <PortalCard className="bg-portal-bg shadow-none ring-1 ring-brand-line">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Preview</p>
            <div className="mt-3 rounded-portal bg-card p-6 shadow-portal">
              <h3 className="text-xl font-extrabold text-brand-navy">{title || "Announcement title"}</h3>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-navySoft">
                <BoldText text={body || "The body of your message, exactly as the author will read it."} />
              </div>
              <Button type="button" variant="pill" size="pillSm" className="mt-5" disabled>
                {dismissible ? "Dismiss" : "Got it"}
              </Button>
            </div>
          </PortalCard>

          <div className="space-y-3">
            <h2 className="text-lg font-extrabold text-brand-navy">Past and active</h2>
            {announcements.length === 0 ? (
              <EmptyState title="No announcement yet" />
            ) : (
              announcements.map((announcement) => {
                const live = isAnnouncementLive(announcement);
                return (
                  <PortalCard key={announcement.id} className="space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-base font-extrabold text-brand-navy">{announcement.title}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          live ? "bg-portal-green/12 text-portal-green" : "bg-brand-surfaceStrong text-brand-navySoft"
                        }`}
                      >
                        {live ? "Active" : "Ended"}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-brand-navySoft">{announcement.body}</p>
                    <p className="text-xs text-brand-navySoft">
                      {announcement.audience === "all" ? "Everyone" : `${(announcement.target_profile_ids ?? []).length} authors`} ·{" "}
                      {announcement.dismissible ? "Dismissible" : "Not dismissible"} · from {formatDateTime(announcement.starts_at)}
                      {announcement.ends_at ? ` to ${formatDateTime(announcement.ends_at)}` : ""}
                    </p>
                    <p className="text-sm font-semibold text-brand-navy">
                      Seen by {readCount.get(announcement.id) ?? 0} of {targetTotal(announcement)} targeted authors
                    </p>
                    <ConfirmButton
                      title="Delete this announcement?"
                      description="It disappears from every author's space."
                      confirmLabel="Delete"
                      onConfirm={() => remove(announcement.id)}
                      trigger={
                        <Button type="button" variant="pillSecondary" size="pillSm">
                          Delete
                        </Button>
                      }
                    />
                  </PortalCard>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
