import { createFileRoute } from "@tanstack/react-router";
import { AccountSetupPage } from "@/components/creators/app/ResourcePages";

export const Route = createFileRoute("/creators/app/account")({
  head: () => ({ meta: [
    { title: "Account setup | Sophia creator space" },
    { name: "description", content: "Account setup in the private Sophia creator space." },
    { property: "og:title", content: "Account setup | Sophia creator space" },
    { property: "og:description", content: "Private Sophia creator space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <AccountSetupPage />,
});
