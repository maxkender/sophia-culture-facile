CREATE TABLE public.pay_zones (
  zone text PRIMARY KEY CHECK (zone IN ('A','B','C')),
  trial_amount numeric NOT NULL,
  monthly_amount numeric NOT NULL,
  ceiling_amount numeric,
  posts_per_day integer NOT NULL DEFAULT 2,
  currency text NOT NULL DEFAULT 'USD',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pay_zones TO authenticated;
GRANT ALL ON public.pay_zones TO service_role;
ALTER TABLE public.pay_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage pay zones" ON public.pay_zones FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TABLE public.country_zones (
  country_code text PRIMARY KEY,
  country_name text NOT NULL,
  zone text NOT NULL REFERENCES public.pay_zones(zone) ON UPDATE CASCADE,
  ceiling_applies boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.country_zones TO authenticated;
GRANT ALL ON public.country_zones TO service_role;
ALTER TABLE public.country_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage country zones" ON public.country_zones FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

ALTER TABLE public.slideshow_applications
  ADD COLUMN zone text,
  ADD COLUMN zone_override boolean NOT NULL DEFAULT false,
  ADD COLUMN zone_note text,
  ADD COLUMN guide_token text UNIQUE,
  ADD COLUMN guide_zone_shown text,
  ADD COLUMN guide_figures_shown jsonb,
  ADD COLUMN guide_opened_at timestamptz;

-- Country is stored as a display name (FR or EN) or code; match any of them.
CREATE OR REPLACE FUNCTION public.lookup_country_zone(_country text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT cz.zone FROM public.country_zones cz
  WHERE lower(trim(_country)) IN (lower(cz.country_code), lower(cz.country_name))
     OR lower(trim(_country)) = ANY (
       SELECT lower(x) FROM unnest(CASE cz.country_code
         WHEN 'FR' THEN ARRAY['France'] WHEN 'NL' THEN ARRAY['Pays-Bas'] WHEN 'DE' THEN ARRAY['Allemagne']
         WHEN 'BE' THEN ARRAY['Belgique'] WHEN 'AT' THEN ARRAY['Autriche'] WHEN 'IE' THEN ARRAY['Irlande']
         WHEN 'GB' THEN ARRAY['Royaume-Uni','UK'] WHEN 'DK' THEN ARRAY['Danemark'] WHEN 'NO' THEN ARRAY['Norvège']
         WHEN 'SE' THEN ARRAY['Suède'] WHEN 'FI' THEN ARRAY['Finlande'] WHEN 'IS' THEN ARRAY['Islande']
         WHEN 'LU' THEN ARRAY['Luxembourg'] WHEN 'CH' THEN ARRAY['Suisse'] WHEN 'US' THEN ARRAY['États-Unis','USA']
         WHEN 'CA' THEN ARRAY['Canada'] WHEN 'AU' THEN ARRAY['Australie'] WHEN 'NZ' THEN ARRAY['Nouvelle-Zélande']
         WHEN 'JP' THEN ARRAY['Japon'] WHEN 'SG' THEN ARRAY['Singapour'] WHEN 'ES' THEN ARRAY['Espagne']
         WHEN 'IT' THEN ARRAY['Italie'] WHEN 'PT' THEN ARRAY['Portugal'] WHEN 'GR' THEN ARRAY['Grèce']
         WHEN 'PL' THEN ARRAY['Pologne'] WHEN 'CZ' THEN ARRAY['Tchéquie','Czech Republic'] WHEN 'SK' THEN ARRAY['Slovaquie']
         WHEN 'HU' THEN ARRAY['Hongrie'] WHEN 'SI' THEN ARRAY['Slovénie'] WHEN 'HR' THEN ARRAY['Croatie']
         WHEN 'EE' THEN ARRAY['Estonie'] WHEN 'LV' THEN ARRAY['Lettonie'] WHEN 'LT' THEN ARRAY['Lituanie']
         WHEN 'IL' THEN ARRAY['Israël'] WHEN 'KR' THEN ARRAY['Corée du Sud'] WHEN 'AE' THEN ARRAY['Émirats arabes unis']
         WHEN 'CL' THEN ARRAY['Chili'] WHEN 'UY' THEN ARRAY['Uruguay'] WHEN 'RO' THEN ARRAY['Roumanie']
         WHEN 'BG' THEN ARRAY['Bulgarie'] WHEN 'RS' THEN ARRAY['Serbie'] WHEN 'UA' THEN ARRAY['Ukraine']
         WHEN 'GE' THEN ARRAY['Géorgie'] WHEN 'AM' THEN ARRAY['Arménie'] WHEN 'TR' THEN ARRAY['Turquie','Türkiye']
         WHEN 'MX' THEN ARRAY['Mexique'] WHEN 'CO' THEN ARRAY['Colombie'] WHEN 'BR' THEN ARRAY['Brésil']
         WHEN 'AR' THEN ARRAY['Argentine'] WHEN 'ZA' THEN ARRAY['Afrique du Sud'] WHEN 'MA' THEN ARRAY['Maroc']
         WHEN 'MY' THEN ARRAY['Malaisie'] WHEN 'TH' THEN ARRAY['Thaïlande'] WHEN 'VN' THEN ARRAY['Viêt Nam','Vietnam']
         WHEN 'PH' THEN ARRAY['Philippines'] WHEN 'IN' THEN ARRAY['Inde'] WHEN 'ID' THEN ARRAY['Indonésie']
         ELSE ARRAY[]::text[] END) x)
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.set_slideshow_zone()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT NEW.zone_override THEN
    NEW.zone := public.lookup_country_zone(NEW.country);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER slideshow_zone BEFORE INSERT OR UPDATE ON public.slideshow_applications
FOR EACH ROW EXECUTE FUNCTION public.set_slideshow_zone();

CREATE OR REPLACE FUNCTION public.refresh_slideshow_zones()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.slideshow_applications SET zone = public.lookup_country_zone(country)
   WHERE NOT zone_override AND zone IS DISTINCT FROM public.lookup_country_zone(country);
  RETURN NULL;
END $$;
CREATE TRIGGER country_zones_refresh AFTER INSERT OR UPDATE OR DELETE ON public.country_zones
FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_slideshow_zones();

INSERT INTO public.pay_zones (zone, trial_amount, monthly_amount, ceiling_amount, posts_per_day) VALUES
('A',15,60,80,2),('B',11,42,NULL,2),('C',7,27,NULL,2);

INSERT INTO public.country_zones (country_code, country_name, zone, ceiling_applies) VALUES
('FR','France','A',false),('NL','Netherlands','A',false),('DE','Germany','A',false),('BE','Belgium','A',false),
('AT','Austria','A',false),('IE','Ireland','A',false),('GB','United Kingdom','A',false),('DK','Denmark','A',true),
('NO','Norway','A',true),('SE','Sweden','A',false),('FI','Finland','A',false),('IS','Iceland','A',true),
('LU','Luxembourg','A',true),('CH','Switzerland','A',true),('US','United States','A',true),('CA','Canada','A',false),
('AU','Australia','A',false),('NZ','New Zealand','A',false),('JP','Japan','A',false),('SG','Singapore','A',false),
('ES','Spain','B',false),('IT','Italy','B',false),('PT','Portugal','B',false),('GR','Greece','B',false),
('PL','Poland','B',false),('CZ','Czechia','B',false),('SK','Slovakia','B',false),('HU','Hungary','B',false),
('SI','Slovenia','B',false),('HR','Croatia','B',false),('EE','Estonia','B',false),('LV','Latvia','B',false),
('LT','Lithuania','B',false),('IL','Israel','B',false),('KR','South Korea','B',false),('AE','United Arab Emirates','B',false),
('CL','Chile','B',false),('UY','Uruguay','B',false),
('RO','Romania','C',false),('BG','Bulgaria','C',false),('RS','Serbia','C',false),('UA','Ukraine','C',false),
('GE','Georgia','C',false),('AM','Armenia','C',false),('TR','Turkey','C',false),('MX','Mexico','C',false),
('CO','Colombia','C',false),('BR','Brazil','C',false),('AR','Argentina','C',false),('ZA','South Africa','C',false),
('MA','Morocco','C',false),('MY','Malaysia','C',false),('TH','Thailand','C',false),('VN','Vietnam','C',false),
('PH','Philippines','C',false),('IN','India','C',false),('ID','Indonesia','C',false);

UPDATE public.slideshow_applications SET zone = public.lookup_country_zone(country) WHERE NOT zone_override;