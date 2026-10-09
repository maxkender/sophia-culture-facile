CREATE TABLE public.sidekick_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_id uuid,
  title text NOT NULL DEFAULT 'New chat',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.sidekick_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.sidekick_threads(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL DEFAULT '',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sidekick_threads, public.sidekick_messages TO authenticated;
GRANT ALL ON public.sidekick_threads, public.sidekick_messages TO service_role;
ALTER TABLE public.sidekick_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sidekick_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sidekick threads" ON public.sidekick_threads FOR ALL TO authenticated
  USING (private.is_admin() AND profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (private.is_admin() AND profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "own sidekick messages" ON public.sidekick_messages FOR ALL TO authenticated
  USING (thread_id IN (SELECT t.id FROM public.sidekick_threads t JOIN public.profiles p ON p.id = t.profile_id WHERE p.user_id = auth.uid()))
  WITH CHECK (thread_id IN (SELECT t.id FROM public.sidekick_threads t JOIN public.profiles p ON p.id = t.profile_id WHERE p.user_id = auth.uid()));

CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  reward_eur numeric NOT NULL DEFAULT 0,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','live','closed')),
  winner_post_id uuid REFERENCES public.creator_posts(id) ON DELETE SET NULL,
  winner_creator_id uuid REFERENCES public.creators(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage challenges" ON public.challenges FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creators see live challenges" ON public.challenges FOR SELECT TO authenticated USING (status IN ('live','closed') AND public.creator_enrolled(app_id));

CREATE TABLE public.creator_email_sequence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  step text NOT NULL CHECK (step IN ('j0','j2','j7')),
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creator_id, step)
);
GRANT SELECT ON public.creator_email_sequence TO authenticated;
GRANT ALL ON public.creator_email_sequence TO service_role;
ALTER TABLE public.creator_email_sequence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read sequence" ON public.creator_email_sequence FOR SELECT TO authenticated USING (private.is_admin());

CREATE OR REPLACE FUNCTION public.schedule_creator_sequence()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.track = 'ugc' AND NEW.social_account_created_at IS NULL THEN
    INSERT INTO public.creator_email_sequence (creator_id, step, scheduled_at) VALUES
      (NEW.id, 'j0', now()), (NEW.id, 'j2', now() + interval '2 days'), (NEW.id, 'j7', now() + interval '7 days')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER creators_schedule_sequence AFTER INSERT ON public.creators FOR EACH ROW EXECUTE FUNCTION public.schedule_creator_sequence();

CREATE TABLE public.reference_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001',
  platform text NOT NULL,
  url text,
  kind text NOT NULL CHECK (kind IN ('account','search','hashtag','format')),
  category text,
  title text NOT NULL,
  note text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reference_library TO authenticated;
GRANT ALL ON public.reference_library TO service_role;
ALTER TABLE public.reference_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage reference library" ON public.reference_library FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creators read reference library" ON public.reference_library FOR SELECT TO authenticated USING (public.creator_enrolled(app_id));

-- Public monthly leaderboard: only pseudonyms and totals leave the database.
CREATE OR REPLACE FUNCTION public.leaderboard_month(_app uuid DEFAULT '00000000-0000-4000-8000-000000000001')
RETURNS TABLE (rank bigint, creator_id uuid, pseudonym text, earnings numeric, views bigint, posts bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH agg AS (
    SELECT p.creator_id,
           coalesce(sum(coalesce(p.amount_usd,0) + coalesce(p.bonus_usd,0)),0) AS earnings,
           coalesce(sum(coalesce(p.views,0)),0)::bigint AS views,
           count(*)::bigint AS posts
    FROM public.creator_posts p
    WHERE p.status = 'approved' AND p.app_id = _app
      AND coalesce(p.posted_on, p.created_at::date) >= date_trunc('month', now())::date
    GROUP BY p.creator_id
  )
  SELECT row_number() OVER (ORDER BY a.earnings DESC, a.views DESC), a.creator_id,
         split_part(trim(c.full_name), ' ', 1) || CASE WHEN split_part(trim(c.full_name), ' ', 2) <> '' THEN ' ' || left(split_part(trim(c.full_name), ' ', 2), 1) || '.' ELSE '' END,
         a.earnings, a.views, a.posts
  FROM agg a JOIN public.creators c ON c.id = a.creator_id
  WHERE c.email NOT ILIKE '%test%'
  ORDER BY 1 LIMIT 50
$$;
REVOKE ALL ON FUNCTION public.leaderboard_month(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.leaderboard_month(uuid) TO anon, authenticated, service_role;
CREATE OR REPLACE VIEW public.leaderboard_month_public WITH (security_invoker = true) AS
  SELECT rank, pseudonym, earnings, views, posts FROM public.leaderboard_month();
GRANT SELECT ON public.leaderboard_month_public TO anon, authenticated;

GRANT SELECT ON public.ugc_tiers TO anon;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ugc_tiers' AND policyname='public reads tiers') THEN
    CREATE POLICY "public reads tiers" ON public.ugc_tiers FOR SELECT TO anon USING (true);
  END IF;
END $$;