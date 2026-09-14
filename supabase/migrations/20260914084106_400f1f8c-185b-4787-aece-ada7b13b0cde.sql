ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upwork_status text NOT NULL DEFAULT 'contacted';
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_upwork_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_upwork_status_check CHECK (upwork_status IN ('accepted', 'contacted'));