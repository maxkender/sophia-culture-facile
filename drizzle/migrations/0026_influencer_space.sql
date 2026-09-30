ALTER TABLE public.influencers
  ADD COLUMN IF NOT EXISTS payout_method text,
  ADD COLUMN IF NOT EXISTS payout_details jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS payee text NOT NULL DEFAULT 'influencer',
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_onboarded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS photo_path text;

CREATE TABLE public.influencer_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  from_admin boolean NOT NULL DEFAULT false,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 5000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.influencer_messages TO authenticated;
GRANT ALL ON public.influencer_messages TO service_role;
ALTER TABLE public.influencer_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage influencer messages" ON public.influencer_messages FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "Influencer reads own messages" ON public.influencer_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.influencers i WHERE i.id = influencer_id AND i.user_id = auth.uid()));
CREATE POLICY "Influencer writes own messages" ON public.influencer_messages FOR INSERT TO authenticated
  WITH CHECK (from_admin = false AND read_at IS NULL AND EXISTS (SELECT 1 FROM public.influencers i WHERE i.id = influencer_id AND i.user_id = auth.uid()));
CREATE INDEX influencer_messages_by_influencer ON public.influencer_messages (influencer_id, created_at);

CREATE POLICY "Influencer reads own signatures" ON public.influencer_signatures FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.influencers i WHERE i.id = influencer_id AND i.user_id = auth.uid()));

CREATE POLICY "Influencers read influencer documents" ON public.documents FOR SELECT TO authenticated
  USING (slug LIKE 'influencer-%' AND EXISTS (SELECT 1 FROM public.influencers i WHERE i.user_id = auth.uid()));
CREATE POLICY "Influencers read influencer document versions" ON public.document_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.documents d JOIN public.influencers i ON i.user_id = auth.uid()
                 WHERE d.id = document_versions.document_id AND d.slug LIKE 'influencer-%'));