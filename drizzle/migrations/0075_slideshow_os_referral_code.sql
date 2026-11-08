ALTER TABLE public.slideshow_applications ADD COLUMN IF NOT EXISTS ref text;
ALTER TABLE public.slideshow_applications ADD CONSTRAINT slideshow_ref_code_format CHECK (ref IS NULL OR ref ~ '^[A-Za-z0-9_-]{1,120}$') NOT VALID;
COMMENT ON COLUMN public.slideshow_applications.ref IS 'Sophia OS referral code captured from recruiting links; separate from referral_name and referral_source.';