import { createFileRoute } from "@tanstack/react-router";
import { ApplyPage } from "@/components/pages/ApplyPage";
import { StudioCta } from "@/components/studio/StudioCta";
import { fr } from "@/i18n/fr";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/fr/devenir-professeur")({
  ssr: false,
  head: () => ({
    meta: meta({
      title: fr.apply.metaTitle,
      description: fr.apply.metaDescription,
      lang: "fr",
      key: "apply",
    }),
    links: langLinks("apply", "fr"),
  }),
  component: TeacherPage,
});

function TeacherPage() {
  return (
    <>
      <StudioCta lang="fr" />
      <ApplyPage />
    </>
  );
}
