CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX notifications_profile_idx ON public.notifications (profile_id, created_at DESC);
CREATE INDEX notifications_course_idx ON public.notifications (course_id);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select ON public.notifications FOR SELECT TO authenticated
  USING ((profile_id = private.profile_id()) OR private.is_admin());

CREATE POLICY notifications_update ON public.notifications FOR UPDATE TO authenticated
  USING ((profile_id = private.profile_id()) OR private.is_admin())
  WITH CHECK ((profile_id = private.profile_id()) OR private.is_admin());

CREATE OR REPLACE FUNCTION public.notify_author(_profile_id uuid, _type text, _course_id uuid, _body text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _profile_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.notifications (profile_id, type, course_id, body)
  VALUES (_profile_id, _type, _course_id, _body);
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_on_course_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.author_id IS NOT NULL AND NEW.status = 'assigned' THEN
      PERFORM public.notify_author(NEW.author_id, 'course_assigned', NEW.id,
        'A new course was assigned to you: ' || NEW.title);
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.author_id IS NOT NULL AND NEW.author_id IS DISTINCT FROM OLD.author_id THEN
    PERFORM public.notify_author(NEW.author_id, 'course_assigned', NEW.id,
      'A new course was assigned to you: ' || NEW.title);
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.author_id IS NOT NULL THEN
    IF NEW.status = 'changes_requested' THEN
      PERFORM public.notify_author(NEW.author_id, 'changes_requested', NEW.id,
        'Changes requested on ' || NEW.title || COALESCE(': ' || NEW.review_comment, ''));
    ELSIF NEW.status = 'accepted' THEN
      PERFORM public.notify_author(NEW.author_id, 'course_accepted', NEW.id,
        'Your course was accepted: ' || NEW.title);
    ELSIF NEW.status = 'published' THEN
      PERFORM public.notify_author(NEW.author_id, 'course_published', NEW.id,
        'Your course is now published: ' || NEW.title);
    END IF;
  END IF;

  IF NEW.due_date IS DISTINCT FROM OLD.due_date
     AND NEW.author_id IS NOT NULL
     AND NEW.author_id IS NOT DISTINCT FROM OLD.author_id THEN
    PERFORM public.notify_author(NEW.author_id, 'due_date_changed', NEW.id,
      CASE WHEN NEW.due_date IS NULL
        THEN 'The due date was removed on ' || NEW.title
        ELSE 'New due date for ' || NEW.title || ': ' || to_char(NEW.due_date, 'DD Mon YYYY')
      END);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_course_change
AFTER INSERT OR UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.notify_on_course_change();

CREATE OR REPLACE FUNCTION public.notify_on_admin_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner uuid;
  _course uuid;
  _sender_role portal_role;
BEGIN
  SELECT c.profile_id, c.course_id INTO _owner, _course
  FROM public.conversations c WHERE c.id = NEW.conversation_id;
  IF _owner IS NULL OR NEW.sender_id IS NULL OR NEW.sender_id = _owner THEN
    RETURN NEW;
  END IF;
  SELECT p.role INTO _sender_role FROM public.profiles p WHERE p.id = NEW.sender_id;
  IF _sender_role IS DISTINCT FROM 'admin'::portal_role THEN
    RETURN NEW;
  END IF;
  PERFORM public.notify_author(_owner, 'message', _course,
    'New message from the editorial desk: ' || left(NEW.body, 140));
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_admin_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_admin_message();

CREATE OR REPLACE FUNCTION public.notify_on_request_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _title text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  SELECT title INTO _title FROM public.courses WHERE id = NEW.course_id;
  IF NEW.status = 'approved' THEN
    PERFORM public.notify_author(NEW.profile_id, 'request_approved', NEW.course_id,
      'Your request was approved: ' || COALESCE(_title, 'a course') || ' is now yours.');
  ELSIF NEW.status = 'declined' THEN
    PERFORM public.notify_author(NEW.profile_id, 'request_declined', NULL,
      'Your request for ' || COALESCE(_title, 'a course') || ' was declined.'
      || COALESCE(' ' || NEW.decline_reason, ''));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_request_decision
AFTER UPDATE ON public.course_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_on_request_decision();