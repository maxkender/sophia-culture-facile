import { escapeHtml } from './email-send.server';

export const POSTER_HELP_URL = 'https://sophia-marketing-orga.vercel.app';
export const POSTER_HELP_TEXT = `Questions or a problem? Click Help on your dashboard: ${POSTER_HELP_URL} — you'll get an answer there.`;

export type PosterEmailContent = {
  paragraphs: string[];
  bullets?: string[];
  access?: { label: string; value: string; url?: string }[];
  checklist?: { deadline: string; steps: string[]; closing: string[] };
  button?: { label: string; url: string };
  after?: { text: string; url?: string }[];
};
/** Poster-only layout: access block, one checklist, then short payment/support copy. */
export function renderPosterEmail(content: PosterEmailContent, unsubscribe: string) {
  const e = escapeHtml;
  const link = (url: string, label: string) => `<a href="${e(url)}" style="color:#1f3a5f;overflow-wrap:anywhere">${e(label)}</a>`;
  const p = (text: string) => `<p style="margin:0 0 16px">${e(text)}</p>`;
  const access = content.access?.map(a => `<div style="margin:0 0 8px"><strong>${e(a.label)}:</strong> ${a.url ? link(a.url, a.value) : e(a.value)}</div>`).join('') ?? '';
  const checklist = content.checklist;
  const help = `<p>Questions or a problem? Click Help on your dashboard: ${link(POSTER_HELP_URL, POSTER_HELP_URL)} — you'll get an answer there.</p>`;
  const html = `<!doctype html><html lang="en"><body style="margin:0;background:#f5f5f2"><main style="max-width:560px;margin:auto;padding:28px 24px;font:15px/1.6 Arial,sans-serif;color:#1a1a1a;overflow-wrap:anywhere"><h1 style="font-size:20px;margin:0 0 24px">Vik Studios</h1>${content.paragraphs.map(p).join('')}${access ? `<section style="background:#ffffff;border:1px solid #dddddd;border-radius:6px;padding:16px;margin-bottom:24px">${access}</section>` : ''}${content.bullets ? `<ul style="padding-left:22px">${content.bullets.map(b => `<li style="margin-bottom:12px">${e(b)}</li>`).join('')}</ul>` : ''}${checklist ? `<h2 style="font-size:17px">${e(checklist.deadline)}</h2><ol style="padding-left:22px">${checklist.steps.map(s => `<li style="margin-bottom:12px">${e(s)}</li>`).join('')}</ol>${checklist.closing.map(p).join('')}` : ''}${content.button ? `<p style="margin:24px 0"><a href="${e(content.button.url)}" style="display:inline-block;background:#1f3a5f;color:#ffffff;padding:12px 24px;border-radius:6px;font-weight:600;text-decoration:none">${e(content.button.label)}</a></p>` : ''}${(content.after ?? []).map(a => `<p>${e(a.text)}${a.url ? ' ' + link(a.url, a.url) : ''}</p>`).join('')}<footer style="font-size:12px;margin-top:24px">${help}Vik Studios · support@vikstudios.com<br>You can also reply STOP. ${link(unsubscribe, 'Unsubscribe')}</footer></main></body></html>`;
  const text = [...content.paragraphs, ...(content.access ?? []).map(a => `${a.label}: ${a.value}`), ...(content.bullets ?? []).map(b => `• ${b}`), ...(checklist ? [checklist.deadline, ...checklist.steps.map((s,i) => `${i+1}. ${s}`), ...checklist.closing] : []), ...(content.button ? [`${content.button.label}: ${content.button.url}`] : []), ...(content.after ?? []).map(a => `${a.text}${a.url ? ' ' + a.url : ''}`), POSTER_HELP_TEXT, `Vik Studios · support@vikstudios.com\nYou can also reply STOP. Unsubscribe: ${unsubscribe}`].join('\n\n');
  return { html, text };
}
