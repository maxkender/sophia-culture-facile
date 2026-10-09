import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/Logo";
import { JobPublicCard, type JobDraft } from "@/components/hub/JobModal";

const getJob = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug.slice(0, 80))
  .handler(async ({ data: slug }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const sb = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => { const h = new Headers(init?.headers); if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization"); h.set("apikey", key); return fetch(input, { ...init, headers: h }); } },
    });
    const { data } = await sb.from("jobs").select("title, slug, cover_image_path, position, details_md, payment_type, base_mode, base_amount, retainer_frequency, cpm_rate, platforms, content_type, posting_frequency_n, posting_frequency_unit, countries, open, app_id").eq("slug", slug).maybeSingle();
    if (!data) return null;
    const { data: app } = await sb.from("apps").select("name").eq("id", data.app_id).maybeSingle();
    return { job: data, appName: app?.name ?? "Sophia" };
  });

export const Route = createFileRoute("/jobs/$slug")({
  loader: async ({ params }) => {
    const r = await getJob({ data: params.slug });
    if (!r) throw notFound();
    return r;
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.job.title} — ${loaderData.appName} creator job` : "Creator job";
    const d = loaderData ? `Paid ${loaderData.job.position} job for ${loaderData.appName}. See pay, requirements and apply.` : "Creator job";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
  },
  notFoundComponent: () => <div className="p-10 text-center">This job is not available any more. <Link to="/creators" className="underline">See creator programmes</Link></div>,
  component: function JobPage() {
    const { job, appName } = Route.useLoaderData();
    return (
      <div className="min-h-screen bg-portal-bg px-4 py-8">
        <div className="mx-auto max-w-xl space-y-4">
          <Link to="/" aria-label="Home"><Logo /></Link>
          <JobPublicCard job={job as unknown as JobDraft} appName={appName} />
          <Button asChild size="lg" className="w-full bg-brand-navy"><Link to="/en/ugc-application">Apply</Link></Button>
          <p className="text-center text-xs text-brand-navySoft">{job.open ? "Open job: you sign the agreement when you apply and start right away." : "Applications are reviewed by the team."}</p>
        </div>
      </div>
    );
  },
});
