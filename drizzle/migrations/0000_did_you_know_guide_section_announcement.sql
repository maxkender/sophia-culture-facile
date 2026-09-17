-- 1. Optional "Did you know?" facts on a course (max three, enforced in the app).
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS did_you_know text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.courses.did_you_know IS 'Optional author-supplied surprising facts (max 3). Not counted in the word target.';

-- 2. Writing guide: new section near the end, archived as a new version.
DO $$
DECLARE
  doc RECORD;
  new_content jsonb;
  section jsonb;
  n int;
BEGIN
  SELECT * INTO doc FROM public.documents WHERE slug = 'guide';
  IF doc IS NULL THEN RETURN; END IF;

  section := jsonb_build_array(
    jsonb_build_object('type','heading','level',2,'text','What you write, and what you do not'),
    jsonb_build_object('type','paragraph','text','Your job is the five screens and the sources. Three things in the app are not yours to write.'),
    jsonb_build_object('type','paragraph','text','**Did you know boxes.** Optional. If you have one or two genuinely surprising facts that did not fit into the five screens, add them in the field at the bottom of the editor, one or two sentences each. They do not count toward the word target. We decide whether to use them.'),
    jsonb_build_object('type','paragraph','text','**Definitions.** Do not write separate definitions. Explain a term in half a sentence where it first appears, as this guide says. We build the glossary from what you wrote.'),
    jsonb_build_object('type','paragraph','text','**Quizzes.** Nothing for you to do. We write them from your text once the course is accepted.')
  );

  n := jsonb_array_length(doc.content);
  -- insert before the closing paragraph
  new_content := (
    SELECT coalesce(jsonb_agg(b ORDER BY ord), '[]'::jsonb)
    FROM (
      SELECT b, ord FROM jsonb_array_elements(doc.content) WITH ORDINALITY AS t(b, ord) WHERE ord <= n - 1
      UNION ALL
      SELECT b, (n - 1) + ord FROM jsonb_array_elements(section) WITH ORDINALITY AS s(b, ord)
      UNION ALL
      SELECT b, n + jsonb_array_length(section) FROM jsonb_array_elements(doc.content) WITH ORDINALITY AS u(b, ord) WHERE ord = n
    ) merged
  );

  -- keep the previous version retrievable
  INSERT INTO public.document_versions (document_id, version, title, content, note)
  VALUES (doc.id, doc.current_version, doc.title, doc.content, 'Archived before adding "What you write, and what you do not"')
  ON CONFLICT DO NOTHING;

  UPDATE public.documents
  SET content = new_content,
      current_version = doc.current_version + 1,
      updated_at = now()
  WHERE id = doc.id;

  INSERT INTO public.document_versions (document_id, version, title, content, note)
  VALUES (doc.id, doc.current_version + 1, doc.title, new_content, 'Added "What you write, and what you do not"')
  ON CONFLICT DO NOTHING;
END $$;

-- 3. Raphael Seguin's due dates.
UPDATE public.courses c
SET due_date = '2026-09-25'
FROM public.profiles p
WHERE c.author_id = p.id AND p.full_name ILIKE 'Raphael Seguin'
  AND c.title IN ('Are we going to run out of water?', 'What is a carbon credit?');

UPDATE public.courses c
SET due_date = '2026-10-02'
FROM public.profiles p
WHERE c.author_id = p.id AND p.full_name ILIKE 'Raphael Seguin'
  AND c.title ILIKE '%ITER%';

-- 4. Announcement to all authors.
INSERT INTO public.announcements (title, body, audience, dismissible, created_by)
SELECT
  'Three things you do not have to write',
  'Your job is the five screens and the sources. Three things in the app are not yours to write.

**Did you know boxes.** Optional. If you have one or two genuinely surprising facts that did not fit into the five screens, add them in the field at the bottom of the editor, one or two sentences each. They do not count toward the word target. We decide whether to use them.

**Definitions.** Do not write separate definitions. Explain a term in half a sentence where it first appears, as this guide says. We build the glossary from what you wrote.

**Quizzes.** Nothing for you to do. We write them from your text once the course is accepted.',
  'all', true,
  (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM public.announcements WHERE title = 'Three things you do not have to write'
);