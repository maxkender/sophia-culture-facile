-- remove previous demo authors and their courses
DELETE FROM public.courses WHERE author_id IN (SELECT id FROM public.profiles WHERE role = 'author');
DELETE FROM public.profiles WHERE role = 'author';
UPDATE public.access_codes SET state = 'available', assigned_to = NULL, assigned_at = NULL WHERE assigned_to IS NULL OR assigned_to IS NOT NULL;

INSERT INTO public.access_codes (code, redeem_url, platform, state)
VALUES
  ('SOPHIA-IOS-0001', 'https://apps.apple.com/redeem?ctx=offercodes&code=SOPHIA-IOS-0001', 'ios', 'available'),
  ('SOPHIA-IOS-0002', 'https://apps.apple.com/redeem?ctx=offercodes&code=SOPHIA-IOS-0002', 'ios', 'available'),
  ('SOPHIA-IOS-0003', 'https://apps.apple.com/redeem?ctx=offercodes&code=SOPHIA-IOS-0003', 'ios', 'available'),
  ('SOPHIA-AND-0001', 'https://play.google.com/redeem?code=SOPHIA-AND-0001', 'android', 'available'),
  ('SOPHIA-AND-0002', 'https://play.google.com/redeem?code=SOPHIA-AND-0002', 'android', 'available')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.profiles (id, email, role, full_name, title, institution, country, platform, bio, access_code, access_redeem_url, invite_token, invited_at, invite_expires_at, activated_at)
VALUES
  ('22222222-2222-4222-8222-222222222222', 'a.osei@example.edu', 'author', 'Amara Osei', 'Senior Lecturer in History of Science', 'University of Ghana', 'Ghana', 'ios',
   'Historian of science working on knowledge exchange between West Africa and Europe in the early modern period.',
   'SOPHIA-IOS-0001', 'https://apps.apple.com/redeem?ctx=offercodes&code=SOPHIA-IOS-0001', 'inv_amara_7c41d0b9', now() - interval '3 days', now() + interval '27 days', NULL),
  ('33333333-3333-4333-8333-333333333333', 'l.bertrand@example.edu', 'author', 'Lucas Bertrand', 'Professor of Egyptology', 'Université de Strasbourg', 'France', 'android',
   'Egyptologist, field director on two Old Kingdom excavation sites, author of three books on pyramid construction.',
   'SOPHIA-AND-0001', 'https://play.google.com/redeem?code=SOPHIA-AND-0001', NULL, now() - interval '12 days', NULL, now() - interval '9 days'),
  ('44444444-4444-4444-8444-444444444444', 'h.weiss@example.edu', 'author', 'Hannah Weiss', 'Associate Professor of Microbiology', 'ETH Zürich', 'Switzerland', 'ios',
   'Microbiologist studying antimicrobial resistance in hospital environments; teaches undergraduate immunology.',
   'SOPHIA-IOS-0002', 'https://apps.apple.com/redeem?ctx=offercodes&code=SOPHIA-IOS-0002', NULL, now() - interval '20 days', NULL, now() - interval '18 days');

UPDATE public.access_codes SET state = 'sent', assigned_to = '22222222-2222-4222-8222-222222222222', assigned_at = now() - interval '3 days' WHERE code = 'SOPHIA-IOS-0001';
UPDATE public.access_codes SET state = 'sent', assigned_to = '33333333-3333-4333-8333-333333333333', assigned_at = now() - interval '12 days' WHERE code = 'SOPHIA-AND-0001';
UPDATE public.access_codes SET state = 'sent', assigned_to = '44444444-4444-4444-8444-444444444444', assigned_at = now() - interval '20 days' WHERE code = 'SOPHIA-IOS-0002';

INSERT INTO public.contracts (author_id, document_version, signed_name, signed_at, signature_ip, user_agent)
VALUES ('44444444-4444-4444-8444-444444444444', '1', 'Hannah Weiss', now() - interval '17 days', '203.0.113.24', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');

INSERT INTO public.courses (id, author_id, lot_code, subject_area, title, subtitle, brief_note, status, order_index, due_date)
VALUES
  ('aaaaaaa1-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'L1-01', 'Human body', 'Why do we blush?',
   'The only expression we cannot fake', 'Explain the physiology first, then why blushing is social rather than purely reflexive. Close on why it is thought to be unique to humans.', 'assigned', 1, current_date + 14),
  ('aaaaaaa1-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'L1-02', 'History', 'Who really built the pyramids?',
   'Not slaves, and not aliens', 'Take the workers'' village evidence as the spine. Address the slavery myth directly and where it comes from.', 'assigned', 2, current_date + 21),
  ('aaaaaaa1-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333', 'L2-01', 'Technology', 'How does an AI that writes actually work?',
   'Prediction, not understanding', 'No jargon. Use the next-word prediction framing. Be honest about what the model does not do.', 'assigned', 1, current_date + 10),
  ('aaaaaaa1-0000-4000-8000-000000000004', '44444444-4444-4444-8444-444444444444', 'L3-01', 'Science', 'Why are antibiotics starting to fail?',
   'Evolution, on a hospital timescale', 'Resistance as evolution under pressure. Include one concrete hospital example and end on what actually helps.', 'in_progress', 1, current_date + 7);

INSERT INTO public.screens (course_id, screen_number, screen_title, body, image_idea)
VALUES
  ('aaaaaaa1-0000-4000-8000-000000000004', 1, 'A drug that stopped working',
   'In 1942, a single dose of penicillin could pull a patient back from a fatal infection. Doctors called it a miracle, and for about a decade it behaved like one. Then the same infections began coming back, in the same hospitals, and the same drug no longer touched them. Nothing about the medicine had changed. What had changed were the bacteria. **Resistance is not a failure of chemistry; it is evolution doing exactly what evolution does**, only fast enough for one doctor to watch it happen across a career.',
   'A 1940s penicillin vial photographed against a plain background'),
  ('aaaaaaa1-0000-4000-8000-000000000004', 2, 'Evolution on a hospital timescale',
   'A bacterial population is not a crowd of identical copies. Random mutation means a few cells always differ, and occasionally one of those differences happens to blunt a drug: a thicker wall, a pump that ejects the molecule, an enzyme that cuts it apart. Give the antibiotic, and you kill everything except those few. They inherit an empty field and divide every twenty minutes. **The drug does not create resistance. It selects for it.** Within days the population that remains is the one the drug cannot reach.',
   'Diagram of a bacterial population before and after exposure'),
  ('aaaaaaa1-0000-4000-8000-000000000004', 3, 'Why hospitals make it worse',
   'Hospitals concentrate the two ingredients resistance needs: heavy antibiotic use and a steady supply of vulnerable patients. Bacteria also trade resistance genes sideways, on small rings of DNA called plasmids, so a species that has never met a drug can acquire protection from a neighbour that has. That is how a gene first seen in one ward in one country turns up on another continent within a few years.',
   'Illustration of plasmid transfer between two bacterial cells');

INSERT INTO public.sources (course_id, claim, reference, page)
VALUES
  ('aaaaaaa1-0000-4000-8000-000000000004', 'Penicillin resistance in Staphylococcus aureus was reported within a decade of clinical use', 'Rammelkamp & Maxon, Proc Soc Exp Biol Med, 1942', '386'),
  ('aaaaaaa1-0000-4000-8000-000000000004', 'Horizontal gene transfer via plasmids is a primary route for resistance spread', 'WHO, Global Antimicrobial Resistance Surveillance Report, 2022', '18');

INSERT INTO public.activity_log (actor_id, entity, entity_id, action, comment, created_at)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'author', '22222222-2222-4222-8222-222222222222', 'author_created', 'Invite generated', now() - interval '3 days'),
  ('11111111-1111-4111-8111-111111111111', 'author', '44444444-4444-4444-8444-444444444444', 'author_created', 'Invite generated', now() - interval '20 days'),
  ('44444444-4444-4444-8444-444444444444', 'contract', '44444444-4444-4444-8444-444444444444', 'contract_signed', 'Version 1', now() - interval '17 days');