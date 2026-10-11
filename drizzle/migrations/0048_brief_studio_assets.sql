ALTER TABLE public.briefs
  ADD COLUMN IF NOT EXISTS hook_visual text,
  ADD COLUMN IF NOT EXISTS product_second int,
  ADD COLUMN IF NOT EXISTS product_gesture text,
  ADD COLUMN IF NOT EXISTS say_name boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS rules_do text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rules_dont text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rules_text text,
  ADD COLUMN IF NOT EXISTS audience_efforts text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS translation_of uuid REFERENCES public.briefs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_reference_id uuid REFERENCES public.reference_videos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS score int;

ALTER TABLE public.reference_videos
  ADD COLUMN IF NOT EXISTS analysis jsonb,
  ADD COLUMN IF NOT EXISTS score int;

CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('video','image','audio','pdf','text','link')),
  folder text NOT NULL DEFAULT 'references' CHECK (folder IN ('screen_recordings','logos','sounds','broll','captions','references')),
  storage_path text, url text, text_content text,
  title text NOT NULL, tags text[] NOT NULL DEFAULT '{}',
  role_default text NOT NULL DEFAULT 'reference_video',
  duration_s numeric, size_bytes bigint, thumbnail_url text, mime text,
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('ready','to_upload')),
  shot_note text,
  created_by uuid, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assets_app_idx ON public.assets(app_id, folder);
CREATE TABLE public.brief_assets (
  brief_id uuid NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE RESTRICT,
  role text NOT NULL DEFAULT 'reference_video', sort_order int NOT NULL DEFAULT 0,
  PRIMARY KEY (brief_id, asset_id)
);
CREATE TABLE public.campaign_assets (
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE RESTRICT,
  role text NOT NULL DEFAULT 'reference_video', sort_order int NOT NULL DEFAULT 0,
  PRIMARY KEY (campaign_id, asset_id)
);
CREATE TABLE public.creator_assets (
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE RESTRICT,
  role text NOT NULL DEFAULT 'caption_text',
  PRIMARY KEY (creator_id, asset_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets, public.brief_assets, public.campaign_assets, public.creator_assets TO authenticated;
GRANT ALL ON public.assets, public.brief_assets, public.campaign_assets, public.creator_assets TO service_role;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage assets" ON public.assets FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creators read app assets" ON public.assets FOR SELECT TO authenticated USING (status = 'ready' AND public.creator_enrolled(app_id));
CREATE POLICY "admins manage brief assets" ON public.brief_assets FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creators read brief assets" ON public.brief_assets FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.briefs b WHERE b.id = brief_id));
CREATE POLICY "admins manage campaign assets" ON public.campaign_assets FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creators read campaign assets" ON public.campaign_assets FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.assets a WHERE a.id = asset_id));
CREATE POLICY "admins manage creator assets" ON public.creator_assets FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creators read own assets" ON public.creator_assets FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.creators c WHERE c.id = creator_id AND c.user_id = auth.uid()));

CREATE POLICY "admins manage creator-assets files" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'creator-assets' AND private.is_admin()) WITH CHECK (bucket_id = 'creator-assets' AND private.is_admin());