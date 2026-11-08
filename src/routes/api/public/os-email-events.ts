import { createFileRoute } from "@tanstack/react-router";
import { handleOsEmailEvent, osEmailMethodNotAllowed } from "@/lib/os-email.server";

export const Route = createFileRoute("/api/public/os-email-events")({
  server: {
    handlers: {
      POST: ({ request }) => handleOsEmailEvent(request, process.env["BREVO_WEBHOOK_TOKEN"], process.env["OS_HUB_SECRET"]),
      GET: osEmailMethodNotAllowed,
      PUT: osEmailMethodNotAllowed,
      PATCH: osEmailMethodNotAllowed,
      DELETE: osEmailMethodNotAllowed,
      OPTIONS: osEmailMethodNotAllowed,
      HEAD: osEmailMethodNotAllowed,
    },
  },
});