import { createFileRoute } from "@tanstack/react-router";
import { handleOsCandidatures } from "@/lib/os-candidatures.server";

const admin = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin;

export const Route = createFileRoute("/api/public/os-candidatures")({
  server: {
    handlers: {
      GET: ({ request }) => handleOsCandidatures(request, process.env["OS_HUB_SECRET"], admin),
      POST: ({ request }) => handleOsCandidatures(request, process.env["OS_HUB_SECRET"], admin),
    },
  },
});
