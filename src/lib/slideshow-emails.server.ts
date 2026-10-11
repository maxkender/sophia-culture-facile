// Server-only: poster emails in the applicant's language (FR, EN, ES, IT, PT, DE; else EN).
import { buildEmailHtml } from "./email-send.server";
import { sendBrevoEmail, type BrevoResult } from "./brevo.server";
import type { ApplicantLang } from "@/config/countries";

type L = ApplicantLang;
const LANGS: L[] = ["fr", "en", "es", "it", "pt", "de"];
export const pickLang = (v: string | null | undefined): L => (LANGS.includes(v as L) ? (v as L) : "en");

const hi: Record<L, (n: string) => string> = {
  fr: (n) => `Bonjour ${n},`, en: (n) => `Hi ${n},`, es: (n) => `Hola ${n}:`, it: (n) => `Ciao ${n},`, pt: (n) => `Olá ${n},`, de: (n) => `Hallo ${n},`,
};

const T = {
  ack: {
    subject: { fr: "Merci pour votre candidature", en: "Thanks for applying", es: "Gracias por tu candidatura", it: "Grazie per la candidatura", pt: "Obrigado pela candidatura", de: "Danke für deine Bewerbung" },
    body: {
      fr: "Merci ! Nous ouvrons des places pays par pays, semaine après semaine. Si votre pays ouvre, nous vous écrirons ici.",
      en: "Thanks! We open places country by country, week after week. If your country opens, we'll write to you here.",
      es: "¡Gracias! Abrimos plazas país por país, semana tras semana. Si tu país abre, te escribiremos aquí.",
      it: "Grazie! Apriamo i posti paese per paese, settimana dopo settimana. Se il tuo paese apre, ti scriveremo qui.",
      pt: "Obrigado! Abrimos vagas país a país, semana após semana. Se o teu país abrir, escrevemos-te aqui.",
      de: "Danke! Wir öffnen Plätze Land für Land, Woche für Woche. Wenn dein Land öffnet, schreiben wir dir hier.",
    },
  },
  accepted: {
    subject: { fr: "Vous êtes accepté·e — signez votre contrat", en: "You're accepted — sign your contract", es: "Has sido aceptado/a — firma tu contrato", it: "Sei stato accettato — firma il contratto", pt: "Foste aceite — assina o teu contrato", de: "Du bist angenommen — unterschreibe deinen Vertrag" },
    body: {
      fr: (d: string) => [`Bonne nouvelle : votre candidature est acceptée. Vous commencez le lundi ${d}.`, "La suite : 1) signez le contrat ci-dessous ; 2) vous recevez vos identifiants ; 3) vous chauffez le compte avant dimanche ; 4) premiers posts lundi."],
      en: (d: string) => [`Good news: your application is accepted. You start on Monday ${d}.`, "What happens next: 1) sign the contract below; 2) you receive your logins; 3) you warm up the account before Sunday; 4) first posts on Monday."],
      es: (d: string) => [`Buenas noticias: tu candidatura ha sido aceptada. Empiezas el lunes ${d}.`, "Lo siguiente: 1) firma el contrato abajo; 2) recibes tus accesos; 3) calientas la cuenta antes del domingo; 4) primeras publicaciones el lunes."],
      it: (d: string) => [`Buone notizie: la tua candidatura è accettata. Inizi lunedì ${d}.`, "Prossimi passi: 1) firma il contratto qui sotto; 2) ricevi le credenziali; 3) scaldi l'account prima di domenica; 4) primi post lunedì."],
      pt: (d: string) => [`Boas notícias: a tua candidatura foi aceite. Começas na segunda-feira ${d}.`, "A seguir: 1) assina o contrato abaixo; 2) recebes os teus acessos; 3) aqueces a conta antes de domingo; 4) primeiras publicações na segunda."],
      de: (d: string) => [`Gute Nachricht: deine Bewerbung ist angenommen. Du startest am Montag, ${d}.`, "So geht es weiter: 1) unterschreibe unten den Vertrag; 2) du bekommst deine Zugangsdaten; 3) du wärmst den Account vor Sonntag auf; 4) erste Posts am Montag."],
    },
    button: { fr: "Signer le contrat", en: "Sign the contract", es: "Firmar el contrato", it: "Firma il contratto", pt: "Assinar o contrato", de: "Vertrag unterschreiben" },
  },
  rejected: {
    subject: { fr: "Votre candidature", en: "Your application", es: "Tu candidatura", it: "La tua candidatura", pt: "A tua candidatura", de: "Deine Bewerbung" },
    body: {
      fr: "Merci pour votre candidature. Nous ne pouvons pas la retenir pour le moment.", en: "Thank you for applying. We can't take your application forward at the moment.",
      es: "Gracias por tu candidatura. No podemos seguir adelante con ella por ahora.", it: "Grazie per la candidatura. Al momento non possiamo procedere.",
      pt: "Obrigado pela candidatura. De momento não podemos avançar.", de: "Danke für deine Bewerbung. Wir können sie im Moment leider nicht weiterführen.",
    },
    reason: { fr: "Raison :", en: "Reason:", es: "Motivo:", it: "Motivo:", pt: "Motivo:", de: "Grund:" },
  },
  expired: {
    subject: { fr: "Votre candidature", en: "Your application", es: "Tu candidatura", it: "La tua candidatura", pt: "A tua candidatura", de: "Deine Bewerbung" },
    body: {
      fr: "Nous n'avons pas ouvert votre pays ces dernières semaines. N'hésitez pas à postuler de nouveau plus tard — merci de votre intérêt.",
      en: "We didn't open your country in the past weeks. Feel free to apply again later — thank you for your interest.",
      es: "No hemos abierto tu país en las últimas semanas. No dudes en volver a postular más adelante — gracias por tu interés.",
      it: "Non abbiamo aperto il tuo paese nelle ultime settimane. Sentiti libero di ricandidarti più avanti — grazie per l'interesse.",
      pt: "Não abrimos o teu país nas últimas semanas. Podes candidatar-te de novo mais tarde — obrigado pelo interesse.",
      de: "Wir haben dein Land in den letzten Wochen nicht geöffnet. Du kannst dich gern später erneut bewerben — danke für dein Interesse.",
    },
  },
  logins: {
    subject: { fr: "Vos identifiants Sophia OS", en: "Your Sophia OS logins", es: "Tus accesos a Sophia OS", it: "Le tue credenziali Sophia OS", pt: "Os teus acessos ao Sophia OS", de: "Deine Sophia-OS-Zugangsdaten" },
    lines: {
      fr: ["Votre compte est prêt.", "Identifiant", "Mot de passe temporaire (à changer à la première connexion)", "Rejoindre Slack", "Guide du posteur", "Début", "Règle de chauffe : utilisez le compte normalement chaque jour jusqu'à dimanche (regarder, liker, suivre), sans publier. Premiers posts lundi."],
      en: ["Your account is ready.", "Login", "Temporary password (change it at first login)", "Join Slack", "Poster Guide", "Start", "Warm-up rule: use the account normally every day until Sunday (watch, like, follow) without posting. First posts on Monday."],
      es: ["Tu cuenta está lista.", "Usuario", "Contraseña temporal (cámbiala al primer acceso)", "Unirse a Slack", "Guía del poster", "Inicio", "Regla de calentamiento: usa la cuenta con normalidad cada día hasta el domingo (ver, dar like, seguir) sin publicar. Primeras publicaciones el lunes."],
      it: ["Il tuo account è pronto.", "Login", "Password temporanea (da cambiare al primo accesso)", "Entra su Slack", "Guida del poster", "Inizio", "Regola di riscaldamento: usa l'account normalmente ogni giorno fino a domenica (guarda, metti like, segui) senza pubblicare. Primi post lunedì."],
      pt: ["A tua conta está pronta.", "Login", "Palavra-passe temporária (muda-a no primeiro acesso)", "Entrar no Slack", "Guia do poster", "Início", "Regra de aquecimento: usa a conta normalmente todos os dias até domingo (ver, gostar, seguir) sem publicar. Primeiras publicações na segunda."],
      de: ["Dein Account ist bereit.", "Login", "Temporäres Passwort (beim ersten Login ändern)", "Slack beitreten", "Poster-Guide", "Start", "Aufwärm-Regel: nutze den Account bis Sonntag jeden Tag normal (ansehen, liken, folgen), ohne zu posten. Erste Posts am Montag."],
    },
  },
  payout: {
    subject: { fr: "Choisissez comment être payé·e", en: "Choose how you get paid", es: "Elige cómo cobrar", it: "Scegli come essere pagato", pt: "Escolhe como receber", de: "Wähle, wie du bezahlt wirst" },
    body: {
      fr: "Indiquez votre moyen de paiement (Stripe, Wise ou PayPal). Le lien est valable 7 jours.", en: "Set your payout method (Stripe, Wise or PayPal). The link is valid for 7 days.",
      es: "Indica tu método de cobro (Stripe, Wise o PayPal). El enlace es válido 7 días.", it: "Indica il metodo di pagamento (Stripe, Wise o PayPal). Il link vale 7 giorni.",
      pt: "Indica o teu método de pagamento (Stripe, Wise ou PayPal). O link é válido 7 dias.", de: "Lege deine Auszahlungsmethode fest (Stripe, Wise oder PayPal). Der Link ist 7 Tage gültig.",
    },
    button: { fr: "Choisir", en: "Set it up", es: "Configurar", it: "Configura", pt: "Configurar", de: "Einrichten" },
  },
};

async function send(to: string, name: string, subject: string, paragraphs: string[], button?: { label: string; url: string }, bullets?: string[]): Promise<BrevoResult> {
  const html = buildEmailHtml({ paragraphs, ...(bullets ? { bullets } : {}), ...(button ? { buttonLabel: button.label, buttonUrl: button.url } : {}) });
  const text = [...paragraphs, ...(bullets ?? []), ...(button ? [`${button.label}: ${button.url}`] : [])].join("\n\n");
  return sendBrevoEmail({ to, toName: name, subject, html, text });
}
const first = (n: string) => n.trim().split(/\s+/)[0] ?? n;

export function formatMonday(d: string, lang: L) {
  return new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));
}

export const posterEmails = {
  ack: (to: string, name: string, l: L) => send(to, name, T.ack.subject[l], [hi[l](first(name)), T.ack.body[l]]),
  accepted: (to: string, name: string, l: L, monday: string, link: string) =>
    send(to, name, T.accepted.subject[l], [hi[l](first(name)), ...T.accepted.body[l](formatMonday(monday, l))], { label: T.accepted.button[l], url: link }),
  rejected: (to: string, name: string, l: L, reason: string | null) =>
    send(to, name, T.rejected.subject[l], [hi[l](first(name)), T.rejected.body[l], ...(reason ? [`${T.rejected.reason[l]} ${reason}`] : [])]),
  expired: (to: string, name: string, l: L) => send(to, name, T.expired.subject[l], [hi[l](first(name)), T.expired.body[l]]),
  logins: (to: string, name: string, l: L, o: { osUrl: string; login: string; password: string; slack: string | null; guide: string | null; monday: string }) => {
    const x = T.logins.lines[l];
    return send(to, name, T.logins.subject[l], [hi[l](first(name)), x[0]!, x[6]!], { label: "Sophia OS", url: o.osUrl }, [
      `${x[1]}: ${o.login}`, `${x[2]}: ${o.password}`, ...(o.slack ? [`${x[3]}: ${o.slack}`] : []), ...(o.guide ? [`${x[4]}: ${o.guide}`] : []), `${x[5]}: ${formatMonday(o.monday, l)}`,
    ]);
  },
  payout: (to: string, name: string, l: L, link: string) => send(to, name, T.payout.subject[l], [hi[l](first(name)), T.payout.body[l]], { label: T.payout.button[l], url: link }),
};
