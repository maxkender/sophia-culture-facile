ALTER TABLE public.ugc_tiers ADD COLUMN IF NOT EXISTS cap_per_post numeric NOT NULL DEFAULT 0;
UPDATE public.ugc_tiers SET cap_per_post = monthly_cap;
COMMENT ON COLUMN public.ugc_tiers.monthly_cap IS 'DEPRECATED: replaced by cap_per_post (the tier cap applies to each post, not the month)';
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS per_post_override numeric;
COMMENT ON COLUMN public.creators.cap_override IS 'Per-post views bonus cap override (tier model) / per-video cap (rate card model)';