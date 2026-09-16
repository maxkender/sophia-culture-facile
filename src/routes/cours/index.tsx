import { createFileRoute, redirect } from "@tanstack/react-router";

/** Ancienne URL française : redirection permanente vers la version /fr. */
export const Route = createFileRoute("/cours/")({
  beforeLoad: () => {
    throw redirect({ to: "/fr/cours", statusCode: 301, replace: true });
  },
  component: () => null,
});
