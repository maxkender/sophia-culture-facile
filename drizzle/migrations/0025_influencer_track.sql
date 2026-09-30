CREATE TABLE public.influencer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL, email text NOT NULL, phone text NOT NULL, country text NOT NULL, city text NOT NULL,
  age integer NOT NULL CHECK (age >= 18),
  tiktok_url text, tiktok_followers integer, instagram_url text, instagram_followers integer,
  youtube_url text, youtube_subscribers integer,
  niche_tags text[] NOT NULL DEFAULT '{}', languages text[] NOT NULL DEFAULT '{}',
  tiktok_avg_views integer, rate_tiktok numeric NOT NULL, rate_reel numeric,
  accepts_recurring text NOT NULL DEFAULT 'depends',
  media_kit_path text, media_kit_url text, proud_links text[] NOT NULL DEFAULT '{}',
  has_agency boolean NOT NULL DEFAULT false, agency_name text, agency_contact text,
  referral_source text, consent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'new', rejection_reason text, admin_notes text,
  assigned_hm_id uuid REFERENCES public.profiles(id), submit_ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(), decided_at timestamptz, decided_by uuid REFERENCES public.profiles(id),
  created_influencer_id uuid
);
GRANT SELECT, UPDATE ON public.influencer_applications TO authenticated;
GRANT ALL ON public.influencer_applications TO service_role;
ALTER TABLE public.influencer_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage influencer applications" ON public.influencer_applications FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TABLE public.influencers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, application_id uuid REFERENCES public.influencer_applications(id),
  display_name text NOT NULL, legal_name text, email text NOT NULL, phone text, country text, city text,
  languages text[] NOT NULL DEFAULT '{}', niche_tags text[] NOT NULL DEFAULT '{}',
  tiktok_url text, tiktok_followers integer, tiktok_avg_views integer,
  instagram_url text, instagram_followers integer, youtube_url text, youtube_subscribers integer,
  tier text NOT NULL DEFAULT 'nano', tier_override boolean NOT NULL DEFAULT false,
  rate_tiktok numeric, rate_reel numeric, rate_youtube numeric, accepts_recurring text,
  agency_name text, agency_contact text, media_kit_path text, media_kit_url text,
  status text NOT NULL DEFAULT 'active', availability text NOT NULL DEFAULT 'available', booked_until date,
  tracked_link text, promo_code text, admin_notes text, assigned_hm_id uuid REFERENCES public.profiles(id),
  invite_token text UNIQUE, invite_sent_at timestamptz,
  rules_accepted_at timestamptz, agreement_signed_at timestamptz, payout_setup_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.influencers TO authenticated;
GRANT ALL ON public.influencers TO service_role;
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage influencers" ON public.influencers FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "Influencer reads own row" ON public.influencers FOR SELECT TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.influencer_applications ADD CONSTRAINT influencer_applications_created_fk FOREIGN KEY (created_influencer_id) REFERENCES public.influencers(id);

CREATE TABLE public.influencer_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  rights_fee_pct jsonb NOT NULL DEFAULT '{"post_only":0,"post_plus_ads_30":25,"post_plus_ads_90":50,"post_plus_raw_180":75}',
  split_threshold numeric NOT NULL DEFAULT 500,
  offer_expiry_days integer NOT NULL DEFAULT 5,
  tier_bounds jsonb NOT NULL DEFAULT '{"micro":10000,"mid":50000,"macro":250000,"top":1000000}',
  niches text[] NOT NULL DEFAULT ARRAY['history','science','culture','books','study','psychology','self-improvement','lifestyle','humour','news','other'],
  disclosure jsonb NOT NULL DEFAULT '{"FR":"\"#collaborationcommerciale\" or \"#publicité\" in the caption, first line."}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.influencer_settings TO authenticated;
GRANT ALL ON public.influencer_settings TO service_role;
ALTER TABLE public.influencer_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in read influencer settings" ON public.influencer_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins update influencer settings" ON public.influencer_settings FOR UPDATE TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TABLE public.influencer_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, angle text, brief_type text NOT NULL DEFAULT 'freestyle', body text NOT NULL DEFAULT '',
  deliverables jsonb NOT NULL DEFAULT '[]', rights_package text NOT NULL DEFAULT 'post_only',
  exclusivity_days integer NOT NULL DEFAULT 0, must_mention text[] NOT NULL DEFAULT '{}',
  reference_video_ids uuid[] NOT NULL DEFAULT '{}', budget_min numeric, budget_max numeric,
  target_tiers text[] NOT NULL DEFAULT '{}', target_niches text[] NOT NULL DEFAULT '{}', target_languages text[] NOT NULL DEFAULT '{}',
  earliest_post_date date, latest_post_date date, draft_approval_required boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft', created_by uuid REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.influencer_briefs TO authenticated;
GRANT ALL ON public.influencer_briefs TO service_role;
ALTER TABLE public.influencer_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage influencer briefs" ON public.influencer_briefs FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TABLE public.influencer_brief_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id uuid NOT NULL REFERENCES public.influencer_briefs(id) ON DELETE CASCADE,
  influencer_id uuid NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (brief_id, influencer_id)
);
GRANT SELECT ON public.influencer_brief_interest TO authenticated;
GRANT ALL ON public.influencer_brief_interest TO service_role;
ALTER TABLE public.influencer_brief_interest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read interest" ON public.influencer_brief_interest FOR SELECT TO authenticated USING (private.is_admin());

CREATE TABLE public.influencer_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id uuid NOT NULL REFERENCES public.influencer_briefs(id) ON DELETE CASCADE,
  influencer_id uuid NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  price numeric NOT NULL, currency text NOT NULL DEFAULT 'EUR', price_breakdown jsonb NOT NULL DEFAULT '{}',
  split_payment boolean NOT NULL DEFAULT false,
  deliverables jsonb NOT NULL DEFAULT '[]', rights_package text NOT NULL, deadline date, message text,
  status text NOT NULL DEFAULT 'sent', counter_price numeric, counter_message text, counter_round integer NOT NULL DEFAULT 0,
  decline_reason text, viewed_at timestamptz, responded_at timestamptz, expires_at timestamptz,
  created_by uuid REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.influencer_offers TO authenticated;
GRANT ALL ON public.influencer_offers TO service_role;
ALTER TABLE public.influencer_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage offers" ON public.influencer_offers FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TABLE public.influencer_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.influencer_offers(id),
  brief_id uuid NOT NULL REFERENCES public.influencer_briefs(id),
  influencer_id uuid NOT NULL REFERENCES public.influencers(id),
  agreed_price numeric NOT NULL, split_payment boolean NOT NULL DEFAULT false,
  rights_package text NOT NULL, deliverables jsonb NOT NULL DEFAULT '[]', deadline date,
  status text NOT NULL DEFAULT 'accepted', deal_sheet_signed_at timestamptz, deal_sheet_signed_name text,
  deal_sheet_snapshot jsonb, spark_ads_code text, cancelled_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.influencer_deals TO authenticated;
GRANT ALL ON public.influencer_deals TO service_role;
ALTER TABLE public.influencer_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage deals" ON public.influencer_deals FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TABLE public.influencer_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.influencer_deals(id) ON DELETE CASCADE,
  platform text NOT NULL, format text NOT NULL,
  draft_file_path text, draft_url text, draft_submitted_at timestamptz, draft_feedback text, draft_approved_at timestamptz,
  post_url text, posted_at timestamptz, verified_at timestamptz, status text NOT NULL DEFAULT 'pending'
);
GRANT SELECT, INSERT, UPDATE ON public.influencer_deliverables TO authenticated;
GRANT ALL ON public.influencer_deliverables TO service_role;
ALTER TABLE public.influencer_deliverables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage deliverables" ON public.influencer_deliverables FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TABLE public.influencer_deliverable_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id uuid NOT NULL REFERENCES public.influencer_deliverables(id) ON DELETE CASCADE,
  checkpoint text NOT NULL, views integer, likes integer, comments integer, shares integer, saves integer,
  screenshot_path text, reported_by text NOT NULL, reported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deliverable_id, checkpoint)
);
GRANT SELECT, INSERT, UPDATE ON public.influencer_deliverable_metrics TO authenticated;
GRANT ALL ON public.influencer_deliverable_metrics TO service_role;
ALTER TABLE public.influencer_deliverable_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage metrics" ON public.influencer_deliverable_metrics FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TABLE public.influencer_attribution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.influencer_deals(id) ON DELETE SET NULL,
  period_start date NOT NULL, period_end date NOT NULL,
  link_clicks integer, code_redemptions integer, installs integer, subscriptions integer,
  entered_by uuid REFERENCES public.profiles(id), entered_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.influencer_attribution TO authenticated;
GRANT ALL ON public.influencer_attribution TO service_role;
ALTER TABLE public.influencer_attribution ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage attribution" ON public.influencer_attribution FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TABLE public.influencer_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.influencer_deals(id) ON DELETE SET NULL,
  amount numeric NOT NULL, file_path text NOT NULL, payee text NOT NULL DEFAULT 'influencer',
  status text NOT NULL DEFAULT 'received', paid_on date, paid_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.influencer_invoices TO authenticated;
GRANT ALL ON public.influencer_invoices TO service_role;
ALTER TABLE public.influencer_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invoices" ON public.influencer_invoices FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TABLE public.influencer_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  kind text NOT NULL, deal_id uuid REFERENCES public.influencer_deals(id),
  document_version text NOT NULL, signed_name text NOT NULL, snapshot jsonb,
  signature_ip text, user_agent text, signed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.influencer_signatures TO authenticated;
GRANT ALL ON public.influencer_signatures TO service_role;
ALTER TABLE public.influencer_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read influencer signatures" ON public.influencer_signatures FOR SELECT TO authenticated USING (private.is_admin());

CREATE OR REPLACE FUNCTION public.match_prospect_influencer()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.creator_prospects SET status = 'applied'
   WHERE status <> 'applied' AND ((email IS NOT NULL AND lower(email) = lower(NEW.email))
     OR (tiktok_handle IS NOT NULL AND NEW.tiktok_url IS NOT NULL AND NEW.tiktok_url ILIKE '%' || ltrim(tiktok_handle,'@') || '%')
     OR (instagram_handle IS NOT NULL AND NEW.instagram_url IS NOT NULL AND NEW.instagram_url ILIKE '%' || ltrim(instagram_handle,'@') || '%'));
  RETURN NEW;
END $$;
CREATE TRIGGER match_prospect_influencer AFTER INSERT ON public.influencer_applications FOR EACH ROW EXECUTE FUNCTION public.match_prospect_influencer();

CREATE POLICY "Admins read influencer files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'influencer-files' AND private.is_admin());