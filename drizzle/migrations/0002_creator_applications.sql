CREATE TABLE public.creator_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  country text NOT NULL,
  age integer NOT NULL CHECK (age >= 18),
  occupation text NOT NULL CHECK (occupation IN ('studying','working','both','other')),
  tiktok_url text,
  instagram_url text,
  other_links text,
  meets_criteria boolean NOT NULL DEFAULT false,
  video_url text,
  video_file_path text,
  referral_source text NOT NULL,
  consent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','interview','accepted','rejected','waitlist')),
  interview_at timestamptz,
  rejection_reason text,
  assigned_hm_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_notes text,
  submit_ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  CHECK (video_url IS NOT NULL OR video_file_path IS NOT NULL)
);
GRANT SELECT, UPDATE, DELETE ON public.creator_applications TO authenticated;
GRANT ALL ON public.creator_applications TO service_role;
ALTER TABLE public.creator_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage creator applications" ON public.creator_applications
  FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE INDEX creator_applications_status_idx ON public.creator_applications(status, created_at DESC);
CREATE INDEX creator_applications_email_idx ON public.creator_applications(lower(email));

CREATE TABLE public.slideshow_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  country text NOT NULL,
  is_adult boolean NOT NULL CHECK (is_adult),
  has_upwork boolean NOT NULL DEFAULT false,
  upwork_profile_url text,
  referral_source text,
  consent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','accepted','rejected','waitlist')),
  rejection_reason text,
  assigned_hm_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_notes text,
  submit_ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
GRANT SELECT, UPDATE, DELETE ON public.slideshow_applications TO authenticated;
GRANT ALL ON public.slideshow_applications TO service_role;
ALTER TABLE public.slideshow_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage slideshow applications" ON public.slideshow_applications
  FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE INDEX slideshow_applications_status_idx ON public.slideshow_applications(status, created_at DESC);

CREATE TABLE public.slideshow_country_rates (
  country text PRIMARY KEY,
  rate_usd numeric(6,2) NOT NULL CHECK (rate_usd >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.slideshow_country_rates TO authenticated;
GRANT ALL ON public.slideshow_country_rates TO service_role;
ALTER TABLE public.slideshow_country_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage slideshow rates" ON public.slideshow_country_rates
  FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE POLICY "Admins read creator videos" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'creator-videos' AND private.is_admin());