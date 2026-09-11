import { createFileRoute } from "@tanstack/react-router";
import { TeacherProfilePage } from "@/components/teacher/TeacherProfilePage";

export const Route = createFileRoute("/_authenticated/profil-enseignant")({
  head: () => ({ meta: [{ title: "Profil enseignant | Sophia" }, { name: "description", content: "Complétez votre profil de professeur certifié Sophia." }, { property: "og:title", content: "Profil enseignant | Sophia" }, { property: "og:description", content: "Complétez votre profil de professeur certifié Sophia." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: TeacherProfilePage,
});