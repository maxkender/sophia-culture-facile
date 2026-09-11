/**
 * CONTENU D'EXEMPLE — À REMPLACER PAR LES VRAIS COURS DE L'APPLICATION.
 *
 * Ce fichier est une source de données temporaire. Il a vocation à être
 * remplacé par un export depuis la base de données des cours (plus de 300).
 * Les composants ne doivent jamais importer ce fichier directement :
 * tout accès passe par les fonctions de `src/content/api.ts`.
 */

import type { Lang } from "@/i18n/routes";

export interface CourseChapter {
  title: string;
  body: string;
}

export interface CourseSource {
  label: string;
  url: string;
}

export interface Course {
  slug: string;
  locale: Lang;
  title: string;
  /** Libellé de catégorie affiché, dans la langue du cours. */
  category: string;
  /** Identifiant stable de catégorie, commun aux deux langues. */
  categoryId: string;
  excerpt: string;
  readingTimeMinutes: number;
  /** Dates ISO (AAAA-MM-JJ). */
  publishedAt: string;
  updatedAt: string;
  heroImage: { src: string; alt: string; width: number; height: number };
  chapters: CourseChapter[];
  sources: CourseSource[];
  relatedSlugs: string[];
  /** Slug de la même leçon dans l'autre langue. */
  alternateSlug: string;
}

export const COURSES: Course[] = [
  /* ---------------------------------------------------------------- FR #1 */
  {
    slug: "la-decolonisation-panorama-1945-1975",
    locale: "fr",
    title: "La décolonisation : panorama 1945-1975",
    category: "Histoire",
    categoryId: "history",
    excerpt:
      "En trente ans, plus de cinquante États accèdent à l'indépendance. Retour sur les causes, les étapes et les héritages de la décolonisation.",
    readingTimeMinutes: 6,
    publishedAt: "2026-02-10",
    updatedAt: "2026-09-11",
    heroImage: {
      src: "/courses/decolonisation.jpg",
      alt: "Foule rassemblée devant un bâtiment officiel lors d'une cérémonie d'indépendance",
      width: 1200,
      height: 630,
    },
    chapters: [
      {
        title: "Un monde d'empires en 1945",
        body: "À la fin de la Seconde Guerre mondiale, une grande partie de l'Afrique et de l'Asie est administrée depuis Londres, Paris, Bruxelles, La Haye ou Lisbonne. Les empires coloniaux européens couvrent alors des centaines de millions d'habitants. La guerre a pourtant fragilisé ces puissances : leurs économies sont exsangues, leur prestige entamé par les défaites militaires, et les troupes coloniales ont combattu en Europe et en Asie au nom de la liberté. La Charte des Nations unies, signée en 1945, affirme le droit des peuples à disposer d'eux-mêmes. Deux nouvelles puissances dominantes, les États-Unis et l'Union soviétique, se posent l'une et l'autre en adversaires des empires européens, pour des raisons différentes.",
      },
      {
        title: "Les premières indépendances en Asie",
        body: "L'Asie ouvre le mouvement. L'Inde et le Pakistan accèdent à l'indépendance en août 1947, au prix d'une partition qui provoque des déplacements de population massifs et des violences considérables. L'Indonésie proclame son indépendance dès 1945 et l'obtient des Pays-Bas en 1949 après quatre années de conflit. En Indochine, la guerre entre la France et le Viêt Minh s'achève en 1954 par la défaite française de Diên Biên Phu et les accords de Genève. Ces trajectoires montrent déjà deux voies distinctes : la négociation politique et la lutte armée, parfois combinées.",
      },
      {
        title: "L'année africaine et la vague des indépendances",
        body: "En Afrique, le tournant se joue autour de 1960 : dix-sept États deviennent indépendants cette année-là, dont la plupart des anciennes colonies françaises et le Congo belge. La conférence de Bandung, en 1955, avait déjà réuni vingt-neuf pays d'Asie et d'Afrique autour d'un refus commun de la domination coloniale. La transition est souvent négociée, mais elle est parfois brutale : la guerre d'Algérie dure de 1954 à 1962 et fait des centaines de milliers de morts. Les colonies portugaises, elles, n'accèdent à l'indépendance qu'en 1974-1975, après la chute de la dictature à Lisbonne.",
      },
      {
        title: "Construire un État après l'empire",
        body: "L'indépendance politique ne règle pas tout. Les nouveaux États héritent de frontières tracées à Berlin en 1885 sans rapport avec les réalités humaines, d'économies orientées vers l'exportation d'une ou deux matières premières, et d'administrations peu nombreuses. Beaucoup adoptent le parti unique au nom de l'unité nationale. La guerre froide s'invite rapidement : les grandes puissances soutiennent des régimes en échange d'alignements diplomatiques. Le mouvement des non-alignés, fondé en 1961, tente de tenir une troisième voie.",
      },
      {
        title: "Ce qu'il en reste aujourd'hui",
        body: "La décolonisation a bouleversé la carte du monde : l'ONU comptait 51 membres en 1945, elle en compte 193 aujourd'hui. Elle a aussi laissé des héritages durables — frontières contestées, langues officielles européennes, liens économiques asymétriques, mémoires conflictuelles. Le débat historiographique reste vif sur le bilan des empires et sur la place de la colonisation dans les programmes scolaires. Comprendre cette période aide à lire l'actualité de nombreuses régions, du Sahel à l'Asie du Sud-Est.",
      },
    ],
    sources: [
      { label: "Organisation des Nations unies — Décolonisation", url: "https://www.un.org/dppa/decolonization/fr" },
      { label: "Encyclopædia Britannica — Decolonization", url: "https://www.britannica.com/topic/decolonization" },
      { label: "Bibliothèque nationale de France — Ressources sur la conférence de Bandung", url: "https://www.bnf.fr" },
    ],
    relatedSlugs: ["la-sante-mentale-enjeu-de-societe"],
    alternateSlug: "decolonisation-1945-1975",
  },

  /* ---------------------------------------------------------------- FR #2 */
  {
    slug: "la-sante-mentale-enjeu-de-societe",
    locale: "fr",
    title: "La santé mentale, enjeu de société",
    category: "Société",
    categoryId: "society",
    excerpt:
      "Longtemps reléguée au second plan, la santé mentale est devenue une question publique majeure. État des lieux, causes et réponses.",
    readingTimeMinutes: 5,
    publishedAt: "2026-03-04",
    updatedAt: "2026-09-11",
    heroImage: {
      src: "/courses/sante-mentale.jpg",
      alt: "Silhouette d'une personne assise près d'une fenêtre, lumière douce",
      width: 1200,
      height: 630,
    },
    chapters: [
      {
        title: "De quoi parle-t-on ?",
        body: "L'Organisation mondiale de la santé définit la santé mentale comme un état de bien-être qui permet à une personne de faire face aux tensions ordinaires de la vie, de travailler de manière productive et de contribuer à sa communauté. Ce n'est donc pas seulement l'absence de trouble psychique. Les troubles mentaux, eux, forment un ensemble large : dépression, troubles anxieux, troubles bipolaires, schizophrénie, troubles du comportement alimentaire, addictions. Ils se distinguent par leur intensité, leur durée et leur retentissement sur la vie quotidienne.",
      },
      {
        title: "Une prévalence sous-estimée",
        body: "Selon l'OMS, environ une personne sur huit dans le monde vit avec un trouble mental. La dépression et les troubles anxieux figurent parmi les premières causes d'années vécues avec incapacité. En France, la santé mentale représente l'un des premiers postes de dépenses de l'Assurance Maladie. Ces chiffres restent probablement en deçà de la réalité : beaucoup de personnes ne consultent jamais, faute d'accès aux soins ou par crainte du regard des autres.",
      },
      {
        title: "Ce qui pèse sur la santé mentale",
        body: "Les facteurs sont multiples et s'additionnent. Le patrimoine génétique et la biologie jouent un rôle, mais les déterminants sociaux comptent au moins autant : précarité économique, isolement, conditions de travail, violences subies, discriminations. Les événements collectifs laissent aussi une trace ; les enquêtes menées après la pandémie de Covid-19 ont montré une hausse durable des symptômes dépressifs et anxieux, en particulier chez les jeunes adultes. Le débat sur les effets des réseaux sociaux chez les adolescents reste ouvert : les corrélations observées sont réelles, mais la causalité fait toujours l'objet de recherches.",
      },
      {
        title: "Le poids de la stigmatisation",
        body: "Parler de santé mentale reste difficile. La stigmatisation retarde la demande d'aide, complique le maintien dans l'emploi et alimente des représentations fausses, notamment l'idée que les personnes atteintes de troubles psychiques seraient dangereuses — alors qu'elles sont statistiquement plus souvent victimes qu'auteures de violences. Depuis une quinzaine d'années, des campagnes publiques, des témoignages de personnalités et l'action d'associations ont fait bouger les lignes, sans faire disparaître le tabou.",
      },
      {
        title: "Quelles réponses ?",
        body: "Les politiques publiques combinent plusieurs leviers : renforcement des soins de premier recours, remboursement de séances chez le psychologue, formation aux premiers secours en santé mentale, prévention en milieu scolaire et professionnel. L'OMS plaide pour un basculement du soin hospitalier vers des services de proximité intégrés à la médecine générale. La question des moyens reste centrale : dans de nombreux pays, la santé mentale représente une part très faible du budget total de santé, sans rapport avec le poids réel de ces troubles.",
      },
    ],
    sources: [
      { label: "Organisation mondiale de la santé — Santé mentale", url: "https://www.who.int/fr/health-topics/mental-health" },
      { label: "Santé publique France — Santé mentale", url: "https://www.santepubliquefrance.fr/maladies-et-traumatismes/sante-mentale" },
      { label: "Institut national de la santé et de la recherche médicale (Inserm)", url: "https://www.inserm.fr" },
    ],
    relatedSlugs: ["la-decolonisation-panorama-1945-1975"],
    alternateSlug: "mental-health-a-social-issue",
  },

  /* ---------------------------------------------------------------- EN #1 */
  {
    slug: "decolonisation-1945-1975",
    locale: "en",
    title: "Decolonisation: the world remade, 1945-1975",
    category: "History",
    categoryId: "history",
    excerpt:
      "In thirty years, more than fifty countries became independent. What caused it, how it unfolded, and what it left behind.",
    readingTimeMinutes: 6,
    publishedAt: "2026-02-10",
    updatedAt: "2026-09-11",
    heroImage: {
      src: "/courses/decolonisation.jpg",
      alt: "Crowd gathered outside an official building during an independence ceremony",
      width: 1200,
      height: 630,
    },
    chapters: [
      {
        title: "A world of empires in 1945",
        body: "When the Second World War ended, much of Africa and Asia was governed from London, Paris, Brussels, The Hague or Lisbon. European empires ruled hundreds of millions of people. The war had weakened them badly: their economies were drained, their military defeats had punctured their prestige, and colonial troops had fought in Europe and Asia in the name of freedom. The United Nations Charter, signed in 1945, affirmed the right of peoples to self-determination. The two new superpowers, the United States and the Soviet Union, both opposed the European empires, for very different reasons.",
      },
      {
        title: "Asia goes first",
        body: "Asia led the way. India and Pakistan became independent in August 1947, at the cost of a partition that displaced millions and caused enormous violence. Indonesia declared independence in 1945 and won Dutch recognition in 1949 after four years of conflict. In Indochina, the war between France and the Viet Minh ended in 1954 with the French defeat at Dien Bien Phu and the Geneva Accords. Two routes were already visible: negotiation and armed struggle, often mixed.",
      },
      {
        title: "The African year",
        body: "In Africa the turning point came around 1960, when seventeen states became independent in a single year, including most former French colonies and the Belgian Congo. The Bandung Conference of 1955 had already brought twenty-nine Asian and African countries together in shared opposition to colonial rule. Many transitions were negotiated. Others were brutal: the Algerian war ran from 1954 to 1962 and killed hundreds of thousands. Portugal's colonies only became independent in 1974-75, after the dictatorship in Lisbon fell.",
      },
      {
        title: "Building a state after empire",
        body: "Political independence settled less than it promised. New states inherited borders drawn in Berlin in 1885 with no regard for the people living inside them, economies built around one or two export commodities, and thin administrations. Many adopted one-party rule in the name of national unity. The Cold War arrived quickly, with both blocs backing governments in exchange for diplomatic alignment. The Non-Aligned Movement, founded in 1961, tried to hold a third position.",
      },
      {
        title: "What it left behind",
        body: "Decolonisation redrew the map. The UN had 51 members in 1945; it has 193 today. It also left long shadows: contested borders, European official languages, lopsided trade relationships, and memories that remain politically charged. Historians still argue over the balance sheet of empire and over how colonisation should be taught. Understanding this period makes a great deal of today's news, from the Sahel to Southeast Asia, far easier to read.",
      },
    ],
    sources: [
      { label: "United Nations — Decolonization", url: "https://www.un.org/dppa/decolonization" },
      { label: "Encyclopædia Britannica — Decolonization", url: "https://www.britannica.com/topic/decolonization" },
      { label: "British Library — Bandung Conference resources", url: "https://www.bl.uk" },
    ],
    relatedSlugs: ["mental-health-a-social-issue"],
    alternateSlug: "la-decolonisation-panorama-1945-1975",
  },

  /* ---------------------------------------------------------------- EN #2 */
  {
    slug: "mental-health-a-social-issue",
    locale: "en",
    title: "Mental health as a social issue",
    category: "Society",
    categoryId: "society",
    excerpt:
      "Long treated as a private matter, mental health is now a public one. The numbers, the causes, and what governments are doing.",
    readingTimeMinutes: 5,
    publishedAt: "2026-03-04",
    updatedAt: "2026-09-11",
    heroImage: {
      src: "/courses/sante-mentale.jpg",
      alt: "Silhouette of a person sitting by a window in soft light",
      width: 1200,
      height: 630,
    },
    chapters: [
      {
        title: "What we are talking about",
        body: "The World Health Organization defines mental health as a state of well-being that lets a person cope with the ordinary stresses of life, work productively and contribute to their community. It is more than the absence of illness. Mental disorders cover a wide range: depression, anxiety disorders, bipolar disorder, schizophrenia, eating disorders and addiction. What sets a disorder apart is its intensity, its duration and its effect on daily life.",
      },
      {
        title: "An underestimated prevalence",
        body: "The WHO estimates that roughly one person in eight worldwide lives with a mental disorder. Depression and anxiety are among the leading causes of years lived with disability. In France, mental health is one of the largest single areas of health insurance spending. The real figures are probably higher: many people never seek care, either because services are out of reach or because they fear how they will be seen.",
      },
      {
        title: "What weighs on mental health",
        body: "The causes stack up. Genetics and biology matter, but social conditions matter at least as much: financial insecurity, isolation, working conditions, violence and discrimination. Collective events leave marks too. Surveys after the Covid-19 pandemic recorded a lasting rise in depressive and anxious symptoms, especially among young adults. The debate about social media and teenagers is still open: the correlations are real, but researchers are still working out how much of it is cause.",
      },
      {
        title: "The cost of stigma",
        body: "Talking about mental health is still hard. Stigma delays help-seeking, complicates staying in work, and keeps false ideas alive — above all the belief that people with mental illness are dangerous, when they are statistically far more likely to be victims of violence than perpetrators. Public campaigns, public figures speaking openly and the work of patient organisations have shifted attitudes over the past fifteen years, without removing the taboo.",
      },
      {
        title: "What is being done",
        body: "Policy responses combine several levers: stronger primary care, reimbursed sessions with psychologists, mental health first-aid training, and prevention in schools and workplaces. The WHO argues for moving care out of hospitals and into community services attached to general practice. Funding remains the sticking point: in many countries mental health takes a very small share of the health budget, far out of step with the burden these conditions actually carry.",
      },
    ],
    sources: [
      { label: "World Health Organization — Mental health", url: "https://www.who.int/health-topics/mental-health" },
      { label: "OECD — Health at a Glance", url: "https://www.oecd.org/health/health-at-a-glance" },
      { label: "Santé publique France — Mental health data", url: "https://www.santepubliquefrance.fr" },
    ],
    relatedSlugs: ["decolonisation-1945-1975"],
    alternateSlug: "la-sante-mentale-enjeu-de-societe",
  },
];
