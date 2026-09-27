ALTER TABLE public.creator_applications DROP CONSTRAINT creator_applications_status_check;
ALTER TABLE public.creator_applications ADD CONSTRAINT creator_applications_status_check CHECK (status IN ('pending','interview','approved','rejected','new','reviewing','accepted','waitlist'));
ALTER TABLE public.creator_applications ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE public.slideshow_applications DROP CONSTRAINT slideshow_applications_status_check;
ALTER TABLE public.slideshow_applications ADD CONSTRAINT slideshow_applications_status_check CHECK (status IN ('pending','interview','approved','rejected','new','reviewing','accepted','waitlist'));
ALTER TABLE public.slideshow_applications ALTER COLUMN status SET DEFAULT 'pending';