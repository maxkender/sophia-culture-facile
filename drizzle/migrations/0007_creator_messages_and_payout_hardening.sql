DROP POLICY IF EXISTS "Creators update own payout profile" ON public.creator_payout_profiles;
REVOKE UPDATE, INSERT ON public.creator_payout_profiles FROM authenticated;
GRANT SELECT ON public.creator_payout_profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.creator_payout_profiles TO authenticated;

CREATE TABLE public.creator_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  from_admin boolean NOT NULL,
  body text NOT NULL CHECK (length(trim(body)) > 0),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.creator_messages TO authenticated;
GRANT ALL ON public.creator_messages TO service_role;
ALTER TABLE public.creator_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage creator messages" ON public.creator_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "Creators read own messages" ON public.creator_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.creators c WHERE c.id = creator_id AND c.user_id = auth.uid()));
CREATE POLICY "Creators send own messages" ON public.creator_messages FOR INSERT TO authenticated
  WITH CHECK (from_admin = false AND read_at IS NULL AND EXISTS (SELECT 1 FROM public.creators c WHERE c.id = creator_id AND c.user_id = auth.uid()));
CREATE INDEX creator_messages_creator_idx ON public.creator_messages(creator_id, created_at);

CREATE TABLE public.creator_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  track text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_announcements TO authenticated;
GRANT ALL ON public.creator_announcements TO service_role;
ALTER TABLE public.creator_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage creator announcements" ON public.creator_announcements FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "Creators read active announcements" ON public.creator_announcements FOR SELECT TO authenticated
  USING (active AND EXISTS (SELECT 1 FROM public.creators c WHERE c.user_id = auth.uid() AND (track IS NULL OR c.track = track OR c.track = 'both')));