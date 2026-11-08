import { useState } from "react";
import { StudioSignups } from "@/components/studio/StudioDesk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { approveApplication, rejectApplication } from "@/lib/applications.functions";
import { formatDate, formatDateTime } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";
import { CopyButton, EmptyState, PageTitle, PortalCard } from "../ui";

type Application = Database["public"]["Tables"]["applications"]["Row"];

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-portal-amber/15 text-portal-amber",
  approved: "bg-portal-green/10 text-portal-green",
  rejected: "bg-portal-red/10 text-portal-red",
};

export function ApplicationsList() {
  const queryClient = useQueryClient();
  const approve = useServerFn(approveApplication);
  const reject = useServerFn(rejectApplication);
  const [status, setStatus] = useState("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [invite, setInvite] = useState<{ id: string; url: string } | null>(null);

  const { data } = useQuery({
    queryKey: ["portal", "admin", "applications", status],
    queryFn: async () => {
      let query = supabase.from("applications").select("*").order("created_at", { ascending: false });
      if (status !== "all") query = query.eq("status", status as "pending" | "approved" | "rejected");
      const { data: rows } = await query;
      return (rows ?? []) as Application[];
    },
  });

  async function openCv(path: string) {
    const { data: signed } = await supabase.storage.from("applications").createSignedUrl(path, 60 * 10);
    if (signed?.signedUrl) window.open(signed.signedUrl, "_blank", "noopener,noreferrer");
    else toast.error("The CV could not be opened.");
  }

  async function onApprove(application: Application) {
    setBusyId(application.id);
    try {
      const result = await approve({ data: { applicationId: application.id, origin: window.location.origin } });
      if (!result.ok) {
        toast.error("The candidature could not be approved.");
        return;
      }
      setInvite({ id: application.id, url: result.inviteUrl });
      toast.success("Approved. Copy the access link and send it to the author.");
      await queryClient.invalidateQueries({ queryKey: ["portal", "admin"] });
    } catch {
      toast.error("The candidature could not be approved.");
    } finally {
      setBusyId(null);
    }
  }

  async function onReject(application: Application) {
    setBusyId(application.id);
    try {
      await reject({ data: { applicationId: application.id } });
      toast.success("Candidature declined.");
      await queryClient.invalidateQueries({ queryKey: ["portal", "admin"] });
    } catch {
      toast.error("The candidature could not be declined.");
    } finally {
      setBusyId(null);
    }
  }

  const rows = data ?? [];

  return (
    <div>
      <StudioSignups />
      <PageTitle
        title="Applications"
        lead="Candidatures sent from the public form. Approving creates the author record and their access link to copy."
        action={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-11 w-44" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Declined</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {rows.length === 0 ? (
        <EmptyState title="No candidature here" text="New applications appear as soon as someone submits the form." />
      ) : (
        <div className="space-y-5">
          {rows.map((application) => (
            <PortalCard key={application.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-extrabold text-brand-navy">{application.full_name}</p>
                  <p className="text-sm text-brand-navySoft">
                    {application.email}
                    {application.country ? ` · ${application.country}` : ""} ·{" "}
                    {application.platform === "android" ? "Android" : "iOS"}
                  </p>
                  <p className="mt-1 text-xs text-brand-navySoft">
                    Applied {formatDateTime(application.created_at)}
                    {application.date_of_birth ? ` · born ${formatDate(application.date_of_birth)}` : ""}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                    STATUS_CLASS[application.status] ?? "bg-brand-line text-brand-navySoft"
                  }`}
                >
                  {application.status === "rejected" ? "Declined" : application.status}
                </span>
              </div>

              <dl className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Education</dt>
                  <dd className="mt-1 whitespace-pre-line text-sm text-brand-navy">{application.education || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Certified teacher</dt>
                  <dd className="mt-1 text-sm text-brand-navy">
                    {application.is_certified_teacher ? `Yes — ${application.school ?? "school not given"}` : "No"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Motivation</dt>
                  <dd className="mt-1 whitespace-pre-line text-sm text-brand-navy">{application.motivation || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Previous work</dt>
                  <dd className="mt-1 whitespace-pre-line break-words text-sm text-brand-navy">
                    {application.previous_work || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Has tried Sophia</dt>
                  <dd className="mt-1 text-sm text-brand-navy">{application.tried_sophia ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">CV</dt>
                  <dd className="mt-1 text-sm">
                    {application.cv_path ? (
                      <Button type="button" variant="pillSecondary" size="pillSm" onClick={() => void openCv(application.cv_path!)}>
                        <FileText className="size-4" /> Open CV
                      </Button>
                    ) : (
                      <span className="text-brand-navy">No file</span>
                    )}
                  </dd>
                </div>
              </dl>

              {invite?.id === application.id ? (
                <div className="mt-5 rounded-portal border border-portal-green/30 bg-portal-green/8 p-4">
                  <p className="text-sm font-bold text-brand-navy">Access link</p>
                  <p className="mt-1 break-all font-mono text-xs text-brand-navySoft">{invite.url}</p>
                  <div className="mt-3">
                    <CopyButton value={invite.url} label="Copy link" />
                  </div>
                </div>
              ) : null}

              {application.status === "pending" ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button type="button" variant="pill" size="pillSm" disabled={busyId === application.id} onClick={() => void onApprove(application)}>
                    {busyId === application.id ? "Working…" : "Approve"}
                  </Button>
                  <Button type="button" variant="outline" size="pillSm" disabled={busyId === application.id} onClick={() => void onReject(application)}>
                    Decline
                  </Button>
                </div>
              ) : (
                <p className="mt-5 text-xs text-brand-navySoft">Reviewed {formatDateTime(application.reviewed_at)}</p>
              )}
            </PortalCard>
          ))}
        </div>
      )}
    </div>
  );
}
