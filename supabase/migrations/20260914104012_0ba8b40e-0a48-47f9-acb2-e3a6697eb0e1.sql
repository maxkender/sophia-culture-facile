CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  admin_unread integer NOT NULL DEFAULT 0,
  author_unread integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX conversations_general_key ON public.conversations (profile_id) WHERE course_id IS NULL;
CREATE UNIQUE INDEX conversations_course_key ON public.conversations (profile_id, course_id) WHERE course_id IS NOT NULL;
CREATE INDEX conversations_last_message_idx ON public.conversations (last_message_at DESC NULLS LAST);

GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversations_select ON public.conversations FOR SELECT TO authenticated
  USING (profile_id = private.profile_id() OR private.is_admin());
CREATE POLICY conversations_insert ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (profile_id = private.profile_id() OR private.is_admin());
CREATE POLICY conversations_update ON public.conversations FOR UPDATE TO authenticated
  USING (profile_id = private.profile_id() OR private.is_admin())
  WITH CHECK (profile_id = private.profile_id() OR private.is_admin());

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
CREATE INDEX messages_conversation_idx ON public.messages (conversation_id, created_at);

GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY messages_select ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id
    AND (c.profile_id = private.profile_id() OR private.is_admin())));
CREATE POLICY messages_insert ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = private.profile_id() AND EXISTS (SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id AND (c.profile_id = private.profile_id() OR private.is_admin())));
CREATE POLICY messages_update ON public.messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id
    AND (c.profile_id = private.profile_id() OR private.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id
    AND (c.profile_id = private.profile_id() OR private.is_admin())));

CREATE OR REPLACE FUNCTION public.bump_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_role public.portal_role;
  owner_id uuid;
BEGIN
  SELECT c.profile_id INTO owner_id FROM public.conversations c WHERE c.id = NEW.conversation_id;
  SELECT p.role INTO sender_role FROM public.profiles p WHERE p.id = NEW.sender_id;
  UPDATE public.conversations
     SET last_message_at = NEW.created_at,
         admin_unread = CASE WHEN NEW.sender_id = owner_id THEN admin_unread + 1 ELSE 0 END,
         author_unread = CASE WHEN NEW.sender_id = owner_id THEN 0 ELSE author_unread + 1 END
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.bump_conversation() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER messages_bump_conversation
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.bump_conversation();

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  audience text NOT NULL DEFAULT 'all',
  target_profile_ids uuid[] NOT NULL DEFAULT '{}',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  dismissible boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY announcements_select ON public.announcements FOR SELECT TO authenticated
  USING (private.is_admin() OR (audience = 'all' OR private.profile_id() = ANY (target_profile_ids)));
CREATE POLICY announcements_admin_write ON public.announcements FOR ALL TO authenticated
  USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE TABLE public.announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, profile_id)
);

GRANT SELECT, INSERT ON public.announcement_reads TO authenticated;
GRANT ALL ON public.announcement_reads TO service_role;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY announcement_reads_select ON public.announcement_reads FOR SELECT TO authenticated
  USING (profile_id = private.profile_id() OR private.is_admin());
CREATE POLICY announcement_reads_insert ON public.announcement_reads FOR INSERT TO authenticated
  WITH CHECK (profile_id = private.profile_id());