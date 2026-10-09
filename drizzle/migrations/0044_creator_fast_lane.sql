ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS fast_lane boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS starting_tier text,
  ADD COLUMN IF NOT EXISTS welcome_bonus numeric,
  ADD COLUMN IF NOT EXISTS fast_lane_token text,
  ADD COLUMN IF NOT EXISTS fast_lane_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS fast_lane_job_id uuid,
  ADD COLUMN IF NOT EXISTS fast_lane_app_id uuid,
  ADD COLUMN IF NOT EXISTS fast_lane_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS fast_lane_opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS fast_lane_entered_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS creators_fast_lane_token_key ON public.creators (fast_lane_token) WHERE fast_lane_token IS NOT NULL;
ALTER TABLE public.creators ADD CONSTRAINT creators_starting_tier_chk CHECK (starting_tier IS NULL OR starting_tier IN ('trial','active','pro')) NOT VALID;