ALTER TABLE public.slideshow_applications
  ADD COLUMN IF NOT EXISTS langue text,
  ADD COLUMN IF NOT EXISTS deux_telephones boolean,
  ADD COLUMN IF NOT EXISTS applications text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS contract_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS os_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS os_profile_id text,
  ADD COLUMN IF NOT EXISTS os_email text,
  ADD COLUMN IF NOT EXISTS os_error text,
  ADD COLUMN IF NOT EXISTS manager_name text,
  ADD COLUMN IF NOT EXISTS manager_email text,
  ADD COLUMN IF NOT EXISTS start_monday date,
  ADD COLUMN IF NOT EXISTS pool_at timestamptz,
  ADD COLUMN IF NOT EXISTS expired_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_reason text,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS dropped_at timestamptz,
  ADD COLUMN IF NOT EXISTS hm_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS q_country_now text,
  ADD COLUMN IF NOT EXISTS q_hours_per_day text,
  ADD COLUMN IF NOT EXISTS q_tiktok_daily text,
  ADD COLUMN IF NOT EXISTS q_previous_content text,
  ADD COLUMN IF NOT EXISTS timeline jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS payout_token text,
  ADD COLUMN IF NOT EXISTS payout_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_method text,
  ADD COLUMN IF NOT EXISTS paypal_email text,
  ADD COLUMN IF NOT EXISTS wise_email text,
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_onboarded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unswipe_code_id uuid,
  ADD COLUMN IF NOT EXISTS ack_sent_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS slideshow_applications_payout_token_key ON public.slideshow_applications(payout_token) WHERE payout_token IS NOT NULL;

ALTER TABLE public.pay_zones
  ADD COLUMN IF NOT EXISTS weekly_amount numeric,
  ADD COLUMN IF NOT EXISTS first_week_amount numeric;
COMMENT ON COLUMN public.pay_zones.monthly_amount IS 'DEPRECATED: slideshow pay is weekly (weekly_amount)';
COMMENT ON COLUMN public.pay_zones.trial_amount IS 'DEPRECATED: replaced by first_week_amount';

CREATE TABLE public.os_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  ok boolean NOT NULL,
  ms integer,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.os_calls TO authenticated;
GRANT ALL ON public.os_calls TO service_role;
ALTER TABLE public.os_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read os calls" ON public.os_calls FOR SELECT TO authenticated USING (private.is_admin());

CREATE TABLE public.os_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.slideshow_applications(id) ON DELETE CASCADE,
  os_profile_id text NOT NULL,
  lundi date NOT NULL,
  prevus integer,
  publies integer,
  manques integer,
  dernier_post_at timestamptz,
  is_active boolean,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (os_profile_id, lundi)
);
GRANT SELECT ON public.os_snapshots TO authenticated;
GRANT ALL ON public.os_snapshots TO service_role;
ALTER TABLE public.os_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read os snapshots" ON public.os_snapshots FOR SELECT TO authenticated USING (private.is_admin());

CREATE TABLE public.slideshow_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.slideshow_applications(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  zone text,
  rate numeric,
  first_week boolean NOT NULL DEFAULT false,
  prevus integer,
  publies integer,
  manques integer,
  suggested numeric,
  amount numeric,
  carried_in numeric NOT NULL DEFAULT 0,
  note text,
  status text NOT NULL DEFAULT 'draft',
  skip_reason text,
  approved_by uuid,
  approved_at timestamptz,
  stripe_transfer_id text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id, week_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.slideshow_payouts TO authenticated;
GRANT ALL ON public.slideshow_payouts TO service_role;
ALTER TABLE public.slideshow_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage slideshow payouts" ON public.slideshow_payouts FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
