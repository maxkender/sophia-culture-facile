CREATE TABLE public.hiring_managers (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  countries text[] NOT NULL DEFAULT '{}',
  tracks text[] NOT NULL DEFAULT '{slideshow}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.hub_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hiring_managers, public.hub_settings TO authenticated;
GRANT ALL ON public.hiring_managers, public.hub_settings TO service_role;
ALTER TABLE public.hiring_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage hiring managers" ON public.hiring_managers FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "admins manage hub settings" ON public.hub_settings FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());