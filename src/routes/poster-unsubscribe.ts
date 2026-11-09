import { createFileRoute } from "@tanstack/react-router";
import { markUnsubscribed, unsubscribeTokenValid } from "@/lib/slideshow-unsubscribe.server";

const page = (title: string, text: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} | Sophia</title></head><body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#f5f5f2;color:#1a1a1a;"><div style="max-width:480px;margin:80px auto;padding:32px 24px;background:#fff;border-radius:12px;text-align:center;"><h1 style="font-size:22px;margin:0 0 12px;">${title}</h1><p style="margin:0;color:#555;">${text}</p></div></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );

async function handle(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("e") ?? "";
  const token = url.searchParams.get("t") ?? "";
  if (!unsubscribeTokenValid(email, token)) return page("Link not valid", "This unsubscribe link is not valid.", 400);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await markUnsubscribed(supabaseAdmin, email);
  return page("You're unsubscribed", "You won't receive any more reminder emails from us.");
}

export const Route = createFileRoute("/poster-unsubscribe")({
  server: { handlers: { GET: ({ request }) => handle(request), POST: ({ request }) => handle(request) } },
});
