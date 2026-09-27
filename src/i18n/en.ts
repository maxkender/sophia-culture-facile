/** English content. The app is called "Sophia: General Knowledge" on the stores. */

import type { Dict } from "./fr";

export const en: Dict = {
  langLabel: "FR",
  langSwitchAria: "Passer en français",
  brand: "Sophia: General Knowledge",
  nav: {
    becomeCreator: "Become a creator",
    careers: "Careers",
    download: "Download",
    teacherLogin: "Sign in",
    becomeTeacher: "Become a certified teacher",
    home: "Sophia: General Knowledge, home",
    main: "Main navigation",
  },
  hero: {
    titleA: "Sophia, the ",
    titleHighlight: "general knowledge",
    titleB: " that fits in your pocket",
    subtitle:
      "Short lessons, written to be understood, on the subjects you would actually like to know about.",
    cta: "Download free",
    note: "Free, iOS and Android.",
    shotHome: "Lesson",
    shotHomeAlt: "A lesson screen in the Sophia: General Knowledge app",
    shotQuiz: "Quiz",
    shotQuizAlt: "A quiz question in the Sophia: General Knowledge app",
  },
  stats: {
    aria: "Key figures",
    downloadsLabel: "downloads",
    ratingSuffix: "★",
    ratingLabel: "on the App Store",
    rankValue: "#3",
    rankLabel: "in Education on the App Store",
    qualifier: "{country} · {year}",
  },
  stores: {
    appStore: "Download on the App Store",
    play: "Get it on Google Play",
    badgeAppStoreTop: "Download on the",
    badgePlayTop: "GET IT ON",
    badgeAppStoreAria: "Download Sophia: General Knowledge on the App Store",
    badgePlayAria: "Get Sophia: General Knowledge on Google Play",
  },
  categories: {
    title: "What you learn",
    subtitle: "Six subjects, over 240 lessons, and one topic at a time so you are never lost.",
    items: [
      "History",
      "Mythology",
      "Art",
      "Literature",
      "Science",
      "Understanding today's world",
    ],
  },
  features: {
    aria: "How it works",
    items: [
      {
        label: "Lessons",
        title: "Short lessons",
        text: "Five screens, a few minutes, one topic at a time. Short enough to read on the bus, dense enough to leave you with something.",
        bullets: ["Five screens per lesson", "Sources cited", "No jargon"],
        shot: "Lesson",
        alt: "A lesson screen in the Sophia: General Knowledge app",
      },
      {
        label: "Quizzes",
        title: "Quizzes",
        text: "After each lesson, a few questions to check what stayed with you. Not to catch you out, but to make it stick.",
        bullets: ["Instant questions", "Explained answers", "Score per lesson"],
        shot: "Quiz",
        alt: "A quiz question in the Sophia: General Knowledge app",
      },
      {
        label: "Review",
        title: "A daily review",
        text: "Ideas you have already seen come back at spaced intervals, right when you were about to forget them. That is the difference between reading and remembering.",
        bullets: ["Daily practice", "Spaced repetition", "A few minutes a day"],
        shot: "Progress",
        alt: "Streak and progress tracking in the Sophia: General Knowledge app",
      },
    ],
  },
  progress: {
    title: "Progress you can see",
    text: "Day streaks, levels, and a general knowledge score per subject. You can see what you know and what you do not know yet.",
    streakTitle: "Streak running",
    streakText: "Come back every day to keep it alive.",
    rankTitle: "New level: Scholar",
    rankText: "Unlocked by reviewing every day.",
    shot: "Collection progress",
    shotAlt: "Sophia app screen showing progress inside a course collection",
  },
  testimonials: {
    title: "They learn with Sophia",
    subtitle: "What people say on the App Store.",
    source: "App Store",
    note: "Reviews translated from French. Original wording on the App Store.",
    items: [
      { text: "A simple, incredibly handy app for learning something every day.", name: "gab24738" },
      { text: "One of the rare apps I actually use daily. […] A few minutes are enough to make progress.", name: "Pauline2105" },
      { text: "Hard to get tired of it, with so many courses and new things to learn and enjoy.", name: "Simon Bafa" },
    ],
  },
  faqTitle: "Frequently asked questions",
  about: {
    title: "What is Sophia?",
    paragraphs: [
      "Sophia is a French mobile app about general knowledge. It offers short lessons you can read in a few minutes, followed by quizzes that check what you kept.",
      "The app is published by Vik Studios SAS, a French company. It is available free of charge on iOS and on Android.",
      "The catalogue holds over 240 lessons across six subjects: history, mythology, art, literature, science, and understanding today's world.",
      "Each lesson is read in five screens. A quiz follows, and daily practice brings back what you have already seen so that it does not fade.",
      "Sophia is for everyone, with no required level and no jargon. It is built to be opened for a few minutes a day, on the way to work or between two things.",
      "Sophia: General Knowledge is a mobile learning app. It has no connection with the Sophia humanoid robot, with Sophia University in Tokyo, or with the sophia health programme run by France's Assurance Maladie.",
    ],
  },
  finalCta: {
    title: "Start today",
    text: "One lesson a day, five minutes, and general knowledge that settles in for good.",
    cta: "Download free",
  },
  teacherAccess: {
    title: "Teachers and creators",
    text: "Sign in to your Sophia workspace: courses for teachers, video content for creators.",
    login: "Sign in",
  },
  careers: {
    metaTitle: "Careers — Sophia: General Knowledge",
    metaDescription:
      "Work with Sophia: become a certified teacher and write short courses, or a creator producing videos and slideshows. Two paths, pick the one that fits you.",
    title: "Careers",
    lead: "Two ways to work with Sophia. Pick the one that fits you.",
    profs: {
      title: "Professors",
      lines: [
        "Write short, five-screen courses on general knowledge topics.",
        "Every course is checked by our editorial team before publication.",
        "You reach readers worldwide, in French and in English.",
      ],
      cta: "Become a certified teacher",
    },
    creators: {
      title: "Creators",
      lines: [
        "Produce short videos and slideshows for Sophia's channels.",
        "Two tracks: UGC creator (on camera) and slideshow creator.",
        "Paid monthly, topics provided, fully remote work.",
      ],
      cta: "Become a creator",
    },
  },
  apply: {
    metaTitle: "Become a certified teacher on Sophia",
    metaDescription:
      "Apply to write general knowledge lessons for Sophia. Education, CV, motivation: our editorial team reviews every application.",
    title: "Become a certified teacher",
    lead: "Write short, fact-checked lessons for hundreds of thousands of readers. Fill in this form: our editorial team answers every application.",
    name: "Full name",
    email: "Email address",
    dob: "Date of birth",
    education: "Education and degrees",
    educationHint: "Degrees, institutions, years.",
    cv: "CV (PDF or Word)",
    cvHint: "10 MB maximum.",
    certified: "Are you a certified teacher?",
    yes: "Yes",
    no: "No",
    school: "At which school?",
    motivation: "Your motivation in a few sentences",
    tried: "Have you tried Sophia?",
    work: "Examples of previous work",
    workHint: "Links to articles, lessons, publications, or a short description.",
    country: "Country",
    platform: "Phone",
    ios: "iPhone (iOS)",
    android: "Android",
    submit: "Send my application",
    sending: "Sending…",
    successTitle: "Application sent",
    successText:
      "Thank you. Our editorial team reviews your file and writes back to the address you gave. If you are accepted, you receive a link to the author portal.",
    error: "Sending failed. Check the required fields and try again.",
    required: "Required fields",
  },
  footer: {
    tagline:
      "Sophia: General Knowledge is a mobile learning app published by {company}, a French company.",
    legal: "Legal notice",
    privacy: "Privacy",
    rights: "All rights reserved.",
  },
  landing: {
    benefitsTitle: "How it works",
    benefits: [
      {
        title: "Short lessons",
        text: "Five screens, a few minutes, one topic at a time. Short enough to read on the bus, dense enough to leave you with something.",
      },
      {
        title: "Quizzes",
        text: "After each lesson, a few questions to check what stayed with you. Not to catch you out, but to make it stick.",
      },
      {
        title: "A daily review",
        text: "Ideas you have already seen come back at spaced intervals, right when you were about to forget them. That is the difference between reading and remembering.",
      },
      {
        title: "Progress you can see",
        text: "Day streaks, levels, and a general knowledge score per subject. You can see what you know and what you do not know yet.",
      },
    ],
    ctaTitle: "Start today",
    cta: "Download free",
    publisher: "Sophia: General Knowledge, published by {company}, France.",
  },
  download: {
    redirectAndroid: "Taking you to Google Play…",
    redirectIos: "Taking you to the App Store…",
    redirectText:
      "Opening the Sophia: General Knowledge listing. If nothing happens, use the buttons below.",
    title: "Download Sophia: General Knowledge",
    text: "The app is free on iOS and Android. Scan the QR code with your phone or pick your store.",
    qrAlt: "QR code to the Sophia: General Knowledge download page",
  },
  legal: {
    title: "Legal notice",
    editorTitle: "Site publisher",
    editorText:
      "{company}, a simplified joint-stock company under French law, publisher of the mobile app Sophia: General Knowledge.",
    editorDetails:
      "Registered office: TO BE COMPLETED. SIREN / SIRET number: TO BE COMPLETED. EU VAT number: TO BE COMPLETED. Share capital: TO BE COMPLETED.",
    director: "Publication director: TO BE COMPLETED. Contact:",
    hostTitle: "Hosting",
    hostText: "Site host: TO BE COMPLETED (company name, address and phone number).",
    ipTitle: "Intellectual property",
    ipText:
      "All content on this site and in the Sophia: General Knowledge app (text, quizzes, trademarks, logo, interfaces) is protected and remains the property of {company}, unless stated otherwise. Section to be completed.",
  },
  privacy: {
    title: "Privacy policy",
    intro:
      "This page explains how {company} handles the personal data of people using the Sophia: General Knowledge app and this site. Document to be completed before publishing.",
    dataTitle: "Data we collect",
    dataText:
      "TO BE COMPLETED: what data is collected (account, progress, technical data), why, and on which legal basis.",
    retentionTitle: "How long we keep it",
    retentionText: "TO BE COMPLETED: retention period for each category of data.",
    processorsTitle: "Processors and analytics",
    processorsText:
      "TO BE COMPLETED: host, analytics tools, any transfers outside the European Union.",
    rightsTitle: "Your rights",
    rightsText:
      "Under the GDPR you can access, correct, delete, object to and port your data. To exercise those rights, write to",
  },
  courses: {
    hubTitle: "Sophia lessons",
    hubSubtitle:
      "The lessons from the app, free to read on the web. Each one is read in five screens, and the quiz that follows lives in the app.",
    hubLink: "Lessons",
    all: "All",
    filterAria: "Filter by category",
    listAria: "Lesson list",
    readingTime: "{minutes} min read",
    updated: "Updated {date}",
    read: "Read the lesson",
    chaptersTitle: "In this lesson",
    sourcesTitle: "Sources",
    relatedTitle: "Read next",
    progressAria: "Reading progress",
    breadcrumbHome: "Home",
    breadcrumbAria: "Breadcrumb",
    inlineCtaTitle: "Finish this lesson in the app, with the quiz",
    inlineCtaText:
      "The quiz after this screen, the daily review and your streak all live in the app.",
    inlineCtaButton: "Open in the app",
    finalCtaTitle: "Learn a little more every day.",
    finalCtaText: "Over 240 lessons, a quiz after each one, free on iOS and Android.",
    finalCtaButton: "Download free",
    notFound: "This lesson does not exist or has moved.",
    backToHub: "Browse all lessons",
  },
  faq: [
    {
      question: "What is Sophia?",
      answer:
        "Sophia is a mobile app about general knowledge, published in France. It offers short lessons of five screens, followed by quizzes, on over 240 topics. It is free and available on iOS and Android.",
    },
    {
      question: "Who created Sophia?",
      answer:
        "Sophia was created by two students around a single idea: general knowledge is almost always taught as a list of things to memorise, while what makes people want to learn are the subjects that intrigue them. They wanted an app that starts from the questions everyone asks rather than from a syllabus. Sophia now works with academics and PhD holders who write its lessons, so that answers come from people who genuinely know the subject. The app is published by Vik Studios SAS.",
    },
    {
      question: "What topics does it cover?",
      answer:
        "Sophia covers six subjects: history, mythology, art, literature, science, and understanding today's world. Over 240 lessons are available, from the fall of Constantinople to how artificial intelligence works. New lessons are added regularly.",
    },
    {
      question: "Is Sophia free?",
      answer:
        "The download and the first lessons are free. A subscription opens the whole catalogue, the quizzes and the daily review. Terms and prices are shown in the app before any commitment.",
    },
    {
      question: "Do I need an account?",
      answer:
        "Yes, an account is required. It keeps your progress, your streak and your reviews, and brings them back if you change phone. Creating one takes less than a minute.",
    },
    {
      question: "Which phones does Sophia run on?",
      answer:
        "Sophia runs on iPhone and iPad through the App Store, and on Android through the Google Play Store. The app is designed for the phone and can be read one-handed.",
    },
    {
      question: "How much time does it take each day?",
      answer:
        "A lesson takes five to ten minutes, quiz included. The daily review adds a minute or two. The app is made for short, regular use, not for long sessions.",
    },
    {
      question: "Is Sophia connected to the Sophia robot?",
      answer:
        "No, not at all. Sophia: General Knowledge is a mobile learning app published by Vik Studios SAS in France. It has nothing to do with the Sophia humanoid robot from Hanson Robotics, with Sophia University in Tokyo, or with the sophia health programme run by France's Assurance Maladie.",
    },
    {
      question: "Are the lessons written by specialists?",
      answer:
        "Sophia works with academics and PhD holders who write its lessons, each in their own field. Signed lessons carry the name and title of their author. The aim is simple: an answer written by someone who truly knows the subject, but written to be understood with no prior knowledge.",
    },
  ],
};
