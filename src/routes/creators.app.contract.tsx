import { createFileRoute } from "@tanstack/react-router";
import { ContractPage } from "@/components/creators/app/ResourcePages";

export const Route = createFileRoute("/creators/app/contract")({
  head: () => ({ meta: [
    { title: "Agreement | Sophia creator space" },
    { name: "description", content: "Agreement in the private Sophia creator space." },
    { property: "og:title", content: "Agreement | Sophia creator space" },
    { property: "og:description", content: "Private Sophia creator space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <ContractPage />,
});
