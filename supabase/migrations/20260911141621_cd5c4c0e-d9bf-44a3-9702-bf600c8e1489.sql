CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.has_role(_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = _role
  )
$$;
REVOKE ALL ON FUNCTION private.has_role(public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(public.app_role) TO authenticated;

DROP POLICY profiles_read_own_or_admin ON public.profiles;
DROP POLICY profiles_update_own_or_admin ON public.profiles;
DROP POLICY roles_read_own_or_admin ON public.user_roles;
DROP POLICY topics_read_approved_own_or_admin ON public.topics;
DROP POLICY topics_propose_own ON public.topics;
DROP POLICY topics_update_admin ON public.topics;
DROP POLICY topics_delete_admin ON public.topics;
DROP POLICY submissions_read_own_or_admin ON public.course_submissions;
DROP POLICY submissions_update_draft_own_or_admin ON public.course_submissions;
DROP POLICY submissions_delete_own_draft_or_admin ON public.course_submissions;
DROP POLICY avatars_read_own_or_admin ON storage.objects;

CREATE POLICY profiles_read_own_or_admin ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR private.has_role('admin'));
CREATE POLICY profiles_update_own_or_admin ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid() OR private.has_role('admin'))
WITH CHECK (id = auth.uid() OR private.has_role('admin'));
CREATE POLICY roles_read_own_or_admin ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.has_role('admin'));
CREATE POLICY topics_read_approved_own_or_admin ON public.topics FOR SELECT TO authenticated
USING (status = 'approved' OR proposed_by = auth.uid() OR private.has_role('admin'));
CREATE POLICY topics_propose_own ON public.topics FOR INSERT TO authenticated
WITH CHECK ((proposed_by = auth.uid() AND status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL) OR private.has_role('admin'));
CREATE POLICY topics_update_admin ON public.topics FOR UPDATE TO authenticated
USING (private.has_role('admin')) WITH CHECK (private.has_role('admin'));
CREATE POLICY topics_delete_admin ON public.topics FOR DELETE TO authenticated
USING (private.has_role('admin'));
CREATE POLICY submissions_read_own_or_admin ON public.course_submissions FOR SELECT TO authenticated
USING (author_id = auth.uid() OR private.has_role('admin'));
CREATE POLICY submissions_update_draft_own_or_admin ON public.course_submissions FOR UPDATE TO authenticated
USING ((author_id = auth.uid() AND status IN ('draft', 'changes_requested')) OR private.has_role('admin'))
WITH CHECK ((author_id = auth.uid() AND status IN ('draft', 'submitted')) OR private.has_role('admin'));
CREATE POLICY submissions_delete_own_draft_or_admin ON public.course_submissions FOR DELETE TO authenticated
USING ((author_id = auth.uid() AND status = 'draft') OR private.has_role('admin'));
CREATE POLICY avatars_read_own_or_admin ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'teacher-avatars' AND ((storage.foldername(name))[1] = auth.uid()::text OR private.has_role('admin')));

DROP FUNCTION public.has_role(uuid, public.app_role);
REVOKE ALL ON FUNCTION public.assign_initial_role() FROM PUBLIC, anon, authenticated;