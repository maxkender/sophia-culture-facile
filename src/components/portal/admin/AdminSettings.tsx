import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { usePortalProfile } from "../usePortal";
import { PageTitle, PortalCard } from "../ui";
import { PayZonesSettings } from "./PayZonesSettings";

export function AdminSettings() {
  const { data: me } = usePortalProfile();
  const profile = me?.profile ?? null;

  const { data: stats } = useQuery({
    queryKey: ["portal", "admin", "settings-stats"],
    queryFn: async () => {
      const count = async (table: "profiles" | "courses" | "access_codes" | "documents") =>
        (await supabase.from(table).select("id", { count: "exact", head: true })).count ?? 0;
      const [authors, courses, codes, documents] = await Promise.all([
        count("profiles"),
        count("courses"),
        count("access_codes"),
        count("documents"),
      ]);
      return { authors, courses, codes, documents };
    },
  });

  return (
    <div>
      <PageTitle title="Settings" lead="Your account and the state of the workspace." />

      <div className="grid gap-5 md:grid-cols-2">
        <PortalCard>
          <p className="text-sm font-bold text-brand-navy">Signed in as</p>
          <p className="mt-3 text-sm text-brand-navySoft">{profile?.full_name ?? "—"}</p>
          <p className="text-sm text-brand-navySoft">{me?.email ?? "—"}</p>
          <p className="mt-2 inline-flex rounded-full bg-portal-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-portal-accent">
            Admin
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="pillSecondary" size="pillSm">
              <Link to="/auteurs/profile">Edit your details</Link>
            </Button>
            <Button asChild variant="pillSecondary" size="pillSm">
              <Link to="/auteurs/admin/documents">Manage documents</Link>
            </Button>
          </div>
        </PortalCard>

        <PortalCard>
          <p className="text-sm font-bold text-brand-navy">Workspace</p>
          <dl className="mt-4 space-y-2 text-sm">
            {[
              ["Profiles", stats?.authors],
              ["Courses", stats?.courses],
              ["Access codes", stats?.codes],
              ["Documents", stats?.documents],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-center justify-between">
                <dt className="text-brand-navySoft">{label}</dt>
                <dd className="font-bold text-brand-navy">{value ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </PortalCard>
        <PayZonesSettings />
      </div>
    </div>
  );
}
