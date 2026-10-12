ALTER TABLE public.notion_items ADD COLUMN imported_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.notion_items ADD COLUMN inspiration_ids uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE public.notion_items ADD COLUMN profile_status text;
ALTER TABLE public.notion_items ADD COLUMN profile_target integer;
ALTER TABLE public.notion_items ADD COLUMN profile_started_at timestamptz;
ALTER TABLE public.ugc_settings ADD COLUMN notion_videos_per_profile integer NOT NULL DEFAULT 10;
ALTER TABLE public.inspirations ADD COLUMN no_audio boolean NOT NULL DEFAULT false;