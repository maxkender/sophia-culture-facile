import { createFileRoute } from "@tanstack/react-router";
import { handleOsEmail, osEmailMethodNotAllowed } from "@/lib/os-email.server";

export const Route = createFileRoute("/api/public/os-email")({
  server: {
    handlers: {
      POST: ({ request }) => handleOsEmail(request, process.env["OS_HUB_SECRET"], process.env["BREVO_API_KEY"]),
      GET: osEmailMethodNotAllowed,
      PUT: osEmailMethodNotAllowed,
      PATCH: osEmailMethodNotAllowed,
      DELETE: osEmailMethodNotAllowed,
      OPTIONS: osEmailMethodNotAllowed,
      HEAD: osEmailMethodNotAllowed,
    },
  },
});