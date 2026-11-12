// Poster emails are English regardless of the stored OS language.
import { sendBrevoEmail } from './brevo.server';
import type { ApplicantLang } from '@/config/countries';
import { unsubscribeUrl } from './slideshow-unsubscribe.server';
import { renderPosterEmail, type PosterEmailContent } from './slideshow-email-render';
import { signingSunday, startMondayAtSignature } from './slideshow-start';

export const POSTER_GUIDE_URL = 'https://star-water-a0e.notion.site/Vik-Studios-TikTok-Poster-Guide-3f4241308d6681f8ad41dc507f2c8505';
export const POSTER_EMAIL_LANG: ApplicantLang = 'en';
export const pickLang = (v: string | null | undefined): ApplicantLang => ['fr','en','es','it','pt','de'].includes(v ?? '') ? v as ApplicantLang : 'en';
const first = (name: string) => name.trim().split(/\s+/)[0] ?? name;
export function formatMonday(date: string, _lang: ApplicantLang = 'en') {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}
export function firstPaymentMonday(start: string) {
  const date = new Date(`${start}T12:00:00Z`); date.setUTCDate(date.getUTCDate()+7); return date.toISOString().slice(0,10);
}
export const formatSigningSunday = (monday: string) => formatMonday(signingSunday(monday));
const guide = (url: string | null | undefined) => !url || url.includes('app.notion.com') ? POSTER_GUIDE_URL : url;
const payment = (amount: number|null) => `How you get paid: through Ruul, a simple platform for freelancers. After you sign, we invite you to Ruul by email: accept the invitation and finish your Ruul account (2 minutes), then click "It's done" on your dashboard. Every Monday, you receive $${amount ?? '—'} for the week you posted (Monday to Sunday). Your first payment arrives the Monday after your first week of posting.`;
async function send(to: string, name: string, subject: string, content: PosterEmailContent) {
  const unsub = unsubscribeUrl(to);
  return sendBrevoEmail({ to, toName: name, subject, ...renderPosterEmail(content, unsub), headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
}
export const posterEmails = {
  ack: (to: string, name: string, _lang: ApplicantLang, kind: 'open'|'closed'|'neutral' = 'closed') => send(to,name,'Thanks for applying',{ paragraphs: [`Hi ${first(name)},`, kind === 'open' ? "Thanks! Your application is in. Your country is open: we're reviewing it and will get back to you here shortly." : kind === 'neutral' ? "Thanks! Your application is in. We review every application and will get back to you here." : "Thanks! We open places country by country, week after week. If your country opens, we'll write to you here."] }),
  accepted: (to: string, name: string, _lang: ApplicantLang, monday: string, link: string, amount: number|null, guideUrl: string|null, _slackUrl: string|null) => send(to,name,"You're accepted — sign your contract",{
    paragraphs: [`Hi ${first(name)},`, "Good news: you're accepted as a Sophia slideshow poster.", `Sign your contract and set everything up before Sunday ${formatSigningSunday(monday)}, midnight (Paris time) to start posting on Monday ${formatMonday(monday)}.`, 'How it works:'],
    bullets: ['You post 2 ready-made slideshows a day, 7 days a week, on a TikTok account we give you. Everything is prepared for you: slides, caption and music.', 'Before your first Monday, you create the TikTok account and warm it up (use TikTok normally, without posting).', payment(amount)],
    button: { label: 'Sign the contract', url: link }, after: [{ text: 'Read the Poster Guide before you sign:', url: guide(guideUrl) }],
  }),
  remindSignature: (to: string, name: string, link: string, storedMonday?: string|null) => {
    const monday = startMondayAtSignature(storedMonday ?? null);
    return send(to,name,'Your contract is waiting for your signature',{ paragraphs: [`Hi ${first(name)}, your contract is waiting for your signature. Sign it before Sunday ${formatSigningSunday(monday)}, midnight (Paris time) to start on Monday ${formatMonday(monday)}. It takes 2 minutes:`], after: [{ text: '', url: link }] });
  },
  rejected: (to: string, name: string, _lang: ApplicantLang, reason: string|null) => send(to,name,'Your application',{ paragraphs: [`Hi ${first(name)},`, "Thank you for applying. We can't take your application forward at the moment.", ...(reason ? [`Reason: ${reason}`] : [])] }),
  expired: (to: string, name: string, _lang: ApplicantLang) => send(to,name,'Your application',{ paragraphs: [`Hi ${first(name)},`, "We didn't open your country in the past weeks. Feel free to apply again later — thank you for your interest."] }),
  logins: (to: string, name: string, _lang: ApplicantLang, o: { osUrl: string; login: string; password: string; slack: string|null; monday: string; ruulEmail: string; weekly: number|null; guideUrl?: string|null }) => send(to,name,'Welcome to Vik Studios — your access',{
    paragraphs: [`Hi ${first(name)}, welcome to Vik Studios! Here is everything you need:`],
    access: [{ label: 'Your dashboard', value: o.osUrl, url: o.osUrl }, { label: 'Login', value: o.login }, { label: 'Password', value: o.password }, { label: 'Poster Guide', value: guide(o.guideUrl), url: guide(o.guideUrl) }, ...(o.slack ? [{ label: 'Slack', value: o.slack, url: o.slack }] : [])],
    checklist: { deadline: `Before Sunday ${formatSigningSunday(o.monday)}, midnight (Paris time):`, steps: ['Log in to your dashboard. Enter your first and last name exactly as on your ID, and the email you want to use for Ruul.', 'Create your TikTok account with the exact username shown on your dashboard.', 'Click "Start warmup", follow 5 accounts and use TikTok normally, without posting.', 'Join Slack with your full name (first and last name). Please never share amounts in channels.'], closing: [`Your first posts arrive on Monday ${formatMonday(o.monday)}.`, payment(o.weekly)] },
  }),
};
