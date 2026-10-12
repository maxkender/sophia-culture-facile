CREATE TABLE public.creator_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  brief_id uuid NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  app_id uuid,
  version integer NOT NULL DEFAULT 1,
  video_path text,
  link_url text,
  note text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','validated','changes_requested')),
  admin_comment text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (video_path IS NOT NULL OR link_url IS NOT NULL),
  UNIQUE (creator_id, brief_id, version)
);
CREATE INDEX creator_drafts_status_idx ON public.creator_drafts (status, created_at DESC);
GRANT SELECT, INSERT ON public.creator_drafts TO authenticated;
GRANT UPDATE, DELETE ON public.creator_drafts TO authenticated;
GRANT ALL ON public.creator_drafts TO service_role;
ALTER TABLE public.creator_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage drafts" ON public.creator_drafts FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creator reads own drafts" ON public.creator_drafts FOR SELECT TO authenticated USING (creator_id IN (SELECT c.id FROM public.creators c WHERE c.user_id = auth.uid()));
CREATE POLICY "creator sends own drafts" ON public.creator_drafts FOR INSERT TO authenticated WITH CHECK (status = 'submitted' AND admin_comment IS NULL AND reviewed_at IS NULL AND creator_id IN (SELECT c.id FROM public.creators c WHERE c.user_id = auth.uid() AND c.status <> 'pending'));

ALTER TABLE public.creator_posts ADD COLUMN draft_id uuid REFERENCES public.creator_drafts(id) ON DELETE SET NULL;
ALTER TABLE public.ugc_settings ADD COLUMN draft_required boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.ugc_draft_required() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((SELECT draft_required FROM public.ugc_settings WHERE id = 1), true)
$$;
GRANT EXECUTE ON FUNCTION public.ugc_draft_required() TO authenticated;