import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Clapperboard, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { EmptyState, PageTitle, PortalCard } from "../ui";

type RecentRow = {
  id: string;
  full_name: string;
  country: string;
  status: string;
  created_at: string;
  track: "ugc" | "slideshow";
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-portal-amber/15 text-portal-amber",
  interview: "bg-portal-accent/10 text-portal-accent",
  approved: "bg-portal-green/10 text-portal-green",
  rejected: "bg-portal-red/10 text-portal-red",
};

export function CreatorsDashboard() {
  const { data } = useQuery({
    queryKey: ["portal", "admin", "creators", "dashboard"],
    queryFn: async () => {
      const countBy = async (table: "creator_applications" | "slideshow_applications", status: string) => {
        const { count } = await supabase
          .from(table)
          .select("id", { count: "exact", head: true })
          .eq("status", status);
        return count ?? 0;
      };
      const [ugcPending, ugcTotal, slidePending, slideTotal, ugcRecent, slideRecent] = await Promise.all([
        countBy("creator_applications", "pending"),
        supabase.from("creator_applications").select("id", { count: "exact", head: true }),
        countBy("slideshow_applications", "pending"),
        supabase.from("slideshow_applications").select("id", { count: "exact", head: true }),
        supabase.from("creator_applications").select("id, full_name, country, status, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("slideshow_applications").select("id, full_name, country, status, created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      const recent: RecentRow[] = [
        ...(ugcRecent.data ?? []).map((r) => ({ ...r, track: "ugc" as const })),
        ...(slideRecent.data ?? []).map((r) => ({ ...r, track: "slideshow" as const })),
      ]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 8);
      return {
        ugcPending,
        ugcTotal: ugcTotal.count ?? 0,
        slidePending,
        slideTotal: slideTotal.count ?? 0,
        recent,
      };
    },
  });

  return (
    <div className="space-y-6">
      <PageTitle
        title="Creator programme"
        lead="UGC and slideshow creator applications, kept fully separate from the author side."
        action={
          <Button asChild variant="pill" size="sm">
            <Link to="/auteurs/admin/creators/applications">
              Open the queue <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <PortalCard className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-portal-accent/10 text-portal-accent">
              <Video className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-brand-navy">UGC creators</p>
              <p className="text-xs text-brand-navySoft">{data?.ugcTotal ?? 0} applications in total</p>
            </div>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-brand-navy">{data?.ugcPending ?? 0}</p>
          <p className="text-xs font-semibold text-brand-navySoft">awaiting a decision</p>
        </PortalCard>
        <PortalCard className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-portal-accent/10 text-portal-accent">
              <Clapperboard className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-brand-navy">Slideshow creators</p>
              <p className="text-xs text-brand-navySoft">{data?.slideTotal ?? 0} applications in total</p>
            </div>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-brand-navy">{data?.slidePending ?? 0}</p>
          <p className="text-xs font-semibold text-brand-navySoft">awaiting a decision</p>
        </PortalCard>
      </div>

      <PortalCard className="p-5">
        <h2 className="text-sm font-bold text-brand-navy">Latest applications</h2>
        {data?.recent.length ? (
          <ul className="mt-3 divide-y divide-brand-line">
            {data.recent.map((row) => (
              <li key={`${row.track}-${row.id}`} className="flex items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-brand-navy">{row.full_name}</span>
                  <span className="block text-xs text-brand-navySoft">
                    {row.track === "ugc" ? "UGC" : "Slideshow"} · {row.country} · {formatDateTime(row.created_at)}
                  </span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_CLASS[row.status] ?? "bg-brand-navy/10 text-brand-navy"}`}>
                  {row.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No applications yet" text="Creator applications will appear here as they come in." />
        )}
      </PortalCard>
    </div>
  );
}
