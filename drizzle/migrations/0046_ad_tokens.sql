CREATE TABLE public.ad_tokens (
  app_id uuid NOT NULL,
  channel text NOT NULL,
  access_token text NOT NULL,
  advertiser_ids text[] NOT NULL DEFAULT '{}',
  scope jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (app_id, channel)
);
GRANT ALL ON public.ad_tokens TO service_role;
ALTER TABLE public.ad_tokens ENABLE ROW LEVEL SECURITY;