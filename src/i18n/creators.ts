import type { Lang } from "./routes";

/** Textes publics du programme créateurs (landing pages bilingues). */
type CreatorsCopy = {
  chooser: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    lead: string;
    ugc: { title: string; lines: [string, string, string]; cta: string };
    slideshow: { title: string; lines: [string, string, string]; cta: string };
  };
  ugc: {
    metaTitle: string;
    metaDescription: string;
    heroTitle: string;
    heroSubtitle: string;
    cta: string;
    replyLine: string;
    aboutTitle: string;
    about: string;
    doingTitle: string;
    doing: string[];
    whoTitle: string;
    who: string;
    onlyIf: string;
    requirements: string[];
    whyTitle: string;
    why: string[];
    bottom: string;
  };
  slideshow: {
    metaTitle: string;
    metaDescription: string;
    heroTitle: string;
    heroSubtitle: string;
    cta: string;
    howTitle: string;
    steps: string[];
    paidTitle: string;
    paid: string;
    forTitle: string;
    forText: string;
    reqTitle: string;
    requirements: string[];
  };
  formsNote: string;
};

export const CREATORS: Record<Lang, CreatorsCopy> = {
  en: {
    chooser: {
      metaTitle: "Create for Sophia: UGC and slideshow creators",
      metaDescription:
        "Two ways to create content for Sophia, the general-knowledge app: film yourself as a UGC creator, or publish ready-made slideshows without appearing on camera.",
      title: "Create for Sophia",
      lead: "Two ways to work with us. Pick the one that fits you.",
      ugc: {
        title: "UGC creator",
        lines: [
          "You appear on camera. You set up a new account that belongs to Sophia and post videos there, five times a week, from our daily briefs.",
          "Paid per video: a fixed fee plus a bonus that grows with views. The best-paid track, and the most demanding.",
          "Requires an iPhone, being comfortable on camera, and posting consistently.",
        ],
        cta: "Apply as a UGC creator",
      },
      slideshow: {
        title: "Slideshow creator",
        lines: [
          "You do not appear on camera. You set up a new TikTok account that belongs to Sophia, and every day we send you two ready-made posts to assemble and publish.",
          "Paid a fixed amount per post, between $0.40 and $1.10 depending on your country. Simple, predictable, no performance pressure.",
          "Requires a phone, thirty minutes a day, and following instructions exactly.",
        ],
        cta: "Apply as a slideshow creator",
      },
    },
    ugc: {
      metaTitle: "Become a Sophia UGC creator: paid per video",
      metaDescription:
        "Post short videos on a Sophia TikTok account you run. Daily briefs, a hiring manager for your country, and a fee for every video.",
      heroTitle: "Create content for Sophia",
      heroSubtitle:
        "Post about an app that makes people smarter. Daily briefs, a team behind you, and a fee for every video.",
      cta: "Apply now (2 minutes)",
      replyLine: "We reply to every application within five days.",
      aboutTitle: "About Sophia",
      about:
        "Sophia is a general-knowledge app: short courses on history, science, art, literature, mythology and the world today, read in under ten minutes. It is one of the fastest-growing general-knowledge apps, with 200,000 active users a few months after launch. More than a hundred creators already work with us.",
      doingTitle: "What you will be doing",
      doing: [
        "You set up a new TikTok account for Sophia, following our instructions, and post short videos there at least five times a week. The account belongs to Sophia; you run it. We send you daily briefs and inspiration so you never start from a blank page.",
        "You are paid per video: a fixed fee for each one, plus a bonus when it performs. We explain the exact figures at the interview.",
        "You work with a hiring manager for your country who answers your questions, reviews your videos and helps you get better.",
      ],
      whoTitle: "Who we are looking for",
      who: "People who are good on camera and comfortable talking to it like it is a friend. Experience is not required. We care about how you come across, not how many followers you have.",
      onlyIf: "Please only apply if",
      requirements: [
        "You have an iPhone",
        "You can post at least five times a week, consistently",
        "You do not currently work for a competing app",
        "You are at least 18 years old",
        "You are good on camera",
        "You agree to sign an account agreement before starting",
      ],
      whyTitle: "Why Sophia",
      why: [
        "We help people get smarter, and our creators are how they find out we exist. Over a hundred creators already post for us.",
        "Daily briefs and ideas, so your only job is to make the video.",
        "A hiring manager for your country who actually answers.",
        "Videos about Sophia, and sometimes about other apps we work with, which means more work for you, not less.",
      ],
      bottom: "You will need to submit a short video of yourself talking.",
    },
    slideshow: {
      metaTitle: "Become a Sophia slideshow creator: two posts a day",
      metaDescription:
        "No camera, no experience. Publish two ready-made TikTok slideshows a day for Sophia and get paid per post.",
      heroTitle: "Post two slideshows a day. That is the whole job.",
      heroSubtitle:
        "We give you the posts. You assemble them, add the music, and publish. Paid per post.",
      cta: "Apply now (1 minute)",
      howTitle: "How it works",
      steps: [
        "You apply below. We reply within five days.",
        "If accepted, you get an account in our system and you set up a fresh TikTok account for Sophia, following our instructions. The account belongs to Sophia; you run it.",
        "You warm the account up for a few days, exactly as we tell you. Then the posts start.",
        "Every day, two posts are waiting for you in your space: the slides, the caption, the music. You assemble and publish. Nothing to invent.",
      ],
      paidTitle: "What you are paid",
      paid: "A fixed amount for every post published, between $0.40 and $1.10 depending on the country you are in. The rate for your country is confirmed when you are accepted. Paid monthly.",
      forTitle: "Who this is for",
      forText:
        "People who want a simple, regular task they can do from their phone in under thirty minutes a day, and who follow instructions to the letter. You do not appear on camera and you do not need any experience.",
      reqTitle: "Requirements",
      requirements: [
        "You are at least 18 years old",
        "You have a smartphone and a reliable connection",
        "You can post two slideshows a day, every day",
        "You do not currently work for a competing app",
        "You agree to sign an account agreement before starting",
      ],
    },
    formsNote: "",
  },
  fr: {
    chooser: {
      metaTitle: "Créer pour Sophia : créateurs UGC et slideshows",
      metaDescription:
        "Deux façons de créer du contenu pour Sophia, l'appli de culture générale : vous filmer en tant que créateur UGC, ou publier des slideshows prêts à l'emploi sans apparaître à l'écran.",
      title: "Créer pour Sophia",
      lead: "Deux façons de travailler avec nous. Choisissez celle qui vous correspond.",
      ugc: {
        title: "Créateur UGC",
        lines: [
          "Vous apparaissez à l'écran. Vous créez un nouveau compte qui appartient à Sophia et vous y publiez des vidéos, cinq fois par semaine, à partir de nos briefs quotidiens.",
          "Payé à la vidéo : un montant fixe, plus un bonus qui augmente avec les vues. La formule la mieux rémunérée, et la plus exigeante.",
          "Il faut un iPhone, être à l'aise face caméra et publier avec régularité.",
        ],
        cta: "Postuler comme créateur UGC",
      },
      slideshow: {
        title: "Créateur de slideshows",
        lines: [
          "Vous n'apparaissez pas à l'écran. Vous créez un nouveau compte TikTok qui appartient à Sophia, et chaque jour nous vous envoyons deux posts prêts à assembler et à publier.",
          "Un montant fixe par post, entre 0,40 $ et 1,10 $ selon votre pays. Simple, prévisible, sans pression sur les performances.",
          "Il faut un téléphone, trente minutes par jour, et suivre les consignes à la lettre.",
        ],
        cta: "Postuler comme créateur de slideshows",
      },
    },
    ugc: {
      metaTitle: "Devenir créateur UGC pour Sophia : payé à la vidéo",
      metaDescription:
        "Publiez de courtes vidéos sur un compte TikTok Sophia que vous animez. Des briefs chaque jour, un responsable pour votre pays et une rémunération pour chaque vidéo.",
      heroTitle: "Créez du contenu pour Sophia",
      heroSubtitle:
        "Parlez d'une appli qui rend les gens plus cultivés. Des briefs chaque jour, une équipe derrière vous, et une rémunération pour chaque vidéo.",
      cta: "Postuler (2 minutes)",
      replyLine: "Nous répondons à chaque candidature sous cinq jours.",
      aboutTitle: "Sophia en deux mots",
      about:
        "Sophia est une appli de culture générale : des cours courts sur l'histoire, les sciences, l'art, la littérature, la mythologie et le monde actuel, qui se lisent en moins de dix minutes. C'est l'une des applis de culture générale qui grandit le plus vite, avec 200 000 utilisateurs actifs quelques mois après son lancement. Plus d'une centaine de créateurs travaillent déjà avec nous.",
      doingTitle: "Ce que vous ferez",
      doing: [
        "Vous créez un nouveau compte TikTok pour Sophia, en suivant nos consignes, et vous y publiez de courtes vidéos au moins cinq fois par semaine. Le compte appartient à Sophia ; c'est vous qui l'animez. Nous vous envoyons des briefs et des idées chaque jour : vous ne partez jamais d'une page blanche.",
        "Vous êtes payé à la vidéo : un montant fixe pour chacune, plus un bonus quand elle marche bien. Nous détaillons les chiffres exacts lors de l'entretien.",
        "Vous travaillez avec un responsable pour votre pays, qui répond à vos questions, relit vos vidéos et vous aide à progresser.",
      ],
      whoTitle: "Qui nous cherchons",
      who: "Des personnes à l'aise face caméra, qui lui parlent comme à un ami. Aucune expérience n'est requise. Ce qui compte, c'est la façon dont vous passez à l'écran, pas votre nombre d'abonnés.",
      onlyIf: "Ne postulez que si",
      requirements: [
        "Vous avez un iPhone",
        "Vous pouvez publier au moins cinq fois par semaine, avec régularité",
        "Vous ne travaillez pas actuellement pour une appli concurrente",
        "Vous avez au moins 18 ans",
        "Vous êtes à l'aise face caméra",
        "Vous acceptez de signer un contrat de compte avant de commencer",
      ],
      whyTitle: "Pourquoi Sophia",
      why: [
        "Nous aidons les gens à se cultiver, et c'est par nos créateurs qu'ils découvrent que nous existons. Plus d'une centaine de créateurs publient déjà pour nous.",
        "Des briefs et des idées chaque jour : votre seul travail, c'est de faire la vidéo.",
        "Un responsable pour votre pays, qui répond vraiment.",
        "Des vidéos sur Sophia, et parfois sur d'autres applis avec lesquelles nous travaillons : plus de travail pour vous, pas moins.",
      ],
      bottom: "Il vous faudra envoyer une courte vidéo de vous en train de parler.",
    },
    slideshow: {
      metaTitle: "Devenir créateur de slideshows pour Sophia : deux posts par jour",
      metaDescription:
        "Pas de caméra, pas d'expérience requise. Publiez chaque jour deux slideshows TikTok prêts à l'emploi pour Sophia, payés au post.",
      heroTitle: "Deux slideshows par jour. C'est tout le travail.",
      heroSubtitle:
        "Nous vous donnons les posts. Vous les assemblez, ajoutez la musique et publiez. Payé au post.",
      cta: "Postuler (1 minute)",
      howTitle: "Comment ça marche",
      steps: [
        "Vous postulez ci-dessous. Nous répondons sous cinq jours.",
        "Si vous êtes retenu, vous recevez un accès à notre espace et vous créez un nouveau compte TikTok pour Sophia, en suivant nos consignes. Le compte appartient à Sophia ; c'est vous qui l'animez.",
        "Vous « chauffez » le compte pendant quelques jours, exactement comme indiqué. Ensuite, les posts commencent.",
        "Chaque jour, deux posts vous attendent dans votre espace : les slides, la légende, la musique. Vous assemblez et publiez. Rien à inventer.",
      ],
      paidTitle: "Votre rémunération",
      paid: "Un montant fixe pour chaque post publié, entre 0,40 $ et 1,10 $ selon le pays où vous êtes. Le tarif de votre pays vous est confirmé à l'acceptation. Paiement mensuel.",
      forTitle: "Pour qui",
      forText:
        "Pour celles et ceux qui veulent une tâche simple et régulière, faisable depuis leur téléphone en moins de trente minutes par jour, et qui suivent les consignes à la lettre. Vous n'apparaissez pas à l'écran et aucune expérience n'est nécessaire.",
      reqTitle: "Conditions",
      requirements: [
        "Vous avez au moins 18 ans",
        "Vous avez un smartphone et une connexion fiable",
        "Vous pouvez publier deux slideshows par jour, tous les jours",
        "Vous ne travaillez pas actuellement pour une appli concurrente",
        "Vous acceptez de signer un contrat de compte avant de commencer",
      ],
    },
    formsNote: "Le formulaire de candidature est en anglais.",
  },
};
