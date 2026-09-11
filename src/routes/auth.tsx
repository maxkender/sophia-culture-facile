import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/auth/AuthPage";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Connexion | Sophia" }, { name: "description", content: "Connexion à l’espace de contribution Sophia." }, { property: "og:title", content: "Connexion | Sophia" }, { property: "og:description", content: "Connexion à l’espace de contribution Sophia." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AuthPage,
});