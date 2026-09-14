DO $$ BEGIN
  CREATE TYPE public.application_state AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  date_of_birth DATE,
  education TEXT NOT NULL DEFAULT '',
  cv_path TEXT,
  is_certified_teacher BOOLEAN NOT NULL DEFAULT false,
  school TEXT,
  motivation TEXT NOT NULL DEFAULT '',
  tried_sophia BOOLEAN NOT NULL DEFAULT false,
  previous_work TEXT,
  country TEXT,
  platform public.device_platform NOT NULL DEFAULT 'ios',
  status public.application_state NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_profile_id UUID,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can apply" ON public.applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read applications" ON public.applications FOR SELECT TO authenticated USING (private.is_admin());
CREATE POLICY "Admins update applications" ON public.applications FOR UPDATE TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "Admins delete applications" ON public.applications FOR DELETE TO authenticated USING (private.is_admin());

CREATE TRIGGER applications_updated_at BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Applicants can upload a CV" ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'applications');
CREATE POLICY "Admins read application files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'applications' AND private.is_admin());