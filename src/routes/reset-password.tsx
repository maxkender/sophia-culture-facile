import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordPage } from "@/components/auth/ResetPasswordPage";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Réinitialiser le mot de passe | Sophia" }, { name: "description", content: "Choisissez un nouveau mot de passe Sophia." }, { property: "og:title", content: "Réinitialiser le mot de passe | Sophia" }, { property: "og:description", content: "Choisissez un nouveau mot de passe Sophia." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ResetPasswordPage,
});