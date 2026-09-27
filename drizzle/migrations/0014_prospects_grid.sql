ALTER TABLE public.creator_prospects
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS track text,
  ADD COLUMN IF NOT EXISTS followers integer,
  ADD COLUMN IF NOT EXISTS tiktok_handle text,
  ADD COLUMN IF NOT EXISTS instagram_handle text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS assigned_hm_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS device text,
  ADD COLUMN IF NOT EXISTS presentation text,
  ADD COLUMN IF NOT EXISTS applied_at date,
  ADD COLUMN IF NOT EXISTS target_app text;

UPDATE public.creator_prospects SET tiktok_handle = handle WHERE handle IS NOT NULL AND platform = 'tiktok' AND tiktok_handle IS NULL;
UPDATE public.creator_prospects SET instagram_handle = handle WHERE handle IS NOT NULL AND platform = 'instagram' AND instagram_handle IS NULL;
UPDATE public.creator_prospects SET status = 'not_interested' WHERE status = 'declined';

-- Re-import of the 90 app-form prospects: recover age, device, track, presentation, applied date from notes (source CSV rows), plus language from the CSV.
UPDATE public.creator_prospects p SET
  age = (substring(p.notes from '^Age (\d+) · '))::int,
  device = trim(substring(p.notes from '^Age \d+ · ([^·\n]+) · In-app')),
  track = substring(p.notes from 'Track: (\w+) · Source'),
  source = coalesce(substring(p.notes from 'Source: (\w+) · Applied'), 'app_form'),
  applied_at = (substring(p.notes from 'Applied: (\d{4}-\d\d-\d\d)\s*$'))::date,
  presentation = nullif(trim(regexp_replace(regexp_replace(p.notes, '^[^\n]*\n', ''), '\n?Track: \w+ · Source: \w+ · Applied: \d{4}-\d\d-\d\d\s*$', '')), ''),
  target_app = 'sophia',
  status = CASE WHEN p.status = 'new' THEN 'interested' ELSE p.status END,
  notes = NULL
WHERE p.notes ~ '^Age \d+ · ' AND p.notes ~ 'Track: \w+ · Source: \w+ · Applied: \d{4}-\d\d-\d\d\s*$';

UPDATE public.creator_prospects p SET language = v.lang FROM (VALUES
('dobassyalioune24@gmail.com','fr'),('parvatyy.reussite@gmail.com','fr'),('aohnia29@gmail.com','es'),('kiaramilwork@gmail.com','it'),('iiamhira3@gmail.com','tr'),('pierpaolo.rubino1964@gmail.com','it'),('leonardofierea21@gmail.com','it'),('noribihari2@gmail.com','hu'),('abatematteoclarita@gmail.com','it'),('ballenstedtvictoria@gmail.com','pl'),('matteus.silva.6000@mail.com','pt'),('camillerodrigues1806@gmail.com','fr'),('emericbayle02@gmail.com','fr'),('marianpopovici476@gmail.com','ro'),('roger.ortiz2008@gmail.com','es'),('arizubi12@gmail.com','es'),('eddie.alva19991@gmail.com','es'),('morgannedelahaye@gmail.com','fr'),('noa.bistu@gmail.com','es'),('louisdutard@icloud.com','fr'),('penalozaluane@gmail.com','es'),('valerinagutierrez@gmail.com','es'),('mariafotosos1009@gmail.com','es'),('nick.marins.97@gmail.com','es'),('aligou12@gmail.com','fr'),('ebru-candan@gmx.de','de'),('piotrglowacz32@gmail.com','pl'),('andreakrzywicka@gmail.com','pl'),('renard.anouk@outlook.be','fr'),('gioocesari@gmail.com','it'),('zulfugar33@gmail.com','tr'),('camillasgro10@gmail.com','it'),('aletrip.08@gmail.com','it'),('roya.zade77@gmail.com','tr'),('miguelaragon150@gmail.com','es'),('asteriia139@gmail.com','pl'),('kajakacz2008@gmail.com','pl'),('scardeoninoccolo@gmail.com','it'),('ezelcelebii1@gmail.com','tr'),('sorana11sterp@gmail.com','en'),('leticiaofficiel@gmail.com','fr'),('mariagarseg@gmail.com','es'),('rafafm2004@gmail.com','es'),('alexiaantonia007@gmail.com','en'),('ruiz.alexandre65@yahoo.com','fr'),('michellgtz.20@gmail.com','es'),('sayginberk663@gmail.com','tr'),('taoventajolpro@gmail.com','fr'),('yaniscottin1345@gmail.com','fr'),('haticeaytan12@gmail.com','tr'),('josephinemichelle2000@gmail.com','de'),('angelinamaniguet3@gmail.com','fr'),('dianita7u7@outlook.com','es'),('maria_salagre@hotmail.com','es'),('sofiatesttik123@gmail.com','fr'),('emilijabonvin@outlook.com','fr'),('wrubcio@icloud.com','pl'),('zuzanna.piczak2@gmail.com','pl'),('j.perucki@wp.pl','pl'),('batuhanterzi678@gmail.com','tr'),('szczotk.robin02@gmail.com','cs'),('agbetteibrahim@gmail.com','fr'),('louka.amand@gmail.com','fr'),('emarinmansilla@gmail.com','es'),('parvatyyob@gmail.com','fr'),('egeotgen@gmail.com','tr'),('emmaverdier27@gmail.com','fr'),('nalicerx@gmail.com','pt'),('anaaliceitsme@gmail.com','pt'),('natann2137@gmail.com','pl'),('helena.voto1505@gmail.com','it'),('julka.bednarz.12@gmail.com','pl'),('romaintess30@gmail.com','fr'),('ethvn.elisss@gmail.com','fr'),('elecoppolecchia@icloud.com','fr'),('nurlanamirzayevaa@gmail.com','tr'),('evanesselin@gmail.com','fr'),('mrymklc1606@gmail.com','tr'),('ameliaa.pyc@gmail.com','pl'),('alemabe2006@gmail.com','es'),('merveyilmaz072004@icloud.com','tr'),('andriamilanjadavidson153@gmail.com','fr'),('romaingarcia909@gmail.com','fr'),('djyanis@hotmail.ca','fr'),('aminebstrs@gmail.com','fr'),('erardleo@gmail.com','fr'),('selmaa94600@gmail.com','fr'),('lisabetti21@gmail.com','fr'),('eryn.wingerter@gmail.com','fr'),('test@gmail.com','fr')
) AS v(email, lang) WHERE lower(p.email) = v.email;

CREATE TABLE IF NOT EXISTS public.prospect_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospect_templates TO authenticated;
GRANT ALL ON public.prospect_templates TO service_role;
ALTER TABLE public.prospect_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage prospect templates" ON public.prospect_templates FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TABLE IF NOT EXISTS public.admin_ui_prefs (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_ui_prefs TO authenticated;
GRANT ALL ON public.admin_ui_prefs TO service_role;
ALTER TABLE public.admin_ui_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ui prefs" ON public.admin_ui_prefs FOR ALL TO authenticated USING (user_id = auth.uid() AND private.is_admin()) WITH CHECK (user_id = auth.uid() AND private.is_admin());