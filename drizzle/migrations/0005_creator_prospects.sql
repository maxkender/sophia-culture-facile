CREATE TABLE public.creator_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  handle text,
  email text,
  platform text NOT NULL DEFAULT 'tiktok',
  country text,
  status text NOT NULL DEFAULT 'new',
  next_action_on date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_prospects TO authenticated;
GRANT ALL ON public.creator_prospects TO service_role;
ALTER TABLE public.creator_prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage prospects" ON public.creator_prospects FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TABLE public.prospect_touches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES public.creator_prospects(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'dm',
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospect_touches TO authenticated;
GRANT ALL ON public.prospect_touches TO service_role;
ALTER TABLE public.prospect_touches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage touches" ON public.prospect_touches FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE OR REPLACE FUNCTION public.match_prospect_ugc() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.creator_prospects SET status = 'applied'
   WHERE status <> 'applied' AND ((email IS NOT NULL AND lower(email) = lower(NEW.email))
     OR (handle IS NOT NULL AND NEW.tiktok_url IS NOT NULL AND NEW.tiktok_url ILIKE '%' || ltrim(handle,'@') || '%'));
  RETURN NEW;
END $$;
CREATE TRIGGER match_prospect_ugc AFTER INSERT ON public.creator_applications FOR EACH ROW EXECUTE FUNCTION public.match_prospect_ugc();

CREATE OR REPLACE FUNCTION public.match_prospect_slideshow() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.creator_prospects SET status = 'applied'
   WHERE status <> 'applied' AND email IS NOT NULL AND lower(email) = lower(NEW.email);
  RETURN NEW;
END $$;
CREATE TRIGGER match_prospect_slideshow AFTER INSERT ON public.slideshow_applications FOR EACH ROW EXECUTE FUNCTION public.match_prospect_slideshow();