DO $$ BEGIN CREATE TYPE public.brief_style AS ENUM ('reaction_demo','broll_stickers','sole_footage','talked_hook_demo','educational'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS style public.brief_style;
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS style_data jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.briefs SET style = CASE
  WHEN effort = 'reaction' THEN 'reaction_demo'::public.brief_style
  WHEN effort = 'pov' THEN 'sole_footage'::public.brief_style
  WHEN effort = 'talking_head' AND id IN ('a9e73fdf-f35e-4990-befa-b135595310a1','40cc3875-3c28-46cb-8ff0-d8e26eadf9b9','6d81ea1f-0771-4bac-a7ed-84f1e867857d','f75c4bb6-0ccf-4291-8cfd-ac646c48636c','777415e3-6916-4b8c-be27-135cb043602e','4945638e-89c6-43c3-8200-bf8da75138f6') THEN 'talked_hook_demo'::public.brief_style
  WHEN effort = 'talking_head' THEN 'educational'::public.brief_style
END
WHERE brief_type = 'format' AND style IS NULL;

CREATE TABLE IF NOT EXISTS public.brief_snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('hook','body','cta')),
  text text NOT NULL,
  app_id uuid REFERENCES public.apps(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'fr',
  styles public.brief_style[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  why text,
  source_url text,
  usage_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brief_snippets TO authenticated;
GRANT ALL ON public.brief_snippets TO service_role;
ALTER TABLE public.brief_snippets ENABLE ROW LEVEL SECURITY;
CREATE POLICY snippets_admin_all ON public.brief_snippets FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());