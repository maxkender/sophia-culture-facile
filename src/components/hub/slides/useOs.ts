import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { osStatus } from "@/lib/slideshows.functions";

/** The OS link is dormant: no OS card, notices or OS-triggered steps are shown until this is turned on. */
export const OS_UI_ENABLED = false;
export const OS_NOT_CONNECTED = "Not connected yet — add OS_HUB_SECRET in Settings → Secrets";

export function useOsStatus() {
  const fn = useServerFn(osStatus);
  return useQuery({ queryKey: ["hub", "os-status"], queryFn: () => fn(), staleTime: 60_000, retry: false, enabled: OS_UI_ENABLED });
}

export const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", pool: "Pool", accepted: "Accepted", contract_signed: "Contract signed", os_created: "OS account created",
  started: "Started", dropped: "Dropped", rejected: "Rejected", expired: "Expired", approved: "Accepted (old flow)",
};
export const POSTER_STATUSES = ["contract_signed", "os_created", "started", "dropped"];
