import { createFileRoute, redirect } from "@tanstack/react-router";

/** Ancienne URL française : redirection permanente vers la version /fr. */
export const Route = createFileRoute("/devenir-professeur")({
  beforeLoad: () => {
    throw redirect({ to: "/fr/devenir-professeur", statusCode: 301, replace: true });
  },
  component: () => null,
});
