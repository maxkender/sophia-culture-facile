ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS creator_slug text,
  ADD COLUMN IF NOT EXISTS creator_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS creator_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS creator_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS writing_lang text,
  ADD COLUMN IF NOT EXISTS onboarding_step text,
  ADD COLUMN IF NOT EXISTS self_registered boolean NOT NULL DEFAULT false;

-- Everyone already in the portal was invited or created by the desk.
UPDATE public.profiles SET creator_status = 'approved';
UPDATE public.profiles SET onboarding_step = 'done' WHERE activated_at IS NOT NULL OR role = 'admin';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_creator_status_check CHECK (creator_status IN ('pending','approved','suspended')),
  ADD CONSTRAINT profiles_creator_slug_check CHECK (creator_slug IS NULL OR creator_slug ~ '^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$' AND length(creator_slug) BETWEEN 2 AND 60),
  ADD CONSTRAINT profiles_onboarding_step_check CHECK (onboarding_step IS NULL OR onboarding_step IN ('identity','credentials','profile','agreement','guide','done'));
CREATE UNIQUE INDEX IF NOT EXISTS profiles_creator_slug_key ON public.profiles (creator_slug) WHERE creator_slug IS NOT NULL;

CREATE OR REPLACE FUNCTION public.guard_profile_privileges()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') OR private.is_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role
    OR NEW.access_code IS DISTINCT FROM OLD.access_code
    OR NEW.access_redeem_url IS DISTINCT FROM OLD.access_redeem_url
    OR NEW.invite_token IS DISTINCT FROM OLD.invite_token
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.email IS DISTINCT FROM OLD.email
    OR NEW.creator_status IS DISTINCT FROM OLD.creator_status
    OR NEW.creator_slug IS DISTINCT FROM OLD.creator_slug
    OR NEW.creator_verified IS DISTINCT FROM OLD.creator_verified
    OR NEW.self_registered IS DISTINCT FROM OLD.self_registered THEN
    RAISE EXCEPTION 'Not allowed to change privileged profile fields';
  END IF;
  RETURN NEW;
END;
$function$;

-- Desk-created (invited) profiles are approved from the start; self sign-ups stay pending.
CREATE OR REPLACE FUNCTION public.set_invited_creator_status()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT NEW.self_registered THEN NEW.creator_status := 'approved'; END IF;
  RETURN NEW;
END $function$;
CREATE TRIGGER profiles_invited_status BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_invited_creator_status();

CREATE TABLE public.studio_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_course_id text,
  origin_lang text NOT NULL DEFAULT 'fr',
  title text NOT NULL DEFAULT '',
  subtitle text,
  subject text,
  subcategory text,
  description text NOT NULL DEFAULT '',
  hero jsonb NOT NULL DEFAULT '{}'::jsonb,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  glossary jsonb NOT NULL DEFAULT '[]'::jsonb,
  quiz jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','changes_requested','accepted','publishing','published','failed','archived')),
  review_comment text,
  precheck jsonb,
  submitted_at timestamptz,
  accepted_at timestamptz,
  published_at timestamptz,
  version int NOT NULL DEFAULT 1,
  last_job_id uuid,
  job_status text,
  languages jsonb NOT NULL DEFAULT '{"published":[],"failed":{}}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (origin_lang IN ('fr','en','es','de','pt','pt-PT','it','tr','pl','ro','nl','el','sv','hu','bg','cs','da','nb','ru','hr','sl','sk','sr','ar','he','fi','et','lt','lv','ja')),
  CHECK (subject IS NULL OR subject IN ('histoire','sciences','litterature','art','mythologie','comprendreLeMonde'))
);
CREATE INDEX studio_courses_author_idx ON public.studio_courses (author_id);
CREATE INDEX studio_courses_status_idx ON public.studio_courses (status, submitted_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_courses TO authenticated;
GRANT ALL ON public.studio_courses TO service_role;
ALTER TABLE public.studio_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY studio_courses_select ON public.studio_courses FOR SELECT TO authenticated
  USING (author_id = private.profile_id() OR private.is_admin());
CREATE POLICY studio_courses_insert ON public.studio_courses FOR INSERT TO authenticated
  WITH CHECK (private.is_admin() OR (author_id = private.profile_id() AND status = 'draft'));
CREATE POLICY studio_courses_update ON public.studio_courses FOR UPDATE TO authenticated
  USING (private.is_admin() OR (author_id = private.profile_id() AND status IN ('draft','changes_requested')))
  WITH CHECK (private.is_admin() OR (author_id = private.profile_id() AND status IN ('draft','changes_requested')));
CREATE POLICY studio_courses_delete ON public.studio_courses FOR DELETE TO authenticated
  USING (private.is_admin() OR (author_id = private.profile_id() AND status = 'draft'));

-- Authors edit content only; workflow and publishing fields move through server functions.
CREATE OR REPLACE FUNCTION public.guard_studio_course()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user IN ('service_role','postgres','supabase_admin') OR private.is_admin() THEN RETURN NEW; END IF;
  IF NEW.author_id IS DISTINCT FROM OLD.author_id OR NEW.app_course_id IS DISTINCT FROM OLD.app_course_id
    OR NEW.status IS DISTINCT FROM OLD.status OR NEW.review_comment IS DISTINCT FROM OLD.review_comment
    OR NEW.precheck IS DISTINCT FROM OLD.precheck OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
    OR NEW.accepted_at IS DISTINCT FROM OLD.accepted_at OR NEW.published_at IS DISTINCT FROM OLD.published_at
    OR NEW.version IS DISTINCT FROM OLD.version OR NEW.last_job_id IS DISTINCT FROM OLD.last_job_id
    OR NEW.job_status IS DISTINCT FROM OLD.job_status OR NEW.languages IS DISTINCT FROM OLD.languages THEN
    RAISE EXCEPTION 'Not allowed to change workflow fields';
  END IF;
  RETURN NEW;
END $function$;
CREATE TRIGGER studio_courses_guard BEFORE UPDATE ON public.studio_courses FOR EACH ROW EXECUTE FUNCTION public.guard_studio_course();
CREATE TRIGGER studio_courses_updated_at BEFORE UPDATE ON public.studio_courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.studio_jobs (
  job_id uuid PRIMARY KEY,
  studio_course_id uuid NOT NULL REFERENCES public.studio_courses(id) ON DELETE CASCADE,
  app_course_id text,
  status text,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary jsonb,
  events jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX studio_jobs_course_idx ON public.studio_jobs (studio_course_id, created_at DESC);
GRANT SELECT ON public.studio_jobs TO authenticated;
GRANT ALL ON public.studio_jobs TO service_role;
ALTER TABLE public.studio_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY studio_jobs_select ON public.studio_jobs FOR SELECT TO authenticated
  USING (private.is_admin() OR EXISTS (SELECT 1 FROM public.studio_courses c WHERE c.id = studio_jobs.studio_course_id AND c.author_id = private.profile_id()));
CREATE TRIGGER studio_jobs_updated_at BEFORE UPDATE ON public.studio_jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.studio_stats_cache (
  key text PRIMARY KEY,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.studio_stats_cache TO authenticated;
GRANT ALL ON public.studio_stats_cache TO service_role;
ALTER TABLE public.studio_stats_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY studio_stats_cache_admin ON public.studio_stats_cache FOR SELECT TO authenticated USING (private.is_admin());