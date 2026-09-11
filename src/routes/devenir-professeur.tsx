import { createFileRoute } from "@tanstack/react-router";
import { TeacherSignupPage } from "@/components/auth/TeacherSignupPage";

export const Route = createFileRoute("/devenir-professeur")({
  head: () => ({ meta: [{ title: "Devenir professeur certifié | Sophia" }, { name: "description", content: "Rejoignez les contributeurs certifiés de Sophia." }, { property: "og:title", content: "Devenir professeur certifié | Sophia" }, { property: "og:description", content: "Rejoignez les contributeurs certifiés de Sophia." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: TeacherSignupPage,
});