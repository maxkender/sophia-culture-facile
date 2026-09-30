import { createFileRoute } from "@tanstack/react-router";
import { InfluencerLandingPage } from "@/components/pages/CreatorsPages";
import { INFLUENCER_COPY } from "@/i18n/influencers";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/en/creators/influencer")({
  head: () => ({
    meta: meta({ title: INFLUENCER_COPY.en.metaTitle, description: INFLUENCER_COPY.en.metaDescription, lang: "en", key: "creatorsInfluencer" }),
    links: langLinks("creatorsInfluencer", "en"),
  }),
  component: InfluencerLandingPage,
});
