import { z } from "zod";

export const normalizeWhatsapp = (value: string) => value.replace(/\s/g, "");
export const isValidWhatsapp = (value: string) => /^\+[1-9]\d{6,14}$/.test(normalizeWhatsapp(value));

export const optionalWhatsappSchema = z.string().max(100).transform(normalizeWhatsapp)
  .refine((value) => value === "" || isValidWhatsapp(value), "Enter a WhatsApp number in international format, for example +33612345678.")
  .optional();

export function whatsappInsertFields(number: string | undefined, optedIn: boolean | undefined, now = new Date()) {
  const normalized = number ? normalizeWhatsapp(number) : "";
  const whatsapp_e164 = normalized && isValidWhatsapp(normalized) ? normalized : null;
  const whatsapp_optin = whatsapp_e164 !== null && optedIn === true;
  return { whatsapp_e164, whatsapp_optin, whatsapp_optin_at: whatsapp_optin ? now.toISOString() : null };
}