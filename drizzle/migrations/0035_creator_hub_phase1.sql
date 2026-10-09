CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.apps(id),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'high_volume_ugc' CHECK (type IN ('high_volume_ugc','influencer','paid_ads','analytics_only')),
  starts_at date NOT NULL DEFAULT current_date,
  ends_at date,
  ongoing boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','live','paused','closed')),
  monthly_budget numeric,
  brief_md text NOT NULL DEFAULT '',
  requirements jsonb NOT NULL DEFAULT '{}',
  settings jsonb NOT NULL DEFAULT '{}',
  distribution jsonb NOT NULL DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT SELECT ON public.campaigns TO anon;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage campaigns" ON public.campaigns FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "live campaigns readable" ON public.campaigns FOR SELECT TO anon, authenticated USING (status = 'live');

CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  app_id uuid NOT NULL REFERENCES public.apps(id),
  slug text UNIQUE NOT NULL DEFAULT substr(md5(random()::text),1,10),
  title text NOT NULL,
  cover_image_path text,
  position text NOT NULL DEFAULT 'UGC creator' CHECK (position IN ('UGC creator','Clipper','Influencer','Video editor','Slideshow poster')),
  details_md text NOT NULL DEFAULT '' CHECK (char_length(details_md) <= 1000),
  access text NOT NULL DEFAULT 'job_feed' CHECK (access IN ('job_feed','invite_only','link')),
  open boolean NOT NULL DEFAULT false,
  payment_type text NOT NULL DEFAULT 'hybrid' CHECK (payment_type IN ('per_post','retainer','cpm','hybrid')),
  base_mode text NOT NULL DEFAULT 'per_post' CHECK (base_mode IN ('per_post','retainer')),
  base_amount numeric NOT NULL DEFAULT 0,
  retainer_frequency text CHECK (retainer_frequency IN ('weekly','monthly')),
  cpm_rate numeric NOT NULL DEFAULT 0,
  weekly_hours text,
  bonus_goals jsonb NOT NULL DEFAULT '[]',
  verified_country boolean NOT NULL DEFAULT false,
  countries text[] NOT NULL DEFAULT '{}',
  age_min int, age_max int,
  platforms text[] NOT NULL DEFAULT '{}',
  account_type text NOT NULL DEFAULT 'brand_owned' CHECK (account_type IN ('personal','brand_owned')),
  content_type text, product_type text,
  video_length_s int, posting_frequency_n int,
  posting_frequency_unit text CHECK (posting_frequency_unit IN ('week','month')),
  application_items jsonb NOT NULL DEFAULT '[]',
  slots int,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT SELECT ON public.jobs TO anon;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage jobs" ON public.jobs FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "public jobs readable" ON public.jobs FOR SELECT TO anon, authenticated USING (status = 'active' AND access IN ('job_feed','link'));

CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES public.creators(id) ON DELETE SET NULL,
  application_id uuid,
  answers jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','withdrawn')),
  shortlisted boolean NOT NULL DEFAULT false,
  decline_reason text,
  contract_signed_at timestamptz,
  decided_by uuid, decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage job apps" ON public.job_applications FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creator reads own job apps" ON public.job_applications FOR SELECT TO authenticated USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

CREATE TABLE public.job_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  creator_id uuid, prospect_id uuid, email text,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  sent_at timestamptz DEFAULT now(), opened_at timestamptz, accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_invites TO authenticated;
GRANT ALL ON public.job_invites TO service_role;
ALTER TABLE public.job_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage job invites" ON public.job_invites FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TABLE public.creator_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'other' CHECK (type IN ('payout','account','brief','other')),
  body text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  reply text,
  resolved_by uuid, resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_requests TO authenticated;
GRANT ALL ON public.creator_requests TO service_role;
ALTER TABLE public.creator_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage requests" ON public.creator_requests FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creator reads own requests" ON public.creator_requests FOR SELECT TO authenticated USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));
CREATE POLICY "creator files own requests" ON public.creator_requests FOR INSERT TO authenticated WITH CHECK (status = 'open' AND creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

CREATE TABLE public.post_metrics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.creator_posts(id) ON DELETE CASCADE,
  app_id uuid,
  day date NOT NULL DEFAULT current_date,
  views bigint NOT NULL DEFAULT 0, likes bigint NOT NULL DEFAULT 0,
  comments bigint NOT NULL DEFAULT 0, shares bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, day)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_metrics_daily TO authenticated;
GRANT ALL ON public.post_metrics_daily TO service_role;
ALTER TABLE public.post_metrics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage metrics" ON public.post_metrics_daily FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

ALTER TABLE public.creator_prospects
  ADD COLUMN IF NOT EXISTS niche text, ADD COLUMN IF NOT EXISTS face_cam boolean,
  ADD COLUMN IF NOT EXISTS city text, ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS school_or_job text, ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

CREATE TRIGGER campaigns_updated BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER jobs_updated BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.campaigns (id, app_id, name, type, status, brief_md, requirements)
VALUES ('00000000-0000-4000-8000-0000000c0001','00000000-0000-4000-8000-000000000001','Sophia UGC FR','high_volume_ugc','live',
'Short face-cam videos in French about general knowledge, posted on Sophia-owned TikTok and Instagram accounts that look personal.',
'{"platforms":["tiktok","instagram"],"countries":["FR"]}');
INSERT INTO public.jobs (campaign_id, app_id, slug, title, position, details_md, access, open, payment_type, base_mode, base_amount, cpm_rate, platforms, account_type, content_type, product_type, video_length_s, posting_frequency_n, posting_frequency_unit, countries, age_min, application_items)
VALUES ('00000000-0000-4000-8000-0000000c0001','00000000-0000-4000-8000-000000000001','sophia-ugc-fr','UGC creator for Sophia (French)','UGC creator',
'Film short face-cam videos about culture générale for Sophia. Trial: 0 €/post + 2 €/1,000 views (cap 100 €). Active: 1 €/post + 2 €/1,000 (cap 150 €). Pro: 2 €/post + 2.5 €/1,000 (cap 200 €).',
'job_feed', false, 'hybrid', 'per_post', 1, 2, '{tiktok,instagram}', 'brand_owned', 'Face-cam talking', 'Mobile app', 30, 5, 'week', '{FR}', 18,
'[{"type":"video","label":"Short talking video (30s)","required":true},{"type":"link","label":"TikTok link","required":false}]');