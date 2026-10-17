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
  ackOpen: {
    fr: "Merci ! Votre candidature est bien reçue. Votre pays est ouvert : nous l'étudions et revenons vers vous ici très vite.",
    en: "Thanks! Your application is in. Your country is open: we're reviewing it and will get back to you here shortly.",
    es: "¡Gracias! Hemos recibido tu candidatura. Tu país está abierto: la estamos revisando y te responderemos aquí muy pronto.",
    it: "Grazie! La tua candidatura è arrivata. Il tuo paese è aperto: la stiamo esaminando e ti risponderemo qui a breve.",
    pt: "Obrigado! A tua candidatura foi recebida. O teu país está aberto: estamos a analisá-la e respondemos-te aqui em breve.",
    de: "Danke! Deine Bewerbung ist angekommen. Dein Land ist offen: Wir prüfen sie und melden uns hier in Kürze bei dir.",
  },
  ackNeutral: {
    fr: "Merci ! Votre candidature est bien reçue. Nous étudions chaque candidature et revenons vers vous ici.",
    en: "Thanks! Your application is in. We review every application and will get back to you here.",
    es: "¡Gracias! Hemos recibido tu candidatura. Revisamos cada candidatura y te responderemos aquí.",
    it: "Grazie! La tua candidatura è arrivata. Esaminiamo ogni candidatura e ti risponderemo qui.",
    pt: "Obrigado! A tua candidatura foi recebida. Analisamos cada candidatura e respondemos-te aqui.",
    de: "Danke! Deine Bewerbung ist angekommen. Wir prüfen jede Bewerbung und melden uns hier bei dir.",
  },
  pay: {
    fr: (e: string, d: string) => `Nous vous payons chaque semaine via Ruul (ruul.io), notre partenaire de paiement. Avant le lundi ${d} : créez votre compte freelancer gratuit sur ruul.io avec exactement cette adresse email : ${e}. Complétez ensuite la vérification d'identité (pièce d'identité + selfie, environ 10 minutes) et ajoutez votre compte bancaire. Rien à envoyer : vous êtes payé·e chaque lundi pour la semaine précédente.`,
    en: (e: string, d: string) => `We pay you every week through Ruul (ruul.io), our payment partner. Before Monday ${d}: create your free freelancer account on ruul.io with exactly this email address: ${e}. Then complete the identity check (ID + selfie, about 10 minutes) and add your bank account. Nothing to submit: you are paid every Monday for the week before.`,
    es: (e: string, d: string) => `Te pagamos cada semana a través de Ruul (ruul.io), nuestro socio de pagos. Antes del lunes ${d}: crea tu cuenta gratuita de freelancer en ruul.io con exactamente esta dirección de email: ${e}. Después completa la verificación de identidad (documento + selfie, unos 10 minutos) y añade tu cuenta bancaria. Nada que enviar: cobras cada lunes por la semana anterior.`,
    it: (e: string, d: string) => `Ti paghiamo ogni settimana tramite Ruul (ruul.io), il nostro partner di pagamento. Prima di lunedì ${d}: crea il tuo account freelancer gratuito su ruul.io con esattamente questo indirizzo email: ${e}. Poi completa la verifica dell'identità (documento + selfie, circa 10 minuti) e aggiungi il tuo conto bancario. Niente da inviare: vieni pagato ogni lunedì per la settimana precedente.`,
    pt: (e: string, d: string) => `Pagamos-te todas as semanas através da Ruul (ruul.io), o nosso parceiro de pagamentos. Antes de segunda-feira ${d}: cria a tua conta freelancer gratuita em ruul.io com exatamente este endereço de email: ${e}. Depois completa a verificação de identidade (documento + selfie, cerca de 10 minutos) e adiciona a tua conta bancária. Nada a enviar: recebes todas as segundas-feiras pela semana anterior.`,
    de: (e: string, d: string) => `Wir bezahlen dich jede Woche über Ruul (ruul.io), unseren Zahlungspartner. Vor Montag, ${d}: Erstelle dein kostenloses Freelancer-Konto auf ruul.io mit genau dieser E-Mail-Adresse: ${e}. Schließe dann die Identitätsprüfung ab (Ausweis + Selfie, ca. 10 Minuten) und füge dein Bankkonto hinzu. Nichts einzureichen: Du wirst jeden Montag für die Vorwoche bezahlt.`,
  },
  cohort: {
    fr: "Une fois dans Slack, rejoignez #welcome et #ruul-cohort : posez toutes vos questions dans #ruul-cohort.",
    en: "Once in Slack, join #welcome and #ruul-cohort: ask all your questions in #ruul-cohort.",
    es: "Una vez en Slack, únete a #welcome y #ruul-cohort: haz todas tus preguntas en #ruul-cohort.",
    it: "Una volta su Slack, entra in #welcome e #ruul-cohort: fai tutte le tue domande in #ruul-cohort.",
    pt: "Já no Slack, entra em #welcome e #ruul-cohort: faz todas as tuas perguntas em #ruul-cohort.",
    de: "Sobald du in Slack bist, tritt #welcome und #ruul-cohort bei: Stell alle deine Fragen in #ruul-cohort.",
  },
  accepted: {
    subject: { fr: "Vous êtes accepté·e — signez votre contrat", en: "You're accepted — sign your contract", es: "Has sido aceptado/a — firma tu contrato", it: "Sei stato accettato — firma il contratto", pt: "Foste aceite — assina o teu contrato", de: "Du bist angenommen — unterschreibe deinen Vertrag" },
    start: {
      fr: (d: string, f: string) => `Bonne nouvelle : votre candidature est acceptée. Signez votre contrat d'ici le ${f} pour commencer le lundi ${d}. Si vous signez plus tard, vous commencerez le premier lundi au moins 3 jours après votre signature.`,
      en: (d: string, f: string) => `Good news: your application is accepted. Sign your contract by ${f} to start on Monday ${d}. If you sign later, you start on the first Monday at least 3 days after you sign.`,
      es: (d: string, f: string) => `Buenas noticias: tu candidatura ha sido aceptada. Firma tu contrato antes del ${f} para empezar el lunes ${d}. Si firmas más tarde, empezarás el primer lunes al menos 3 días después de tu firma.`,
      it: (d: string, f: string) => `Buone notizie: la tua candidatura è accettata. Firma il contratto entro ${f} per iniziare lunedì ${d}. Se firmi più tardi, inizierai il primo lunedì almeno 3 giorni dopo la firma.`,
      pt: (d: string, f: string) => `Boas notícias: a tua candidatura foi aceite. Assina o teu contrato até ${f} para começares na segunda-feira ${d}. Se assinares mais tarde, começas na primeira segunda-feira pelo menos 3 dias depois da tua assinatura.`,
      de: (d: string, f: string) => `Gute Nachricht: deine Bewerbung ist angenommen. Unterschreibe deinen Vertrag bis ${f}, um am Montag, ${d} zu starten. Wenn du später unterschreibst, startest du am ersten Montag, der mindestens 3 Tage nach deiner Unterschrift liegt.`,
    },
    howTitle: { fr: "Comment ça marche", en: "How it works", es: "Cómo funciona", it: "Come funziona", pt: "Como funciona", de: "So funktioniert es" },
    how: {
      fr: (amount: string) => ["Vous créez un compte TikTok sur votre téléphone, avec l'identité que nous vous donnons.", "Chaque jour, 7 jours sur 7, vous publiez les 2 slideshows préparés pour vous dans votre tableau de bord.", "Avant votre premier lundi, vous chauffez le compte : vous utilisez TikTok normalement, sans publier.", `Vous êtes payé·e chaque semaine via Ruul : ${amount} USD par semaine.`, "Sur Slack, vous rejoignez les salons #welcome et #ruul-cohort : posez toutes vos questions dans #ruul-cohort."],
      en: (amount: string) => ["You create a TikTok account on your phone, with the identity we give you.", "Every day, 7 days a week, you post the 2 slideshows prepared for you in your dashboard.", "Before your first Monday, you warm up the account: use TikTok normally, without posting.", `You are paid every week via Ruul: ${amount} USD per week.`, "On Slack, you join the #welcome and #ruul-cohort channels: ask all your questions in #ruul-cohort."],
      es: (amount: string) => ["Creas una cuenta de TikTok en tu teléfono, con la identidad que te damos.", "Cada día, 7 días a la semana, publicas los 2 slideshows preparados para ti en tu panel.", "Antes de tu primer lunes, calientas la cuenta: usas TikTok con normalidad, sin publicar.", `Cobras cada semana a través de Ruul: ${amount} USD por semana.`, "En Slack, te unes a los canales #welcome y #ruul-cohort: haz todas tus preguntas en #ruul-cohort."],
      it: (amount: string) => ["Crei un account TikTok sul tuo telefono, con l'identità che ti diamo noi.", "Ogni giorno, 7 giorni su 7, pubblichi i 2 slideshow preparati per te nella tua dashboard.", "Prima del tuo primo lunedì, scaldi l'account: usi TikTok normalmente, senza pubblicare.", `Vieni pagato ogni settimana tramite Ruul: ${amount} USD a settimana.`, "Su Slack, entri nei canali #welcome e #ruul-cohort: fai tutte le tue domande in #ruul-cohort."],
      pt: (amount: string) => ["Crias uma conta TikTok no teu telemóvel, com a identidade que te damos.", "Todos os dias, 7 dias por semana, publicas os 2 slideshows preparados para ti no teu painel.", "Antes da tua primeira segunda-feira, aqueces a conta: usas o TikTok normalmente, sem publicar.", `Recebes todas as semanas através da Ruul: ${amount} USD por semana.`, "No Slack, entras nos canais #welcome e #ruul-cohort: faz todas as tuas perguntas em #ruul-cohort."],
      de: (amount: string) => ["Du erstellst auf deinem Handy einen TikTok-Account mit der Identität, die wir dir geben.", "Jeden Tag, 7 Tage die Woche, postest du die 2 Slideshows, die in deinem Dashboard für dich vorbereitet sind.", "Vor deinem ersten Montag wärmst du den Account auf: Nutze TikTok ganz normal, ohne zu posten.", `Du wirst jede Woche über Ruul bezahlt: ${amount} USD pro Woche.`, "Auf Slack trittst du den Kanälen #welcome und #ruul-cohort bei: Stell alle deine Fragen in #ruul-cohort."],
    },
    guide: { fr: "Lisez le Poster Guide avant de signer :", en: "Read the Poster Guide before you sign:", es: "Lee la Guía del poster antes de firmar:", it: "Leggi la Guida del poster prima di firmare:", pt: "Lê o Guia do poster antes de assinares:", de: "Lies den Poster-Guide, bevor du unterschreibst:" },
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
      fr: ["Votre compte est prêt.", "Identifiant", "Mot de passe", "Rejoindre Slack", "Début", "Connectez-vous à Sophia OS et appuyez tout de suite sur « Commencer ma chauffe ». Jusqu'à dimanche, utilisez le compte normalement chaque jour (regarder, liker, suivre), sans publier. Vos premiers posts arrivent lundi."],
      en: ["Your account is ready.", "Login", "Password", "Join Slack", "Start", "Log in to Sophia OS and press \"Start my warm-up\" right away. Until Sunday, use the account normally every day (watch, like, follow) without posting. Your first posts arrive on Monday."],
      es: ["Tu cuenta está lista.", "Usuario", "Contraseña", "Unirse a Slack", "Inicio", "Entra en Sophia OS y pulsa \"Empezar mi calentamiento\" enseguida. Hasta el domingo, usa la cuenta con normalidad cada día (ver, dar like, seguir) sin publicar. Tus primeras publicaciones llegan el lunes."],
      it: ["Il tuo account è pronto.", "Login", "Password", "Entra su Slack", "Inizio", "Accedi a Sophia OS e premi subito \"Inizia il mio riscaldamento\". Fino a domenica, usa l'account normalmente ogni giorno (guarda, metti like, segui) senza pubblicare. I tuoi primi post arrivano lunedì."],
      pt: ["A tua conta está pronta.", "Login", "Palavra-passe", "Entrar no Slack", "Início", "Entra no Sophia OS e carrega já em \"Começar o meu aquecimento\". Até domingo, usa a conta normalmente todos os dias (ver, gostar, seguir) sem publicar. As tuas primeiras publicações chegam na segunda."],
      de: ["Dein Account ist bereit.", "Login", "Passwort", "Slack beitreten", "Start", "Melde dich bei Sophia OS an und drücke sofort \"Mein Aufwärmen starten\". Bis Sonntag nutzt du den Account jeden Tag ganz normal (ansehen, liken, folgen), ohne zu posten. Deine ersten Posts kommen am Montag."],
    },
  },
  ruul: {
    subject: { fr: "Comment vous êtes payé·e", en: "Getting paid", es: "Cómo cobras", it: "Come vieni pagato", pt: "Como recebes", de: "So wirst du bezahlt" },
    body: {
      fr: (email: string, d: string) => `Nous vous payons chaque semaine via Ruul (ruul.io), notre partenaire de paiement. Créez votre compte freelancer gratuit sur ruul.io avec exactement cette adresse email : ${email}. Ce doit être la même adresse, sinon nous ne pouvons pas vous payer. Complétez ensuite la vérification d'identité (pièce d'identité + selfie, environ 10 minutes) et ajoutez votre compte bancaire, avant le lundi ${d}.`,
      en: (email: string, d: string) => `We pay you every week through Ruul (ruul.io), our payment partner. Create your free freelancer account on ruul.io with exactly this email address: ${email}. It must be the same address, otherwise we cannot pay you. Then complete the identity check (ID + selfie, about 10 minutes) and add your bank account, before Monday ${d}.`,
      es: (email: string, d: string) => `Te pagamos cada semana a través de Ruul (ruul.io), nuestro socio de pagos. Crea tu cuenta gratuita de freelancer en ruul.io con exactamente esta dirección de email: ${email}. Debe ser la misma dirección, de lo contrario no podemos pagarte. Después completa la verificación de identidad (documento + selfie, unos 10 minutos) y añade tu cuenta bancaria, antes del lunes ${d}.`,
      it: (email: string, d: string) => `Ti paghiamo ogni settimana tramite Ruul (ruul.io), il nostro partner di pagamento. Crea il tuo account freelancer gratuito su ruul.io con esattamente questo indirizzo email: ${email}. Deve essere lo stesso indirizzo, altrimenti non possiamo pagarti. Poi completa la verifica dell'identità (documento + selfie, circa 10 minuti) e aggiungi il tuo conto bancario, prima di lunedì ${d}.`,
      pt: (email: string, d: string) => `Pagamos-te todas as semanas através da Ruul (ruul.io), o nosso parceiro de pagamentos. Cria a tua conta freelancer gratuita em ruul.io com exatamente este endereço de email: ${email}. Tem de ser o mesmo endereço, caso contrário não conseguimos pagar-te. Depois completa a verificação de identidade (documento + selfie, cerca de 10 minutos) e adiciona a tua conta bancária, antes de segunda-feira ${d}.`,
      de: (email: string, d: string) => `Wir bezahlen dich jede Woche über Ruul (ruul.io), unseren Zahlungspartner. Erstelle dein kostenloses Freelancer-Konto auf ruul.io mit genau dieser E-Mail-Adresse: ${email}. Es muss dieselbe Adresse sein, sonst können wir dich nicht bezahlen. Schließe dann die Identitätsprüfung ab (Ausweis + Selfie, ca. 10 Minuten) und füge dein Bankkonto hinzu, vor Montag, ${d}.`,
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

export function formatSigningFriday(monday: string, lang: L) {
  const friday = new Date(`${monday}T00:00:00Z`);
  friday.setUTCDate(friday.getUTCDate() - 3);
  return new Intl.DateTimeFormat(lang, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(friday);
}

export const posterEmails = {
  /** kind: "open" (country open in the OS and payable by Ruul), "closed" (today's text), "neutral" (OS unreachable). */
  ack: (to: string, name: string, l: L, kind: "open" | "closed" | "neutral" = "closed") =>
    send(to, name, T.ack.subject[l], [hi[l](first(name)), kind === "open" ? T.ackOpen[l] : kind === "neutral" ? T.ackNeutral[l] : T.ack.body[l]]),
  accepted: (to: string, name: string, l: L, monday: string, link: string, weeklyAmount: number | null, guideUrl: string | null) => {
    const t = T.accepted;
    const amount = weeklyAmount != null ? String(weeklyAmount) : "—";
    const paragraphs = [hi[l](first(name)), t.start[l](formatMonday(monday, l), formatSigningFriday(monday, l)), `${t.howTitle[l]}:`, ...t.how[l](amount).map((b) => `• ${b}`), ...(guideUrl ? [`${t.guide[l]} ${guideUrl}`] : [])];
    return send(to, name, t.subject[l], paragraphs, { label: t.button[l], url: link });
  },
  rejected: (to: string, name: string, l: L, reason: string | null) =>
    send(to, name, T.rejected.subject[l], [hi[l](first(name)), T.rejected.body[l], ...(reason ? [`${T.rejected.reason[l]} ${reason}`] : [])]),
  expired: (to: string, name: string, l: L) => send(to, name, T.expired.subject[l], [hi[l](first(name)), T.expired.body[l]]),
  logins: (to: string, name: string, l: L, o: { osUrl: string; login: string; password: string; slack: string | null; monday: string; ruulEmail: string }) => {
    const x = T.logins.lines[l];
    return send(to, name, T.logins.subject[l], [hi[l](first(name)), x[0]!, x[5]!, T.pay[l](o.ruulEmail, formatMonday(o.monday, l))], { label: "Sophia OS", url: o.osUrl }, [
      `${x[1]}: ${o.login}`, `${x[2]}: ${o.password}`, ...(o.slack ? [`${x[3]}: ${o.slack}`] : []), T.cohort[l], `${x[4]}: ${formatMonday(o.monday, l)}`,
    ]);
  },
  ruul: (to: string, name: string, l: L, ruulEmail: string, monday: string) =>
    send(to, name, T.ruul.subject[l], [hi[l](first(name)), T.ruul.body[l](ruulEmail, formatMonday(monday, l))]),
  payout: (to: string, name: string, l: L, link: string) => send(to, name, T.payout.subject[l], [hi[l](first(name)), T.payout.body[l]], { label: T.payout.button[l], url: link }),
};
