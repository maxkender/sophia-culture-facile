-- A/B application source + email log
ALTER TABLE public.creator_applications
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS welcome_email_provider text,
  ADD COLUMN IF NOT EXISTS welcome_email_message_id text,
  ADD COLUMN IF NOT EXISTS welcome_email_error text,
  ADD COLUMN IF NOT EXISTS decline_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS decline_email_message_id text;

-- C/D per-creator settings
ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS posts_per_month integer,
  ADD COLUMN IF NOT EXISTS required_platforms text NOT NULL DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS ugc_status text NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS fixed_monthly_override numeric,
  ADD COLUMN IF NOT EXISTS rpm_override numeric,
  ADD COLUMN IF NOT EXISTS cap_override numeric,
  ADD COLUMN IF NOT EXISTS tiktok_handle text,
  ADD COLUMN IF NOT EXISTS instagram_handle text,
  ADD COLUMN IF NOT EXISTS accounts_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean,
  ADD COLUMN IF NOT EXISTS resign_required_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS sync_status text,
  ADD COLUMN IF NOT EXISTS sync_error text,
  ADD COLUMN IF NOT EXISTS sync_checked_at timestamptz;
ALTER TABLE public.creators ADD CONSTRAINT creators_required_platforms_chk CHECK (required_platforms IN ('tiktok','instagram','both')) NOT VALID;
ALTER TABLE public.creators ADD CONSTRAINT creators_ugc_status_chk CHECK (ugc_status IN ('trial','active','paused','ended')) NOT VALID;

-- G rate card + settings
CREATE TABLE public.ugc_rate_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001',
  fixed_monthly numeric NOT NULL DEFAULT 100,
  rpm_eur_per_1000 numeric NOT NULL DEFAULT 1,
  cap_per_video numeric NOT NULL DEFAULT 300,
  prorate_fixed_by_quota boolean NOT NULL DEFAULT true,
  currency text NOT NULL DEFAULT 'EUR',
  effective_from date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ugc_rate_cards TO authenticated;
GRANT ALL ON public.ugc_rate_cards TO service_role;
ALTER TABLE public.ugc_rate_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage ugc rate cards" ON public.ugc_rate_cards FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
INSERT INTO public.ugc_rate_cards (effective_from) VALUES ('2026-01-01');

CREATE TABLE public.ugc_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_posts_per_month integer NOT NULL DEFAULT 20,
  payday_day integer NOT NULL DEFAULT 5,
  apify_tiktok_actor text NOT NULL DEFAULT 'clockworks~tiktok-profile-scraper',
  apify_instagram_actor text NOT NULL DEFAULT 'apify~instagram-profile-scraper',
  apify_price_per_result_usd numeric NOT NULL DEFAULT 0.0003,
  posts_per_profile_call integer NOT NULL DEFAULT 30,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.ugc_settings TO authenticated;
GRANT ALL ON public.ugc_settings TO service_role;
ALTER TABLE public.ugc_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage ugc settings" ON public.ugc_settings FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
INSERT INTO public.ugc_settings (id) VALUES (1);

-- F external posts + sync runs
CREATE TABLE public.external_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('tiktok','instagram')),
  external_id text NOT NULL,
  url text,
  posted_at timestamptz,
  caption text,
  cover_url text,
  duration numeric,
  views bigint, likes bigint, comments bigint, shares bigint,
  views_7d bigint, likes_7d bigint, comments_7d bigint, shares_7d bigint, views_7d_at timestamptz,
  views_30d bigint, views_30d_at timestamptz,
  views_7d_source text,
  manual_views_7d bigint, manual_screenshot_path text, manual_submitted_at timestamptz, manual_accepted_at timestamptz,
  logged_post_id uuid REFERENCES public.creator_posts(id) ON DELETE SET NULL,
  brief_id uuid REFERENCES public.briefs(id) ON DELETE SET NULL,
  excluded boolean NOT NULL DEFAULT false,
  exclude_reason text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, external_id)
);
CREATE INDEX external_posts_creator_idx ON public.external_posts (creator_id, posted_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.external_posts TO authenticated;
GRANT ALL ON public.external_posts TO service_role;
ALTER TABLE public.external_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage external posts" ON public.external_posts FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creators read own external posts" ON public.external_posts FOR SELECT TO authenticated USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

CREATE TABLE public.sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job text NOT NULL,
  creator_id uuid REFERENCES public.creators(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'running',
  items integer NOT NULL DEFAULT 0,
  cost_usd numeric NOT NULL DEFAULT 0,
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
GRANT SELECT ON public.sync_runs TO authenticated;
GRANT ALL ON public.sync_runs TO service_role;
ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read sync runs" ON public.sync_runs FOR SELECT TO authenticated USING (private.is_admin());

-- G payout lines in EUR with breakdown
ALTER TABLE public.payout_items
  ADD COLUMN IF NOT EXISTS period text,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS amount numeric,
  ADD COLUMN IF NOT EXISTS fixed_part numeric,
  ADD COLUMN IF NOT EXISTS bonus_part numeric,
  ADD COLUMN IF NOT EXISTS adjustments_part numeric,
  ADD COLUMN IF NOT EXISTS hold_reason text,
  ADD COLUMN IF NOT EXISTS breakdown jsonb;

CREATE TABLE public.payout_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  period text NOT NULL,
  amount numeric NOT NULL,
  reason text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payout_adjustments TO authenticated;
GRANT ALL ON public.payout_adjustments TO service_role;
ALTER TABLE public.payout_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage adjustments" ON public.payout_adjustments FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creators read own adjustments" ON public.payout_adjustments FOR SELECT TO authenticated USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

-- I briefs extended + planner assignments
ALTER TABLE public.briefs
  ADD COLUMN IF NOT EXISTS angle text,
  ADD COLUMN IF NOT EXISTS script text,
  ADD COLUMN IF NOT EXISTS brief_type text NOT NULL DEFAULT 'precise',
  ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS format text,
  ADD COLUMN IF NOT EXISTS duration_target text,
  ADD COLUMN IF NOT EXISTS must_mention text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS difficulty integer NOT NULL DEFAULT 1;

ALTER TABLE public.brief_assignments
  ADD COLUMN IF NOT EXISTS target_date date,
  ADD COLUMN IF NOT EXISTS week_start date,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS declined_at timestamptz,
  ADD COLUMN IF NOT EXISTS decline_reason text,
  ADD COLUMN IF NOT EXISTS replacement_brief_id uuid REFERENCES public.briefs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS replaces_assignment_id uuid REFERENCES public.brief_assignments(id) ON DELETE SET NULL;
UPDATE public.brief_assignments SET published_at = created_at WHERE published_at IS NULL;

-- planner rows stay hidden from creators until the week is published
DROP POLICY IF EXISTS "creator reads own assignments" ON public.brief_assignments;
CREATE POLICY "creator reads own published assignments" ON public.brief_assignments FOR SELECT TO authenticated
  USING (published_at IS NOT NULL AND creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "creators read published briefs" ON public.briefs;
CREATE POLICY "creators read published briefs" ON public.briefs FOR SELECT TO authenticated USING (
  status = 'published' AND creator_enrolled(app_id)
  AND EXISTS (SELECT 1 FROM public.creators c JOIN public.creator_signatures s ON s.creator_id = c.id WHERE c.user_id = auth.uid())
  AND (audience = 'all' OR EXISTS (SELECT 1 FROM public.brief_assignments a JOIN public.creators c ON c.id = a.creator_id
        WHERE a.brief_id = briefs.id AND a.published_at IS NOT NULL AND c.user_id = auth.uid())));

-- J access code batches
ALTER TABLE public.access_codes ADD COLUMN IF NOT EXISTS batch_label text;