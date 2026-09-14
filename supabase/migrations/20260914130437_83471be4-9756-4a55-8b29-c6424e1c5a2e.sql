ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS declaration_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS declaration_ip text,
  ADD COLUMN IF NOT EXISTS declaration_user_agent text,
  ADD COLUMN IF NOT EXISTS declaration_snapshot jsonb;