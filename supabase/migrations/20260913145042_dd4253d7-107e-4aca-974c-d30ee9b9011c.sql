ALTER TABLE public.access_codes ADD COLUMN IF NOT EXISTS platform public.device_platform NOT NULL DEFAULT 'ios';
UPDATE public.access_codes SET platform = 'android' WHERE code ILIKE '%AND%';
CREATE INDEX IF NOT EXISTS access_codes_state_platform_idx ON public.access_codes (state, platform);