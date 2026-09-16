ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS used_invite_token text;
CREATE INDEX IF NOT EXISTS profiles_used_invite_token_idx ON public.profiles (used_invite_token);