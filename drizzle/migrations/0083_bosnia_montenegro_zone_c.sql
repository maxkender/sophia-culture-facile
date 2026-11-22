INSERT INTO public.country_zones (country_code, country_name, zone, ceiling_applies) VALUES
('BA','Bosnia and Herzegovina','C',false),('ME','Montenegro','C',false);

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
         WHEN 'BA' THEN ARRAY['Bosnie-Herzégovine','Bosnie','Bosnia'] WHEN 'ME' THEN ARRAY['Monténégro']
         ELSE ARRAY[]::text[] END) x)
  LIMIT 1
$$;