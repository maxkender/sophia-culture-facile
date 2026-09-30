import { createFileRoute } from "@tanstack/react-router";
import { InfluencerLandingPage } from "@/components/pages/CreatorsPages";
import { INFLUENCER_COPY } from "@/i18n/influencers";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/fr/createurs/influenceur")({
  head: () => ({
    meta: meta({ title: INFLUENCER_COPY.fr.metaTitle, description: INFLUENCER_COPY.fr.metaDescription, lang: "fr", key: "creatorsInfluencer" }),
    links: langLinks("creatorsInfluencer", "fr"),
  }),
  component: InfluencerLandingPage,
});
