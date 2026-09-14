
CREATE OR REPLACE FUNCTION public.log_display_name_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.display_name IS DISTINCT FROM OLD.display_name
     AND EXISTS (SELECT 1 FROM public.contracts c WHERE c.author_id = NEW.id) THEN
    INSERT INTO public.activity_log (actor_id, entity, entity_id, action, comment)
    VALUES (NEW.id, 'author', NEW.id, 'display_name_changed',
            coalesce(OLD.display_name, '—') || ' -> ' || coalesce(NEW.display_name, '—'));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_display_name_change ON public.profiles;
CREATE TRIGGER profiles_display_name_change
AFTER UPDATE OF display_name ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_display_name_change();
