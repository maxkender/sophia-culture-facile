import type { BrevoResult } from './brevo.server';

/** Atomic merge: concurrent lifecycle writes must not overwrite email audit events. */
export async function recordPosterEmail(email: string, subject: string, result: BrevoResult) {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const event = { at: new Date().toISOString(), by: 'Brevo', subject, sent: result.sent, messageId: result.messageId ?? null, reason: result.reason ?? null };
    const { error } = await supabaseAdmin.rpc('record_slideshow_email_result', {
      p_email: email, p_key: `email_${crypto.randomUUID().replace(/-/g, '_')}`, p_event: event,
    });
    if (error) console.error('[poster-email] timeline write failed', { reason: error.message });
  } catch (error) {
    console.error('[poster-email] timeline write failed', { reason: error instanceof Error ? error.message : 'unknown_error' });
  }
}