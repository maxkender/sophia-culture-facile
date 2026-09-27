-- Rates per track and country (country NULL = default rate for the track)
CREATE TABLE public.creator_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track text NOT NULL CHECK (track IN ('ugc','slideshow')),
  country text,
  rate_usd numeric NOT NULL CHECK (rate_usd >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (track, country)
);
GRANT SELECT ON public.creator_rates TO authenticated;
GRANT ALL ON public.creator_rates TO service_role;
ALTER TABLE public.creator_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage rates" ON public.creator_rates FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "Creators read rates" ON public.creator_rates FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.creators c WHERE c.user_id = auth.uid()));

-- Payout profile per creator (Stripe Connect / PayPal / Wise details)
CREATE TABLE public.creator_payout_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE UNIQUE,
  method text NOT NULL DEFAULT 'stripe' CHECK (method IN ('stripe','paypal','wise')),
  stripe_account_id text,
  stripe_onboarded boolean NOT NULL DEFAULT false,
  paypal_email text,
  wise_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.creator_payout_profiles TO authenticated;
GRANT ALL ON public.creator_payout_profiles TO service_role;
ALTER TABLE public.creator_payout_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage payout profiles" ON public.creator_payout_profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "Creators read own payout profile" ON public.creator_payout_profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.creators c WHERE c.id = creator_id AND c.user_id = auth.uid()));
CREATE POLICY "Creators update own payout profile" ON public.creator_payout_profiles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.creators c WHERE c.id = creator_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.creators c WHERE c.id = creator_id AND c.user_id = auth.uid()));

-- Monthly payout batches
CREATE TABLE public.payout_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period text NOT NULL UNIQUE, -- e.g. '2026-09'
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','paid')),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.payout_batches TO authenticated;
GRANT ALL ON public.payout_batches TO service_role;
ALTER TABLE public.payout_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage batches" ON public.payout_batches FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- One line per creator per batch
CREATE TABLE public.payout_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.payout_batches(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  posts_count integer NOT NULL DEFAULT 0,
  rate_usd numeric NOT NULL DEFAULT 0,
  amount_usd numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','skipped')),
  stripe_transfer_id text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, creator_id)
);
GRANT SELECT, INSERT, UPDATE ON public.payout_items TO authenticated;
GRANT ALL ON public.payout_items TO service_role;
ALTER TABLE public.payout_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage payout items" ON public.payout_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "Creators read own payout items" ON public.payout_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.creators c WHERE c.id = creator_id AND c.user_id = auth.uid()));