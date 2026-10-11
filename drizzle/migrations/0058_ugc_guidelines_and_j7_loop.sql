create table public.ugc_guidelines (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  title_fr text not null, title_en text not null,
  body_fr text not null default '', body_en text not null default '',
  image_data text,
  app_id uuid references public.apps(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.ugc_guidelines to authenticated;
grant all on public.ugc_guidelines to service_role;
alter table public.ugc_guidelines enable row level security;
create policy ugc_guidelines_admin_all on public.ugc_guidelines for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy ugc_guidelines_read_active on public.ugc_guidelines for select to authenticated using (active);
insert into public.ugc_guidelines (sort_order, title_fr, title_en, body_fr, body_en) values
 (1,'Pas de reflets','No reflections','Évite fenêtre, miroir ou écran filmé dans l''écran.','Avoid windows, mirrors or a screen filmed inside the screen.'),
 (2,'Bon son','Good sound','Micro ou pièce silencieuse, pas de vent.','Use a mic or a quiet room, no wind.'),
 (3,'Lumière de face','Light from the front','Jamais à contre-jour : la lumière est devant toi.','Never backlit: the light is in front of you.'),
 (4,'Vertical 9:16, téléphone stable','Vertical 9:16, steady phone','Filme en vertical, téléphone posé ou tenu bien droit.','Film vertically, phone resting or held steady.'),
 (5,'L''app bien visible','The app clearly visible','L''app lisible à l''écran, luminosité au max.','The app readable on screen, brightness at max.'),
 (6,'Sous-titres lisibles','Readable subtitles','Pas sur les bords de l''écran.','Keep them away from the screen edges.'),
 (7,'Pas de logo ni de marque tierce','No third-party logo or brand','Aucun logo ou marque d''un tiers dans le cadre.','No other brand or logo in the frame.'),
 (8,'Pas de musique protégée','No copyrighted music','Si la vidéo peut passer en pub, pas de musique protégée.','If the video may run as an ad, no copyrighted music.'),
 (9,'Dire le nom de l''app une fois','Say the app name once','Une seule fois, clairement.','Once, clearly.'),
 (10,'Un seul hook dans les 2 premières secondes','One hook in the first 2 seconds','Une seule accroche, tout de suite.','A single hook, straight away.');

alter table public.creator_posts
  add column if not exists submitted_at timestamptz default now(),
  add column if not exists validated_at timestamptz,
  add column if not exists validated_by uuid,
  add column if not exists guidelines_checked text[] not null default '{}',
  add column if not exists url_key text,
  add column if not exists views_frozen bigint,
  add column if not exists frozen_at timestamptz,
  add column if not exists pay_amount numeric,
  add column if not exists pay_currency text not null default 'EUR',
  add column if not exists pay_formula text,
  add column if not exists pay_flag text,
  add column if not exists payout_item_id uuid,
  add column if not exists cover_url text;
create unique index if not exists creator_posts_url_key_uniq on public.creator_posts(url_key) where url_key is not null;
alter table public.creators alter column weekly_target set default 5;

create or replace function public.price_creator_post() returns trigger language plpgsql security definer set search_path to 'public' as $function$
DECLARE _track text; _country text; _rate record;
BEGIN
  SELECT track, country INTO _track, _country FROM public.creators WHERE id = NEW.creator_id;
  IF _track = 'ugc' THEN
    -- UGC loop: validation starts tracking; pay is computed at J+7 after validation (inspirations-free, see ugc-j7.server.ts).
    IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
      NEW.validated_at := coalesce(NEW.validated_at, now());
      IF NEW.pay_status IS NULL OR NEW.pay_status IN ('due','held') THEN NEW.pay_status := 'tracking'; END IF;
    ELSIF NEW.status <> 'approved' AND coalesce(NEW.pay_status,'') NOT IN ('approved','paid') THEN
      NEW.pay_status := NULL; NEW.pay_amount := NULL; NEW.pay_formula := NULL; NEW.views_frozen := NULL; NEW.frozen_at := NULL; NEW.validated_at := NULL;
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    SELECT id, rate_usd INTO _rate FROM public.creator_rates
      WHERE track = _track AND (country = _country OR country IS NULL) AND effective_from <= NEW.posted_on
      ORDER BY (country IS NULL), effective_from DESC LIMIT 1;
    IF _rate.id IS NULL THEN NEW.pay_status := 'held'; NEW.amount_usd := NULL; NEW.rate_id := NULL;
    ELSE NEW.pay_status := 'due'; NEW.amount_usd := _rate.rate_usd; NEW.rate_id := _rate.id; END IF;
  ELSIF NEW.status <> 'approved' THEN
    NEW.pay_status := NULL; NEW.amount_usd := NULL; NEW.rate_id := NULL;
  END IF;
  RETURN NEW;
END $function$;