
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_version INTEGER NOT NULL DEFAULT 1,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents_read" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "documents_admin_write" ON public.documents FOR ALL TO authenticated
  USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TABLE public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  note TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, version)
);
GRANT SELECT, INSERT ON public.document_versions TO authenticated;
GRANT ALL ON public.document_versions TO service_role;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "document_versions_read" ON public.document_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "document_versions_admin_write" ON public.document_versions FOR ALL TO authenticated
  USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TRIGGER documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.documents (slug, title, content, current_version)
VALUES
  ('guide', 'Sophia writing guide', '[{"type":"callout","tone":"red","title":"DO THIS FIRST","body":"Open the Sophia app and read three or four courses in your own subject area before you write a single word.\n\nYour access code is on your home page. Ten minutes in the app will teach you more about the format than this whole guide, and it is the single best thing you can do to avoid a round of corrections. Nothing else here makes proper sense until you have seen a real course on a real phone."},{"type":"heading","level":2,"text":"Before you start"},{"type":"paragraph","text":"Each course is published under the author''s name, with their title and qualifications, and where the format allows a short biography and a photograph. That is the point of commissioning a person rather than generating the text."},{"type":"paragraph","text":"An author who would prefer not to be identified should say so immediately, because it changes the arrangement entirely."},{"type":"paragraph","text":"Authors keep the right to teach, publish and speak on the same topics. Nothing is exclusive to their ideas, only to the specific text."},{"type":"heading","level":2,"text":"Who reads this"},{"type":"paragraph","text":"The reader is 18 to 25, knows nothing about the subject, and is intelligent. All three matter equally."},{"type":"paragraph","text":"They read on a phone, five to ten minutes at a time. They are not revising for an exam and they will not take notes. What they keep is one idea."},{"type":"paragraph","text":"The whole job is to write so that someone with no background understands every sentence on first reading. No technical term without a short explanation right beside it, no assumed knowledge, no sentence that needs re-reading."},{"type":"paragraph","text":"The test: read it aloud. If you run out of breath the sentence is too long. If you hesitate on a word the reader stops there."},{"type":"heading","level":2,"text":"The five screens"},{"type":"paragraph","text":"There are exactly five. The reader taps Continue between them and does not go back."},{"type":"paragraph","text":"Screen 1 opens, with a short line under the title setting up the question, then two paragraphs: one or two concrete figures to frame the scale, then where the answer will come from."},{"type":"paragraph","text":"Screens 2 to 4 explain, one idea per screen, each answering something the screen before raised."},{"type":"paragraph","text":"Screen 5 closes by drawing the consequence or widening the frame. It does not summarise."},{"type":"paragraph","text":"Each screen carries its own title. The course title is a question, the screen titles are statements, short ones."},{"type":"paragraph","text":"Length: 100 to 140 words per screen, 500 to 700 for the whole course."},{"type":"paragraph","text":"Bold two or three expressions per screen, the terms and numbers that carry the explanation, nothing else."},{"type":"paragraph","text":"Authors do not source images. Where a screen would benefit, write one line saying what it should show."},{"type":"heading","level":2,"text":"How to write"},{"type":"bullets","items":["Short sentences, one idea each. Cut when in doubt.","Present tense for historical events.","Address the reader as \"you\" or avoid the pronoun. Never a formal register.","Explain every technical word where it first appears, in half a sentence, not a heavy parenthesis.","Two figures per screen at most.","Orders of magnitude beat decimals: \"about a quarter\", not \"24.7%\".","A concrete comparison beats an abstract quantity.","Where the science or history is genuinely unsettled, say so and say who disagrees. That is different from hedging.","Where most people believe something wrong, address it head-on, but do not force it: most courses simply explain."]},{"type":"heading","level":2,"text":"What gets sent back"},{"type":"table","header":["What we send back","Why"],"rows":[["Announcing the plan (\"we will see that\", \"first of all\")","The reader needs the path, not the map."],["Summarising (\"in conclusion\", \"to sum up\")","Screen 5 opens out, it does not close down."],["Hedging (\"it would seem that\", \"some authors have suggested\")","If it is established say it, if it is contested say who contests it."],["Piling up","Three dates and four proper nouns on one screen and the reader stops."],["Flat chronology (\"then\", \"next\", \"finally\")","A course that only advances in date order is a summary."]]},{"type":"heading","level":2,"text":"Where you write"},{"type":"paragraph","text":"Everything happens in this author space. There is no document to send back."},{"type":"paragraph","text":"Courses are already waiting. The author writes directly in the page and the work saves itself every few seconds."},{"type":"paragraph","text":"Each course page has the title and subtitle already filled in and editable, a note from us above the editor saying what the course should cover, five numbered blocks each with a screen title, body text and an optional image suggestion, a live word count per screen and for the course, a sources section, and a Submit button that unlocks once all five screens have a title and a body."},{"type":"paragraph","text":"Bold is written with double asterisks and checked with the preview toggle. That is the only formatting."},{"type":"paragraph","text":"We handle layout, illustration, integration and the audio version."},{"type":"heading","level":2,"text":"Sources"},{"type":"paragraph","text":"Sources are optional and not published, but fill them in. It is the single thing that makes editing fast instead of slow, and it protects both sides if a claim is challenged after publication."},{"type":"paragraph","text":"One row per non-obvious claim: the claim, the book or article, the page."},{"type":"paragraph","text":"A counter-intuitive claim needs a firmer source than an ordinary one, because it is the one a reader will check."},{"type":"paragraph","text":"Where the field genuinely disagrees with itself, say so in the text and say who holds which position."},{"type":"paragraph","text":"These rules exist to get from you what nobody else can write. If one of them stops you saying something that matters, tell us rather than working around it. We will adjust."}]'::jsonb, 1),
  ('contract', 'Author agreement — commissioned course and assignment of rights', '[{"type":"callout","tone":"blue","title":"Placeholder","body":"The final agreement text has not been pasted in yet. The editorial desk edits this document from Documents > Author contract in the admin area. Saving there creates a new version; authors who have already signed stay bound to the version they signed."},{"type":"heading","level":2,"text":"1. Parties"},{"type":"paragraph","text":"To be completed by the administrator."}]'::jsonb, 1);

INSERT INTO public.document_versions (document_id, version, title, content, note)
SELECT id, 1, title, content, 'Initial version' FROM public.documents;
