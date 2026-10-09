GRANT SELECT ON public.ugc_tiers TO anon;
CREATE POLICY "Public reads tier rates" ON public.ugc_tiers FOR SELECT TO anon USING (true);