ALTER TABLE public.creator_posts ADD COLUMN IF NOT EXISTS fraud_flags text[] NOT NULL DEFAULT '{}', ADD COLUMN IF NOT EXISTS hold_reason text, ADD COLUMN IF NOT EXISTS external_id text, ADD COLUMN IF NOT EXISTS auto_detected boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS queued_period text, ADD COLUMN IF NOT EXISTS format text, ADD COLUMN IF NOT EXISTS comments integer, ADD COLUMN IF NOT EXISTS shares integer, ADD COLUMN IF NOT EXISTS caption text;
CREATE UNIQUE INDEX IF NOT EXISTS creator_posts_platform_external ON public.creator_posts(platform, external_id) WHERE external_id IS NOT NULL;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS dormant_at timestamptz, ADD COLUMN IF NOT EXISTS last_post_at timestamptz, ADD COLUMN IF NOT EXISTS dormancy_reminders jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.creator_applications ADD COLUMN IF NOT EXISTS ref_handle text;
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS hooks text[] NOT NULL DEFAULT '{}', ADD COLUMN IF NOT EXISTS source_course_id uuid, ADD COLUMN IF NOT EXISTS drop_at timestamptz;
ALTER TABLE public.reference_videos ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}', ADD COLUMN IF NOT EXISTS is_winner boolean NOT NULL DEFAULT false;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS closed_by_budget boolean NOT NULL DEFAULT false;

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  referee_creator_id uuid NOT NULL UNIQUE REFERENCES public.creators(id) ON DELETE CASCADE,
  ref_handle text NOT NULL,
  rate numeric NOT NULL DEFAULT 0.10,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL DEFAULT now() + interval '60 days',
  earned numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage referrals" ON public.referrals FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "Referrers read own" ON public.referrals FOR SELECT TO authenticated USING (referrer_creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

CREATE TABLE public.go_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handle text NOT NULL,
  creator_id uuid REFERENCES public.creators(id) ON DELETE SET NULL,
  app_id uuid,
  device text NOT NULL,
  country text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX go_clicks_handle_day ON public.go_clicks(handle, created_at);
GRANT SELECT ON public.go_clicks TO authenticated;
GRANT ALL ON public.go_clicks TO service_role;
ALTER TABLE public.go_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read clicks" ON public.go_clicks FOR SELECT TO authenticated USING (private.is_admin());

CREATE TABLE public.weekly_installs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handle text NOT NULL,
  app_id uuid,
  week_start date NOT NULL,
  installs integer NOT NULL DEFAULT 0,
  spend numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (handle, week_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_installs TO authenticated;
GRANT ALL ON public.weekly_installs TO service_role;
ALTER TABLE public.weekly_installs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage installs" ON public.weekly_installs FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TABLE public.account_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid,
  platform text NOT NULL,
  handle text NOT NULL,
  from_creator_id uuid REFERENCES public.creators(id) ON DELETE SET NULL,
  assigned_creator_id uuid REFERENCES public.creators(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'needs_rotation',
  password_rotated_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_pool TO authenticated;
GRANT ALL ON public.account_pool TO service_role;
ALTER TABLE public.account_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage account pool" ON public.account_pool FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TABLE public.saved_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'reply',
  name text NOT NULL,
  subject text,
  body text NOT NULL DEFAULT '',
  app_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_templates TO authenticated;
GRANT ALL ON public.saved_templates TO service_role;
ALTER TABLE public.saved_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage templates" ON public.saved_templates FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TABLE public.job_locks (name text PRIMARY KEY, locked_until timestamptz NOT NULL);
GRANT ALL ON public.job_locks TO service_role;
ALTER TABLE public.job_locks ENABLE ROW LEVEL SECURITY;