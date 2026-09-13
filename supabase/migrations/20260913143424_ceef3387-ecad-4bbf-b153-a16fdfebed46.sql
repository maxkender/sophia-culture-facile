-- 1. Remove the old teacher portal (including all payment tables)
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.author_payment_details CASCADE;
DROP TABLE IF EXISTS public.contract_signatures CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.topic_applications CASCADE;
DROP TABLE IF EXISTS public.course_submissions CASCADE;
DROP TABLE IF EXISTS public.topics CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.assign_initial_role() CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.application_state CASCADE;
DROP TYPE IF EXISTS public.assignment_state CASCADE;
DROP TYPE IF EXISTS public.author_legal_status CASCADE;
DROP TYPE IF EXISTS public.payment_kind CASCADE;
DROP TYPE IF EXISTS public.payment_state CASCADE;
DROP TYPE IF EXISTS public.submission_status CASCADE;
DROP TYPE IF EXISTS public.topic_category CASCADE;
DROP TYPE IF EXISTS public.topic_status CASCADE;

-- 2. Enums
CREATE TYPE public.portal_role AS ENUM ('admin', 'author');
CREATE TYPE public.course_status AS ENUM ('assigned', 'in_progress', 'submitted', 'changes_requested', 'accepted', 'published');
CREATE TYPE public.code_state AS ENUM ('available', 'assigned', 'sent');
CREATE TYPE public.device_platform AS ENUM ('ios', 'android');

-- 3. Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  email text NOT NULL UNIQUE,
  role public.portal_role NOT NULL DEFAULT 'author',
  full_name text NOT NULL,
  title text,
  institution text,
  bio text,
  photo_url text,
  country text,
  platform public.device_platform,
  access_code text,
  access_redeem_url text,
  invite_token text UNIQUE,
  invited_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION private.profile_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.is_admin());
CREATE POLICY profiles_insert_admin ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (private.is_admin());
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR private.is_admin())
  WITH CHECK (user_id = auth.uid() OR private.is_admin());
CREATE POLICY profiles_delete_admin ON public.profiles FOR DELETE TO authenticated
  USING (private.is_admin());

CREATE OR REPLACE FUNCTION public.guard_profile_privileges()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT private.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role
      OR NEW.access_code IS DISTINCT FROM OLD.access_code
      OR NEW.access_redeem_url IS DISTINCT FROM OLD.access_redeem_url
      OR NEW.invite_token IS DISTINCT FROM OLD.invite_token
      OR NEW.user_id IS DISTINCT FROM OLD.user_id
      OR NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Not allowed to change privileged profile fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_guard BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileges();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Courses
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  lot_code text,
  subject_area text,
  title text NOT NULL,
  subtitle text,
  brief_note text,
  status public.course_status NOT NULL DEFAULT 'assigned',
  order_index integer NOT NULL DEFAULT 0,
  due_date date,
  review_comment text,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY courses_select ON public.courses FOR SELECT TO authenticated
  USING (author_id = private.profile_id() OR private.is_admin());
CREATE POLICY courses_insert_admin ON public.courses FOR INSERT TO authenticated
  WITH CHECK (private.is_admin());
CREATE POLICY courses_update ON public.courses FOR UPDATE TO authenticated
  USING (author_id = private.profile_id() OR private.is_admin())
  WITH CHECK (author_id = private.profile_id() OR private.is_admin());
CREATE POLICY courses_delete_admin ON public.courses FOR DELETE TO authenticated
  USING (private.is_admin());
CREATE TRIGGER courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Screens
CREATE TABLE public.screens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  screen_number integer NOT NULL CHECK (screen_number BETWEEN 1 AND 5),
  screen_title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  image_idea text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, screen_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.screens TO authenticated;
GRANT ALL ON public.screens TO service_role;
ALTER TABLE public.screens ENABLE ROW LEVEL SECURITY;
CREATE POLICY screens_all ON public.screens FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.author_id = private.profile_id() OR private.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.author_id = private.profile_id() OR private.is_admin())));
CREATE TRIGGER screens_updated_at BEFORE UPDATE ON public.screens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Sources
CREATE TABLE public.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  claim text,
  reference text,
  page text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sources TO authenticated;
GRANT ALL ON public.sources TO service_role;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY sources_all ON public.sources FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.author_id = private.profile_id() OR private.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.author_id = private.profile_id() OR private.is_admin())));

-- 7. Access codes
CREATE TABLE public.access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  redeem_url text,
  state public.code_state NOT NULL DEFAULT 'available',
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_codes TO authenticated;
GRANT ALL ON public.access_codes TO service_role;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY codes_admin_all ON public.access_codes FOR ALL TO authenticated
  USING (private.is_admin()) WITH CHECK (private.is_admin());

-- 8. Contracts
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_version text NOT NULL,
  signed_name text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  signature_ip text,
  user_agent text
);
GRANT SELECT, INSERT ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO service_role;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY contracts_select ON public.contracts FOR SELECT TO authenticated
  USING (author_id = private.profile_id() OR private.is_admin());
CREATE POLICY contracts_insert ON public.contracts FOR INSERT TO authenticated
  WITH CHECK (author_id = private.profile_id());

-- 9. Activity log
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY activity_select ON public.activity_log FOR SELECT TO authenticated
  USING (actor_id = private.profile_id() OR private.is_admin());
CREATE POLICY activity_insert ON public.activity_log FOR INSERT TO authenticated
  WITH CHECK (actor_id = private.profile_id());

-- 10. Seed data
INSERT INTO public.profiles (id, user_id, email, role, full_name, title, institution, country, platform, activated_at)
VALUES ('11111111-1111-4111-8111-111111111111', 'aa2dbcd4-e86d-49d8-b6f9-357d4f461685', 'admin@vikstudios.com', 'admin', 'Sophia Editorial Desk', 'Editor in chief', 'Vik Studios', 'France', 'ios', now());

INSERT INTO public.access_codes (code, redeem_url, state) VALUES
  ('SOPHIA-IOS-0001', 'https://apps.apple.com/redeem?ctx=offercodes&code=SOPHIA-IOS-0001', 'available'),
  ('SOPHIA-IOS-0002', 'https://apps.apple.com/redeem?ctx=offercodes&code=SOPHIA-IOS-0002', 'available'),
  ('SOPHIA-IOS-0003', 'https://apps.apple.com/redeem?ctx=offercodes&code=SOPHIA-IOS-0003', 'available'),
  ('SOPHIA-AND-0001', 'https://play.google.com/redeem?code=SOPHIA-AND-0001', 'available'),
  ('SOPHIA-AND-0002', 'https://play.google.com/redeem?code=SOPHIA-AND-0002', 'available');

INSERT INTO public.profiles (id, email, role, full_name, title, institution, country, platform, bio, access_code, access_redeem_url, invite_token, invited_at)
VALUES
  ('22222222-2222-4222-8222-222222222222', 'e.moreau@example.edu', 'author', 'Elena Moreau', 'Associate Professor of History', 'University of Edinburgh', 'United Kingdom', 'ios', 'Historian of early modern Europe, focused on printing and literacy.', 'SOPHIA-IOS-0001', 'https://apps.apple.com/redeem?ctx=offercodes&code=SOPHIA-IOS-0001', 'inv_elena_2f7a91c4', now()),
  ('33333333-3333-4333-8333-333333333333', 'k.adeyemi@example.edu', 'author', 'Kofi Adeyemi', 'Lecturer in Political Science', 'University of Ghana', 'Ghana', 'android', 'Political scientist working on West African geopolitics and institutions.', 'SOPHIA-AND-0001', 'https://play.google.com/redeem?code=SOPHIA-AND-0001', 'inv_kofi_9d3b52ea', now());

UPDATE public.access_codes SET state = 'assigned', assigned_to = '22222222-2222-4222-8222-222222222222', assigned_at = now() WHERE code = 'SOPHIA-IOS-0001';
UPDATE public.access_codes SET state = 'assigned', assigned_to = '33333333-3333-4333-8333-333333333333', assigned_at = now() WHERE code = 'SOPHIA-AND-0001';

INSERT INTO public.courses (id, author_id, lot_code, subject_area, title, subtitle, brief_note, status, order_index, due_date) VALUES
  ('aaaaaaa1-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'LOT-A1', 'History', 'The printing press', 'How movable type reshaped Europe', 'Five screens from Gutenberg to the spread of vernacular printing. Keep dates light, favour consequences over inventory.', 'in_progress', 1, (now() + interval '14 days')::date),
  ('aaaaaaa1-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'LOT-A2', 'History', 'The Hanseatic League', 'A merchant network before nation states', 'Explain how a trading league governed itself. End on what it left behind.', 'assigned', 2, (now() + interval '21 days')::date),
  ('aaaaaaa1-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 'LOT-A3', 'History', 'Coffee houses of the Enlightenment', 'Where public opinion was invented', 'Focus on sociability and the circulation of ideas, not on the drink itself.', 'assigned', 3, (now() - interval '3 days')::date),
  ('bbbbbbb1-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'LOT-B1', 'Geopolitics', 'The Gulf of Guinea', 'Oil, piracy and regional power', 'Five screens: geography, resources, security, regional bodies, outlook.', 'assigned', 1, (now() + interval '10 days')::date),
  ('bbbbbbb1-0000-4000-8000-000000000002', '33333333-3333-4333-8333-333333333333', 'LOT-B2', 'Geopolitics', 'The African Union', 'What it can and cannot do', 'Institutional but readable. One concrete example per screen.', 'assigned', 2, (now() + interval '18 days')::date),
  ('bbbbbbb1-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333', 'LOT-B3', 'Geopolitics', 'Borders drawn in Berlin', 'The 1884 conference and its afterlife', 'Explain the conference briefly, then spend three screens on consequences.', 'assigned', 3, (now() + interval '30 days')::date);

INSERT INTO public.screens (course_id, screen_number, screen_title, body, image_idea) VALUES
  ('aaaaaaa1-0000-4000-8000-000000000001', 1, 'Before the press', 'Copying a book by hand took months. A single Bible could cost as much as a small house, and monasteries held most of what Europe had written down. Literacy was not rare because people were incurious; it was rare because there was almost nothing to read. Any change in how books were made was going to be a change in who could think with them.', 'A scriptorium desk with an unfinished manuscript'),
  ('aaaaaaa1-0000-4000-8000-000000000001', 2, 'Gutenberg''s machine', 'Around 1450 Johannes Gutenberg combined three existing things: a wine press, oil-based ink, and metal type cast letter by letter. None was new on its own. Together they made it possible to set a page once and print it hundreds of times. His **42-line Bible** was not cheap, but it proved the method worked at scale.', 'Metal type arranged in a composing stick'),
  ('aaaaaaa1-0000-4000-8000-000000000001', 3, 'The price collapse', '', NULL),
  ('aaaaaaa1-0000-4000-8000-000000000001', 4, '', '', NULL),
  ('aaaaaaa1-0000-4000-8000-000000000001', 5, '', '', NULL);

INSERT INTO public.sources (course_id, claim, reference, page) VALUES
  ('aaaaaaa1-0000-4000-8000-000000000001', 'Cost of a hand-copied Bible', 'Eisenstein, The Printing Press as an Agent of Change', '46');
