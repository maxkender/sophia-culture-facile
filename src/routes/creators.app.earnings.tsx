import { createFileRoute } from "@tanstack/react-router";
import { UgcEarningsPage as EarningsPage } from "@/components/creators/app/UgcPages";
import { Locked } from "@/components/creators/app/CreatorShell";

export const Route = createFileRoute("/creators/app/earnings")({
  head: () => ({ meta: [
    { title: "Earnings | Sophia creator space" },
    { name: "description", content: "Earnings in the private Sophia creator space." },
    { property: "og:title", content: "Earnings | Sophia creator space" },
    { property: "og:description", content: "Private Sophia creator space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <Locked gate="payouts"><EarningsPage /></Locked>,
});
