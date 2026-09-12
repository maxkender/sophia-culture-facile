import { createFileRoute } from "@tanstack/react-router";
import { PaymentsPage } from "@/components/teacher/PaymentsPage";

export const Route = createFileRoute("/_authenticated/paiements")({
  head: () => ({ meta: [{ title: "Paiements | Sophia" }, { name: "description", content: "Suivi des acomptes, soldes et coordonnées de paiement des auteurs Sophia." }, { property: "og:title", content: "Paiements | Sophia" }, { property: "og:description", content: "Suivi des rémunérations des auteurs Sophia." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: PaymentsPage,
});
