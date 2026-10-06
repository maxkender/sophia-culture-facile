CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
ALTER TABLE public.ugc_settings ADD COLUMN IF NOT EXISTS cron_token text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex');