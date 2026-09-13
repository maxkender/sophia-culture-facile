ALTER TABLE public.profiles DISABLE TRIGGER profiles_guard;
UPDATE public.profiles SET user_id = '1762d70f-62d0-4d16-9b3f-85762e1a0aa8', activated_at = now() WHERE id = '99999999-9999-4999-8999-999999999999';
ALTER TABLE public.profiles ENABLE TRIGGER profiles_guard;