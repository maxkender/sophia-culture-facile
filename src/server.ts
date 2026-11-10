import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { detectLangFromHeaders } from "./lib/detect-lang";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

/**
 * This site now only serves the slideshow poster programme: the old home pages and
 * other creator tracks send people (and Sophia app links) to the slideshow page.
 */
export function slideshowRedirect(pathname: string, lang: () => string): string | null {
  const p = pathname.replace(/\/+$/, "") || "/";
  const EN = "/en/creators/slideshow";
  const FR = "/fr/createurs/slideshow";
  if (p === "/") return EN;
  if (p === "/en") return EN;
  if (p === "/fr") return FR;
  if (/^\/en\/creators(\/(ugc|influencer|unswipe)(\/.*)?)?$/.test(p)) return EN;
  if (/^\/fr\/creators(\/(ugc|slideshow|influencer|unswipe)(\/.*)?)?$/.test(p)) return FR;
  if (/^\/fr\/createurs(\/(ugc|influenceur|unswipe)(\/.*)?)?$/.test(p)) return FR;
  if (/^\/creators(\/(ugc|influencer|unswipe)(\/.*)?)?$/.test(p)) return lang() === "fr" ? FR : EN;
  return null;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    if (request.method === "GET") {
      const target = slideshowRedirect(url.pathname, () => detectLangFromHeaders(request.headers));
      if (target) {
        return new Response(null, { status: 301, headers: { location: `${target}${url.search}` } });
      }
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
