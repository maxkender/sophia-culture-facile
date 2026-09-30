CREATE OR REPLACE FUNCTION public.my_influencer_id()
 RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT id FROM public.influencers WHERE user_id = auth.uid() LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.influencer_can_see_brief(_brief_id uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.influencer_briefs b JOIN public.influencers i ON i.user_id = auth.uid()
    WHERE b.id = _brief_id AND (
      EXISTS (SELECT 1 FROM public.influencer_offers o WHERE o.brief_id = b.id AND o.influencer_id = i.id)
      OR (b.status = 'open'
          AND (cardinality(b.target_tiers) = 0 OR i.tier = ANY (b.target_tiers))
          AND (cardinality(b.target_niches) = 0 OR b.target_niches && i.niche_tags)
          AND (cardinality(b.target_languages) = 0 OR b.target_languages && i.languages))
    ))
$$;

CREATE POLICY "Influencer reads visible briefs" ON public.influencer_briefs FOR SELECT TO authenticated USING (public.influencer_can_see_brief(id));
CREATE POLICY "Influencer reads own offers" ON public.influencer_offers FOR SELECT TO authenticated USING (influencer_id = public.my_influencer_id());
CREATE POLICY "Influencer reads own deals" ON public.influencer_deals FOR SELECT TO authenticated USING (influencer_id = public.my_influencer_id());
CREATE POLICY "Influencer reads own deliverables" ON public.influencer_deliverables FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.influencer_deals d WHERE d.id = deal_id AND d.influencer_id = public.my_influencer_id()));
CREATE POLICY "Influencer reads own metrics" ON public.influencer_deliverable_metrics FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.influencer_deliverables v JOIN public.influencer_deals d ON d.id = v.deal_id
                 WHERE v.id = deliverable_id AND d.influencer_id = public.my_influencer_id()));
CREATE POLICY "Influencer reads own interest" ON public.influencer_brief_interest FOR SELECT TO authenticated USING (influencer_id = public.my_influencer_id());

ALTER TABLE public.influencer_deals ADD COLUMN IF NOT EXISTS extended_count integer NOT NULL DEFAULT 0;