ALTER TABLE public.reference_videos ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.reference_videos ADD COLUMN IF NOT EXISTS why_it_works text;
ALTER TABLE public.reference_videos ADD COLUMN IF NOT EXISTS format_notes text;
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS reference_video_ids uuid[] NOT NULL DEFAULT '{}';