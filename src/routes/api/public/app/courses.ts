import { createFileRoute } from "@tanstack/react-router";
import { exportedCourses, unauthorised } from "@/lib/app-export.server";

/** Export JSON en lecture seule des cours publiés, protégé par clé. */
export const Route = createFileRoute("/api/public/app/courses")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = unauthorised(request);
        if (denied) return denied;

        const url = new URL(request.url);
        const since = url.searchParams.get("updated_since");
        const courses = await exportedCourses({ since });

        return Response.json(
          { count: courses.length, updated_since: since, courses },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
