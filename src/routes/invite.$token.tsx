import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { resolveJobInvite } from "@/lib/hub.functions";

export const Route = createFileRoute("/invite/$token")({
  loader: async ({ params }) => {
    const r = await resolveJobInvite({ data: params.token }).catch(() => null);
    if (r) throw redirect({ to: "/jobs/$slug", params: { slug: r.slug }, search: { invite: params.token } });
    return null;
  },
  head: () => ({ meta: [{ title: "Creator invitation | Sophia" }, { name: "description", content: "Open your creator job invitation." }, { property: "og:title", content: "Creator invitation | Sophia" }, { property: "og:description", content: "Open your creator job invitation." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="flex min-h-screen items-center justify-center bg-portal-bg p-6 text-center">
      <p className="text-brand-navy">This invitation is no longer valid or the job has closed. <Link to="/creators" className="font-bold underline">See creator programmes</Link></p>
    </div>
  ),
});
