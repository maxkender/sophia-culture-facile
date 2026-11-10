ALTER TABLE public.slideshow_applications
 ADD COLUMN IF NOT EXISTS utm_source text,
 ADD COLUMN IF NOT EXISTS utm_medium text,
 ADD COLUMN IF NOT EXISTS utm_campaign text,
 ADD COLUMN IF NOT EXISTS utm_content text,
 ADD COLUMN IF NOT EXISTS utm_term text,
 ADD COLUMN IF NOT EXISTS fbclid text,
 ADD COLUMN IF NOT EXISTS landing_url text,
 ADD COLUMN IF NOT EXISTS source text,
 ADD COLUMN IF NOT EXISTS marketing_consent jsonb,
 ADD COLUMN IF NOT EXISTS meta_event_id uuid;
CREATE OR REPLACE FUNCTION public.slideshow_attribution_source() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 NEW.source := CASE WHEN nullif(trim(NEW.ref), '') IS NOT NULL THEN 'referral'
 WHEN lower(trim(coalesce(NEW.utm_source, ''))) IN ('facebook','fb','instagram','ig','meta') OR nullif(trim(NEW.fbclid), '') IS NOT NULL THEN 'meta'
 WHEN coalesce(NEW.utm_source, NEW.utm_medium, NEW.utm_campaign, NEW.utm_content, NEW.utm_term) IS NOT NULL THEN 'other_utm'
 ELSE 'direct' END;
 RETURN NEW;
END; $$;
CREATE TRIGGER slideshow_attribution_source BEFORE INSERT OR UPDATE OF ref,utm_source,utm_medium,utm_campaign,utm_content,utm_term,fbclid,source ON public.slideshow_applications FOR EACH ROW EXECUTE FUNCTION public.slideshow_attribution_source();
UPDATE public.slideshow_applications SET source = CASE WHEN nullif(trim(ref), '') IS NOT NULL THEN 'referral' ELSE 'direct' END WHERE source IS NULL;