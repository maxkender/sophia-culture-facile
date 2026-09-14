CREATE OR REPLACE FUNCTION public.guard_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') OR private.is_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role
    OR NEW.access_code IS DISTINCT FROM OLD.access_code
    OR NEW.access_redeem_url IS DISTINCT FROM OLD.access_redeem_url
    OR NEW.invite_token IS DISTINCT FROM OLD.invite_token
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Not allowed to change privileged profile fields';
  END IF;
  RETURN NEW;
END;
$$;