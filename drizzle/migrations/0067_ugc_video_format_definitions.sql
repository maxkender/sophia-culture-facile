CREATE TABLE public.ugc_formats (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 key text NOT NULL UNIQUE CHECK (key IN ('reaction_demo','broll_stickers','sole_footage','talked_hook_demo','educational')),
 name_fr text NOT NULL, name_en text NOT NULL,
 description text NOT NULL DEFAULT '', when_to_use text NOT NULL DEFAULT '',
 structure jsonb NOT NULL DEFAULT '{"shots":[]}'::jsonb,
 tips text NOT NULL DEFAULT '', example_inspiration_ids uuid[] NOT NULL DEFAULT '{}',
 sort_order integer NOT NULL DEFAULT 0,
 CHECK (cardinality(example_inspiration_ids) <= 3)
);
GRANT SELECT, UPDATE ON public.ugc_formats TO authenticated;
GRANT ALL ON public.ugc_formats TO service_role;
ALTER TABLE public.ugc_formats ENABLE ROW LEVEL SECURITY;
CREATE POLICY ugc_formats_read ON public.ugc_formats FOR SELECT TO authenticated USING (true);
CREATE POLICY ugc_formats_admin_update ON public.ugc_formats FOR UPDATE TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
COMMENT ON TABLE public.ugc_formats IS 'Five fixed UGC video format definitions; never brief templates. Admin edits guidance and shot structure, authenticated creators read.';