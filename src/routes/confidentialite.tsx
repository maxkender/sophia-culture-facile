import { createFileRoute, redirect } from "@tanstack/react-router";

/** Ancienne URL française : redirection permanente vers la version /fr. */
export const Route = createFileRoute("/confidentialite")({
  beforeLoad: () => {
    throw redirect({ to: "/fr/confidentialite", statusCode: 301, replace: true });
  },
  component: () => null,
});
