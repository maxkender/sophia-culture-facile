import { createFileRoute, redirect } from "@tanstack/react-router";

/** Old home page: sends visitors to the slideshow poster page (server sends a 301 too). */
export const Route = createFileRoute("/fr/")({
  beforeLoad: () => {
    throw redirect({ href: "/fr/createurs/slideshow", statusCode: 301, replace: true });
  },
});
