ALTER TABLE public.slideshow_applications ADD COLUMN IF NOT EXISTS source_declared boolean DEFAULT false;
CREATE OR REPLACE FUNCTION public.slideshow_attribution_source() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE declared_source text;
BEGIN
 declared_source := CASE WHEN NEW.referral_source = 'In the Sophia app' THEN 'sophia_app' WHEN NEW.referral_source = 'Instagram / Facebook ad' THEN 'meta' ELSE NULL END;
 NEW.source_declared := false;
 NEW.source := CASE WHEN nullif(trim(NEW.ref), '') IS NOT NULL THEN 'referral'
 WHEN lower(trim(coalesce(NEW.utm_source, ''))) IN ('facebook','fb','instagram','ig','meta') OR nullif(trim(NEW.fbclid), '') IS NOT NULL THEN 'meta'
 WHEN lower(trim(coalesce(NEW.utm_source, ''))) = 'sophia_app' THEN 'sophia_app'
 WHEN nullif(trim(NEW.utm_source), '') IS NULL AND declared_source IS NOT NULL THEN declared_source
 WHEN coalesce(nullif(trim(NEW.utm_source),''),nullif(trim(NEW.utm_medium),''),nullif(trim(NEW.utm_campaign),''),nullif(trim(NEW.utm_content),''),nullif(trim(NEW.utm_term),'')) IS NOT NULL THEN 'other_utm'
 ELSE 'direct' END;
 NEW.source_declared := nullif(trim(NEW.ref), '') IS NULL AND nullif(trim(NEW.utm_source), '') IS NULL AND nullif(trim(NEW.fbclid), '') IS NULL AND declared_source IS NOT NULL;
 RETURN NEW;
END; $$;
CREATE TRIGGER slideshow_declared_source BEFORE UPDATE OF referral_source,source_declared ON public.slideshow_applications FOR EACH ROW EXECUTE FUNCTION public.slideshow_attribution_source();
UPDATE public.slideshow_applications SET source = source;