ALTER TABLE public.notion_items ADD COLUMN deleted_at timestamptz;
ALTER TABLE public.notion_items ADD COLUMN deleted_kind text;