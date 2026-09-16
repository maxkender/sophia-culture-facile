
DO $$
DECLARE
  v_ved uuid; v_rana uuid; v_cla uuid; v_gri uuid;
  c record; ids uuid[]; i int := 0;
  arr uuid[] := ARRAY[]::uuid[];
BEGIN
  INSERT INTO public.profiles (role, full_name, display_title, institution, admin_note, upwork_status, platform, email, invite_token, invited_at)
  VALUES ('author','Vedran Obucina','Anglican theologian and historian, PhD in History',NULL,
    'Theologian and historian. Applied to the second job post. Brought in to cover the religion, belief and mythology ground left empty when Takahiro Yamamoto withdrew.',
    'contacted',NULL,NULL,'inv_seed_24_vedran',now()) RETURNING id INTO v_ved;

  INSERT INTO public.profiles (role, full_name, display_title, institution, admin_note, upwork_status, platform, email, invite_token, invited_at)
  VALUES ('author','Rana Abdalla','PhD researcher in Industrial Systems Engineering',NULL,
    'Energy, sustainability, industrial systems, data analysis. Interested in the intersection of AI and sustainability.',
    'contacted',NULL,NULL,'inv_seed_25_rana',now()) RETURNING id INTO v_rana;

  INSERT INTO public.profiles (role, full_name, display_title, institution, admin_note, upwork_status, platform, email, invite_token, invited_at)
  VALUES ('author','Claudia Tomasini Montenegro','PhD in Chemical Engineering and Analytical Science',NULL,
    'Life Cycle Assessment and environmental sustainability: renewable energy, batteries, wastewater, consumer products. Taught LCA at university level. Her application proposed her own course rather than describing herself, and course 1 is her own idea.',
    'contacted',NULL,NULL,'inv_seed_26_claudia',now()) RETURNING id INTO v_cla;

  INSERT INTO public.profiles (role, full_name, display_title, institution, admin_note, upwork_status, platform, email, invite_token, invited_at)
  VALUES ('author','Grigory Mechetin','PhD in Chemistry, biochemist',NULL,
    'Twenty years in protein and DNA biochemistry, DNA repair, protein folding. Duke University 2022-2025, Institute of Chemical Biology and Fundamental Medicine 2004-2022. Google Scholar: scholar.google.com/citations?user=xnaZoYUAAAAJ',
    'contacted',NULL,NULL,'inv_seed_27_grigory',now()) RETURNING id INTO v_gri;

  -- assign one available Apple code to each new author
  FOR c IN
    SELECT p.id AS pid, ac.id AS cid, ac.code, ac.redeem_url
    FROM (SELECT v_ved AS id, 1 AS n UNION ALL SELECT v_rana,2 UNION ALL SELECT v_cla,3 UNION ALL SELECT v_gri,4) p
    JOIN (SELECT id, code, redeem_url, row_number() OVER (ORDER BY code) AS n
          FROM public.access_codes WHERE state='available' AND platform='ios' LIMIT 4) ac
      ON ac.n = p.n
  LOOP
    UPDATE public.access_codes SET state='assigned', assigned_to=c.pid, assigned_at=now() WHERE id=c.cid;
    UPDATE public.profiles SET access_code=c.code, access_redeem_url=c.redeem_url WHERE id=c.pid;
  END LOOP;

  -- L24 Vedran: four courses out of the pool
  UPDATE public.courses SET author_id=v_ved, status='assigned', lot_code='L24', lot_name='Belief and power',
    order_index=1, released_from=NULL, released_at=NULL
    WHERE id='917e7cfc-5d63-4507-ba4b-62cac8b4fd02';
  UPDATE public.courses SET author_id=v_ved, status='assigned', lot_code='L24', lot_name='Belief and power',
    order_index=2, released_from=NULL, released_at=NULL,
    brief_note='The Taiping Rebellion was led by a man who believed he was Jesus''s younger brother. A theologian and historian is the right person for this, and the religious dimension should not be a footnote.'
    WHERE id='97a36821-e1b6-438d-8783-3b1c92a44e87';
  UPDATE public.courses SET author_id=v_ved, status='assigned', lot_code='L24', lot_name='Belief and power',
    order_index=3, released_from=NULL, released_at=NULL
    WHERE id='22d51695-1892-4b24-8c6d-56611e63d145';
  UPDATE public.courses SET author_id=v_ved, status='assigned', lot_code='L24', lot_name='Belief and power',
    order_index=4, released_from=NULL, released_at=NULL
    WHERE id='6246be6d-b217-4608-a558-991f771b5a76';

  INSERT INTO public.courses (author_id, lot_code, lot_name, subject_area, title, subtitle, brief_note, status, order_index, fee_usd)
  VALUES (v_ved,'L24','Belief and power','Histoire','How did Christianity go from persecuted to official?',
    'In under seventy years, a banned sect became the religion of the Roman state.',
    'From Constantine in 312 to Theodosius in 380. What actually changed, what did not, and why the speed of it still shapes European law and calendars.',
    'assigned',5,20);

  -- L25 Rana: one from the pool, four new
  UPDATE public.courses SET author_id=v_rana, status='assigned', lot_code='L25', lot_name='Where the power comes from',
    order_index=1, released_from=NULL, released_at=NULL,
    brief_note=COALESCE(brief_note,'State the disagreement plainly, with the range, rather than one number presented as settled.')
    WHERE id='656c43e3-4005-42c5-9e5b-e2304f00bf20';

  INSERT INTO public.courses (author_id, lot_code, lot_name, subject_area, title, subtitle, brief_note, status, order_index, fee_usd) VALUES
   (v_rana,'L25','Where the power comes from','Comprendre le monde actuel','Where does your electricity actually come from?','The plug is the same everywhere. What is behind it is not.','The mix, why it changes hour by hour, and why a country''s headline percentage hides more than it shows.','assigned',2,20),
   (v_rana,'L25','Where the power comes from','Comprendre le monde actuel','Why is it so hard to store electricity?','We can make it cleanly. Keeping it is the problem.','Why storage is the real constraint on renewables, what a battery can and cannot do at grid scale, and the alternatives nobody talks about.','assigned',3,20),
   (v_rana,'L25','Where the power comes from','Comprendre le monde actuel','Why do power grids fail?','A grid has to balance supply and demand every second of every day.','What a blackout actually is, why the system is more fragile than it looks, and what happened in the big ones.','assigned',4,20),
   (v_rana,'L25','Where the power comes from','Comprendre le monde actuel','What is a data centre, and why are there suddenly so many?','Buildings full of machines, drinking power and water.','What is inside one, why they cluster where they do, and what they need from the places that host them.','assigned',5,20);

  INSERT INTO public.courses (author_id, lot_code, lot_name, subject_area, title, subtitle, brief_note, status, order_index, fee_usd) VALUES
   (v_cla,'L26','The life of things','Comprendre le monde actuel','What has the circular economy got to do with me?','Start with something you bought, used and threw away.','Her own proposal. Follow one ordinary object through its whole life rather than defining the concept. By screen five the term should mean a set of everyday decisions rather than a diagram.','assigned',1,20),
   (v_cla,'L26','The life of things','Comprendre le monde actuel','What actually happens to the things you recycle?','Sorting is the easy part. What comes next is where it gets complicated.','What is genuinely recycled, what is not, and why. State what the evidence shows rather than either reassuring or condemning.','assigned',2,20),
   (v_cla,'L26','The life of things','Comprendre le monde actuel','Cotton bag or plastic bag: which is worse?','The answer depends on a number most people have never heard.','A life cycle assessment explained through the one comparison everyone has an opinion about. The reader should finish understanding that impact depends on use count, not material.','assigned',3,20),
   (v_cla,'L26','The life of things','Comprendre le monde actuel','What does an electric car actually cost the planet?','Cleaner to drive, heavier to build.','Where the emissions sit across manufacture and use, how many kilometres it takes to break even, and why the answer changes by country.','assigned',4,20),
   (v_cla,'L26','The life of things','Comprendre le monde actuel','Why do things break just after the warranty ends?','Sometimes design, sometimes physics, sometimes neither.','Planned obsolescence, what is documented and what is folklore, and the repairability rules now changing it.','assigned',5,20);

  INSERT INTO public.courses (author_id, lot_code, lot_name, subject_area, title, subtitle, brief_note, status, order_index, fee_usd) VALUES
   (v_gri,'L27','The machinery of the body','Sciences','How does your body repair its own DNA?','Your cells take thousands of hits a day and fix almost all of them.','His exact research field. What damages DNA, how the repair systems find and fix it, and what happens when they do not.','assigned',1,20),
   (v_gri,'L27','The machinery of the body','Sciences','Why do some people get cancer and others do not?','Chance plays a bigger part than most people are comfortable with.','Mutation, repair failure and chance. Handle the risk-factor question carefully and state what the evidence supports rather than reassuring or alarming.','assigned',2,20),
   (v_gri,'L27','The machinery of the body','Sciences','What is a protein, actually?','The word is everywhere in food adverts and almost never explained.','What proteins are, that shape is the whole point, and why a protein that folds wrongly causes disease.','assigned',3,20),
   (v_gri,'L27','The machinery of the body','Sciences','What does a virus actually do to a cell?','It is not alive, and it cannot do anything on its own.','The mechanism, step by step, and why that makes viruses hard to treat with the tools that work on bacteria.','assigned',4,20),
   (v_gri,'L27','The machinery of the body','Sciences','Why does cooking change food?','Heat is doing chemistry to the proteins on your plate.','Denaturation, the Maillard reaction, and why an egg cannot be uncooked.','assigned',5,20);
END $$;
