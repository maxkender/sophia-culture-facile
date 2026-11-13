import { beforeEach, expect, it, vi } from 'vitest';
const rpc = vi.hoisted(() => vi.fn(async (_name: string, _args: { p_key: string; p_email: string; p_event: unknown }) => ({ error: null })));
vi.mock('@/integrations/supabase/client.server', () => ({ supabaseAdmin: { rpc } }));
import { recordPosterEmail } from './slideshow-email-audit.server';
beforeEach(() => rpc.mockClear());
it('records the Brevo message ID for a successful creator send', async () => {
  await recordPosterEmail('creator@example.invalid', 'Acceptance', { sent: true, messageId: '<accepted-id>' });
  expect(rpc).toHaveBeenCalledWith('record_slideshow_email_result', expect.objectContaining({ p_email: 'creator@example.invalid', p_event: expect.objectContaining({ sent: true, messageId: '<accepted-id>', reason: null }) }));
});
it('records failure and provider reason for a refused creator send', async () => {
  await recordPosterEmail('creator@example.invalid', 'Acceptance', { sent: false, reason: 'brevo_402: credits exhausted' });
  expect(rpc).toHaveBeenCalledWith('record_slideshow_email_result', expect.objectContaining({ p_event: expect.objectContaining({ sent: false, messageId: null, reason: 'brevo_402: credits exhausted' }) }));
});
it('uses a distinct timeline key for each send instead of overwriting earlier results', async () => {
  await recordPosterEmail('creator@example.invalid', 'Reminder', { sent: true });
  await recordPosterEmail('creator@example.invalid', 'Reminder', { sent: true });
  expect(rpc.mock.calls[0]?.[1]?.p_key).not.toBe(rpc.mock.calls[1]?.[1]?.p_key);
});