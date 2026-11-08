/**
 * Web-to-app onboarding funnel (/start FR, /en/start EN).
 * Source of truth: the Sophia iOS onboarding spec. Every text, option, course,
 * review and price lives here so copy can be rewritten without touching
 * components. Prices are placeholders: no real payment exists.
 */
export type StartLang = "fr" | "en";
type L = Record<StartLang, string>;

const IMG = (name: string) => `/onboarding/${name}`;

/* ------------------------------ steps ------------------------------ */

export const STEPS = [
  "welcome", "language", "intro", "social", "name", "age", "knowledge",
  "motivation", "goals", "topics", "help", "mission", "questions",
  "phoneTime", "years", "transform", "reviews", "personalize", "swipe",
  "loading", "profile", "readingTime", "email", "account", "aboard",
  "features", "trial", "reminder", "paywallA", "paywallB", "success",
] as const;
export type StepId = (typeof STEPS)[number];

/** The 14 steps that show the progress capsules, in order. */
export const DOT_STEPS: StepId[] = [
  "name", "age", "knowledge", "motivation", "goals", "topics", "help",
  "mission", "questions", "phoneTime", "years", "reviews", "swipe", "loading",
];

/* ------------------------------ design ------------------------------ */

export const OB = {
  bg: "#F7F8FA", surface: "#FFFFFF", surfaceMuted: "#E9EFF8",
  ink: "#16263D", inkSecondary: "#55637A", inkTertiary: "#9AA4B2",
  accent: "#1A3A6B", accentSoft: "#2E62C4", hairline: "#E4E7EC",
  success: "#387D5A", danger: "#DB595C", pink: "#F2548F", gold: "#E6B233",
} as const;

/* ------------------------------ options ------------------------------ */

export type Option = { id: string; emoji: string; label: L };

export const LANGUAGES: { id: StartLang; flag: string; native: string }[] = [
  { id: "fr", flag: "🇫🇷", native: "Français" },
  { id: "en", flag: "🇬🇧", native: "English" },
];

export const AGES: { id: string; label: L }[] = [
  { id: "u18", label: { fr: "Moins de 18 ans", en: "Under 18" } },
  { id: "18-24", label: { fr: "18 – 24 ans", en: "18-24" } },
  { id: "25-34", label: { fr: "25 – 34 ans", en: "25-34" } },
  { id: "35-44", label: { fr: "35 – 44 ans", en: "35-44" } },
  { id: "45-54", label: { fr: "45 – 54 ans", en: "45-54" } },
  { id: "55+", label: { fr: "55 ans et plus", en: "55 and over" } },
];

export const KNOWLEDGE_LEVELS: { id: string; emoji: string; label: L }[] = [
  { id: "not-great", emoji: "😅", label: { fr: "Pas terrible", en: "Not great" } },
  { id: "decent", emoji: "🙂", label: { fr: "Correcte", en: "Decent" } },
  { id: "good", emoji: "😎", label: { fr: "Bonne", en: "Good" } },
  { id: "very-good", emoji: "🤓", label: { fr: "Très bonne", en: "Very good" } },
];

export const MOTIVATIONS: Option[] = [
  { id: "grow", emoji: "🌱", label: { fr: "Pour m'épanouir et grandir", en: "To grow as a person" } },
  { id: "shine", emoji: "💬", label: { fr: "Pour briller dans les conversations", en: "To shine in conversations" } },
  { id: "career", emoji: "💼", label: { fr: "Pour avancer dans mes études ou ma carrière", en: "To get ahead in my studies or career" } },
  { id: "mind", emoji: "🧠", label: { fr: "Pour garder l'esprit vif", en: "To keep my mind sharp" } },
  { id: "world", emoji: "🌍", label: { fr: "Pour mieux comprendre le monde", en: "To understand the world better" } },
];

export const GOALS: Option[] = [
  { id: "cultivate", emoji: "🧠", label: { fr: "Me cultiver au quotidien", en: "Broaden my mind daily" } },
  { id: "reduceScreen", emoji: "📵", label: { fr: "Réduire mon temps d'écran", en: "Reduce my screen time" } },
  { id: "exams", emoji: "🎓", label: { fr: "Réussir mes études / examens", en: "Ace my studies / exams" } },
  { id: "impress", emoji: "✨", label: { fr: "Impressionner en société", en: "Impress people" } },
  { id: "curiosity", emoji: "🔭", label: { fr: "Apprendre par curiosité", en: "Learn out of curiosity" } },
];

export type Topic = { id: string; emoji: string; color: string; label: L };
export const TOPICS: Topic[] = [
  { id: "history", emoji: "🗽", color: "#F59E0A", label: { fr: "Histoire", en: "History" } },
  { id: "science", emoji: "🦠", color: "#33D499", label: { fr: "Sciences", en: "Science" } },
  { id: "literature", emoji: "📖", color: "#ED5973", label: { fr: "Littérature", en: "Literature" } },
  { id: "art", emoji: "🎨", color: "#D98CF2", label: { fr: "Art", en: "Art" } },
  { id: "mythology", emoji: "⚡️", color: "#8F66EB", label: { fr: "Mythologie", en: "Mythology" } },
  { id: "current", emoji: "🌍", color: "#40B8D9", label: { fr: "Monde actuel", en: "Current affairs" } },
];

/* ------------------------------ courses ------------------------------ */

export type Course = { id: string; subject: string; color: string; img: string; title: L };

export const INTRO_COURSES: Course[] = [
  { id: "reve", subject: "Science", color: "#33D499", img: IMG("pourquoi_reve_t_on.jpg"), title: { fr: "Pourquoi rêve-t-on ?", en: "Why do we dream?" } },
  { id: "trou-noir", subject: "Science", color: "#33D499", img: IMG("qu_est_ce_qu_un_trou_noir.jpg"), title: { fr: "Qu'est-ce qu'un trou noir ?", en: "What is a black hole?" } },
  { id: "conflit", subject: "Current affairs", color: "#40B8D9", img: IMG("la_naissance_du_conflit_israelo_palestinien.jpg"), title: { fr: "Comment est né le conflit israélo-palestinien ?", en: "How did the Israeli-Palestinian conflict begin?" } },
  { id: "van-gogh", subject: "Art", color: "#D98CF2", img: IMG("la_nuit_etoilee_van_gogh.jpg"), title: { fr: "Pourquoi le ciel de « La Nuit étoilée » tourbillonne-t-il ?", en: "Why does the sky in “The Starry Night” swirl?" } },
];

export const QUIZ_GRID_IMAGES = [
  "apollo_11_aldrin_us_flag_lunar_module_1969.jpg",
  "tutankhamun_golden_mask_egyptian_museum_cairo.jpg",
  "la_joconde.jpg",
  "giza_pyramids_khufu_khafre_menkaure_wide_view.jpg",
  "crab_nebula_supernova_remnant_hubble.jpg",
  "eiffel_tower_1889_universal_exhibition.jpg",
].map(IMG);

export const AUTHOR_PHOTOS = [
  "author_rana_abdalla.jpg", "author_mark_n_hoffman.jpg",
  "author_elizabeth_singer_hunt.jpg", "author_stacy_jankowski.jpg",
  "author_simon_lea.jpg", "author_dusan_nikolic.jpg",
  "author_guido_manuel_de_la_torre_olvera.jpg", "author_ivana_toskovic.jpg",
].map(IMG);

export const UNIVERSITY_LOGOS = [
  "university_01_oxford.png", "university_02_queens_belfast.png",
  "university_03_jeonbuk.png", "university_04_belgrade.png",
  "university_05_slovak_academy.png",
].map(IMG);

export const STUDENT_PHOTOS = [1, 2, 3, 4, 5].map((i) => IMG(`student_${i}.jpg`));
export const REVIEW_AVATARS = [1, 2, 3, 4, 5].map((i) => IMG(`review_avatar_${i}.jpg`));

/** Base swipe deck; two more cards are derived from the chosen topics. */
export const SWIPE_BASE: Course[] = [
  { id: "baille", subject: "Science", color: "#33D499", img: IMG("pourquoi_baille_t_on.jpg"), title: { fr: "Pourquoi baille-t-on ?", en: "Why do we yawn?" } },
  { id: "conflit", subject: "Current affairs", color: "#40B8D9", img: IMG("la_naissance_du_conflit_israelo_palestinien.jpg"), title: { fr: "Comment est né le conflit israélo-palestinien ?", en: "How did the Israeli-Palestinian conflict begin?" } },
  { id: "joconde", subject: "Art", color: "#D98CF2", img: IMG("la_joconde.jpg"), title: { fr: "Pourquoi la Joconde est-elle si célèbre ?", en: "Why is the Mona Lisa so famous?" } },
  { id: "mer", subject: "Science", color: "#33D499", img: IMG("pourquoi_l_eau_de_mer_est_salee.jpg"), title: { fr: "Pourquoi l'eau de mer est-elle salée ?", en: "Why is seawater salty?" } },
];

/** Extra courses per topic, used to complete the swipe deck and profile scroller. */
export const TOPIC_COURSES: Record<string, Course[]> = {
  history: [
    { id: "apollo", subject: "History", color: "#F59E0A", img: IMG("apollo_11_aldrin_us_flag_lunar_module_1969.jpg"), title: { fr: "Apollo 11 : les coulisses du premier pas sur la Lune", en: "Apollo 11: behind the first steps on the Moon" } },
    { id: "toutankhamon", subject: "History", color: "#F59E0A", img: IMG("tutankhamun_golden_mask_egyptian_museum_cairo.jpg"), title: { fr: "Le trésor de Toutânkhamon", en: "The treasure of Tutankhamun" } },
    { id: "eiffel", subject: "History", color: "#F59E0A", img: IMG("eiffel_tower_1889_universal_exhibition.jpg"), title: { fr: "1889 : la tour Eiffel scandalise Paris", en: "1889: the Eiffel Tower shocks Paris" } },
  ],
  science: [
    { id: "penicilline", subject: "Science", color: "#33D499", img: IMG("la_decouverte_de_la_penicilline.jpg"), title: { fr: "La découverte de la pénicilline (Fleming, 1928)", en: "The discovery of penicillin" } },
    { id: "adn", subject: "Science", color: "#33D499", img: IMG("la_structure_de_l_adn.jpg"), title: { fr: "La structure de l'ADN (Watson & Crick, 1953)", en: "The structure of DNA" } },
    { id: "nebuleuse", subject: "Science", color: "#33D499", img: IMG("crab_nebula_supernova_remnant_hubble.jpg"), title: { fr: "La nébuleuse du Crabe, reste d'une supernova", en: "The Crab Nebula, a supernova remnant" } },
  ],
  literature: [
    { id: "joconde-lit", subject: "Literature", color: "#ED5973", img: IMG("la_joconde.jpg"), title: { fr: "Pourquoi la Joconde fascine-t-elle les écrivains ?", en: "Why writers can't quit the Mona Lisa" } },
  ],
  art: [
    { id: "van-gogh-art", subject: "Art", color: "#D98CF2", img: IMG("la_nuit_etoilee_van_gogh.jpg"), title: { fr: "Pourquoi le ciel de « La Nuit étoilée » tourbillonne-t-il ?", en: "Why does the sky in “The Starry Night” swirl?" } },
  ],
  mythology: [
    { id: "pyramides", subject: "Mythology", color: "#8F66EB", img: IMG("giza_pyramids_khufu_khafre_menkaure_wide_view.jpg"), title: { fr: "Les pyramides de Gizeh, tombeaux des dieux ?", en: "The Giza pyramids, tombs of the gods?" } },
  ],
  current: [
    { id: "ia-emploi", subject: "Current affairs", color: "#40B8D9", img: IMG("l_ia_et_l_emploi.jpg"), title: { fr: "L'IA va-t-elle remplacer les métiers du savoir ?", en: "Will AI replace knowledge work?" } },
  ],
};

export const ROULETTE_QUESTIONS: L[] = [
  { fr: "Pourquoi le ciel est-il bleu ?", en: "Why is the sky blue?" },
  { fr: "Comment Napoléon a-t-il gagné à Ulm ?", en: "How did Napoleon win at Ulm?" },
  { fr: "Qu'est-ce qu'un trou noir ?", en: "What is a black hole?" },
  { fr: "Qu'est-ce que l'impressionnisme ?", en: "What is Impressionism?" },
  { fr: "Comment fonctionne la dette publique ?", en: "How does public debt work?" },
  { fr: "Pourquoi la Lune ne tombe-t-elle pas ?", en: "Why doesn't the Moon fall?" },
  { fr: "Qui était vraiment Cléopâtre ?", en: "Who was Cleopatra really?" },
  { fr: "Comment l'Univers est-il né ?", en: "How did the Universe begin?" },
  { fr: "Pourquoi rêve-t-on la nuit ?", en: "Why do we dream at night?" },
  { fr: "Qu'est-ce que la relativité d'Einstein ?", en: "What is Einstein's theory of relativity?" },
];

export const REVIEWS: { name: string; age: number; avatar: string | null; quote: L }[] = [
  { name: "Camille", age: 22, avatar: REVIEW_AVATARS[0]!, quote: { fr: "Depuis que je scroll moins et que j'utilise Sophia, j'ai l'impression que je retiens beaucoup plus de choses.", en: "Since I started scrolling less and using Sophia, I feel like I actually remember way more." } },
  { name: "Yanis", age: 27, avatar: REVIEW_AVATARS[1]!, quote: { fr: "10 minutes le matin dans le métro et le soir j'ai un truc à raconter. Franchement je suis accro.", en: "10 minutes on the subway in the morning and I've got something to talk about at night. Honestly, I'm hooked." } },
  { name: "Inès", age: 19, avatar: REVIEW_AVATARS[2]!, quote: { fr: "J'ai toujours détesté « réviser », mais là ça rentre tout seul. Ma mémoire me surprend.", en: "I've always hated “studying,” but this just sticks. My memory keeps surprising me." } },
  { name: "Thomas", age: 31, avatar: REVIEW_AVATARS[3]!, quote: { fr: "Je remplace mes scrolls sans fin par un cours. En un mois, mes proches ont remarqué la différence.", en: "I swap my endless scrolling for a course. Within a month, the people around me noticed the difference." } },
  { name: "Sarah", age: 26, avatar: REVIEW_AVATARS[4]!, quote: { fr: "Enfin une app qui me donne l'impression d'avancer, pas de perdre mon temps. Je la lance tous les jours.", en: "Finally an app that makes me feel like I'm moving forward, not wasting time. I open it every day." } },
  { name: "Malik", age: 23, avatar: null, quote: { fr: "Les quiz espacés, c'est magique : je me souviens de trucs appris il y a des semaines sans forcer.", en: "Spaced quizzes are magic: I remember things I learned weeks ago without even trying." } },
];

export const ARCHETYPES: Record<string, { emoji: string; name: L; tagline: L }> = {
  cultivate: { emoji: "🧠", name: { fr: "L'Esprit Curieux", en: "The Curious Mind" }, tagline: { fr: "Tu veux comprendre le monde, un peu plus chaque jour.", en: "You want to understand the world, a little more every day." } },
  reduceScreen: { emoji: "📵", name: { fr: "Le Reconquérant", en: "The Timekeeper" }, tagline: { fr: "Tu reprends le contrôle de ton temps et de ton attention.", en: "You're taking back control of your time and attention." } },
  exams: { emoji: "🎓", name: { fr: "Le Stratège", en: "The Strategist" }, tagline: { fr: "Tu apprends avec méthode pour être prêt le jour J.", en: "You study methodically to be ready for the big day." } },
  impress: { emoji: "✨", name: { fr: "L'Éclatant", en: "The Standout" }, tagline: { fr: "Bientôt, c'est toi qui auras les meilleures anecdotes.", en: "Soon, you'll be the one with the best fun facts." } },
  curiosity: { emoji: "🔭", name: { fr: "L'Explorateur", en: "The Explorer" }, tagline: { fr: "Ta curiosité n'a pas de limite — nourrissons-la.", en: "Your curiosity has no limits. Let's feed it." } },
};

export const FEATURES: { icon: string; color: string; text: L }[] = [
  { icon: "puzzle", color: "#F0783D", text: { fr: "Un apprentissage ludique, étape par étape", en: "Step-by-step gamified learning" } },
  { icon: "book", color: "#7A5CD6", text: { fr: "300+ cours écrits par de vrais chercheurs", en: "300+ courses written by real researchers" } },
  { icon: "trophy", color: "#3DBAA8", text: { fr: "2 600+ questions de quiz", en: "2,600+ quiz questions" } },
  { icon: "headphones", color: "#4A7AF7", text: { fr: "Chaque cours s'écoute aussi en audio", en: "Every course is also available as audio" } },
  { icon: "hand", color: "#F2A33B", text: { fr: "Un bloqueur pour les apps qui te distraient", en: "A blocker for the apps that distract you" } },
  { icon: "atom", color: "#4CB07A", text: { fr: "Des méthodes d'apprentissage prouvées scientifiquement", en: "Scientifically proven learning methods" } },
];

export const ABOARD_FLOATERS = [
  { img: IMG("pourquoi_reve_t_on.jpg"), x: -148, y: -60, size: 44, rot: -8 },
  { img: IMG("la_joconde.jpg"), x: 150, y: -50, size: 40, rot: 7 },
  { img: IMG("apollo_11_aldrin_us_flag_lunar_module_1969.jpg"), x: -128, y: 46, size: 38, rot: 5 },
  { img: IMG("qu_est_ce_qu_un_trou_noir.jpg"), x: 134, y: 56, size: 44, rot: -6 },
  { img: IMG("giza_pyramids_khufu_khafre_menkaure_wide_view.jpg"), x: -62, y: -126, size: 42, rot: 6 },
  { img: IMG("la_nuit_etoilee_van_gogh.jpg"), x: 76, y: -130, size: 46, rot: -5 },
];

/* ------------------------------ pricing ------------------------------ */

/** Placeholder prices — edit here. No checkout is wired. */
export const PRICING = {
  yearly: { total: { fr: "39,99 €", en: "€39.99" }, perMonth: { fr: "3,33 €", en: "€3.33" }, trialDays: 3, save: "66%" },
  monthly: { price: { fr: "9,99 €", en: "€9.99" } },
} as const;

/* ------------------------------ copy ------------------------------ */

export const COPY = {
  fr: {
    continue: "Continuer", skip: "Passer", maybeLater: "Plus tard",
    tapContinue: "Appuie pour continuer", tapAnywhere: "Appuie n'importe où pour continuer",
    // 1 welcome
    welcomeTitle: "Bienvenue sur Sophia", welcomeSub: "Deviens plus cultivé, un peu chaque jour.",
    welcomeCta: "Commencer", alreadyAccount: "J'ai déjà un compte",
    // 2 language
    langTitle: "Choisis ta langue", langSub: "Glisse pour découvrir toutes les langues. Tu pourras la changer plus tard.",
    // 3 intro
    intro1: "Deviens **plus cultivé** grâce à des **leçons** de 10 minutes **passionnantes**, faites pour toi.",
    intro2: "Écrites par de **vrais chercheurs** et docteurs. Pas par une IA.",
    intro2Sub: "Nos leçons sont écrites par des experts.",
    intro3: "Sophia te teste avec des **quiz ludiques**, pour que tu retiennes vraiment.",
    intro3Sub: "Scientifiquement prouvé : des connaissances solides qui restent.",
    intro4: "Tu ne sais pas quoi apprendre ? Sophia te construit un **parcours personnalisé**, à suivre chaque jour.",
    intro4Sub: "Suis-le chaque jour, et tu te sentiras plus cultivé en quelques semaines.",
    tenMin: "10 min",
    pathCaptions: ["La découverte de la pénicilline (Fleming, 1928)", "La structure de l'ADN (Watson & Crick, 1953)", "L'IA va-t-elle remplacer les métiers du savoir ?"],
    // 4 social proof
    socialTitle: "Rejoins les **500 000** utilisateurs heureux qui **apprennent** avec Sophia",
    onAppStore: "sur l'App Store", countries: "Disponible dans plus de 140 pays dans le monde",
    socialCta: "C'est parti",
    // 5 name
    nameTitle: "Comment tu t'appelles ?", nameSub: "Pour que Sophia s'adresse à toi par ton prénom.",
    namePlaceholder: "Ton prénom",
    // 6 age
    ageTitle: "Quel âge as-tu ?", ageSub: "Pour te proposer des cours adaptés.",
    // 7 knowledge
    knowledgeTitle: "Comment évalues-tu ta culture générale ?",
    knowledgeSub: "Sois honnête : ça sert juste à adapter le niveau.",
    // 8 motivation
    motivationTitle: "Pourquoi veux-tu améliorer ta culture générale ?",
    motivationSub: "Choisis la raison qui te ressemble le plus.",
    // 9 goals
    goalsTitle: "Quels sont tes objectifs ?", goalsSub: "Tu peux en choisir plusieurs.",
    // 10 topics
    topicsTitle: "Quels sujets t'intéressent le plus ?", topicsSub: "Choisis-en autant que tu veux.",
    // 11 help
    helpWords: (n: string) => (n ? `${n}, Sophia va t'aider à atteindre tous tes objectifs` : "Sophia va t'aider à atteindre tous tes objectifs"),
    // 12 mission
    missionTitle: "Sophia est gratuite à l'essai.",
    missionBody1: "Notre mission : rendre l'apprentissage facile, et accessible à tous.",
    missionBody2: "Notre équipe de profs et de designers compte sur toi pour continuer à créer de bons contenus, au service d'une seule mission : rendre l'apprentissage facile.",
    missionTeam: "L'équipe Sophia",
    // 13 questions
    questionsTitle: "Avec Sophia, tu sauras répondre à ces questions :",
    // 14 phone time
    phoneTitle: "Combien de temps passes-tu par jour sur ton téléphone ?",
    // 15 years
    yearsTitle: "Voici ta vie en années",
    legendSleep: "Sommeil", legendWork: "Travail", legendFree: "Temps libre", legendPhone: "Sur ton téléphone",
    yearsUnit: (n: number) => (n <= 1 ? "an" : "ans"), yearsWord: "années",
    yearsCaption: (n: number) => `Sur tes 26 années de temps libre, tu en passes ${n} sur ton téléphone.`,
    // 16 transform
    transformWords: "Avec Sophia, transforme ce temps en culture",
    transformCycle: ["culture", "art", "philosophie", "sciences", "histoire", "littérature"],
    // 17 reviews
    reviewsTitle: "Voici ce que nos utilisateurs en pensent", reviewsBadge: "500 000 utilisateurs",
    // 18 personalize
    personalizeWords: "Personnalisons ton contenu",
    // 19 swipe
    swipeTitle: "Choisis les premiers cours que tu vas lire",
    swipeSub: "Glisse à droite ce qui t'intéresse.",
    swipeLike: "J'aime", swipeNope: "Non", swipeDone: "C'est noté !",
    // 20 loading
    loadingTitle: (n: string) => (n ? `On prépare ton parcours de connaissances, ${n}` : "On prépare ton parcours de connaissances"),
    loadingRows: ["Analyse de ton objectif", "Sélection de tes cours", "Création de ton programme"],
    loadingProof: "lisent des cours sur Sophia tous les mois.", loadingJoin: "Viens te joindre à l'équipe !",
    loadingCta: "Voir mon profil",
    // 21 profile
    profileEyebrow: (n: string) => (n ? `${n}, voici ton profil` : "Voici ton profil"),
    yourGoal: "TON OBJECTIF", coursesWaiting: "Les cours qui t'attendent", profileCta: "C'est parti",
    // 22 reading time
    readingTitle: "À quelle heure veux-tu lire ton cours du jour ?",
    readingLabels: ["Au réveil, avant tout le monde", "Dans la matinée", "L'après-midi", "En soirée", "Avant de dormir"],
    // 23 email reminders
    emailTitle: "Reste informé",
    emailSub: "Un rappel discret quand un cours peut vraiment t'intéresser. Rien d'autre, jamais.",
    emailStat: "Activer les rappels augmente de **89 %** tes chances d'atteindre tes objectifs.",
    notifTitle: "À découvrir aujourd'hui", notifBody: "Un nouveau cours t'attend — 5 minutes suffisent.",
    emailBullets: ["📚 Un cours choisi selon ton profil", "⏰ Au bon moment, jamais en rafale", "🔕 Désactivable en un geste"],
    emailPlaceholder: "ton@email.com", emailCta: "Me rappeler par email", emailInvalid: "Entre une adresse email valide",
    // 24 account
    accountTitle: "Crée ton compte",
    accountSub: "Pour sauvegarder ta progression et la retrouver sur tous tes appareils.",
    accountLegal: "En continuant, tu acceptes nos", accountLegalLinks: "Conditions générales · Politique de confidentialité",
    // 25 aboard
    aboardTitle: (n: string) => (n ? `Bienvenue à bord, ${n} !` : "Bienvenue à bord !"),
    aboardSub: "Bienvenue dans le club Sophia ! La vie est plus fun quand on apprend quelque chose chaque jour !",
    // 26 features
    featuresTitle: (n: string) => (n ? `${n}, apprendre n'a pas à être compliqué` : "Apprendre n'a pas à être compliqué"),
    onTheAppStore: "SUR L'APP STORE", reviewsCount: "PLUS DE 1 000 AVIS",
    noCommitment: "Sans engagement, annulable à tout moment.",
    // 27 trial
    trialTitle: "Comment marche ton essai gratuit",
    trialSteps: [
      { title: "Compte créé", body: "Ton profil a bien été créé." },
      { title: "Aujourd'hui : essaie Sophia Pro", body: "Apprends quelque chose de nouveau en 5 minutes par jour." },
      { title: "Jour 2 : rappel", body: "On te préviendra. Annulable en 15 secondes." },
      { title: "Jour 3 : fin de l'essai", body: "" }, // body filled with date
    ],
    trialEndsBody: (d: string) => `Ton abonnement démarrera le ${d}.`,
    trialCta: "C'est parti",
    // 28 reminder
    reminderWords: "Tu recevras un rappel 1 jour avant la fin de ton essai.",
    reminderCta: "Essayer gratuitement",
    // 29 paywall A
    paywallAGreen: "Essaie 3 jours gratuitement,",
    paywallAInk: "puis 3,33 € / mois (facturé annuellement).",
    paywallAProof: "· 500 000 utilisateurs", viewAllPlans: "Voir tous les plans",
    paywallReassurance: "Deux clics pour démarrer, résiliable facilement.",
    trialCtaLong: "Démarrer mon essai de 3 jours",
    billedYearly: "(facturé 39,99 € par an)",
    legalLogin: "Déjà abonné ? Connecte-toi", legalTerms: "Conditions générales", legalPrivacy: "Politique de confidentialité",
    // 30 paywall B
    paywallBTitle: "Les abonnés Pro apprennent plus, plus vite",
    freeCol: "Gratuit",
    cmpRows: ["Tous les sujets", "Favoris illimités", "Cours illimités", "Quiz & entraînement", "Mode audio", "TikTok blocker"],
    planYearly: "Annuel", planYearlyBilled: "facturé 39,99 € par an", planYearlyPer: "3,33 € / mois",
    planTrialBadge: "3 jours offerts", planSave: "Économise 66 %",
    planMonthly: "Mensuel", planMonthlyBilled: "facturé chaque mois", planMonthlyPer: "9,99 € / mois",
    subscribeNow: "S'abonner maintenant",
    // success
    successTitle: "C'est parti !",
    successSub: "Télécharge Sophia pour retrouver ton parcours et commencer ton premier cours.",
    download: "Télécharger Sophia",
    openBrowser: "Le bouton ne marche pas ? Ouvre cette page dans ton navigateur (menu ⋯).",
  },
  en: {
    continue: "Continue", skip: "Skip", maybeLater: "Maybe later",
    tapContinue: "Tap to continue", tapAnywhere: "Tap anywhere to continue",
    welcomeTitle: "Welcome to Sophia", welcomeSub: "Get a little smarter every day.",
    welcomeCta: "Get started", alreadyAccount: "I already have an account",
    langTitle: "Choose your language", langSub: "Swipe to explore every language. You can change it later.",
    intro1: "Get **smarter** with **exciting** 10-minute **courses**, made for you.",
    intro2: "Written by **real researchers** and PhDs. Not by AI.",
    intro2Sub: "Our courses are written by experts.",
    intro3: "Sophia tests you with **fun quizzes**, so you really remember what you learn.",
    intro3Sub: "Scientifically proven to build real knowledge that stays with you.",
    intro4: "Not sure what to learn? Sophia builds you a **personalized path** to follow every day.",
    intro4Sub: "Follow it every day, and you'll feel smarter in a few weeks.",
    tenMin: "10 min",
    pathCaptions: ["The discovery of penicillin", "The structure of DNA", "Will AI replace knowledge work?"],
    socialTitle: "Join the **500,000** happy users who **learn** with Sophia",
    onAppStore: "on the App Store", countries: "Available in more than 140 countries around the world",
    socialCta: "Let's get started",
    nameTitle: "What's your name?", nameSub: "So Sophia can call you by your name.",
    namePlaceholder: "Your first name",
    ageTitle: "How old are you?", ageSub: "So your courses fit you.",
    knowledgeTitle: "How would you rate your general knowledge?",
    knowledgeSub: "Be honest: it just helps Sophia adjust the difficulty.",
    motivationTitle: "Why do you want to improve your general knowledge?",
    motivationSub: "Pick the reason that fits you best.",
    goalsTitle: "What are your goals?", goalsSub: "You can pick several.",
    topicsTitle: "What topics interest you most?", topicsSub: "Pick as many as you like.",
    helpWords: (n: string) => (n ? `${n}, Sophia will help you reach all your goals` : "Sophia will help you reach all your goals"),
    missionTitle: "Sophia is free to try.",
    missionBody1: "Our mission: to make learning easy and accessible to everyone.",
    missionBody2: "Our team of teachers and designers is counting on you so we can keep creating great content, all for one mission: making learning easy.",
    missionTeam: "The Sophia team",
    questionsTitle: "With Sophia, you'll be able to answer these questions:",
    phoneTitle: "How long do you spend on your phone each day?",
    yearsTitle: "Here's your life in years",
    legendSleep: "Sleep", legendWork: "Work", legendFree: "Free time", legendPhone: "On your phone",
    yearsUnit: (n: number) => (n <= 1 ? "year" : "years"), yearsWord: "years",
    yearsCaption: (n: number) => `Of your 26 years of free time, you spend ${n} on your phone.`,
    transformWords: "With Sophia, turn that time into knowledge",
    transformCycle: ["knowledge", "art", "philosophy", "science", "history", "literature"],
    reviewsTitle: "Here's what our users think", reviewsBadge: "500,000 people",
    personalizeWords: "Let's personalize your content",
    swipeTitle: "Pick the first courses you'll read",
    swipeSub: "Swipe right on what interests you.",
    swipeLike: "Like", swipeNope: "Nope", swipeDone: "Got it!",
    loadingTitle: (n: string) => (n ? `We're building your learning path, ${n}` : "We're building your learning path"),
    loadingRows: ["Analyzing your goal", "Selecting your courses", "Building your program"],
    loadingProof: "read courses on Sophia every month.", loadingJoin: "Come join the team!",
    loadingCta: "See my profile",
    profileEyebrow: (n: string) => (n ? `${n}, here's your profile` : "Here's your profile"),
    yourGoal: "YOUR GOAL", coursesWaiting: "Courses waiting for you", profileCta: "Let's go",
    readingTitle: "When do you want to read your daily course?",
    readingLabels: ["First thing, before everyone else", "Mid-morning", "In the afternoon", "In the evening", "Before bed"],
    emailTitle: "Stay in the loop",
    emailSub: "One quiet nudge when a course is genuinely worth your time. Nothing else, ever.",
    emailStat: "Turning on reminders boosts your chances of reaching your goals by **89%**.",
    notifTitle: "Worth a look today", notifBody: "A new course is waiting for you. It only takes five minutes.",
    emailBullets: ["📚 A course picked for your profile", "⏰ At the right moment, never spammy", "🔕 Switch it off in one tap"],
    emailPlaceholder: "you@email.com", emailCta: "Remind me by email", emailInvalid: "Enter a valid email address",
    accountTitle: "Create your account",
    accountSub: "To save your progress and access it on all your devices.",
    accountLegal: "By continuing, you agree to our", accountLegalLinks: "Terms of Service · Privacy Policy",
    aboardTitle: (n: string) => (n ? `Welcome aboard, ${n}!` : "Welcome aboard!"),
    aboardSub: "Welcome to the Sophia club! Life is more fun when you learn something every day!",
    featuresTitle: (n: string) => (n ? `${n}, learning doesn't have to be complicated` : "Learning doesn't have to be complicated"),
    onTheAppStore: "ON THE APP STORE", reviewsCount: "1,000+ REVIEWS",
    noCommitment: "No commitment, cancel anytime.",
    trialTitle: "How your free trial works",
    trialSteps: [
      { title: "Account created", body: "Your profile is all set." },
      { title: "Today: try Sophia Premium", body: "Learn something new in 5 minutes a day." },
      { title: "Day 2: trial reminder", body: "We'll send you a reminder. Canceling takes 15 seconds." },
      { title: "Day 3: trial ends", body: "" },
    ],
    trialEndsBody: (d: string) => `Your subscription will start on ${d}.`,
    trialCta: "I'm ready",
    reminderWords: "You'll get a reminder 1 day before your trial ends.",
    reminderCta: "Try for free",
    paywallAGreen: "Try it free for 3 days,",
    paywallAInk: "then €3.33 / month (billed yearly).",
    paywallAProof: "· 500,000 people", viewAllPlans: "View all plans",
    paywallReassurance: "Two taps to start, super easy to cancel.",
    trialCtaLong: "Start my 3-day free trial",
    billedYearly: "(billed €39.99 per year)",
    legalLogin: "Already subscribed? Log in", legalTerms: "Terms of Service", legalPrivacy: "Privacy Policy",
    paywallBTitle: "Premium subscribers learn more, faster",
    freeCol: "Free",
    cmpRows: ["All subjects", "Unlimited favorites", "Unlimited courses", "Quizzes & Practice", "Audio mode", "TikTok blocker"],
    planYearly: "Yearly", planYearlyBilled: "billed €39.99 per year", planYearlyPer: "€3.33 / month",
    planTrialBadge: "3-day free trial", planSave: "Save 66%",
    planMonthly: "Monthly", planMonthlyBilled: "billed monthly", planMonthlyPer: "€9.99 / month",
    subscribeNow: "Subscribe now",
    successTitle: "You're all set!",
    successSub: "Download Sophia to find your path and start your first course.",
    download: "Download Sophia",
    openBrowser: "Button not working? Open this page in your browser (⋯ menu).",
  },
};
export type Copy = (typeof COPY)["fr"];

/** Renders **bold pink** segments of a copy string. */
export function parseHighlight(text: string): { text: string; hot: boolean }[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part) =>
    part.startsWith("**") ? { text: part.slice(2, -2), hot: true } : { text: part, hot: false },
  );
}

/** Screen-time years out of 80, per spec: round(80 × minutes / 1440), clamped 1…26. */
export function screenYears(minutes: number): number {
  return Math.min(26, Math.max(1, Math.round((80 * minutes) / 1440)));
}

/** Builds the 6-card swipe deck: 4 base cards + 2 from the chosen topics. */
export function buildSwipeDeck(topicIds: string[]): Course[] {
  const extra: Course[] = [];
  for (const t of topicIds) {
    for (const course of TOPIC_COURSES[t] ?? []) {
      if (extra.length < 2 && !SWIPE_BASE.some((b) => b.id === course.id)) extra.push(course);
    }
  }
  for (const list of Object.values(TOPIC_COURSES)) {
    for (const course of list) {
      if (extra.length < 2 && !extra.includes(course) && !SWIPE_BASE.some((b) => b.id === course.id)) extra.push(course);
    }
  }
  return [...SWIPE_BASE, ...extra.slice(0, 2)];
}

/** 5 course cards for the profile scroller, from selected topics, excluding swiped ones. */
export function buildProfileCourses(topicIds: string[], excludeIds: string[]): Course[] {
  const out: Course[] = [];
  for (const t of topicIds) {
    for (const course of TOPIC_COURSES[t] ?? []) {
      if (!excludeIds.includes(course.id) && !out.some((o) => o.id === course.id)) out.push(course);
    }
  }
  for (const course of [...INTRO_COURSES, ...Object.values(TOPIC_COURSES).flat()]) {
    if (out.length >= 5) break;
    if (!excludeIds.includes(course.id) && !out.some((o) => o.id === course.id)) out.push(course);
  }
  return out.slice(0, 5);
}
