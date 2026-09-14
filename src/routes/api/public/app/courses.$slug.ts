import { createFileRoute } from "@tanstack/react-router";
import { exportedCourses, unauthorised } from "@/lib/app-export.server";

/** Export JSON d'un seul cours publié, protégé par clé. */
export const Route = createFileRoute("/api/public/app/courses/$slug")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const denied = unauthorised(request);
        if (denied) return denied;

        const courses = await exportedCourses({ slug: params.slug });
        const course = courses[0];
        if (!course) return Response.json({ error: "not_found" }, { status: 404 });
        return Response.json(course, { headers: { "cache-control": "no-store" } });
      },
    },
  },
});
