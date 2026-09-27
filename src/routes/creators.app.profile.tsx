import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/creators/app/ResourcePages";

export const Route = createFileRoute("/creators/app/profile")({
  head: () => ({ meta: [
    { title: "Profile | Sophia creator space" },
    { name: "description", content: "Profile in the private Sophia creator space." },
    { property: "og:title", content: "Profile | Sophia creator space" },
    { property: "og:description", content: "Private Sophia creator space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <ProfilePage />,
});
