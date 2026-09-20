-- 1. Admin-only note on courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS admin_note text;
COMMENT ON COLUMN public.courses.admin_note IS 'Admin-only note. Never shown to authors.';

-- 2. Thirteen suggested courses into the pool
INSERT INTO public.courses (title, subtitle, subject_area, brief_note, admin_note, status)
VALUES
('Can the brain actually change?',
 'For most of the twentieth century the answer was no. It was wrong.',
 'Sciences',
 'Neuroplasticity: what changes, what does not, and what that means for learning, injury and age. Avoid the self-help version.',
 'Suggested 20 September, not yet reviewed', 'unassigned'),
('Why does the body attack itself?',
 'Your immune system is trained to recognise you. Sometimes it forgets.',
 'Sciences',
 'Autoimmune disease: how the immune system tells self from not-self, how that fails, and why women are affected far more often.',
 'Suggested 20 September, not yet reviewed', 'unassigned'),
('What turns a normal cell into a cancer cell?',
 'Not one mistake, but a sequence of them.',
 'Sciences',
 'The steps from healthy cell to tumour, why it usually takes years, and why most damaged cells never get there.',
 'Suggested 20 September, not yet reviewed. Overlaps with Grigory Mechetin''s "Why do some people get cancer and others do not?". Keep both only if the angles are kept distinct: his is about chance and risk, this one is about mechanism.',
 'unassigned'),
('How does anaesthesia actually work?',
 'We can switch consciousness off and on again, and we still do not fully know how.',
 'Sciences',
 'What general anaesthesia does to the brain, what it does not do, and why the mechanism remains partly unexplained after 170 years of use.',
 'Suggested 20 September, not yet reviewed. One of the best subjects in the pool.', 'unassigned'),
('Can your gut change your mood?',
 'There are more bacteria in you than cells of you, and they talk to your brain.',
 'Sciences',
 'The gut-brain axis and the microbiome. State what is established, what is promising, and what is hype. This field is full of overclaiming.',
 'Suggested 20 September, not yet reviewed', 'unassigned'),
('Can your environment change your genes?',
 'Your DNA is fixed. Which parts of it get read is not.',
 'Sciences',
 'Epigenetics explained through concrete examples: famine, stress, identical twins who diverge. Careful with the inheritance claims, which are contested.',
 'Suggested 20 September, not yet reviewed', 'unassigned'),
('Will we cure inherited diseases by editing genes?',
 'The tools exist. The question is what we are allowed to do with them.',
 'Sciences',
 'The angle is the ethics and the regulation, not the technique: what the tools can already do, who decides what is permitted, and where the lines are drawn.',
 'Suggested 20 September, not yet reviewed. Overlaps with Kate Lewis''s accepted course "Can you edit a human being''s DNA?". Consider whether this adds enough. If kept, the angle is the ethics and the regulation, not the technique.',
 'unassigned'),
('Why does time pass at different speeds?',
 'A clock on a mountain runs faster than one at sea level. Measurably.',
 'Sciences',
 'Relativity through its consequences: GPS satellites, the twin paradox, time at the edge of a black hole. No equations.',
 'Suggested 20 September, not yet reviewed', 'unassigned'),
('What is quantum physics, actually?',
 'The rules of the very small, and why they break your intuition.',
 'Sciences',
 'Superposition, uncertainty, entanglement, each through one concrete experiment the reader can picture. Avoid mysticism entirely.',
 'Suggested 20 September, not yet reviewed', 'unassigned'),
('What is consciousness?',
 'The one thing you are most certain of, and the one science understands least.',
 'Sciences',
 'The hard problem, the main theories, and why the question is still open. State positions, do not pick one.',
 'Suggested 20 September, not yet reviewed', 'unassigned'),
('Could we ever read a thought?',
 'Brain scanners can already guess what you are looking at.',
 'Sciences',
 'What brain imaging can and cannot decode today, what a thought even is in the brain, and where the limits are.',
 'Suggested 20 September, not yet reviewed', 'unassigned'),
('How did we find out the Earth goes round the Sun?',
 'It took two thousand years and a telescope.',
 'Histoire',
 'How the heliocentric picture was established: the observations, the instruments and the arguments that settled it.',
 'Suggested 20 September, not yet reviewed. The original suggestion, "important discoveries and how our knowledge developed", is too broad for one course. This is one concrete version. Others could follow: how we learned what blood does, how we found out the age of the Earth.',
 'unassigned'),
('What was a woman''s life like in the Middle Ages?',
 'Not what the films show, and not what the textbooks skip.',
 'Histoire',
 'What daily life, work, rights and constraints actually looked like for women in medieval Europe.',
 'Suggested 20 September, not yet reviewed. The original suggestion, "how women lived in different epochs", is too broad for one course. This is one epoch. Others could follow for antiquity, the nineteenth century, and so on.',
 'unassigned');

-- 3. Author course proposals
CREATE TABLE public.course_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  subtitle text,
  subject_area text,
  reveal text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  decline_reason text,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid REFERENCES public.profiles(id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_proposals TO authenticated;
GRANT ALL ON public.course_proposals TO service_role;

ALTER TABLE public.course_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY course_proposals_select ON public.course_proposals
  FOR SELECT TO authenticated
  USING ((profile_id = private.profile_id()) OR private.is_admin());

CREATE POLICY course_proposals_insert ON public.course_proposals
  FOR INSERT TO authenticated
  WITH CHECK ((profile_id = private.profile_id()) AND status = 'pending');

CREATE POLICY course_proposals_update_admin ON public.course_proposals
  FOR UPDATE TO authenticated
  USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE POLICY course_proposals_delete_admin ON public.course_proposals
  FOR DELETE TO authenticated
  USING (private.is_admin());

CREATE OR REPLACE FUNCTION public.cap_pending_proposals()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'pending' AND (
    SELECT count(*) FROM public.course_proposals p
    WHERE p.profile_id = NEW.profile_id AND p.status = 'pending'
  ) >= 3 THEN
    RAISE EXCEPTION 'Three proposals are already pending for this author';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER cap_pending_proposals
BEFORE INSERT ON public.course_proposals
FOR EACH ROW EXECUTE FUNCTION public.cap_pending_proposals();

CREATE OR REPLACE FUNCTION public.notify_on_proposal_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  IF NEW.status = 'approved_assigned' THEN
    PERFORM public.notify_author(NEW.profile_id, 'proposal_approved', NEW.course_id,
      'Your proposal was approved: ' || NEW.title || ' is now yours to write.');
  ELSIF NEW.status = 'approved_to_pool' THEN
    PERFORM public.notify_author(NEW.profile_id, 'proposal_approved', NULL,
      'Your proposal ' || NEW.title || ' was approved and added to the open courses pool.');
  ELSIF NEW.status = 'declined' THEN
    PERFORM public.notify_author(NEW.profile_id, 'proposal_declined', NULL,
      'Your proposal ' || NEW.title || ' was declined.' || COALESCE(' ' || NEW.decline_reason, ''));
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER notify_on_proposal_decision
AFTER UPDATE ON public.course_proposals
FOR EACH ROW EXECUTE FUNCTION public.notify_on_proposal_decision();