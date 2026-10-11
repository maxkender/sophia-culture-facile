ALTER TABLE public.briefs
  ADD COLUMN IF NOT EXISTS hook_text text,
  ADD COLUMN IF NOT EXISTS oral_hook text,
  ADD COLUMN IF NOT EXISTS beats jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS product_moment text,
  ADD COLUMN IF NOT EXISTS variations text,
  ADD COLUMN IF NOT EXISTS effort text CHECK (effort IN ('pov','reaction','talking_head')),
  ADD COLUMN IF NOT EXISTS parent_format_id uuid REFERENCES public.briefs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order int;
CREATE INDEX IF NOT EXISTS briefs_parent_format_idx ON public.briefs(parent_format_id);
ALTER TABLE public.ugc_tiers
  ADD COLUMN IF NOT EXISTS per_post_pov numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS per_post_reaction numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS per_post_talking_head numeric NOT NULL DEFAULT 0;
UPDATE public.ugc_tiers SET per_post_pov = 0.5, per_post_reaction = 1, per_post_talking_head = 2 WHERE tier = 'active';
UPDATE public.ugc_tiers SET per_post_pov = 1, per_post_reaction = 1.5, per_post_talking_head = 2.5 WHERE tier = 'pro';
ALTER TABLE public.creator_posts ADD COLUMN IF NOT EXISTS effort text CHECK (effort IN ('pov','reaction','talking_head'));
ALTER TABLE public.external_posts ADD COLUMN IF NOT EXISTS effort text CHECK (effort IN ('pov','reaction','talking_head'));
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS min_talking_head_per_month int NOT NULL DEFAULT 10;