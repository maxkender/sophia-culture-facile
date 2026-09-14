
CREATE OR REPLACE FUNCTION public.unaccent_fallback(value text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT translate(
    value,
    'àáâãäåçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŒœ',
    'aaaaaaceeeeiiiinooooouuuuyyAAAAAACEEEEIIIINOOOOOUUUUYOo');
$$;

CREATE OR REPLACE FUNCTION public.slugify(value text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT trim(both '-' from regexp_replace(
    lower(public.unaccent_fallback(value)), '[^a-z0-9]+', '-', 'g'));
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS short_bio text,
  ADD COLUMN IF NOT EXISTS orcid text,
  ADD COLUMN IF NOT EXISTS personal_site text,
  ADD COLUMN IF NOT EXISTS scholar_url text,
  ADD COLUMN IF NOT EXISTS public_slug text;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_short_bio_len
    CHECK (short_bio IS NULL OR char_length(short_bio) <= 300);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS public_full_text boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_key ON public.courses (slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_public_slug_key ON public.profiles (public_slug) WHERE public_slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.education_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  degree text,
  field text,
  institution text,
  year text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.education_records TO authenticated;
GRANT ALL ON public.education_records TO service_role;

ALTER TABLE public.education_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authors manage their own education records"
    ON public.education_records FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage all education records"
    ON public.education_records FOR ALL TO authenticated
    USING (private.is_admin()) WITH CHECK (private.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS education_records_profile_idx ON public.education_records (profile_id, order_index);

UPDATE public.profiles SET display_name = full_name WHERE display_name IS NULL;

UPDATE public.profiles p SET public_slug = s.candidate
FROM (
  SELECT id, public.slugify(full_name) || CASE WHEN row_number() OVER (PARTITION BY public.slugify(full_name) ORDER BY created_at) > 1
    THEN '-' || left(replace(id::text,'-',''), 4) ELSE '' END AS candidate
  FROM public.profiles
) s
WHERE p.id = s.id AND p.public_slug IS NULL AND s.candidate <> '';

UPDATE public.courses c SET slug = s.candidate
FROM (
  SELECT id, public.slugify(title) || CASE WHEN row_number() OVER (PARTITION BY public.slugify(title) ORDER BY created_at) > 1
    THEN '-' || left(replace(id::text,'-',''), 4) ELSE '' END AS candidate
  FROM public.courses
) s
WHERE c.id = s.id AND c.slug IS NULL AND s.candidate <> '';
