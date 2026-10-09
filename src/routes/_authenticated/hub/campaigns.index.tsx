import { createFileRoute } from "@tanstack/react-router";
import { Campaigns, type CampaignTab } from "@/components/hub/Campaigns";

const TABS: CampaignTab[] = ["campaigns", "applicants", "requests", "jobs", "reviews", "challenges"];

export const Route = createFileRoute("/_authenticated/hub/campaigns/")({
  validateSearch: (s: Record<string, unknown>): { tab: CampaignTab; newJob?: number | undefined } => ({
    tab: TABS.includes(s["tab"] as CampaignTab) ? (s["tab"] as CampaignTab) : "campaigns",
    newJob: s["newJob"] ? 1 : undefined,
  }),
  head: () => ({ meta: [{ title: "Campaigns | Creator Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: function CampaignsRoute() {
    const { tab, newJob } = Route.useSearch();
    return <Campaigns tab={tab} newJob={Boolean(newJob)} />;
  },
});
