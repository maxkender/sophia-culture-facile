-- 1. Email becomes optional: authors are contracted through Upwork and supply it when they claim their invite.
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- 2. Lot name alongside the lot code.
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS lot_name text;

-- 3. Remove placeholder seed authors and everything attached to them.
DELETE FROM public.sources WHERE course_id IN (
  SELECT id FROM public.courses WHERE author_id IN (
    '22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444'));
DELETE FROM public.screens WHERE course_id IN (
  SELECT id FROM public.courses WHERE author_id IN (
    '22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444'));
DELETE FROM public.courses WHERE author_id IN (
  '22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444');
DELETE FROM public.contracts WHERE author_id IN (
  '22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444');
DELETE FROM public.activity_log WHERE actor_id IN (
  '22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444');
UPDATE public.access_codes SET state = 'available', assigned_to = NULL, assigned_at = NULL
  WHERE assigned_to IN (
    '22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444');
DELETE FROM public.profiles WHERE id IN (
  '22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444');

-- 4. The eight real authors: invited, not yet claimed, platform unknown.
INSERT INTO public.profiles (id, email, role, full_name, title, institution, platform, access_code, invite_token, invited_at, invite_expires_at)
VALUES
  ('a0000001-0000-4000-8000-000000000001', NULL, 'author', 'Stacy Jankowski', 'PhD Biomedical Sciences (2025)', NULL, NULL, 'EHWFL8Y8AKP67WANTF', 'inv_' || replace(gen_random_uuid()::text, '-', ''), now(), now() + interval '90 days'),
  ('a0000002-0000-4000-8000-000000000002', NULL, 'author', 'Kate L.', 'PhD Molecular Microbiology (agricultural focus), degree in Zoology', NULL, NULL, 'FFYPNL68K7JHPW8LFT', 'inv_' || replace(gen_random_uuid()::text, '-', ''), now(), now() + interval '90 days'),
  ('a0000003-0000-4000-8000-000000000003', NULL, 'author', 'Muhammad Zaheer', 'PhD Chemistry, Senior Lecturer', 'Nottingham Trent University', NULL, 'MAKKYHKEMPKNE4TFWX', 'inv_' || replace(gen_random_uuid()::text, '-', ''), now(), now() + interval '90 days'),
  ('a0000004-0000-4000-8000-000000000004', NULL, 'author', 'Ezgi Gizem Berkay', 'MD and PhD in Medical Genetics, works in ancient history', NULL, NULL, 'M7HHF84JREHKR6N8JX', 'inv_' || replace(gen_random_uuid()::text, '-', ''), now(), now() + interval '90 days'),
  ('a0000005-0000-4000-8000-000000000005', NULL, 'author', 'Nathan Hewitt', 'BA and MA in History, doctorate nearing completion', NULL, NULL, 'MRPMX8XARHE8WFRYPJ', 'inv_' || replace(gen_random_uuid()::text, '-', ''), now(), now() + interval '90 days'),
  ('a0000006-0000-4000-8000-000000000006', NULL, 'author', 'Takahiro Yamamoto', 'PhD in Literature, university professor for over thirty years', 'Hiroshima University', NULL, 'RJAA7MXHLKYHKWNXAW', 'inv_' || replace(gen_random_uuid()::text, '-', ''), now(), now() + interval '90 days'),
  ('a0000007-0000-4000-8000-000000000007', NULL, 'author', 'Mark Hoffman', 'PhD in Political Science, University of Minnesota (2013)', 'Saint Xavier University, Chicago', NULL, 'WM3EM3FJTHRAARNP47', 'inv_' || replace(gen_random_uuid()::text, '-', ''), now(), now() + interval '90 days'),
  ('a0000008-0000-4000-8000-000000000008', NULL, 'author', 'Ibrahim Yassine Nouali', 'PhD in Wireless Communications and Networks, part-time lecturer', NULL, NULL, '7MNFNNLXNRHN4RJLKM', 'inv_' || replace(gen_random_uuid()::text, '-', ''), now(), now() + interval '90 days');

-- 5. Their access codes leave the pool.
INSERT INTO public.access_codes (code, platform, state, assigned_to, assigned_at)
SELECT v.code, 'ios', 'assigned', v.author_id, now()
FROM (VALUES
  ('EHWFL8Y8AKP67WANTF', 'a0000001-0000-4000-8000-000000000001'::uuid),
  ('FFYPNL68K7JHPW8LFT', 'a0000002-0000-4000-8000-000000000002'::uuid),
  ('MAKKYHKEMPKNE4TFWX', 'a0000003-0000-4000-8000-000000000003'::uuid),
  ('M7HHF84JREHKR6N8JX', 'a0000004-0000-4000-8000-000000000004'::uuid),
  ('MRPMX8XARHE8WFRYPJ', 'a0000005-0000-4000-8000-000000000005'::uuid),
  ('RJAA7MXHLKYHKWNXAW', 'a0000006-0000-4000-8000-000000000006'::uuid),
  ('WM3EM3FJTHRAARNP47', 'a0000007-0000-4000-8000-000000000007'::uuid),
  ('7MNFNNLXNRHN4RJLKM', 'a0000008-0000-4000-8000-000000000008'::uuid)
) AS v(code, author_id)
ON CONFLICT (code) DO UPDATE SET state = 'assigned', assigned_to = EXCLUDED.assigned_to, assigned_at = now(), platform = 'ios';

-- 6. Their forty-nine commissioned courses, all assigned and waiting.
INSERT INTO public.courses (author_id, lot_code, lot_name, subject_area, title, status, order_index)
SELECT v.author_id, v.lot_code, v.lot_name, v.subject_area, v.title, 'assigned', v.order_index
FROM (VALUES
  ('a0000001-0000-4000-8000-000000000001'::uuid, 'S1', 'Le corps et ses réflexes', 'Sciences', 'Pourquoi rougit-on ?', 1),
  ('a0000001-0000-4000-8000-000000000001'::uuid, 'S1', 'Le corps et ses réflexes', 'Sciences', 'Pourquoi a-t-on le hoquet ?', 2),
  ('a0000001-0000-4000-8000-000000000001'::uuid, 'S1', 'Le corps et ses réflexes', 'Sciences', 'Pourquoi déteste-t-on la coriandre ?', 3),
  ('a0000001-0000-4000-8000-000000000001'::uuid, 'S1', 'Le corps et ses réflexes', 'Sciences', 'Pourquoi rit-on quand on est chatouillé ?', 4),
  ('a0000001-0000-4000-8000-000000000001'::uuid, 'S1', 'Le corps et ses réflexes', 'Sciences', 'Pourquoi déteste-t-on sa voix enregistrée ?', 5),
  ('a0000001-0000-4000-8000-000000000001'::uuid, 'S2', 'Cerveau, mémoire et sommeil', 'Sciences', 'Pourquoi a-t-on des déjà-vu ?', 6),
  ('a0000001-0000-4000-8000-000000000001'::uuid, 'S2', 'Cerveau, mémoire et sommeil', 'Sciences', 'Pourquoi les souvenirs d''enfance disparaissent-ils ?', 7),
  ('a0000001-0000-4000-8000-000000000001'::uuid, 'S2', 'Cerveau, mémoire et sommeil', 'Sciences', 'Pourquoi certains ont-ils besoin de moins de sommeil ?', 8),
  ('a0000001-0000-4000-8000-000000000001'::uuid, 'S2', 'Cerveau, mémoire et sommeil', 'Sciences', 'Pourquoi a-t-on peur du vide ?', 9),
  ('a0000002-0000-4000-8000-000000000002'::uuid, 'S3', 'Le vivant et la santé', 'Sciences', 'Peut-on modifier l''ADN d''un être humain ?', 1),
  ('a0000002-0000-4000-8000-000000000002'::uuid, 'S3', 'Le vivant et la santé', 'Sciences', 'Que peut-on apprendre de son ADN ?', 2),
  ('a0000002-0000-4000-8000-000000000002'::uuid, 'S3', 'Le vivant et la santé', 'Sciences', 'Pourquoi les antibiotiques cessent-ils de marcher ?', 3),
  ('a0000002-0000-4000-8000-000000000002'::uuid, 'S3', 'Le vivant et la santé', 'Sciences', 'Comment nourrit-on huit milliards de personnes ?', 4),
  ('a0000003-0000-4000-8000-000000000003'::uuid, 'S4', 'Matière et cosmos', 'Sciences', 'Qu''y a-t-il vraiment dans un smartphone ?', 1),
  ('a0000003-0000-4000-8000-000000000003'::uuid, 'S4', 'Matière et cosmos', 'Sciences', 'Pourquoi la Lune s''éloigne-t-elle de la Terre ?', 2),
  ('a0000003-0000-4000-8000-000000000003'::uuid, 'S4', 'Matière et cosmos', 'Sciences', 'Comment meurt une étoile ?', 3),
  ('a0000003-0000-4000-8000-000000000003'::uuid, 'S4', 'Matière et cosmos', 'Sciences', 'Pourquoi Mars est-elle devenue un désert ?', 4),
  ('a0000003-0000-4000-8000-000000000003'::uuid, 'S4', 'Matière et cosmos', 'Sciences', 'Que se passerait-il si un supervolcan se réveillait ?', 5),
  ('a0000004-0000-4000-8000-000000000004'::uuid, 'H1', 'Antiquité', 'Histoire', 'Qui a vraiment construit les pyramides ?', 1),
  ('a0000004-0000-4000-8000-000000000004'::uuid, 'H1', 'Antiquité', 'Histoire', 'La disparition de Pompéi', 2),
  ('a0000004-0000-4000-8000-000000000004'::uuid, 'H1', 'Antiquité', 'Histoire', 'Pourquoi les spartiates étaient-ils si forts ?', 3),
  ('a0000004-0000-4000-8000-000000000004'::uuid, 'H1', 'Antiquité', 'Histoire', 'A-t-on vraiment perdu tout le savoir du monde à Alexandrie ?', 4),
  ('a0000004-0000-4000-8000-000000000004'::uuid, 'H1', 'Antiquité', 'Histoire', 'À quoi servait vraiment la Route de la soie ?', 5),
  ('a0000005-0000-4000-8000-000000000005'::uuid, 'H2', 'Moyen Âge et bascule moderne', 'Histoire', 'Les Vikings ont-ils découvert l''Amérique avant Colomb ?', 1),
  ('a0000005-0000-4000-8000-000000000005'::uuid, 'H2', 'Moyen Âge et bascule moderne', 'Histoire', 'Le mode de vie au moyen-âge', 2),
  ('a0000005-0000-4000-8000-000000000005'::uuid, 'H2', 'Moyen Âge et bascule moderne', 'Histoire', 'Comment un seul homme a-t-il conquis la moitié du monde ?', 3),
  ('a0000005-0000-4000-8000-000000000005'::uuid, 'H2', 'Moyen Âge et bascule moderne', 'Histoire', 'Pourquoi l''imprimerie a-t-elle tout changé ?', 4),
  ('a0000005-0000-4000-8000-000000000005'::uuid, 'H2', 'Moyen Âge et bascule moderne', 'Histoire', 'L''incendie de Londres en 1666', 5),
  ('a0000006-0000-4000-8000-000000000006'::uuid, 'H3', 'Le XIXe siècle', 'Histoire', 'La ruée vers l''or en Californie (1848)', 1),
  ('a0000006-0000-4000-8000-000000000006'::uuid, 'H3', 'Le XIXe siècle', 'Histoire', 'Le naufrage du Titanic (1912)', 2),
  ('a0000006-0000-4000-8000-000000000006'::uuid, 'H3', 'Le XIXe siècle', 'Histoire', 'La course au pôle Sud (1911)', 3),
  ('a0000006-0000-4000-8000-000000000006'::uuid, 'H3', 'Le XIXe siècle', 'Histoire', 'Qui a décidé des frontières de l''Afrique ?', 4),
  ('a0000006-0000-4000-8000-000000000006'::uuid, 'H3', 'Le XIXe siècle', 'Histoire', 'Quelle est la guerre la plus meurtrière de l''histoire ?', 5),
  ('a0000007-0000-4000-8000-000000000007'::uuid, 'H4', 'Le XXe siècle', 'Histoire', 'La course à la Lune (1969)', 1),
  ('a0000007-0000-4000-8000-000000000007'::uuid, 'H4', 'Le XXe siècle', 'Histoire', 'Le pont aérien de Berlin (1948)', 2),
  ('a0000007-0000-4000-8000-000000000007'::uuid, 'H4', 'Le XXe siècle', 'Histoire', 'Comment a-t-on évité la famine annoncée des années 1960 ?', 3),
  ('a0000007-0000-4000-8000-000000000007'::uuid, 'H4', 'Le XXe siècle', 'Histoire', 'La catastrophe de Bhopal (1984)', 4),
  ('a0000007-0000-4000-8000-000000000007'::uuid, 'H4', 'Le XXe siècle', 'Histoire', 'La disparition de l''URSS (1991)', 5),
  ('a0000007-0000-4000-8000-000000000007'::uuid, 'H4', 'Le XXe siècle', 'Histoire', 'La naissance d''Internet', 6),
  ('a0000007-0000-4000-8000-000000000007'::uuid, 'M3', 'Le monde vu de près', 'Comprendre le monde actuel', 'Pourquoi le dollar domine-t-il encore le monde ?', 7),
  ('a0000007-0000-4000-8000-000000000007'::uuid, 'M3', 'Le monde vu de près', 'Comprendre le monde actuel', 'Qui décide des sanctions internationales ?', 8),
  ('a0000007-0000-4000-8000-000000000007'::uuid, 'M3', 'Le monde vu de près', 'Comprendre le monde actuel', 'La crise de l''État-Providence', 9),
  ('a0000007-0000-4000-8000-000000000007'::uuid, 'M3', 'Le monde vu de près', 'Comprendre le monde actuel', 'Pourquoi les traités sur le climat n''obligent-ils personne ?', 10),
  ('a0000007-0000-4000-8000-000000000007'::uuid, 'M3', 'Le monde vu de près', 'Comprendre le monde actuel', 'Pourquoi y a-t-il des bases militaires étrangères partout ?', 11),
  ('a0000008-0000-4000-8000-000000000008'::uuid, 'M1', 'Comment marche l''IA', 'Comprendre le monde actuel', 'Comment fonctionne une IA qui écrit ?', 1),
  ('a0000008-0000-4000-8000-000000000008'::uuid, 'M1', 'Comment marche l''IA', 'Comprendre le monde actuel', 'Avec quoi entraîne-t-on une intelligence artificielle ?', 2),
  ('a0000008-0000-4000-8000-000000000008'::uuid, 'M1', 'Comment marche l''IA', 'Comprendre le monde actuel', 'L''IA consomme-t-elle beaucoup d''énergie ?', 3),
  ('a0000008-0000-4000-8000-000000000008'::uuid, 'M2', 'L''IA face au monde', 'Comprendre le monde actuel', 'Pourquoi le monde se bat-il pour des puces électroniques ?', 4),
  ('a0000008-0000-4000-8000-000000000008'::uuid, 'M2', 'L''IA face au monde', 'Comprendre le monde actuel', 'Quels métiers l''IA est-elle en train de changer ?', 5)
) AS v(author_id, lot_code, lot_name, subject_area, title, order_index);