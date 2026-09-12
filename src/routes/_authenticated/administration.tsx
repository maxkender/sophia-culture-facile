import { createFileRoute } from "@tanstack/react-router";
import { AdminWorkspace } from "@/components/teacher/AdminWorkspace";

export const Route = createFileRoute("/_authenticated/administration")({
  head: () => ({ meta: [{ title: "Administration | Sophia" }, { name: "description", content: "Vue d’ensemble des professeurs, attributions, contrats et paiements Sophia." }, { property: "og:title", content: "Administration | Sophia" }, { property: "og:description", content: "Pilotage des contributions Sophia." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AdminWorkspace,
});
