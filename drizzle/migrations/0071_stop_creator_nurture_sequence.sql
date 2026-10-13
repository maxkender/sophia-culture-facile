DROP TRIGGER IF EXISTS creators_schedule_sequence ON public.creators;
COMMENT ON FUNCTION public.schedule_creator_sequence() IS 'DEPRECATED: nurture j0/j2/j7 emails removed; trigger dropped';
COMMENT ON TABLE public.creator_email_sequence IS 'DEPRECATED: no rows are ever created; nurture emails removed';