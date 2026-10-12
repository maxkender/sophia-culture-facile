import { creatorLang } from "@/i18n/creator-app";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_ALLOWED_PATTERN = /^\+?[0-9\s().-]+$/;

export type CreatorValidationLang = "en" | "fr";

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

export function isValidInternationalPhone(value: string) {
  const phone = value.trim();
  const digits = phone.replace(/\D/g, "");
  return PHONE_ALLOWED_PATTERN.test(phone) && digits.length >= 7 && digits.length <= 15;
}

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function friendlyCreatorError(error: unknown, lang: CreatorValidationLang = creatorLang()) {
  const fallback = lang === "fr"
    ? "Impossible d’enregistrer pour le moment. Vérifiez les informations saisies puis réessayez."
    : "We could not save this right now. Check the information you entered and try again.";
  const raw = error instanceof Error ? error.message : "";
  const message = raw.toLowerCase();

  if (message.includes("wait for it to be validated")) return lang === "fr" ? "Envoie ton brouillon et attends sa validation avant de poster." : "Send your draft and wait for it to be validated before posting.";
  if (message.includes("choose the brief")) return lang === "fr" ? "Choisis d’abord le brief de cette vidéo." : "Choose the brief of this video first.";
  if (message.includes("starting with https")) return lang === "fr" ? "Colle le lien complet, qui commence par https://." : "Paste the full link, starting with https://.";
  if (message.includes("add a video or a link")) return lang === "fr" ? "Ajoute une vidéo ou un lien." : "Add a video or a link.";
  if (message.includes("email") || message.includes("invalid_string")) {
    return lang === "fr"
      ? "Saisissez une adresse e-mail complète, par exemple nom@exemple.com."
      : "Enter a complete email address, for example name@example.com.";
  }
  if (message.includes("phone") || message.includes("téléphone")) {
    return lang === "fr"
      ? "Saisissez un numéro de téléphone valide avec l’indicatif du pays, par exemple +33 6 12 34 56 78."
      : "Enter a valid phone number with the country code, for example +44 7700 900123.";
  }
  if (message.includes("url") || message.includes("link")) {
    return lang === "fr"
      ? "Saisissez un lien complet commençant par https://."
      : "Enter a complete link beginning with https://.";
  }
  if (message.includes("too_small") || message.includes("required") || message.includes("received undefined")) {
    return lang === "fr" ? "Complétez tous les champs obligatoires indiqués par un astérisque."
      : "Complete every required field marked with an asterisk.";
  }
  if (message.includes("unauthorized") || message.includes("creator account not found")) {
    return lang === "fr" ? "Votre session a expiré. Reconnectez-vous puis réessayez."
      : "Your session has expired. Sign in again, then try once more.";
  }
  if (raw && !message.includes("zod") && !message.includes("invalid_type") && !message.includes("validation")) {
    const safeMessages = [
      "Enter the account password.", "Register the account first.", "Brief not found.", "Post not found.",
      "Views can be reported 7 days after posting.", "Finish onboarding steps 1 to 3 before logging posts.",
      "The date cannot be in the future.", "The screenshot could not be uploaded.", "The photo could not be uploaded.",
      "The account could not be saved.", "The post could not be logged.",
    ];
    if (safeMessages.includes(raw)) return raw;
  }
  return fallback;
}