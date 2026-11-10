import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordPage } from "@/components/auth/ResetPasswordPage";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password | Vik Studios Hub" }, { name: "description", content: "Choose a new password for your Vik Studios Hub account." }, { property: "og:title", content: "Reset password | Vik Studios Hub" }, { property: "og:description", content: "Choose a new password for your Vik Studios Hub account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ResetPasswordPage,
});