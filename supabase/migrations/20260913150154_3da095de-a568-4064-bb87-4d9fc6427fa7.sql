ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ;
UPDATE public.profiles SET invite_expires_at = COALESCE(invited_at, now()) + interval '30 days' WHERE invite_token IS NOT NULL AND invite_expires_at IS NULL;
CREATE INDEX IF NOT EXISTS profiles_invite_token_idx ON public.profiles (invite_token) WHERE invite_token IS NOT NULL;