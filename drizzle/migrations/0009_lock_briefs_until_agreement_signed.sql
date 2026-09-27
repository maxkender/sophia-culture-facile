DROP POLICY "creators read published briefs" ON public.briefs;
CREATE POLICY "creators read published briefs" ON public.briefs FOR SELECT TO authenticated
  USING (status = 'published' AND EXISTS (SELECT 1 FROM public.creators c JOIN public.creator_signatures s ON s.creator_id = c.id WHERE c.user_id = auth.uid()));
DROP POLICY "creator logs own posts" ON public.creator_posts;
CREATE POLICY "creator logs own posts" ON public.creator_posts FOR INSERT TO authenticated
  WITH CHECK (status = 'pending' AND creator_id IN (SELECT c.id FROM public.creators c JOIN public.creator_signatures s ON s.creator_id = c.id WHERE c.user_id = auth.uid()));