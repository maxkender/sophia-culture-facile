ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS terms_visible boolean NOT NULL DEFAULT false;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS terms_text_fr text;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS terms_text_en text;
INSERT INTO public.creator_apps (creator_id, app_id, status)
SELECT c.id, a.id, 'active' FROM public.creators c CROSS JOIN public.apps a
WHERE c.track = 'ugc' AND a.active AND c.status IN ('active','onboarding','trial')
ON CONFLICT (creator_id, app_id) DO UPDATE SET status = 'active';