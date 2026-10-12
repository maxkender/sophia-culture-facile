CREATE TABLE public.inspiration_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  handle text NOT NULL,
  url text NOT NULL,
  display_name text,
  avatar_path text,
  followers bigint,
  notion_page_id text UNIQUE,
  notes text,
  app_ids text[] NOT NULL DEFAULT '{}',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  refreshed_at timestamptz,
  UNIQUE (platform, handle)
);
GRANT SELECT ON public.inspiration_accounts TO authenticated;
GRANT ALL ON public.inspiration_accounts TO service_role;
ALTER TABLE public.inspiration_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read accounts" ON public.inspiration_accounts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
COMMENT ON COLUMN public.ugc_settings.notion_videos_per_profile IS 'DEPRECATED: profile video import cancelled';
COMMENT ON COLUMN public.notion_items.profile_target IS 'DEPRECATED: profile video import cancelled';