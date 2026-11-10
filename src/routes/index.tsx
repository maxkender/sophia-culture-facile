import { createFileRoute, redirect } from "@tanstack/react-router";

/** The site now only hosts the slideshow poster programme (server sends a 301 too). */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ href: "/en/creators/slideshow", statusCode: 301, replace: true });
  },
});
