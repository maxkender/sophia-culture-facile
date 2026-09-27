CREATE TABLE public.reference_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  platform text NOT NULL DEFAULT 'tiktok',
  category text NOT NULL DEFAULT 'hook',
  note text,
  pinned boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reference_videos TO authenticated;
GRANT ALL ON public.reference_videos TO service_role;
ALTER TABLE public.reference_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage refs" ON public.reference_videos FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creators read refs" ON public.reference_videos FOR SELECT TO authenticated
  USING (active AND EXISTS (SELECT 1 FROM public.creators c WHERE c.user_id = auth.uid()));
ALTER TABLE public.creator_posts ADD COLUMN reference_video_id uuid REFERENCES public.reference_videos(id) ON DELETE SET NULL;