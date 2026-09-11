import { createFileRoute } from "@tanstack/react-router";

/**
 * Universal Links iOS — servi en application/json sans extension de fichier.
 * À REMPLIR : remplacer TEAMID par l'identifiant d'équipe Apple Developer
 * (App Store Connect > Membership) et vérifier le bundle id.
 */
const APPLE_APP_SITE_ASSOCIATION = {
  applinks: {
    apps: [],
    details: [
      {
        appID: "TEAMID.app.rork.sophia", // À REMPLIR
        paths: ["*"],
      },
    ],
  },
  webcredentials: {
    apps: ["TEAMID.app.rork.sophia"], // À REMPLIR
  },
};

export const Route = createFileRoute("/.well-known/apple-app-site-association")({
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify(APPLE_APP_SITE_ASSOCIATION, null, 2), {
          headers: {
            "content-type": "application/json",
            "cache-control": "public, max-age=3600",
          },
        }),
    },
  },
});
