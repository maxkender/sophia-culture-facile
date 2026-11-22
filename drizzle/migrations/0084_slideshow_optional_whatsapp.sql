ALTER TABLE public.slideshow_applications ADD COLUMN IF NOT EXISTS whatsapp_e164 text;
ALTER TABLE public.slideshow_applications ADD COLUMN IF NOT EXISTS whatsapp_optin boolean DEFAULT false;
ALTER TABLE public.slideshow_applications ADD COLUMN IF NOT EXISTS whatsapp_optin_at timestamptz;