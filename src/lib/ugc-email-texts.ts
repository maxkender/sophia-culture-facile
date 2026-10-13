// Client-safe UGC email texts (FR + EN). No amounts, ever.
export const EMAIL_DEFAULTS = {
  "ugc-welcome": {
    subject: "You're in — your Sophia creator space",
    intro: "Hi {first_name},\n\nWelcome to the Sophia creator team. Your private creator space is ready: open the button below and create your password with this email address.",
    instructions: "Then:\n1. Sign your UGC Creator Agreement.\n2. Read the shooting guidelines.\n3. Get your app codes and open your first brief.\n\nReply to this email if anything is unclear.",
    button_label: "Open my creator space",
  },
  "ugc-decline": {
    subject: "Your Sophia creator application",
    intro: "Hi {first_name},\n\nThank you for applying to create for Sophia and for the time you put into your video.",
    instructions: "We are not taking your application further this time. This is not a judgement of you: we look for a very specific style and we receive many more applications than we have places.\n\nWe wish you all the best, and you are welcome to apply again in a few months.",
    button_label: "",
  },
} as const;

/** French versions used for French-speaking creators (language fr, or a French-speaking country). */
export const EMAIL_DEFAULTS_FR = {
  "ugc-welcome": {
    subject: "C’est validé — ton espace créateur Sophia",
    intro: "Salut {first_name},\n\nBienvenue dans l’équipe créateurs Sophia. Ton espace créateur privé est prêt : clique sur le bouton ci-dessous et crée ton mot de passe avec cette adresse email.",
    instructions: "Ensuite :\n1. Signe ton contrat créateur UGC.\n2. Lis les consignes de tournage.\n3. Récupère tes codes d’app et ouvre ton premier brief.\n\nRéponds à cet email si quelque chose n’est pas clair.",
    button_label: "Ouvrir mon espace créateur",
  },
  "ugc-decline": {
    subject: "Ta candidature créateur Sophia",
    intro: "Salut {first_name},\n\nMerci d’avoir candidaté pour créer pour Sophia et pour le temps passé sur ta vidéo.",
    instructions: "On ne retient pas ta candidature cette fois-ci. Ce n’est pas un jugement sur toi : on cherche un style très précis et on reçoit beaucoup plus de candidatures que de places.\n\nOn te souhaite le meilleur, et tu peux candidater à nouveau dans quelques mois.",
    button_label: "",
  },
} as const;


/** Every email the UGC programme can send — each one only because a person clicked something. Shown in Settings → Emails. */
export const UGC_EMAIL_CATALOG: { key: string; when: string; fr: { subject: string; body: string }; en: { subject: string; body: string } }[] = [
  { key: "ack", when: "Applicant submits the public form", fr: { subject: "Candidature reçue", body: "Salut {first_name},\nCandidature reçue, on revient vers toi.\n— L’équipe créateurs Sophia" }, en: { subject: "Application received", body: "Hi {first_name},\nApplication received, we'll get back to you.\n— The Sophia creator team" } },
  { key: "ugc-welcome", when: "Admin clicks Accept, Add creator or Resend invitation", fr: { subject: EMAIL_DEFAULTS_FR["ugc-welcome"].subject, body: `${EMAIL_DEFAULTS_FR["ugc-welcome"].intro}\n\n${EMAIL_DEFAULTS_FR["ugc-welcome"].instructions}\n[${EMAIL_DEFAULTS_FR["ugc-welcome"].button_label}]` }, en: { subject: EMAIL_DEFAULTS["ugc-welcome"].subject, body: `${EMAIL_DEFAULTS["ugc-welcome"].intro}\n\n${EMAIL_DEFAULTS["ugc-welcome"].instructions}\n[${EMAIL_DEFAULTS["ugc-welcome"].button_label}]` } },
  { key: "ugc-decline", when: "Admin clicks Reject (with email)", fr: { subject: EMAIL_DEFAULTS_FR["ugc-decline"].subject, body: `${EMAIL_DEFAULTS_FR["ugc-decline"].intro}\n\n${EMAIL_DEFAULTS_FR["ugc-decline"].instructions}` }, en: { subject: EMAIL_DEFAULTS["ugc-decline"].subject, body: `${EMAIL_DEFAULTS["ugc-decline"].intro}\n\n${EMAIL_DEFAULTS["ugc-decline"].instructions}` } },
  { key: "draft", when: "Admin clicks Validate or Request changes on a draft", fr: { subject: "Brouillon validé ✅ / Modifications demandées", body: "Salut {first_name},\nBrouillon validé ✅ pour « {brief} » — poste-la et colle ton lien.\n(ou) Modifications demandées pour « {brief} » : {comment}\n[Ouvrir le brief]" }, en: { subject: "Draft validated ✅ / Changes requested", body: "Hi {first_name},\nDraft validated ✅ for \"{brief}\" — post it and paste your link.\n(or) Changes requested for \"{brief}\": {comment}\n[Open the brief]" } },
  { key: "post", when: "Admin clicks Validate or Refuse on a post link", fr: { subject: "Post validé ✅ / Lien refusé", body: "Salut {first_name},\nTon post a été validé ✅. Les vues seront relevées 7 jours après la validation.\n(ou) Ton lien a été refusé : {reason}" }, en: { subject: "Post validated ✅ / Link refused", body: "Hi {first_name},\nYour post was validated ✅. Views are recorded 7 days after validation.\n(or) Your link was refused: {reason}" } },
  { key: "reset", when: "Creator clicks Forgot password", fr: { subject: "Réinitialiser ton mot de passe", body: "Lien de réinitialisation envoyé par le système de connexion." }, en: { subject: "Reset your password", body: "Reset link sent by the sign-in system." } },
];
