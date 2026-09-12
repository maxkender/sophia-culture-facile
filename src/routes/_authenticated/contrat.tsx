import { createFileRoute } from "@tanstack/react-router";
import { ContractPage } from "@/components/teacher/ContractPage";

export const Route = createFileRoute("/_authenticated/contrat")({
  head: () => ({ meta: [{ title: "Contrat auteur | Sophia" }, { name: "description", content: "Contrat de commande et de cession de droits d’auteur Sophia, à lire et signer en ligne." }, { property: "og:title", content: "Contrat auteur | Sophia" }, { property: "og:description", content: "Contrat de commande et de cession de droits d’auteur Sophia." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ContractPage,
});
