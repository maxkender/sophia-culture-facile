DO $$ DECLARE c text; BEGIN
  SELECT conname INTO c FROM pg_constraint WHERE conrelid = 'public.assets'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) ILIKE '%folder%';
  IF c IS NOT NULL THEN EXECUTE format('ALTER TABLE public.assets DROP CONSTRAINT %I', c); END IF;
END $$;
ALTER TABLE public.assets ADD CONSTRAINT assets_folder_check CHECK (folder IN ('screen_recordings','logos','sounds','broll','captions','references','generic'));