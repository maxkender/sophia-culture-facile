DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname='public' AND cmd='SELECT'
    AND ((tablename='courses' AND qual = '(status = ''unassigned''::course_status)')
      OR (tablename='announcements' AND qual LIKE '%audience = ''all''%'))
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

CREATE POLICY "Authors read the open pool" ON public.courses FOR SELECT TO authenticated
  USING (status = 'unassigned'::course_status AND private.profile_id() IS NOT NULL);

CREATE POLICY "Authors read their announcements" ON public.announcements FOR SELECT TO authenticated
  USING (private.is_admin() OR (private.profile_id() IS NOT NULL AND (audience = 'all' OR private.profile_id() = ANY (target_profile_ids))));