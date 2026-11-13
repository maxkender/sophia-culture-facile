CREATE OR REPLACE FUNCTION public.record_slideshow_email_result(p_email text, p_key text, p_event jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  IF p_key !~ '^email_[a-z0-9_]+$' OR jsonb_typeof(p_event) <> 'object' THEN
    RAISE EXCEPTION 'invalid_email_audit';
  END IF;
  UPDATE public.slideshow_applications
  SET timeline = coalesce(timeline, '{}'::jsonb) || jsonb_build_object(p_key, p_event)
  WHERE lower(trim(email)) = lower(trim(p_email));
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.record_slideshow_email_result(text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_slideshow_email_result(text, text, jsonb) TO service_role;