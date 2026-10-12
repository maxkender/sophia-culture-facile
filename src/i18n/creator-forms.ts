import type { Lang } from "./routes";

export type CreatorFormCopy = {
  common: {
    contact: string;
    fullName: string;
    email: string;
    phone: string;
    country: string;
    age: string;
    yes: string;
    no: string;
    consent: string;
    consentText: string;
    privacy: string;
    privacyNotice: string;
    selectCountry: string;
    searchCountry: string;
    noCountry: string;
    requiredError: string;
    emailError: string;
    phoneError: string;
    consentError: string;
    rateError: string;
    genericError: string;
    sending: string;
    submit: string;
  };
  ugc: {
    title: string;
    lead: string;
    confirmation: string;
    occupation: string;
    occupations: Record<"studying" | "working" | "both" | "other", string>;
    content: string;
    contentHint: string;
    tiktok: string;
    instagram: string;
    otherLinks: string;
    requirements: string;
    requirementItems: string[];
    meets: string;
    underage: string;
    notMeeting: string;
    videoTitle: string;
    videoHelp: string;
    sendLink: string;
    uploadFile: string;
    videoLink: string;
    videoFile: string;
    uploaded: string;
    uploading: string;
    videoMissing: string;
    videoTooLarge: string;
    videoType: string;
    linksError: string;
    referral: string;
    referralHint: string;
    referralError: string;
  };
  slideshow: {
    title: string;
    lead: string;
    confirmation: string;
    about: string;
    adult: string;
    underage: string;
    upwork: string;
    upworkLink: string;
    referral: string;
    secondPhone: string;
    language: string;
    screening: string;
    qCountryNow: string;
    qTiktok: string;
    qPrevious: string;
    screeningError: string;
  };
};

export const CREATOR_FORMS: Record<Lang, CreatorFormCopy> = {
  en: {
    common: {
      contact: "Contact",
      fullName: "Full name *",
      email: "Email *",
      phone: "Phone number, with country code *",
      country: "Which country are you in? *",
      age: "How old are you? *",
      yes: "Yes",
      no: "No",
      consent: "Consent *",
      consentText: "I agree that Sophia stores this application and contacts me about it.",
      privacy: "Privacy policy",
      privacyNotice: "Your application is stored by Vik Studios to process it and contact you about it. See our",
      selectCountry: "Select your country",
      searchCountry: "Search a country…",
      noCountry: "No country found.",
      requiredError: "Please fill in every required field.",
      emailError: "Enter a complete email address, for example name@example.com.",
      phoneError: "Enter a valid phone number with the country code, for example +44 7700 900123.",
      consentError: "Please tick the consent box.",
      rateError: "We have already received an application from you recently. We will be in touch.",
      genericError: "Something went wrong. Please check your answers and try again.",
      sending: "Sending…",
      submit: "Submit my application",
    },
    ugc: {
      title: "Apply as a UGC creator",
      lead: "Two minutes. Your answers are saved on this device as you type.",
      confirmation: "Thank you. We read every application and reply within five days by email.",
      occupation: "What do you do? *",
      occupations: { studying: "Studying", working: "Working", both: "Both", other: "Other" },
      content: "Your content",
      contentHint: "Past content experience is not required, but it helps to see what you have made.",
      tiktok: "TikTok link",
      instagram: "Instagram link",
      otherLinks: "Other links",
      requirements: "Requirements",
      requirementItems: ["You have an iPhone", "You can post at least five times a week, consistently", "You do not currently work for a competing app", "You are at least 18 years old", "You are good on camera", "You agree to sign an account agreement before starting"],
      meets: "Do you meet all of the above? *",
      underage: "You need to be at least 18 to apply.",
      notMeeting: "Please do not apply if you do not meet these.",
      videoTitle: "A video of you talking *",
      videoHelp: "A 30 to 90 second video of you talking to the camera. Any subject. Be casual, like you are on a call with a friend. Decent light, no influencer voice. You can send a link to a video you have already made, as long as you are facing the camera and speaking.",
      sendLink: "Send a link",
      uploadFile: "Upload a file",
      videoLink: "Video link",
      videoFile: "Video file (.mp4 or .mov, 200 MB maximum)",
      uploaded: "Uploaded",
      uploading: "Uploading",
      videoMissing: "Please add a video: a link, or a file upload.",
      videoTooLarge: "The video is over 200 MB.",
      videoType: "Please upload an .mp4 or .mov file.",
      linksError: "Links must start with https://",
      referral: "How did you hear about us? *",
      referralHint: "If a friend referred you, give their name and contact so we can thank them.",
      referralError: "Please tell us how you heard about us.",
    },
    slideshow: {
      title: "Apply as a slideshow creator",
      lead: "One minute, no video needed.",
      confirmation: "Thanks! We open places country by country, week after week. If your country opens, we'll write to you by email.",
      about: "About you",
      adult: "Are you at least 18? *",
      underage: "You need to be at least 18 to apply.",
      upwork: "Do you have an Upwork account? *",
      upworkLink: "Your Upwork profile link (optional)",
      referral: "How did you hear about us?",
      secondPhone: "Do you have a second phone you can use for filming? *",
      language: "Language for our emails",
      screening: "Three quick questions",
      qCountryNow: "1. Which country do you live in right now? *",
      qTiktok: "2. Do you already use TikTok daily? *",
      qPrevious: "3. Tell us about any content you've posted before *",
      screeningError: "Please answer the three questions.",
    },
  },
  fr: {
    common: {
      contact: "Coordonnées",
      fullName: "Nom complet *",
      email: "E-mail *",
      phone: "Numéro de téléphone, avec indicatif du pays *",
      country: "Dans quel pays vivez-vous ? *",
      age: "Quel âge avez-vous ? *",
      yes: "Oui",
      no: "Non",
      consent: "Consentement *",
      consentText: "J’accepte que Sophia conserve cette candidature et me contacte à son sujet.",
      privacy: "Politique de confidentialité",
      privacyNotice: "Votre candidature est conservée par Vik Studios afin de l’étudier et de vous contacter à son sujet. Consultez notre",
      selectCountry: "Sélectionnez votre pays",
      searchCountry: "Rechercher un pays…",
      noCountry: "Aucun pays trouvé.",
      requiredError: "Veuillez remplir tous les champs obligatoires.",
      emailError: "Saisissez une adresse e-mail complète, par exemple nom@exemple.com.",
      phoneError: "Saisissez un numéro de téléphone valide avec l’indicatif du pays, par exemple +33 6 12 34 56 78.",
      consentError: "Veuillez cocher la case de consentement.",
      rateError: "Nous avons déjà reçu une candidature de votre part récemment. Nous vous recontacterons.",
      genericError: "Une erreur est survenue. Vérifiez vos réponses puis réessayez.",
      sending: "Envoi…",
      submit: "Envoyer ma candidature",
    },
    ugc: {
      title: "Postuler comme créateur UGC",
      lead: "Deux minutes. Vos réponses sont enregistrées sur cet appareil pendant la saisie.",
      confirmation: "Merci. Nous lisons chaque candidature et répondons par e-mail sous cinq jours.",
      occupation: "Quelle est votre activité ? *",
      occupations: { studying: "Études", working: "Travail", both: "Les deux", other: "Autre" },
      content: "Votre contenu",
      contentHint: "Aucune expérience n’est exigée, mais voir ce que vous avez déjà créé nous aide.",
      tiktok: "Lien TikTok",
      instagram: "Lien Instagram",
      otherLinks: "Autres liens",
      requirements: "Conditions",
      requirementItems: ["Vous avez un iPhone", "Vous pouvez publier au moins cinq fois par semaine, avec régularité", "Vous ne travaillez pas actuellement pour une appli concurrente", "Vous avez au moins 18 ans", "Vous êtes à l’aise face caméra", "Vous acceptez de signer un contrat de compte avant de commencer"],
      meets: "Remplissez-vous toutes ces conditions ? *",
      underage: "Vous devez avoir au moins 18 ans pour postuler.",
      notMeeting: "Merci de ne pas postuler si vous ne remplissez pas ces conditions.",
      videoTitle: "Une vidéo de vous en train de parler *",
      videoHelp: "Une vidéo de 30 à 90 secondes où vous parlez face caméra, sur le sujet de votre choix. Restez naturel, comme lors d’un appel avec un ami. Une lumière correcte suffit, sans ton d’influenceur. Vous pouvez envoyer une vidéo existante si vous êtes face caméra et parlez.",
      sendLink: "Envoyer un lien",
      uploadFile: "Importer un fichier",
      videoLink: "Lien de la vidéo",
      videoFile: "Fichier vidéo (.mp4 ou .mov, 200 Mo maximum)",
      uploaded: "Importée",
      uploading: "Importation",
      videoMissing: "Ajoutez une vidéo sous forme de lien ou de fichier.",
      videoTooLarge: "La vidéo dépasse 200 Mo.",
      videoType: "Importez un fichier .mp4 ou .mov.",
      linksError: "Les liens doivent commencer par https://",
      referral: "Comment avez-vous entendu parler de nous ? *",
      referralHint: "Si un ami vous a recommandé, indiquez son nom et son contact pour que nous puissions le remercier.",
      referralError: "Indiquez comment vous avez entendu parler de nous.",
    },
    slideshow: {
      title: "Postuler comme créateur de slideshows",
      lead: "Une minute, aucune vidéo nécessaire.",
      confirmation: "Merci ! Nous ouvrons des places pays par pays, semaine après semaine. Si votre pays ouvre, nous vous écrirons par e-mail.",
      about: "À propos de vous",
      adult: "Avez-vous au moins 18 ans ? *",
      underage: "Vous devez avoir au moins 18 ans pour postuler.",
      upwork: "Avez-vous un compte Upwork ? *",
      upworkLink: "Lien de votre profil Upwork (facultatif)",
      referral: "Comment avez-vous entendu parler de nous ?",
      secondPhone: "Avez-vous un second téléphone utilisable pour filmer ? *",
      language: "Langue de nos e-mails",
      screening: "Trois questions rapides",
      qCountryNow: "1. Dans quel pays vivez-vous en ce moment ? *",
      qTiktok: "2. Utilisez-vous déjà TikTok tous les jours ? *",
      qPrevious: "3. Parlez-nous des contenus que vous avez déjà publiés *",
      screeningError: "Répondez aux trois questions.",
    },
  },
};