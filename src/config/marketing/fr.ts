/**
 * Copy marketing FR (accueil, page app, page téléchargement).
 * Une clé = un texte. **mot** = mot surligné en rose. On tutoie.
 * Chiffres autorisés uniquement : 500 000 apprenants, 4,8 sur l'App Store,
 * 140+ pays, 300+ cours, 2 600+ questions, audio, bloqueur, 10 min/jour, essai gratuit.
 */
export const MK_FR = {
  nav: {
    courses: "Cours",
    how: "Comment ça marche",
    reviews: "Avis",
    faq: "FAQ",
    download: "Télécharger",
    menu: "Menu",
    close: "Fermer",
  },
  cta: {
    start: "Commencer en 1 minute",
    appStore: "App Store",
    appStoreSmall: "Télécharger sur l'",
    googlePlay: "Google Play",
    googlePlaySmall: "Disponible sur",
    free: "Gratuit à essayer",
  },
  hero: {
    eyebrow: "L'app de culture générale",
    title: "Deviens un peu plus **cultivé** chaque jour",
    subtitle:
      "Des cours de 10 minutes écrits par de vrais chercheurs, à lire ou à écouter, puis un quiz pour ne rien oublier. Le bon réflexe pour remplacer le scroll.",
    rating: "4,8",
    ratingLine: "500 000 apprenants · 140+ pays",
  },
  trust: {
    line: "Écrit par de vrais chercheurs et docteurs. **Pas par une IA.**",
    alt: ["Université d'Oxford", "Queen's University Belfast", "Université nationale de Jeonbuk", "Université de Belgrade", "Académie slovaque des sciences"],
  },
  how: {
    eyebrow: "Comment ça marche",
    title: "Trois gestes, **dix minutes**, tous les jours",
    steps: [
      { n: "1", title: "Choisis tes sujets", text: "Histoire, sciences, art, mythologie… Tu dis ce qui te rend curieux, Sophia s'occupe du reste." },
      { n: "2", title: "Apprends en 10 minutes par jour", text: "Un cours court, clair et illustré. À lire dans le métro ou à écouter en marchant." },
      { n: "3", title: "Retiens avec des quiz", text: "Des questions qui reviennent au bon moment, pour que ce que tu apprends reste vraiment." },
    ],
  },
  path: {
    eyebrow: "Ton parcours",
    title: "Un chemin **rien qu'à toi**",
    text: "Chaque cours terminé en débloque un autre, choisi selon tes goûts. Tu avances à ton rythme, une étape à la fois.",
  },
  time: {
    eyebrow: "Reprends ton temps",
    title: "Une vie, c'est environ **80 ans**",
    legendSleep: "Sommeil",
    legendWork: "Travail et études",
    legendFree: "Temps libre",
    legendPhone: "Sur ton téléphone",
    stepSleep: "On en passe près d'un tiers à dormir.",
    stepWork: "Un autre tiers à travailler et étudier.",
    stepFree: "Il reste le temps libre…",
    stepPhone: "… et une bonne partie part dans ton téléphone.",
    closingBefore: "Avec Sophia, transforme ce temps en",
    closingWords: ["histoire", "sciences", "littérature", "art", "mythologie", "monde actuel"],
    note: "Illustration à partir d'environ 3 h d'écran par jour.",
  },
  subjects: {
    eyebrow: "Les sujets",
    title: "De quoi **nourrir** ta curiosité",
    tiles: {
      history: { name: "Histoire", courses: ["Apollo 11 : les coulisses du premier pas sur la Lune", "Le trésor de Toutânkhamon", "1889 : la tour Eiffel scandalise Paris"] },
      science: { name: "Sciences", courses: ["Pourquoi rêve-t-on ?", "Qu'est-ce qu'un trou noir ?", "La structure de l'ADN (Watson & Crick, 1953)"] },
      literature: { name: "Littérature", courses: ["Pourquoi la Joconde fascine-t-elle les écrivains ?"] },
      art: { name: "Art", courses: ["Pourquoi le ciel de « La Nuit étoilée » tourbillonne-t-il ?", "Pourquoi la Joconde est-elle si célèbre ?"] },
      mythology: { name: "Mythologie", courses: ["Les pyramides de Gizeh, tombeaux des dieux ?"] },
      current: { name: "Monde actuel", courses: ["L'IA va-t-elle remplacer les métiers du savoir ?", "Comment est né le conflit israélo-palestinien ?"] },
    },
  },
  researchers: {
    eyebrow: "Les auteurs",
    title: "Écrit par des gens qui **savent vraiment**",
    text: "Chaque cours est rédigé par un chercheur ou un docteur, puis relu par notre équipe éditoriale.",
    bioPlaceholder: "Bio à compléter",
  },
  reviews: {
    eyebrow: "Avis",
    title: "Ils ont remplacé le scroll par **Sophia**",
    badge: "4,8 sur l'App Store",
  },
  features: {
    eyebrow: "Dans l'app",
    title: "Tout ce qu'il faut pour **apprendre pour de vrai**",
    items: {
      courses: { title: "300+ cours", text: "Écrits par de vrais chercheurs." },
      quiz: { title: "2 600+ questions", text: "Des quiz pour ancrer chaque cours." },
      audio: { title: "Chaque cours en audio", text: "À écouter en marchant ou en cuisinant." },
      blocker: { title: "Bloqueur TikTok et apps", text: "Pour garder ton attention sur l'essentiel." },
      reminder: { title: "Rappel quotidien", text: "Un petit coup de pouce au bon moment." },
      science: { title: "Méthodes prouvées", text: "Des techniques validées scientifiquement." },
    },
    notifTitle: "Sophia",
    notifText: "Ton cours du jour t'attend : « Pourquoi rêve-t-on ? » 🌙",
    notifTime: "maintenant",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Tes questions",
    items: [
      { q: "Sophia, c'est quoi ?", a: "Une app de culture générale : des cours de 10 minutes, à lire ou à écouter, suivis d'un quiz. Plus de 500 000 personnes l'utilisent dans plus de 140 pays." },
      { q: "Qui écrit les cours ?", a: "De vrais chercheurs et docteurs, pas une IA. Chaque cours est relu par notre équipe éditoriale avant d'être publié." },
      { q: "Combien de temps faut-il par jour ?", a: "Environ 10 minutes. Un cours, un quiz, et c'est fait." },
      { q: "C'est gratuit ?", a: "Tu peux essayer Sophia gratuitement. Tu choisis ensuite si tu veux continuer avec l'abonnement." },
      { q: "Je peux écouter les cours ?", a: "Oui, chaque cours existe aussi en version audio." },
      { q: "C'est quoi le bloqueur ?", a: "Une option qui bloque les apps qui te distraient, comme TikTok, pour t'aider à garder ton attention." },
      { q: "Sur quels téléphones ?", a: "Sophia est disponible sur iPhone (App Store) et Android (Google Play)." },
    ],
  },
  final: {
    title: "Deviens un peu plus **cultivé** chaque jour",
    text: "Dix minutes aujourd'hui. Un peu plus de monde dans ta tête demain.",
  },
  footer: {
    tagline: "Sophia, culture générale. Une app éditée par {company}.",
    product: "Produit",
    company: "Sophia",
    legalTitle: "Légal",
    courses: "Tous les cours",
    app: "L'app",
    download: "Télécharger",
    start: "Commencer",
    teacherLogin: "Espace auteurs",
    becomeTeacher: "Devenir professeur",
    becomeCreator: "Devenir créateur",
    legal: "Mentions légales",
    privacy: "Confidentialité",
    rights: "Tous droits réservés.",
    language: "Langue",
  },
  appPage: {
    eyebrow: "L'app Sophia",
    title: "La culture générale qui **tient dans ta poche**",
    subtitle: "Des cours courts, des quiz malins et un parcours qui s'adapte à toi. Sur iPhone et Android.",
  },
  downloadPage: {
    eyebrow: "Télécharger",
    title: "Télécharge Sophia **gratuitement**",
    subtitle: "Disponible sur l'App Store et Google Play. Ou commence ici en une minute, et retrouve ton parcours dans l'app.",
    qrHint: "Sur ordinateur ? Ouvre ce lien sur ton téléphone :",
  },
};

export type MkCopy = typeof MK_FR;
