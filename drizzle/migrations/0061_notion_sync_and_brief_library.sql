-- lovable-cron-fallback-reviewed: owner explicitly requires a 10-minute Notion poll; Notion offers no webhook for this internal integration; the handler no-ops without a token or when auto-sync is off.
ALTER TABLE public.inspirations ADD COLUMN IF NOT EXISTS notion_page_id text UNIQUE, ADD COLUMN IF NOT EXISTS notion_notes text, ADD COLUMN IF NOT EXISTS notion_format text;
ALTER TABLE public.ugc_settings ADD COLUMN IF NOT EXISTS notion_database_id text NOT NULL DEFAULT '4926491a-d0cb-4ff6-8401-4c851223d5b9',
  ADD COLUMN IF NOT EXISTS notion_auto boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notion_last_sync timestamptz,
  ADD COLUMN IF NOT EXISTS notion_last_full_sync timestamptz,
  ADD COLUMN IF NOT EXISTS notion_last_error text;
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS inspiration_id uuid REFERENCES public.inspirations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
DROP TRIGGER IF EXISTS briefs_set_updated_at ON public.briefs;
CREATE TRIGGER briefs_set_updated_at BEFORE UPDATE ON public.briefs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.notion_items (
  notion_page_id text PRIMARY KEY,
  url text,
  norm_key text,
  kind text NOT NULL DEFAULT 'other' CHECK (kind IN ('video','profile','other')),
  inspiration_id uuid REFERENCES public.inspirations(id) ON DELETE SET NULL,
  hub_status text,
  error text,
  notion_props jsonb NOT NULL DEFAULT '{}'::jsonb,
  notion_last_edited timestamptz,
  pushed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notion_items TO authenticated;
GRANT ALL ON public.notion_items TO service_role;
ALTER TABLE public.notion_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY notion_items_admin_all ON public.notion_items FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE TRIGGER notion_items_set_updated_at BEFORE UPDATE ON public.notion_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DO $$ BEGIN
  PERFORM cron.unschedule('ugc-notion-sync') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ugc-notion-sync');
  PERFORM cron.schedule('ugc-notion-sync', '*/10 * * * *', $c$select net.http_post(url := 'https://project--d2a94640-0eb5-45b3-b9c3-fa235b3dabd0.lovable.app/api/public/cron/ugc/notion-sync', headers := jsonb_build_object('x-cron-secret', (select cron_token from public.ugc_settings where id = 1), 'content-type','application/json'), timeout_milliseconds := 120000)$c$);
END $$;