ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'all';
ALTER TABLE public.creator_rates ADD COLUMN IF NOT EXISTS effective_from date NOT NULL DEFAULT '2000-01-01';
ALTER TABLE public.reference_videos ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.creator_posts ADD COLUMN IF NOT EXISTS amount_usd numeric;
ALTER TABLE public.creator_posts ADD COLUMN IF NOT EXISTS pay_status text;
ALTER TABLE public.creator_posts ADD COLUMN IF NOT EXISTS rate_id uuid REFERENCES public.creator_rates(id) ON DELETE SET NULL;
ALTER TABLE public.creator_posts ADD COLUMN IF NOT EXISTS views_entered_at timestamptz;
ALTER TABLE public.creator_posts ADD COLUMN IF NOT EXISTS skip_reason text;

CREATE TABLE public.brief_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id uuid NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brief_id, creator_id)
);
GRANT SELECT ON public.brief_assignments TO authenticated;
GRANT ALL ON public.brief_assignments TO service_role;
ALTER TABLE public.brief_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage brief assignments" ON public.brief_assignments FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creator reads own assignments" ON public.brief_assignments FOR SELECT TO authenticated
  USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

CREATE TABLE public.creator_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
GRANT SELECT, UPDATE ON public.creator_notifications TO authenticated;
GRANT ALL ON public.creator_notifications TO service_role;
ALTER TABLE public.creator_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage creator notifications" ON public.creator_notifications FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creator reads own notifications" ON public.creator_notifications FOR SELECT TO authenticated
  USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));
CREATE POLICY "creator marks own notifications read" ON public.creator_notifications FOR UPDATE TO authenticated
  USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()))
  WITH CHECK (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

CREATE TABLE public.creator_call_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.creator_calls(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  answer text NOT NULL DEFAULT 'yes',
  reminded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (call_id, creator_id)
);
GRANT SELECT, INSERT, UPDATE ON public.creator_call_rsvps TO authenticated;
GRANT ALL ON public.creator_call_rsvps TO service_role;
ALTER TABLE public.creator_call_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read rsvps" ON public.creator_call_rsvps FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "creator manages own rsvp" ON public.creator_call_rsvps FOR ALL TO authenticated
  USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()))
  WITH CHECK (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()) AND answer IN ('yes','no'));

DROP POLICY "creators read published briefs" ON public.briefs;
CREATE POLICY "creators read published briefs" ON public.briefs FOR SELECT TO authenticated
  USING (status = 'published'
    AND EXISTS (SELECT 1 FROM public.creators c JOIN public.creator_signatures s ON s.creator_id = c.id WHERE c.user_id = auth.uid())
    AND (audience = 'all' OR EXISTS (SELECT 1 FROM public.brief_assignments a JOIN public.creators c ON c.id = a.creator_id WHERE a.brief_id = briefs.id AND c.user_id = auth.uid())));

-- Price a post when it is approved: dated rate card in force on the post date, or held.
CREATE OR REPLACE FUNCTION public.price_creator_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _track text; _country text; _rate record;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    SELECT track, country INTO _track, _country FROM public.creators WHERE id = NEW.creator_id;
    SELECT id, rate_usd INTO _rate FROM public.creator_rates
      WHERE track = _track AND (country = _country OR country IS NULL) AND effective_from <= NEW.posted_on
      ORDER BY (country IS NULL), effective_from DESC LIMIT 1;
    IF _rate.id IS NULL THEN
      NEW.pay_status := 'held'; NEW.amount_usd := NULL; NEW.rate_id := NULL;
    ELSE
      NEW.pay_status := 'due'; NEW.amount_usd := _rate.rate_usd; NEW.rate_id := _rate.id;
    END IF;
  ELSIF NEW.status <> 'approved' THEN
    NEW.pay_status := NULL; NEW.amount_usd := NULL; NEW.rate_id := NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER price_creator_post BEFORE UPDATE ON public.creator_posts FOR EACH ROW EXECUTE FUNCTION public.price_creator_post();

-- Notify on flagged posts
CREATE OR REPLACE FUNCTION public.notify_creator_post_flag()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'flagged' AND OLD.status IS DISTINCT FROM 'flagged' THEN
    INSERT INTO public.creator_notifications (creator_id, body) VALUES (NEW.creator_id, 'Feedback on your post: ' || left(coalesce(NEW.feedback,''), 140));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER notify_creator_post_flag AFTER UPDATE ON public.creator_posts FOR EACH ROW EXECUTE FUNCTION public.notify_creator_post_flag();