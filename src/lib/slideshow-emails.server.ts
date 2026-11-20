// Poster emails use the language of the applicant's country, English fallback.
import { sendBrevoEmail } from './brevo.server';
import type { ApplicantLang } from '@/config/countries';
import { unsubscribeUrl } from './slideshow-unsubscribe.server';
import { renderPosterEmail, type PosterEmailContent } from './slideshow-email-render';
import { signingSunday, startMondayAtSignature } from './slideshow-start';
import { recordPosterEmail } from './slideshow-email-audit.server';

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
import { fill, formatPosterDate, posterDict, posterLangFor, type PosterLang } from './slideshow-email-i18n';
type L = { lang: PosterLang; t: (k: keyof ReturnType<typeof posterDict>, v?: Record<string, string>) => string; date: (d: string) => string };
const loc = (country: string | null | undefined): L => {
  const lang = posterLangFor(country); const d = posterDict(lang);
  return { lang, t: (k, v = {}) => fill(d[k], v), date: (x) => formatPosterDate(x, lang) };
};
const payment = (l: L, amount: number|null) => l.t('pay', { amount: `$${amount ?? '—'}` });
async function send(l: L, to: string, name: string, subject: string, content: PosterEmailContent) {
  const unsub = unsubscribeUrl(to);
  const result = await sendBrevoEmail({ to, toName: name, subject, ...renderPosterEmail(content, unsub, { lang: l.lang, help: l.t('help', { url: '{url}' }), stop: l.t('stop'), unsub: l.t('unsub') }), headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
  await recordPosterEmail(to, subject, result);
  return result;
}
type Country = string | null | undefined;
/** Each email is written in the language of the applicant's country (see slideshow-email-i18n.ts). */
export const posterEmails = {
  ack: (to: string, name: string, _lang: ApplicantLang, kind: 'open'|'closed'|'neutral' = 'closed', country?: Country) => { const l = loc(country); return send(l,to,name,l.t('ackSubject'),{ paragraphs: [l.t('greet',{name:first(name)}), l.t(kind === 'open' ? 'ackOpen' : kind === 'neutral' ? 'ackNeutral' : 'ackClosed')] }); },
  accepted: (to: string, name: string, _lang: ApplicantLang, monday: string, link: string, amount: number|null, guideUrl: string|null, _slackUrl: string|null, country?: Country) => { const l = loc(country); return send(l,to,name,l.t('accSubject'),{
    paragraphs: [l.t('greet',{name:first(name)}), l.t('accGood'), l.t('accSign',{sunday:l.date(signingSunday(monday)),monday:l.date(monday)}), l.t('accHow')],
    bullets: [l.t('accB1'), l.t('accB2'), payment(l, amount)],
    button: { label: l.t('accButton'), url: link }, after: [{ text: l.t('accGuide'), url: guide(guideUrl) }],
  }); },
  remindSignature: (to: string, name: string, link: string, storedMonday?: string|null, country?: Country) => {
    const l = loc(country); const monday = startMondayAtSignature(storedMonday ?? null);
    return send(l,to,name,l.t('remSubject'),{ paragraphs: [l.t('remBody',{name:first(name),sunday:l.date(signingSunday(monday)),monday:l.date(monday)})], after: [{ text: '', url: link }] });
  },
  rejected: (to: string, name: string, _lang: ApplicantLang, reason: string|null, country?: Country) => { const l = loc(country); return send(l,to,name,l.t('rejSubject'),{ paragraphs: [l.t('greet',{name:first(name)}), l.t('rejBody'), ...(reason ? [l.t('rejReason',{reason})] : [])] }); },
  expired: (to: string, name: string, _lang: ApplicantLang, country?: Country) => { const l = loc(country); return send(l,to,name,l.t('rejSubject'),{ paragraphs: [l.t('greet',{name:first(name)}), l.t('expBody')] }); },
  logins: (to: string, name: string, _lang: ApplicantLang, o: { osUrl: string; login: string; password: string; slack: string|null; monday: string; ruulEmail: string; weekly: number|null; guideUrl?: string|null; country?: Country }) => { const l = loc(o.country); return send(l,to,name,l.t('logSubject'),{
    paragraphs: [l.t('logIntro',{name:first(name)})],
    access: [{ label: l.t('lDash'), value: o.osUrl, url: o.osUrl }, { label: l.t('lLogin'), value: o.login }, { label: l.t('lPass'), value: o.password }, { label: l.t('lGuide'), value: guide(o.guideUrl), url: guide(o.guideUrl) }, ...(o.slack ? [{ label: 'Slack', value: o.slack, url: o.slack }] : [])],
    checklist: { deadline: l.t('lDeadline',{sunday:l.date(signingSunday(o.monday))}), steps: [l.t('s1'), l.t('s2'), l.t('s3'), l.t('s4')], closing: [l.t('lHelp'), l.t('lFirst',{monday:l.date(o.monday)}), payment(l, o.weekly)] },
  }); },
};
