ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_note text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS released_from uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS released_at timestamptz;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_upwork_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_upwork_status_check
  CHECK (upwork_status IN ('accepted', 'contacted', 'declined'));

UPDATE public.courses c
SET author_id = NULL,
    status = 'unassigned',
    released_from = p.id,
    released_at = '2026-09-14T00:00:00Z'
FROM public.profiles p
WHERE p.full_name = 'Takahiro Yamamoto' AND c.author_id = p.id;

UPDATE public.access_codes ac
SET state = 'available', assigned_to = NULL, assigned_at = NULL
FROM public.profiles p
WHERE p.full_name = 'Takahiro Yamamoto' AND ac.assigned_to = p.id;

UPDATE public.profiles
SET upwork_status = 'declined',
    admin_note = 'Declined 14 September. Cannot be publicly attributed because of his university''s restrictions on outside work. Worth approaching again if his situation changes.',
    access_code = NULL,
    access_redeem_url = NULL
WHERE full_name = 'Takahiro Yamamoto';