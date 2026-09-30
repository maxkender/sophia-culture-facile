CREATE TABLE public.apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  logo_path text,
  primary_color text,
  accent_color text,
  domain text,
  app_store_url text,
  play_store_url text,
  taap_url text,
  short_description text,
  users_line text,
  creators_line text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.apps TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.apps TO authenticated;
GRANT ALL ON public.apps TO service_role;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads apps" ON public.apps FOR SELECT USING (true);
CREATE POLICY "admins manage apps" ON public.apps FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

INSERT INTO public.apps (id, slug, name, tagline, primary_color, accent_color, domain, app_store_url, play_store_url, taap_url, short_description, users_line, creators_line)
VALUES
('00000000-0000-4000-8000-000000000001','sophia','Sophia','General knowledge, one course a day','#14213d','#fca311','sophia-culture.com',
 'https://apps.apple.com/app/sophia-culture-generale/id6479283452','https://play.google.com/store/apps/details?id=com.sophia.culture',NULL,
 'Sophia is a general-knowledge app: short daily courses on history, science, art and culture, written by teachers, to learn a little every day instead of scrolling.',
 '200,000 active users','a hundred creators already posting'),
('00000000-0000-4000-8000-000000000002','unswipe','UnSwipe','Instagram without the Reels',NULL,NULL,'unswipe.app',NULL,NULL,NULL,
 'UnSwipe gives you Instagram without the endless scroll: your friends'' posts, no Reels, no explore page, no algorithm pulling you back in. For people who want to keep in touch without losing their evenings.',
 NULL,NULL);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['briefs','influencer_briefs','creator_posts','influencer_deals','influencer_offers','creator_rates','slideshow_country_rates','payout_items','influencer_payout_items','reference_videos','creator_applications','slideshow_applications','influencer_applications','access_codes','creator_announcements','creator_social_accounts','creator_weekly_guides']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS app_id uuid NOT NULL DEFAULT ''00000000-0000-4000-8000-000000000001'' REFERENCES public.apps(id)', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (app_id)', t || '_app_id_idx', t);
  END LOOP;
END $$;

ALTER TABLE public.creator_prospects ADD COLUMN IF NOT EXISTS target_app_id uuid REFERENCES public.apps(id);
UPDATE public.creator_prospects p SET target_app_id = a.id FROM public.apps a WHERE lower(coalesce(p.target_app,'sophia')) = a.slug;
UPDATE public.briefs b SET app_id = a.id FROM public.apps a WHERE lower(b.app) = a.slug;
COMMENT ON COLUMN public.briefs.app IS 'DEPRECATED: replaced by app_id';

-- one managed account per creator per app
ALTER TABLE public.creator_social_accounts DROP CONSTRAINT IF EXISTS creator_social_accounts_creator_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS creator_social_accounts_creator_app_key ON public.creator_social_accounts (creator_id, app_id);

CREATE TABLE public.creator_apps (
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  app_id uuid NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused')),
  PRIMARY KEY (creator_id, app_id)
);
CREATE TABLE public.influencer_apps (
  influencer_id uuid NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  app_id uuid NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused')),
  PRIMARY KEY (influencer_id, app_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_apps, public.influencer_apps TO authenticated;
GRANT ALL ON public.creator_apps, public.influencer_apps TO service_role;
ALTER TABLE public.creator_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage creator apps" ON public.creator_apps FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creator reads own apps" ON public.creator_apps FOR SELECT TO authenticated USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));
CREATE POLICY "admins manage influencer apps" ON public.influencer_apps FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "influencer reads own apps" ON public.influencer_apps FOR SELECT TO authenticated USING (influencer_id = public.my_influencer_id());

INSERT INTO public.creator_apps (creator_id, app_id) SELECT id, '00000000-0000-4000-8000-000000000001' FROM public.creators ON CONFLICT DO NOTHING;
INSERT INTO public.influencer_apps (influencer_id, app_id) SELECT id, '00000000-0000-4000-8000-000000000001' FROM public.influencers ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.creator_enrolled(_app uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.creator_apps ca JOIN public.creators c ON c.id = ca.creator_id
    WHERE c.user_id = auth.uid() AND ca.app_id = _app AND ca.status = 'active')
$$;

DROP POLICY IF EXISTS "creators read published briefs" ON public.briefs;
CREATE POLICY "creators read published briefs" ON public.briefs FOR SELECT TO authenticated USING (
  status = 'published' AND public.creator_enrolled(app_id)
  AND EXISTS (SELECT 1 FROM public.creators c JOIN public.creator_signatures s ON s.creator_id = c.id WHERE c.user_id = auth.uid())
  AND (audience = 'all' OR EXISTS (SELECT 1 FROM public.brief_assignments a JOIN public.creators c ON c.id = a.creator_id WHERE a.brief_id = briefs.id AND c.user_id = auth.uid()))
);

CREATE OR REPLACE FUNCTION public.influencer_can_see_brief(_brief_id uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.influencer_briefs b JOIN public.influencers i ON i.user_id = auth.uid()
    WHERE b.id = _brief_id AND (
      EXISTS (SELECT 1 FROM public.influencer_offers o WHERE o.brief_id = b.id AND o.influencer_id = i.id)
      OR (b.status = 'open'
          AND EXISTS (SELECT 1 FROM public.influencer_apps ia WHERE ia.influencer_id = i.id AND ia.app_id = b.app_id AND ia.status = 'active')
          AND (cardinality(b.target_tiers) = 0 OR i.tier = ANY (b.target_tiers))
          AND (cardinality(b.target_niches) = 0 OR b.target_niches && i.niche_tags)
          AND (cardinality(b.target_languages) = 0 OR b.target_languages && i.languages))
    ))
$function$;

-- inherit app from parent rows
CREATE OR REPLACE FUNCTION public.inherit_app_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_TABLE_NAME = 'creator_posts' AND NEW.brief_id IS NOT NULL THEN
    SELECT app_id INTO NEW.app_id FROM public.briefs WHERE id = NEW.brief_id;
  ELSIF TG_TABLE_NAME = 'influencer_offers' THEN
    SELECT app_id INTO NEW.app_id FROM public.influencer_briefs WHERE id = NEW.brief_id;
  ELSIF TG_TABLE_NAME = 'influencer_deals' THEN
    SELECT app_id INTO NEW.app_id FROM public.influencer_briefs WHERE id = NEW.brief_id;
  ELSIF TG_TABLE_NAME = 'influencer_payout_items' THEN
    SELECT app_id INTO NEW.app_id FROM public.influencer_deals WHERE id = NEW.deal_id;
  END IF;
  NEW.app_id := coalesce(NEW.app_id, '00000000-0000-4000-8000-000000000001');
  RETURN NEW;
END $$;
CREATE TRIGGER creator_posts_app BEFORE INSERT OR UPDATE OF brief_id ON public.creator_posts FOR EACH ROW EXECUTE FUNCTION public.inherit_app_id();
CREATE TRIGGER influencer_offers_app BEFORE INSERT ON public.influencer_offers FOR EACH ROW EXECUTE FUNCTION public.inherit_app_id();
CREATE TRIGGER influencer_deals_app BEFORE INSERT ON public.influencer_deals FOR EACH ROW EXECUTE FUNCTION public.inherit_app_id();
CREATE TRIGGER influencer_payout_items_app BEFORE INSERT ON public.influencer_payout_items FOR EACH ROW EXECUTE FUNCTION public.inherit_app_id();

UPDATE public.creator_posts p SET app_id = b.app_id FROM public.briefs b WHERE b.id = p.brief_id;

ALTER TABLE public.admin_ui_prefs ADD COLUMN IF NOT EXISTS creators_app text NOT NULL DEFAULT 'all';