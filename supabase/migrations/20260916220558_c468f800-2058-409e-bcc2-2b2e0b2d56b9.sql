COMMENT ON COLUMN public.profiles.institution IS 'Current employer / where the author works now. Past studies belong in education_records, never here.';
COMMENT ON TABLE public.education_records IS 'Where the author studied: degree, field, institution, year.';
UPDATE public.profiles SET institution = 'Saint Xavier University, Chicago' WHERE full_name = 'Mark Hoffman';