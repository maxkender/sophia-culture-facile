CREATE TABLE public.creator_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid UNIQUE REFERENCES public.creators(id) ON DELETE CASCADE,
  slideshow_application_id uuid UNIQUE REFERENCES public.slideshow_applications(id) ON DELETE CASCADE,
  variant text NOT NULL CHECK (variant IN ('ugc','slideshow')),
  document_version text NOT NULL,
  signed_name text NOT NULL,
  signature_ip text,
  user_agent text,
  signed_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((creator_id IS NOT NULL) <> (slideshow_application_id IS NOT NULL))
);
GRANT SELECT ON public.creator_signatures TO authenticated;
GRANT ALL ON public.creator_signatures TO service_role;
ALTER TABLE public.creator_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read creator signatures" ON public.creator_signatures FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "Creators read own signature" ON public.creator_signatures FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.creators c WHERE c.id = creator_id AND c.user_id = auth.uid()));

ALTER TABLE public.slideshow_applications ADD COLUMN signing_token text UNIQUE;
ALTER TABLE public.slideshow_applications ADD COLUMN signing_token_created_at timestamptz;
ALTER TABLE public.slideshow_applications ADD COLUMN agreement_signed_at timestamptz;
ALTER TABLE public.creators ADD COLUMN examples_read_at timestamptz;
ALTER TABLE public.creators ADD COLUMN guide_read_at timestamptz;