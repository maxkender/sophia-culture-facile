ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_title text;

ALTER TABLE public.profiles DISABLE TRIGGER USER;

-- Every code currently in the pool was generated as a placeholder, never a real store code.
UPDATE public.profiles SET access_code = NULL, access_redeem_url = NULL WHERE access_code IS NOT NULL;
UPDATE public.access_codes SET assigned_to = NULL WHERE assigned_to IS NOT NULL;
DELETE FROM public.access_codes WHERE id IS NOT NULL;

UPDATE public.profiles SET institution = 'Istanbul University',
  display_title = 'MD, PhD in Medical Genetics. MA in Ancient History, Istanbul University',
  bio = COALESCE(NULLIF(bio, ''), '') ||
        CASE WHEN COALESCE(bio, '') ILIKE '%0000-0002-1967-705X%' THEN '' 
             WHEN COALESCE(bio, '') = '' THEN 'ORCID 0000-0002-1967-705X'
             ELSE ' ORCID 0000-0002-1967-705X' END
  WHERE full_name = 'Ezgi Gizem Berkay';

UPDATE public.profiles SET institution = 'Hiroshima University',
  display_title = 'PhD in Literature, Hiroshima University. University professor'
  WHERE full_name = 'Takahiro Yamamoto';

UPDATE public.profiles SET institution = 'University of Minnesota',
  display_title = 'PhD in Political Science, University of Minnesota. Professor at Saint Xavier University, Chicago'
  WHERE full_name = 'Mark Hoffman';

UPDATE public.profiles SET institution = 'University of Arizona',
  display_title = 'PhD in Sociocultural Anthropology, University of Arizona'
  WHERE full_name = 'Alex Ruuska';

UPDATE public.profiles SET institution = 'Université de Montpellier',
  display_title = 'PhD in Marine Ecology, Université de Montpellier'
  WHERE full_name = 'Raphael Seguin';

UPDATE public.profiles SET institution = 'University of Belgrade',
  display_title = 'MA in Art History, University of Belgrade'
  WHERE full_name = 'Dusan Nikolic';

UPDATE public.profiles SET institution = NULL,
  display_title = 'PhD in Chemistry. Senior Lecturer in Sustainable Chemistry, Nottingham Trent University'
  WHERE full_name = 'Muhammad Zaheer';

UPDATE public.profiles SET institution = NULL, display_title = 'PhD in Biomedical Sciences'
  WHERE full_name = 'Stacy Jankowski';

UPDATE public.profiles SET institution = NULL, display_title = 'PhD in Molecular Microbiology'
  WHERE full_name = 'Kate Lewis';

UPDATE public.profiles SET institution = NULL, display_title = 'PhD in Philosophy'
  WHERE full_name = 'Simon Lea';

UPDATE public.profiles SET institution = NULL, display_title = NULL
  WHERE full_name IN ('Benjamin Campbell','Myra Houser','Christofer Bolanos Alvarado','Danial Qaurooni','Guido Manuel De La Torre Olvera','Elizabeth Singer Hunt');

ALTER TABLE public.profiles ENABLE TRIGGER USER;