import { createFileRoute, redirect } from "@tanstack/react-router";

/** Ancienne URL française : redirection permanente vers la version /fr. */
export const Route = createFileRoute("/cours/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/fr/cours/$slug",
      params: { slug: params.slug },
      statusCode: 301,
      replace: true,
    });
  },
  component: () => null,
});
