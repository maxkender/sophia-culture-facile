CREATE TABLE public.ugc_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.apps(id),
  tier text NOT NULL CHECK (tier IN ('trial','active','pro')),
  label text NOT NULL,
  per_post numeric NOT NULL DEFAULT 0,
  cpm numeric NOT NULL DEFAULT 0,
  monthly_cap numeric NOT NULL DEFAULT 0,
  rule text NOT NULL DEFAULT '',
  UNIQUE (app_id, tier)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ugc_tiers TO authenticated;
GRANT ALL ON public.ugc_tiers TO service_role;
ALTER TABLE public.ugc_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage tiers" ON public.ugc_tiers FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "signed-in read tiers" ON public.ugc_tiers FOR SELECT TO authenticated USING (true);
INSERT INTO public.ugc_tiers (app_id, tier, label, per_post, cpm, monthly_cap, rule)
SELECT a.id, t.tier, t.label, t.pp, t.cpm, t.cap, t.rule FROM public.apps a CROSS JOIN (VALUES
 ('trial','Trial',0,2,100,'Days 1-14'),
 ('active','Active',1,2,150,'20+ approved posts in the last 30 days'),
 ('pro','Pro',2,2.5,200,'Top 10% views last month')) AS t(tier,label,pp,cpm,cap,rule);

ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS tier_since timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS tier_locked boolean NOT NULL DEFAULT false;

CREATE TABLE public.awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  kind text NOT NULL,
  period text NOT NULL DEFAULT '',
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creator_id, kind, period)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.awards TO authenticated;
GRANT ALL ON public.awards TO service_role;
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage awards" ON public.awards FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creator reads own awards" ON public.awards FOR SELECT TO authenticated USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

ALTER TABLE public.ugc_settings
  ADD COLUMN IF NOT EXISTS monthly_budget_cap numeric,
  ADD COLUMN IF NOT EXISTS hold_days int NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS min_payout numeric NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS ad_selection_bonus numeric NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS cpi_target numeric NOT NULL DEFAULT 1.5,
  ADD COLUMN IF NOT EXISTS ten_post_bonus numeric NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS streak7_bonus numeric NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS streak30_bonus numeric NOT NULL DEFAULT 50;

CREATE TABLE public.ad_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.apps(id),
  channel text NOT NULL CHECK (channel IN ('meta','tiktok')),
  account_id text,
  connected_at timestamptz,
  UNIQUE (app_id, channel)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_connections TO authenticated;
GRANT ALL ON public.ad_connections TO service_role;
ALTER TABLE public.ad_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage ad connections" ON public.ad_connections FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TABLE public.ad_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.creator_posts(id) ON DELETE CASCADE,
  app_id uuid NOT NULL,
  creator_id uuid,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','ready','pushed','live','paused','ended')),
  channel text NOT NULL DEFAULT 'tiktok' CHECK (channel IN ('tiktok','meta')),
  objective text NOT NULL DEFAULT 'app_installs',
  daily_budget numeric, duration_days int, country text NOT NULL DEFAULT 'FR',
  cta text NOT NULL DEFAULT 'Download', landing_url text, notes text,
  caption text, hook text,
  spark_code text, spark_valid_until date, raw_file_path text,
  external_ids jsonb NOT NULL DEFAULT '{}',
  started_at date, ended_at date,
  winner boolean NOT NULL DEFAULT false,
  bonus_paid_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_candidates TO authenticated;
GRANT ALL ON public.ad_candidates TO service_role;
ALTER TABLE public.ad_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage ad candidates" ON public.ad_candidates FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE TRIGGER ad_candidates_updated BEFORE UPDATE ON public.ad_candidates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.ad_metrics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.ad_candidates(id) ON DELETE CASCADE,
  day date NOT NULL,
  spend numeric NOT NULL DEFAULT 0, impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0, installs bigint NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'manual',
  UNIQUE (ad_id, day)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_metrics_daily TO authenticated;
GRANT ALL ON public.ad_metrics_daily TO service_role;
ALTER TABLE public.ad_metrics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage ad metrics" ON public.ad_metrics_daily FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TABLE public.creator_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  ad_candidate_id uuid REFERENCES public.ad_candidates(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('spark_code','raw_upload','other')),
  title text NOT NULL,
  instructions text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','done','cancelled')),
  response text, file_path text, valid_until date,
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_tasks TO authenticated;
GRANT ALL ON public.creator_tasks TO service_role;
ALTER TABLE public.creator_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage tasks" ON public.creator_tasks FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creator reads own tasks" ON public.creator_tasks FOR SELECT TO authenticated USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

CREATE POLICY "creators read feed jobs" ON public.jobs FOR SELECT TO authenticated USING (status = 'active' AND access = 'job_feed');