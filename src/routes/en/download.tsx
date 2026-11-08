import { createFileRoute } from "@tanstack/react-router";
import { MarketingDownload } from "@/components/marketing/pages";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/en/download")({
  head: () => ({
    meta: meta({
      title: "Download Sophia: General Knowledge (iOS and Android)",
      description:
        "Get Sophia: General Knowledge free on the App Store or Google Play. Five-minute lessons, a quiz after each one, and daily practice that sticks.",
      lang: "en",
      key: "download",
    }),
    links: langLinks("download", "en"),
  }),
  component: MarketingDownload,
});
