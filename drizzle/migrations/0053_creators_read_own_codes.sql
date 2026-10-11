GRANT SELECT ON public.access_codes TO authenticated;
CREATE POLICY codes_creator_read_own ON public.access_codes FOR SELECT TO authenticated
USING (assigned_creator_id IS NOT NULL AND assigned_creator_id IN (SELECT c.id FROM public.creators c WHERE c.user_id = auth.uid()));