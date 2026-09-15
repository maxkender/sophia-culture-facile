WITH picked_code AS (
  SELECT code, redeem_url, platform
  FROM public.access_codes
  WHERE state = 'available'
  ORDER BY code
  LIMIT 1
),
new_profile AS (
  INSERT INTO public.profiles (
    full_name,
    role,
    email,
    platform,
    upwork_status,
    display_title,
    institution,
    admin_note,
    invite_token,
    invited_at,
    access_code,
    access_redeem_url,
    is_test
  )
  SELECT
    'Ivana Toskovic',
    'author',
    NULL,
    NULL,
    'contacted',
    'MSc in Regional Studies of the United States, BA in International Relations, University of Belgrade',
    'University of Belgrade',
    'Faculty of Political Sciences, Belgrade. Top Rated on Upwork with 141 contracts and 94 reviews, the most experienced freelancer in the pool. Background is academic writing, so watch the register on the first delivery: the risk is correct but unreadable, not wrong.',
    'inv_seed_23_ivana',
    now(),
    pc.code,
    pc.redeem_url,
    false
  FROM picked_code pc
  RETURNING id, access_code, access_redeem_url
),
code_update AS (
  UPDATE public.access_codes ac
  SET state = 'assigned', assigned_to = np.id, assigned_at = now()
  FROM new_profile np
  WHERE ac.code = np.access_code AND ac.state = 'available'
  RETURNING ac.platform
)
INSERT INTO public.courses (
  author_id, lot_code, lot_name, subject_area, title, subtitle, brief_note,
  status, order_index, fee_usd, public_full_text, slug
)
SELECT np.id, 'L23', 'Countries that came apart', 'Comprendre le monde actuel',
       'Why did Yugoslavia fall apart?',
       'A country our parents grew up with, gone from the map in a decade.',
       'How one state became seven. The reader starts knowing Serbia and Croatia exist and finishes understanding what was there before and why it broke. Ivana is from Belgrade and knows the competing accounts from the inside: set them out rather than settle them, and say who holds which. No graphic detail, this is a course about how a country dissolves, not a catalogue of atrocities.',
       'assigned', 1, 20, false, public.slugify('Why did Yugoslavia fall apart?')
FROM new_profile np;

WITH np AS (
  SELECT id FROM public.profiles WHERE invite_token = 'inv_seed_23_ivana'
)
INSERT INTO public.courses (
  author_id, lot_code, lot_name, subject_area, title, subtitle, brief_note,
  status, order_index, fee_usd, public_full_text, slug
)
SELECT np.id, 'L23', 'Countries that came apart', 'Comprendre le monde actuel',
       'Why is Korea split in two?',
       'The border was drawn in one night, by two American officers, on a National Geographic map.',
       'August 1945, two colonels given thirty minutes to divide a country they had never visited, picking the 38th parallel off the only map to hand. Then how a line meant to be temporary became the most militarised border on earth. The reader should finish understanding that one of the defining divisions of the modern world began as an improvisation.',
       'assigned', 2, 20, false, public.slugify('Why is Korea split in two?')
FROM np;

WITH np AS (
  SELECT id FROM public.profiles WHERE invite_token = 'inv_seed_23_ivana'
)
INSERT INTO public.courses (
  author_id, lot_code, lot_name, subject_area, title, subtitle, brief_note,
  status, order_index, fee_usd, public_full_text, slug
)
SELECT np.id, 'L23', 'Countries that came apart', 'Comprendre le monde actuel',
       'Why do the United States have so much power?',
       'A country that did not exist 250 years ago now decides things everywhere.',
       'Not a course about American foreign policy today. A course about how it got there: the size, the two oceans, arriving late and intact to two world wars, the dollar, and the institutions built in 1944 and 1945 that are still running. The reader should finish understanding the mechanism, not the opinion. This is her exact master''s field.',
       'assigned', 3, 20, false, public.slugify('Why do the United States have so much power?')
FROM np;

WITH np AS (
  SELECT id FROM public.profiles WHERE invite_token = 'inv_seed_23_ivana'
)
INSERT INTO public.courses (
  author_id, lot_code, lot_name, subject_area, title, subtitle, brief_note,
  status, order_index, fee_usd, public_full_text, slug
)
SELECT np.id, 'L23', 'Countries that came apart', 'Comprendre le monde actuel',
       'Why is Switzerland never at war?',
       'Neutral since 1815, and armed to the teeth.',
       'What Swiss neutrality actually is, where it comes from, and the contradiction at its heart: compulsory military service, bunkers under the mountains, and banks that held money from every side of every conflict. The reader should finish understanding that neutrality is a policy with costs and conditions, not an absence of politics.',
       'assigned', 4, 20, false, public.slugify('Why is Switzerland never at war?')
FROM np;