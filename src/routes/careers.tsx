import { createFileRoute, redirect } from "@tanstack/react-router";

/** Ancienne URL racine : redirection permanente vers la version /fr. */
export const Route = createFileRoute("/careers")({
  beforeLoad: () => {
    throw redirect({ to: "/fr/careers", statusCode: 301, replace: true });
  },
  component: () => null,
});
