CREATE TYPE public.app_role AS ENUM ('admin', 'teacher');
CREATE TYPE public.topic_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.submission_status AS ENUM ('draft', 'submitted', 'approved', 'changes_requested', 'rejected');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  first_name text NOT NULL CHECK (char_length(trim(first_name)) BETWEEN 1 AND 80),
  last_name text NOT NULL CHECK (char_length(trim(last_name)) BETWEEN 1 AND 80),
  email text NOT NULL CHECK (char_length(email) <= 255),
  language text NOT NULL CHECK (language IN ('fr', 'en')),
  study_country text NOT NULL CHECK (char_length(trim(study_country)) BETWEEN 2 AND 100),
  avatar_path text NOT NULL CHECK (char_length(avatar_path) <= 500),
  subject_taught text NOT NULL CHECK (char_length(trim(subject_taught)) BETWEEN 2 AND 120),
  teaching_level text NOT NULL CHECK (char_length(trim(teaching_level)) BETWEEN 2 AND 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'teacher',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE TABLE public.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 3 AND 180),
  description text CHECK (description IS NULL OR char_length(description) <= 1500),
  language text NOT NULL CHECK (language IN ('fr', 'en')),
  proposed_by uuid,
  status public.topic_status NOT NULL DEFAULT 'pending',
  admin_feedback text CHECK (admin_feedback IS NULL OR char_length(admin_feedback) <= 1000),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topics TO authenticated;
GRANT ALL ON public.topics TO service_role;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.course_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE RESTRICT,
  title text CHECK (title IS NULL OR char_length(trim(title)) BETWEEN 3 AND 180),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.submission_status NOT NULL DEFAULT 'draft',
  admin_feedback text CHECK (admin_feedback IS NULL OR char_length(admin_feedback) <= 2000),
  submitted_at timestamptz,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_submissions TO authenticated;
GRANT ALL ON public.course_submissions TO service_role;
ALTER TABLE public.course_submissions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER topics_updated_at BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER submissions_updated_at BEFORE UPDATE ON public.course_submissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.assign_initial_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = NEW.id AND lower(coalesce(auth.jwt()->>'email', '')) = 'admin@vikstudios.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'teacher') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER assign_initial_role_after_profile AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.assign_initial_role();

CREATE POLICY profiles_read_own_or_admin ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid() AND lower(email) = lower(coalesce(auth.jwt()->>'email', '')));
CREATE POLICY profiles_update_own_or_admin ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY roles_read_own_or_admin ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY topics_read_approved_own_or_admin ON public.topics FOR SELECT TO authenticated
USING (status = 'approved' OR proposed_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY topics_propose_own ON public.topics FOR INSERT TO authenticated
WITH CHECK (
  (proposed_by = auth.uid() AND status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL)
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY topics_update_admin ON public.topics FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY topics_delete_admin ON public.topics FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY submissions_read_own_or_admin ON public.course_submissions FOR SELECT TO authenticated
USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY submissions_create_own ON public.course_submissions FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid() AND status = 'draft');
CREATE POLICY submissions_update_draft_own_or_admin ON public.course_submissions FOR UPDATE TO authenticated
USING ((author_id = auth.uid() AND status IN ('draft', 'changes_requested')) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK ((author_id = auth.uid() AND status IN ('draft', 'submitted')) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY submissions_delete_own_draft_or_admin ON public.course_submissions FOR DELETE TO authenticated
USING ((author_id = auth.uid() AND status = 'draft') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY avatars_read_own_or_admin ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'teacher-avatars' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY avatars_insert_own ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'teacher-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY avatars_update_own ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'teacher-avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'teacher-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY avatars_delete_own ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'teacher-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE INDEX topics_status_language_idx ON public.topics(status, language);
CREATE INDEX topics_proposed_by_idx ON public.topics(proposed_by);
CREATE INDEX submissions_author_status_idx ON public.course_submissions(author_id, status);
CREATE INDEX submissions_topic_idx ON public.course_submissions(topic_id);