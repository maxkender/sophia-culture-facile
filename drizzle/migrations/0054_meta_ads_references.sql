ALTER TABLE public.reference_videos
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS advertiser text,
  ADD COLUMN IF NOT EXISTS ad_id text,
  ADD COLUMN IF NOT EXISTS ad_start_date date,
  ADD COLUMN IF NOT EXISTS ad_end_date date,
  ADD COLUMN IF NOT EXISTS ad_platforms text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS landing_url text,
  ADD COLUMN IF NOT EXISTS ad_copy text;
ALTER TABLE public.sync_runs ADD COLUMN IF NOT EXISTS meta jsonb;