import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

/** Short creator invite URL: /creators/invite?token=…&email=… → the creator space claim flow. */
function CreatorInvite() {
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const token = p.get("token") ?? p.get("invite") ?? "";
    const email = p.get("email");
    window.location.replace(`/creators/app?invite=${encodeURIComponent(token)}${email ? `&email=${encodeURIComponent(email)}` : ""}`);
  }, []);
  return <div className="min-h-screen bg-portal-bg" />;
}

export const Route = createFileRoute("/creators/invite")({
  ssr: false,
  head: () => ({ meta: [{ title: "Creator invitation | Sophia" }, { name: "description", content: "Set up your Sophia creator account." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Creator invitation | Sophia" }, { property: "og:description", content: "Set up your Sophia creator account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: CreatorInvite,
});
