CREATE TABLE public.creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  application_id uuid,
  track text NOT NULL DEFAULT 'ugc',
  full_name text NOT NULL,
  email text NOT NULL,
  country text,
  assigned_hm_id uuid REFERENCES public.profiles(id),
  weekly_target integer NOT NULL DEFAULT 3,
  status text NOT NULL DEFAULT 'invited',
  invite_token text UNIQUE DEFAULT encode(gen_random_bytes(18),'hex'),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creators TO authenticated;
GRANT ALL ON public.creators TO service_role;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage creators" ON public.creators FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creator reads self" ON public.creators FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  hook text,
  status text NOT NULL DEFAULT 'draft',
  due_date date,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.briefs TO authenticated;
GRANT ALL ON public.briefs TO service_role;
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage briefs" ON public.briefs FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creators read published briefs" ON public.briefs FOR SELECT TO authenticated
  USING (status = 'published' AND EXISTS (SELECT 1 FROM public.creators c WHERE c.user_id = auth.uid()));

CREATE TABLE public.creator_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  brief_id uuid REFERENCES public.briefs(id) ON DELETE SET NULL,
  platform text NOT NULL DEFAULT 'tiktok',
  url text NOT NULL,
  posted_on date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'pending',
  feedback text,
  views integer,
  likes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_posts TO authenticated;
GRANT ALL ON public.creator_posts TO service_role;
ALTER TABLE public.creator_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage posts" ON public.creator_posts FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creator reads own posts" ON public.creator_posts FOR SELECT TO authenticated
  USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));
CREATE POLICY "creator logs own posts" ON public.creator_posts FOR INSERT TO authenticated
  WITH CHECK (status = 'pending' AND creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

CREATE TABLE public.creator_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  starts_at timestamptz NOT NULL,
  link text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_calls TO authenticated;
GRANT ALL ON public.creator_calls TO service_role;
ALTER TABLE public.creator_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage calls" ON public.creator_calls FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creators read calls" ON public.creator_calls FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.creators c WHERE c.user_id = auth.uid()));