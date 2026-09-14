CREATE TABLE public.course_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid REFERENCES public.profiles(id),
  decline_reason text,
  CONSTRAINT course_requests_status_check CHECK (status IN ('pending', 'approved', 'declined'))
);

CREATE UNIQUE INDEX course_requests_open_unique
  ON public.course_requests (course_id, profile_id)
  WHERE status = 'pending';

CREATE INDEX course_requests_status_idx ON public.course_requests (status, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_requests TO authenticated;
GRANT ALL ON public.course_requests TO service_role;

ALTER TABLE public.course_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY course_requests_select ON public.course_requests
  FOR SELECT TO authenticated
  USING (profile_id = private.profile_id() OR private.is_admin());

CREATE POLICY course_requests_insert ON public.course_requests
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = private.profile_id() AND status = 'pending');

CREATE POLICY course_requests_update_admin ON public.course_requests
  FOR UPDATE TO authenticated
  USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE POLICY course_requests_delete_admin ON public.course_requests
  FOR DELETE TO authenticated
  USING (private.is_admin());

-- Le pool est lisible par tout auteur connecté : ces cours n'appartiennent encore à personne.
CREATE POLICY courses_select_pool ON public.courses
  FOR SELECT TO authenticated
  USING (status = 'unassigned');

CREATE OR REPLACE FUNCTION public.cap_pending_requests()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending' AND (
    SELECT count(*) FROM public.course_requests r
    WHERE r.profile_id = NEW.profile_id AND r.status = 'pending'
  ) >= 3 THEN
    RAISE EXCEPTION 'Three requests are already pending for this author';
  END IF;
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.cap_pending_requests() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER course_requests_cap
  BEFORE INSERT ON public.course_requests
  FOR EACH ROW EXECUTE FUNCTION public.cap_pending_requests();