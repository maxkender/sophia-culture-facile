import { createFileRoute, redirect } from "@tanstack/react-router";

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
  // Payments are off: the page is gone, old links go home.
  beforeLoad: () => { throw redirect({ to: "/creators/app", replace: true }); },
});
