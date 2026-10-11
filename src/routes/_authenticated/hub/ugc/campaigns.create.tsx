import { createFileRoute } from "@tanstack/react-router";
import { CampaignWizard } from "@/components/hub/CampaignWizard";

export const Route = createFileRoute("/_authenticated/hub/ugc/campaigns/create")({
  head: () => ({ meta: [{ title: "Create campaign | Creator Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: CampaignWizard,
});
