ALTER TABLE public.creators ALTER COLUMN weekly_target SET DEFAULT 5;
UPDATE public.creators SET weekly_target = 5 WHERE track = 'ugc' AND weekly_target = 3;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS rules_accepted_at timestamptz;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS rules_version integer;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS setup_guide_checks jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS warmup jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS photo_path text;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS access_code text;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS access_redeem_url text;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS platform text;
ALTER TABLE public.access_codes ADD COLUMN IF NOT EXISTS assigned_creator_id uuid REFERENCES public.creators(id) ON DELETE SET NULL;

ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS app text NOT NULL DEFAULT 'Sophia';
ALTER TABLE public.creator_posts ADD COLUMN IF NOT EXISTS bonus_usd numeric;
ALTER TABLE public.creator_messages ADD COLUMN IF NOT EXISTS post_id uuid REFERENCES public.creator_posts(id) ON DELETE CASCADE;
ALTER TABLE public.creator_call_rsvps ADD COLUMN IF NOT EXISTS attended boolean;

CREATE TABLE public.creator_social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL UNIQUE REFERENCES public.creators(id) ON DELETE CASCADE,
  handle text NOT NULL,
  account_email text NOT NULL,
  password_encrypted text NOT NULL,
  phone text,
  device text,
  registered_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.creator_social_accounts TO service_role;
ALTER TABLE public.creator_social_accounts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.creator_social_accounts FROM anon, authenticated;

CREATE TABLE public.brief_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id uuid NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  seen_at timestamptz NOT NULL DEFAULT now(),
  skipped_at timestamptz,
  skip_reason text,
  UNIQUE (brief_id, creator_id)
);
GRANT SELECT, INSERT ON public.brief_reads TO authenticated;
GRANT ALL ON public.brief_reads TO service_role;
ALTER TABLE public.brief_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read brief reads" ON public.brief_reads FOR SELECT TO authenticated USING (private.is_admin());
CREATE POLICY "creator reads own brief reads" ON public.brief_reads FOR SELECT TO authenticated
  USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));
CREATE POLICY "creator marks brief seen" ON public.brief_reads FOR INSERT TO authenticated
  WITH CHECK (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()) AND skipped_at IS NULL);

DROP POLICY IF EXISTS "creator manages own rsvp" ON public.creator_call_rsvps;
CREATE POLICY "creator manages own rsvp" ON public.creator_call_rsvps FOR ALL TO authenticated
  USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()))
  WITH CHECK (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()) AND answer IN ('yes','no','maybe') AND attended IS NULL);