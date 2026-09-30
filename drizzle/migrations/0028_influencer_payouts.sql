CREATE TABLE public.influencer_payout_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.influencer_deals(id) ON DELETE CASCADE,
  influencer_id uuid NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  part text NOT NULL DEFAULT 'full' CHECK (part IN ('full','acceptance','posting')),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'EUR',
  method text NOT NULL DEFAULT 'stripe',
  payee text NOT NULL DEFAULT 'influencer' CHECK (payee IN ('influencer','agency')),
  status text NOT NULL DEFAULT 'due' CHECK (status IN ('due','invoiced','paid','cancelled')),
  invoice_id uuid REFERENCES public.influencer_invoices(id) ON DELETE SET NULL,
  paid_on date,
  paid_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deal_id, part)
);
GRANT SELECT ON public.influencer_payout_items TO authenticated;
GRANT ALL ON public.influencer_payout_items TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.influencer_payout_items TO authenticated;
ALTER TABLE public.influencer_payout_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage influencer payout items" ON public.influencer_payout_items FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "Influencer reads own payout items" ON public.influencer_payout_items FOR SELECT TO authenticated USING (influencer_id = public.my_influencer_id());
CREATE POLICY "Influencer reads own invoices" ON public.influencer_invoices FOR SELECT TO authenticated USING (influencer_id = public.my_influencer_id());
CREATE POLICY "Influencer reads own attribution" ON public.influencer_attribution FOR SELECT TO authenticated USING (influencer_id = public.my_influencer_id());