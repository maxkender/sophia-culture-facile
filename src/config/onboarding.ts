/**
 * Web-to-app onboarding funnel (/start, /en/start).
 * Every text, option, quiz question and price lives here so it can be rewritten
 * without touching components. Prices are placeholders: no real payment exists.
 */
export type StartLang = "fr" | "en";

export type Option = { id: string; emoji: string; label: Record<StartLang, string> };

export const INTERESTS: Option[] = [
  { id: "history", emoji: "🏛️", label: { fr: "Histoire", en: "History" } },
  { id: "science", emoji: "🔬", label: { fr: "Sciences", en: "Science" } },
  { id: "art", emoji: "🎨", label: { fr: "Art", en: "Art" } },
  { id: "geo", emoji: "🌍", label: { fr: "Géographie", en: "Geography" } },
  { id: "philo", emoji: "🧠", label: { fr: "Philosophie", en: "Philosophy" } },
  { id: "eco", emoji: "💰", label: { fr: "Économie", en: "Economics" } },
  { id: "lit", emoji: "📚", label: { fr: "Littérature", en: "Literature" } },
  { id: "music", emoji: "🎵", label: { fr: "Musique", en: "Music" } },
];

export const LEVELS: Option[] = [
  { id: "beginner", emoji: "🌱", label: { fr: "Je débute", en: "Just starting" } },
  { id: "curious", emoji: "🌿", label: { fr: "Curieux·se, quelques bases", en: "Curious, some basics" } },
  { id: "good", emoji: "🌳", label: { fr: "Plutôt calé·e", en: "Pretty knowledgeable" } },
];

export const GOALS: Option[] = [
  { id: "conversation", emoji: "💬", label: { fr: "Briller en conversation", en: "Shine in conversations" } },
  { id: "culture", emoji: "✨", label: { fr: "Me cultiver chaque jour", en: "Learn something every day" } },
  { id: "exams", emoji: "🎓", label: { fr: "Préparer un concours", en: "Prepare for an exam" } },
  { id: "screen", emoji: "📵", label: { fr: "Remplacer le scroll", en: "Replace mindless scrolling" } },
];

export const DAILY_TIMES: Option[] = [
  { id: "5", emoji: "☕", label: { fr: "5 min / jour", en: "5 min / day" } },
  { id: "10", emoji: "📖", label: { fr: "10 min / jour", en: "10 min / day" } },
  { id: "15", emoji: "🚀", label: { fr: "15 min / jour", en: "15 min / day" } },
];

export const REMINDERS: Option[] = [
  { id: "morning", emoji: "🌅", label: { fr: "Le matin (8h)", en: "Morning (8am)" } },
  { id: "lunch", emoji: "🥪", label: { fr: "Le midi (12h30)", en: "Lunch (12:30pm)" } },
  { id: "evening", emoji: "🌙", label: { fr: "Le soir (21h)", en: "Evening (9pm)" } },
  { id: "none", emoji: "🔕", label: { fr: "Pas de rappel", en: "No reminder" } },
];

export type QuizQuestion = {
  id: string;
  q: Record<StartLang, string>;
  answers: Record<StartLang, string[]>;
  correct: number;
  fact: Record<StartLang, string>;
};

export const QUIZ: QuizQuestion[] = [
  {
    id: "q1",
    q: { fr: "Quelle est la plus longue guerre de l'histoire de France ?", en: "Which was the longest war in French history?" },
    answers: { fr: ["Guerre de Cent Ans", "Guerre de Trente Ans", "Guerres de Religion"], en: ["Hundred Years' War", "Thirty Years' War", "Wars of Religion"] },
    correct: 0,
    fact: { fr: "Elle a en réalité duré 116 ans, de 1337 à 1453.", en: "It actually lasted 116 years, from 1337 to 1453." },
  },
  {
    id: "q2",
    q: { fr: "Quel animal a trois cœurs ?", en: "Which animal has three hearts?" },
    answers: { fr: ["Le dauphin", "La pieuvre", "Le crocodile"], en: ["Dolphin", "Octopus", "Crocodile"] },
    correct: 1,
    fact: { fr: "Et son sang est bleu, grâce au cuivre qu'il contient.", en: "And its blood is blue, thanks to the copper it contains." },
  },
  {
    id: "q3",
    q: { fr: "Qui a peint « La Nuit étoilée » ?", en: "Who painted “The Starry Night”?" },
    answers: { fr: ["Claude Monet", "Vincent van Gogh", "Paul Cézanne"], en: ["Claude Monet", "Vincent van Gogh", "Paul Cézanne"] },
    correct: 1,
    fact: { fr: "Il l'a peinte de mémoire, depuis sa chambre à Saint-Rémy-de-Provence.", en: "He painted it from memory, from his room in Saint-Rémy-de-Provence." },
  },
];

/** Placeholder plans — edit amounts here. No checkout is wired yet. */
export const PLANS = [
  { id: "yearly", price: { fr: "39,99 €", en: "€39.99" }, per: { fr: "/ an", en: "/ year" }, note: { fr: "soit 3,33 € / mois", en: "only €3.33 / month" }, badge: { fr: "Le plus choisi", en: "Most popular" }, trialDays: 7 },
  { id: "monthly", price: { fr: "7,99 €", en: "€7.99" }, per: { fr: "/ mois", en: "/ month" }, note: { fr: "sans engagement", en: "cancel anytime" }, badge: null, trialDays: 0 },
] as const;

export const COPY = {
  fr: {
    back: "Retour", next: "Continuer", start: "Commencer", skip: "Passer",
    welcomeTitle: "Deviens incollable en 5 minutes par jour",
    welcomeText: "Réponds à quelques questions et on te prépare un programme sur mesure.",
    interestsTitle: "Qu'est-ce qui te passionne ?", interestsHint: "Choisis-en au moins un",
    levelTitle: "Ton niveau de culture générale ?",
    goalTitle: "Quel est ton objectif ?",
    timeTitle: "Combien de temps par jour ?",
    quizIntro: "Petit quiz : 3 questions", correct: "Bonne réponse ! 🎉", wrong: "Presque !", funFact: "Le savais-tu ?",
    reminderTitle: "Quand veux-tu ton rappel ?",
    buildingTitle: "On prépare ton programme…",
    buildingSteps: ["Analyse de tes centres d'intérêt", "Ajustement à ton niveau", "Création de ton plan sur 30 jours"],
    resultTitle: "Ton programme est prêt",
    resultScore: (n: number) => `${n}/3 au quiz`,
    resultMinutes: (m: string) => `${m} min par jour`,
    planWeek: (w: number) => `Semaine ${w}`,
    planWeeks: ["Les bases", "Les grandes idées", "Les liens entre les sujets", "Devenir incollable"],
    resultCta: "Débloquer mon programme",
    paywallTitle: "Accède à tout Sophia",
    paywallPerks: ["Toutes les leçons et tous les quiz", "Ton programme personnalisé sur 30 jours", "Rappels et suivi de ta série"],
    trial: (d: number) => `${d} jours gratuits`,
    paywallCta: "Continuer",
    paywallNote: "Démonstration : aucun paiement n'est effectué sur cette page.",
    successTitle: "C'est parti !",
    successText: "Télécharge Sophia pour retrouver ton programme et commencer ta première leçon.",
    appStore: "Télécharger sur l'App Store", play: "Disponible sur Google Play",
    openBrowser: "Le bouton ne marche pas ? Ouvre cette page dans ton navigateur (menu ⋯).",
    progress: "Progression",
  },
  en: {
    back: "Back", next: "Continue", start: "Get started", skip: "Skip",
    welcomeTitle: "Get smarter in 5 minutes a day",
    welcomeText: "Answer a few questions and we'll build a plan made for you.",
    interestsTitle: "What are you curious about?", interestsHint: "Pick at least one",
    levelTitle: "How's your general knowledge?",
    goalTitle: "What's your goal?",
    timeTitle: "How much time per day?",
    quizIntro: "Quick quiz: 3 questions", correct: "Correct! 🎉", wrong: "So close!", funFact: "Did you know?",
    reminderTitle: "When should we remind you?",
    buildingTitle: "Building your plan…",
    buildingSteps: ["Analysing your interests", "Matching your level", "Creating your 30-day plan"],
    resultTitle: "Your plan is ready",
    resultScore: (n: number) => `${n}/3 on the quiz`,
    resultMinutes: (m: string) => `${m} min a day`,
    planWeek: (w: number) => `Week ${w}`,
    planWeeks: ["The basics", "The big ideas", "Connecting the dots", "Becoming unbeatable"],
    resultCta: "Unlock my plan",
    paywallTitle: "Get all of Sophia",
    paywallPerks: ["Every lesson and quiz", "Your personalised 30-day plan", "Reminders and streak tracking"],
    trial: (d: number) => `${d}-day free trial`,
    paywallCta: "Continue",
    paywallNote: "Demo: no payment is taken on this page.",
    successTitle: "You're all set!",
    successText: "Download Sophia to find your plan and start your first lesson.",
    appStore: "Download on the App Store", play: "Get it on Google Play",
    openBrowser: "Button not working? Open this page in your browser (⋯ menu).",
    progress: "Progress",
  },
} as const;

export const STEPS = [
  "welcome", "interests", "level", "goal", "time", "quiz0", "quiz1", "quiz2",
  "reminder", "building", "result", "paywall", "success",
] as const;
export type StepId = (typeof STEPS)[number];

/** Builds the 4-week plan: one focus subject per week, cycling through interests. */
export function buildPlan(interests: string[]): string[] {
  const picks = interests.length ? interests : ["history", "science"];
  return [0, 1, 2, 3].map((w) => picks[w % picks.length]!);
}
