import { createFileRoute, redirect } from "@tanstack/react-router";

/** Ancienne URL française : redirection permanente vers la version /fr. */
export const Route = createFileRoute("/sophia-culture-generale")({
  beforeLoad: () => {
    throw redirect({ to: "/fr/sophia-culture-generale", statusCode: 301, replace: true });
  },
  component: () => null,
});
