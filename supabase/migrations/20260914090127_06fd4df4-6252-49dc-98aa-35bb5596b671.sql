ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS examples_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS guide_read_at timestamptz;