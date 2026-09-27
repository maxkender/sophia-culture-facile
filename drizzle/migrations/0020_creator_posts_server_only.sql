DROP POLICY IF EXISTS "creator logs own posts" ON public.creator_posts;
DROP POLICY IF EXISTS "Creators send own messages" ON public.creator_messages;
CREATE POLICY "Creators send own messages" ON public.creator_messages FOR INSERT TO authenticated
WITH CHECK ((from_admin = false) AND (read_at IS NULL)
  AND EXISTS (SELECT 1 FROM public.creators c WHERE c.id = creator_messages.creator_id AND c.user_id = auth.uid())
  AND (post_id IS NULL OR EXISTS (SELECT 1 FROM public.creator_posts p WHERE p.id = creator_messages.post_id AND p.creator_id = creator_messages.creator_id)));