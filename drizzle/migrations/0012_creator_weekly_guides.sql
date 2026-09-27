CREATE TABLE public.creator_weekly_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  track text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_weekly_guides TO authenticated;
GRANT ALL ON public.creator_weekly_guides TO service_role;
ALTER TABLE public.creator_weekly_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage guides" ON public.creator_weekly_guides FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creators read guides" ON public.creator_weekly_guides FOR SELECT TO authenticated
  USING (published AND EXISTS (SELECT 1 FROM public.creators c WHERE c.user_id = auth.uid() AND (creator_weekly_guides.track IS NULL OR c.track = creator_weekly_guides.track)));

CREATE TABLE public.creator_guide_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id uuid NOT NULL REFERENCES public.creator_weekly_guides(id) ON DELETE CASCADE,
  url text,
  file_path text,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_guide_media TO authenticated;
GRANT ALL ON public.creator_guide_media TO service_role;
ALTER TABLE public.creator_guide_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage guide media" ON public.creator_guide_media FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creators read guide media" ON public.creator_guide_media FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.creator_weekly_guides g WHERE g.id = guide_id));

CREATE POLICY "admins manage guide files" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'guide-media' AND private.is_admin()) WITH CHECK (bucket_id = 'guide-media' AND private.is_admin());
CREATE POLICY "creators read guide files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'guide-media' AND EXISTS (SELECT 1 FROM public.creators c WHERE c.user_id = auth.uid()));