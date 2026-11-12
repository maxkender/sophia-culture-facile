import { describe, expect, it, vi } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
const calls: { html: string; text: string; subject: string; to: string }[] = [];
vi.mock('./brevo.server', () => ({ sendBrevoEmail: vi.fn(async (o) => { calls.push(o); return { sent: true }; }) }));
import { firstPaymentMonday, posterEmails } from './slideshow-emails.server';
import { nextStartMonday, signingSaturday, startMondayAtSignature } from './slideshow-start';

describe('Saturday 20:00 Europe/Paris cutoff', () => {
  it.each([
    ['2026-11-14T18:59:59Z','2026-11-16'],
    ['2026-11-14T19:00:00Z','2026-11-16'],
    ['2026-11-14T19:00:00.001Z','2026-11-23'],
    ['2026-11-14T19:00:01Z','2026-11-23'],
    ['2026-11-15T09:00:00Z','2026-11-23'],
    ['2026-07-11T18:00:00Z','2026-07-13'],
    ['2026-07-11T18:00:01Z','2026-07-20'],
    ['2026-10-24T18:00:00Z','2026-10-26'],
    ['2026-10-24T18:00:01Z','2026-11-02'],
  ])('%s allows Monday %s', (now,monday) => expect(nextStartMonday(new Date(now))).toBe(monday));
  it('keeps a later stored start Monday', () => expect(startMondayAtSignature('2026-11-30',new Date('2026-11-14T19:00:00Z'))).toBe('2026-11-30'));
  it('deadline is the Saturday immediately before Monday', () => expect(signingSaturday('2026-11-16')).toBe('2026-11-14'));
  it.each([['2026-11-16','2026-11-23'],['2026-12-28','2027-01-04']])('first payment is seven days after %s', (start,pay) => expect(firstPaymentMonday(start)).toBe(pay));
});

// Owner-requested HTML/text test renders; transport is mocked, no real emails or passwords.
it('renders accepted, reminder and logins for preview review without sending', async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-10T18:37:00Z'));
  calls.length = 0;
  await posterEmails.accepted('demo@example.invalid','Ana Demo','es','2026-11-16','https://vik-studios-creators.com/creators/sign/preview-not-a-real-token',14,null,null);
  await posterEmails.remindSignature('demo@example.invalid','Ana Demo','https://vik-studios-creators.com/creators/sign/preview-not-a-real-token','2026-11-16');
  await posterEmails.logins('demo@example.invalid','Ana Demo','es',{osUrl:'https://dashboard.example.invalid',login:'demo@example.invalid',password:'DEMO — not a real password',slack:'https://join.slack.com/example-preview',monday:'2026-11-16',ruulEmail:'demo@example.invalid',weekly:14});
  mkdirSync('/tmp/poster-email-renders',{recursive:true});
  calls.forEach((m,i) => { const slug=['accepted','signature-reminder','logins'][i]; writeFileSync(`/tmp/poster-email-renders/${slug}.html`,m.html);writeFileSync(`/tmp/poster-email-renders/${slug}.txt`,`${m.subject}\n\n${m.text}`); });
  expect(calls).toHaveLength(3);
  await posterEmails.ack('demo@example.invalid','Ana Demo','es','open');
  await posterEmails.ack('demo@example.invalid','Ana Demo','tr' as never,'closed');
  await posterEmails.ack('demo@example.invalid','Ana Demo','fr','neutral');
  await posterEmails.rejected('demo@example.invalid','Ana Demo','es',null);
  await posterEmails.expired('demo@example.invalid','Ana Demo','fr');
  calls.slice(3).forEach((m,i) => { const slug=['application-open','application-closed','application-neutral','rejected','expired'][i]; writeFileSync(`/tmp/poster-email-renders/${slug}.html`,m.html);writeFileSync(`/tmp/poster-email-renders/${slug}.txt`,`${m.subject}\n\n${m.text}`); });
  vi.useRealTimers();
});
