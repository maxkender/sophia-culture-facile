DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='creator_announcements' AND cmd='SELECT' LOOP
    EXECUTE format('DROP POLICY %I ON public.creator_announcements', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "Creators read announcements for their track" ON public.creator_announcements FOR SELECT TO authenticated
  USING (active AND EXISTS (
    SELECT 1 FROM public.creators c
    WHERE c.user_id = auth.uid()
      AND (creator_announcements.track IS NULL OR creator_announcements.track = c.track OR c.track = 'both')
  ));