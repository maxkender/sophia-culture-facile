import { createFileRoute } from "@tanstack/react-router";
import { AssignmentsPage } from "@/components/teacher/AssignmentsPage";

export const Route = createFileRoute("/_authenticated/mes-cours")({
  head: () => ({ meta: [{ title: "Mes cours à rédiger | Sophia" }, { name: "description", content: "Cours attribués, échéances et candidatures aux sujets Sophia." }, { property: "og:title", content: "Mes cours à rédiger | Sophia" }, { property: "og:description", content: "Cours attribués et candidatures aux sujets Sophia." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AssignmentsPage,
});
