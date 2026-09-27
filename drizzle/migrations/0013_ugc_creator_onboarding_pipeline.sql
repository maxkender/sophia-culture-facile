ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS motivation_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS social_account_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS social_handle text,
  ADD COLUMN IF NOT EXISTS social_bio text,
  ADD COLUMN IF NOT EXISTS profile_picture_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_sent_at timestamptz;

ALTER TABLE public.creator_applications
  ADD COLUMN IF NOT EXISTS created_creator_id uuid REFERENCES public.creators(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS acceptance_email_sent_at timestamptz;

CREATE TABLE IF NOT EXISTS public.creator_email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE CHECK (template_key = 'ugc-acceptance'),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 160),
  intro text NOT NULL CHECK (char_length(intro) BETWEEN 1 AND 3000),
  instructions text NOT NULL CHECK (char_length(instructions) BETWEEN 1 AND 5000),
  button_label text NOT NULL CHECK (char_length(button_label) BETWEEN 1 AND 80),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.creator_email_settings TO authenticated;
GRANT ALL ON public.creator_email_settings TO service_role;

ALTER TABLE public.creator_email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read creator email settings"
ON public.creator_email_settings FOR SELECT TO authenticated
USING (private.is_admin());

CREATE POLICY "Admins insert creator email settings"
ON public.creator_email_settings FOR INSERT TO authenticated
WITH CHECK (private.is_admin());

CREATE POLICY "Admins update creator email settings"
ON public.creator_email_settings FOR UPDATE TO authenticated
USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TRIGGER creator_email_settings_updated_at
BEFORE UPDATE ON public.creator_email_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.creator_email_settings (template_key, subject, intro, instructions, button_label)
VALUES (
  'ugc-acceptance',
  'Welcome to the Sophia creator team',
  'Good news — your UGC creator application has been accepted. We would love to welcome you to the Sophia team.',
  'Use the secure link below to choose your password and open your creator space. Your onboarding checklist will guide you through the examples, agreement, Sophia account setup and first post.',
  'Create my creator account'
)
ON CONFLICT (template_key) DO NOTHING;

CREATE INDEX IF NOT EXISTS creators_application_id_idx ON public.creators(application_id);
CREATE INDEX IF NOT EXISTS creator_applications_created_creator_id_idx ON public.creator_applications(created_creator_id);