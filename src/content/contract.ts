import { PUBLISHER } from "@/config/publisher";

export type ContractSection = { title: string; paragraphs: string[] };

export const CONTRACT_TITLE = "Contrat de commande et de cession de droits d’auteur";
export const CONTRACT_SUBTITLE = "Collections éditoriales signées — application Sophia";

export const CONTRACT_SECTIONS: ContractSection[] = [
  {
    title: "Entre les soussignés",
    paragraphs: [
      `La société ${PUBLISHER.name}, ${PUBLISHER.legalForm} au capital de ${PUBLISHER.capital}, immatriculée au Registre du Commerce et des Sociétés de ${PUBLISHER.rcsCity} sous le numéro ${PUBLISHER.siren} (SIRET ${PUBLISHER.siret}, TVA intracommunautaire ${PUBLISHER.vat}), dont le siège social est situé ${PUBLISHER.address}, représentée par ${PUBLISHER.director}, Président, dûment habilité aux fins des présentes.`,
      "Ci-après dénommée « l’Éditeur », d’une part,",
      "Et l’auteur identifié par son profil professeur sur la plateforme Sophia, ci-après dénommé « l’Auteur », d’autre part.",
    ],
  },
  {
    title: "Préambule",
    paragraphs: [
      "L’Éditeur exploite l’application mobile et les services numériques « Sophia », consacrés à la diffusion de contenus de culture générale sous forme de cours courts, de collections thématiques et de quiz associés, accessibles par abonnement.",
      "L’Éditeur développe une ligne éditoriale de collections signées, rédigées par des auteurs disposant d’une expertise reconnue dans leur domaine et publiées sous leur nom au sein de l’application.",
      "L’Auteur dispose des compétences nécessaires à la rédaction de tels contenus et accepte la commande qui lui est faite dans les conditions ci-après.",
    ],
  },
  {
    title: "Article 1 — Objet du contrat",
    paragraphs: [
      "L’Auteur réalise, sur commande de l’Éditeur, une œuvre originale telle que décrite à l’article 2.",
      "L’Auteur cède à l’Éditeur, à titre exclusif, les droits patrimoniaux d’auteur afférents à l’Œuvre dans les conditions de l’article 5.",
      "L’Éditeur rémunère l’Auteur dans les conditions de l’article 7.",
    ],
  },
  {
    title: "Article 2 — Description de l’Œuvre commandée",
    paragraphs: [
      "L’Œuvre consiste en une collection éditoriale composée de 5 cours indépendants mais articulés autour d’une thèse d’ensemble, accompagnés de leurs questions de quiz.",
      "Pour chaque cours, l’Auteur livre : le texte respectant le découpage en écrans, un titre, un sous-titre et une accroche, les questions de quiz avec leurs propositions de réponse et l’explication de la bonne réponse, les sources utilisées à usage de vérification interne, ainsi qu’une notice biographique et une photographie.",
      "L’Œuvre doit être originale au sens du droit d’auteur. Le recours à des systèmes d’intelligence artificielle générative pour la rédaction du texte livré est exclu, sauf accord écrit préalable de l’Éditeur. L’Auteur reste libre d’utiliser de tels outils pour sa recherche documentaire.",
    ],
  },
  {
    title: "Article 3 — Processus de création et de validation",
    paragraphs: [
      "Étape 1 : l’Auteur soumet une proposition d’angle et un plan détaillé. Étape 2 : l’Éditeur valide ou demande modification sous cinq (5) jours ouvrés ; aucune rédaction n’est engagée avant validation écrite.",
      "Étape 3 : l’Auteur remet le premier jet complet à la date convenue. Étape 4 : l’Éditeur transmet ses observations sous cinq (5) jours ouvrés. Étape 5 : l’Auteur remet une version corrigée sous sept (7) jours ouvrés, un second tour pouvant être demandé. Étape 6 : l’Éditeur notifie par écrit l’acceptation définitive.",
      "L’Auteur reconnaît que l’Éditeur procède à un travail éditorial : relecture, correction, harmonisation stylistique, découpage en écrans, formatage, illustrations et intégration technique.",
      "L’Éditeur peut refuser l’Œuvre si, après deux tours de correction, elle ne répond pas au brief éditorial ou aux garanties de l’article 9. L’Auteur conserve alors l’acompte et recouvre la libre disposition de son texte.",
    ],
  },
  {
    title: "Article 4 — Propriété des supports et éléments annexes",
    paragraphs: [
      "Les illustrations, éléments graphiques, habillages sonores, interfaces, algorithmes de progression et de révision ainsi que l’ensemble des éléments techniques de l’application Sophia demeurent la propriété exclusive de l’Éditeur.",
    ],
  },
  {
    title: "Article 5 — Cession des droits patrimoniaux",
    paragraphs: [
      "La cession est consentie à titre exclusif et comprend les droits de reproduction, de représentation, d’adaptation et de traduction de l’Œuvre sur tous supports numériques.",
      "La cession est consentie pour le monde entier, pour toutes les langues, et pour toute la durée légale de protection des droits d’auteur, y compris ses prorogations éventuelles.",
      "Conformément à l’article L. 131-6 du Code de la propriété intellectuelle, la cession s’étend aux formes d’exploitation non prévisibles à la date de signature, moyennant une participation aux recettes nettes encaissées à ce titre.",
    ],
  },
  {
    title: "Article 6 — Droit moral",
    paragraphs: [
      "L’Œuvre est publiée sous le nom de l’Auteur. L’Auteur autorise l’Éditeur à reproduire son nom, sa qualité, sa notice biographique et sa photographie aux fins d’identification et de promotion de l’Œuvre et de l’application Sophia.",
      "L’Auteur consent aux interventions éditoriales, adaptations, traductions et découpages prévus au contrat, dès lors qu’ils ne dénaturent pas le sens de l’Œuvre ni la thèse défendue.",
    ],
  },
  {
    title: "Article 7 — Rémunération",
    paragraphs: [
      "En contrepartie de la réalisation de l’Œuvre et de la cession des droits, l’Auteur perçoit une rémunération forfaitaire, dont le montant est fixé par collection dans le bon de commande correspondant et repris dans l’espace « Paiements » de la plateforme.",
      "Le versement intervient en deux temps : un acompte à la validation de l’angle, le solde après acceptation définitive de l’Œuvre.",
      "Le régime applicable (droits d’auteur avec précompte ou facturation en qualité d’indépendant) dépend du statut déclaré par l’Auteur dans ses coordonnées de paiement.",
    ],
  },
  {
    title: "Article 9 — Garanties de l’Auteur",
    paragraphs: [
      "L’Auteur garantit qu’il est le seul auteur de l’Œuvre et dispose de la pleine titularité des droits cédés, que l’Œuvre est originale et inédite et ne constitue ni contrefaçon ni plagiat, et qu’il n’a consenti aucune cession antérieure portant sur l’Œuvre.",
    ],
  },
  {
    title: "Articles 13 à 15 — Résiliation, données personnelles, dispositions générales",
    paragraphs: [
      "En cas de manquement, la Partie lésée peut résilier le contrat trente (30) jours après une mise en demeure demeurée infructueuse. La résiliation postérieure à l’acceptation définitive et au paiement intégral est sans effet sur la cession.",
      "Les données personnelles de l’Auteur sont traitées aux seules fins d’exécution du contrat et du respect des obligations légales de l’Éditeur, conformément au règlement (UE) 2016/679.",
      "Le contrat est soumis au droit français. Les Parties rechercheront une solution amiable avant toute action judiciaire.",
    ],
  },
  {
    title: "Annexe 1 — Brief éditorial",
    paragraphs: [
      "Structure : 5 cours indépendants articulés autour d’une thèse d’ensemble unique, respectant le gabarit de rédaction fourni par l’Éditeur.",
      "Quiz : les questions portent sur l’idée démontrée et non sur des dates mémorisables. Les trois mauvaises réponses doivent être plausibles ; une question éliminable par simple logique est refusée. Chaque question est assortie d’une explication de deux phrases maximum.",
      "L’Éditeur fournit le gabarit de rédaction, trois collections d’exemple, un accès complet à l’application, un retour éditorial sous cinq jours ouvrés à chaque étape, ainsi que les illustrations, le formatage, l’intégration technique et les versions audio.",
    ],
  },
];
