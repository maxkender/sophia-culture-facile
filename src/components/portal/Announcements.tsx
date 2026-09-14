import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isAnnouncementLive, targetsProfile, type Announcement } from "@/lib/messaging";
import { BoldText, PortalCard } from "./ui";

const SESSION_KEY = "sophia.portal.announcements.shown";

function sessionShown(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.sessionStorage.getItem(SESSION_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function markSessionShown(id: string) {
  const next = Array.from(new Set([...sessionShown(), id]));
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
}

/** Active announcements targeted at this author, oldest first. */
export function useActiveAnnouncements(profileId: string | null | undefined) {
  return useQuery({
    queryKey: ["portal", "announcements", profileId],
    enabled: Boolean(profileId),
    staleTime: 60_000,
    queryFn: async () => {
      const [{ data: rows }, { data: reads }] = await Promise.all([
        supabase.from("announcements").select("*").order("starts_at", { ascending: true }),
        supabase.from("announcement_reads").select("announcement_id").eq("profile_id", profileId!),
      ]);
      const readIds = new Set((reads ?? []).map((read) => read.announcement_id));
      const active = ((rows ?? []) as Announcement[]).filter(
        (row) => isAnnouncementLive(row) && targetsProfile(row, profileId!),
      );
      return { active, readIds };
    },
  });
}

export function AnnouncementGate({ profileId }: { profileId: string }) {
  const queryClient = useQueryClient();
  const { data } = useActiveAnnouncements(profileId);
  const [current, setCurrent] = useState<Announcement | null>(null);
  const [picked, setPicked] = useState(false);

  useEffect(() => {
    if (!data || picked) return;
    const shown = sessionShown();
    const next =
      data.active.find((row) => !data.readIds.has(row.id)) ??
      data.active.find((row) => !row.dismissible && !shown.includes(row.id)) ??
      null;
    setPicked(true);
    setCurrent(next);
  }, [data, picked]);

  async function acknowledge() {
    if (!current) return;
    markSessionShown(current.id);
    await supabase
      .from("announcement_reads")
      .upsert({ announcement_id: current.id, profile_id: profileId }, { onConflict: "announcement_id,profile_id" });
    setCurrent(null);
    await queryClient.invalidateQueries({ queryKey: ["portal", "announcements"] });
  }

  if (!current) return null;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) void acknowledge(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-brand-navy">{current.title}</DialogTitle>
          <DialogDescription className="sr-only">Announcement from the editorial desk</DialogDescription>
        </DialogHeader>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-brand-navySoft">
          <BoldText text={current.body} />
        </div>
        <div>
          <Button type="button" variant="pill" size="pillSm" onClick={() => void acknowledge()}>
            {current.dismissible ? "Dismiss" : "Got it"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AnnouncementBanners({ profileId }: { profileId: string }) {
  const { data } = useActiveAnnouncements(profileId);
  const active = data?.active ?? [];
  if (active.length === 0) return null;

  return (
    <div className="mb-8 space-y-3">
      {active.map((announcement) => (
        <PortalCard key={announcement.id} className="bg-portal-bg shadow-none ring-1 ring-brand-line">
          <div className="flex gap-3">
            <Megaphone className="mt-0.5 size-4 shrink-0 text-portal-accent" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-brand-navy">{announcement.title}</p>
              <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-brand-navySoft">
                <BoldText text={announcement.body} />
              </div>
            </div>
          </div>
        </PortalCard>
      ))}
    </div>
  );
}
