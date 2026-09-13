DELETE FROM public.contracts c USING public.contracts c2 WHERE c.author_id = c2.author_id AND c.signed_at < c2.signed_at;
CREATE UNIQUE INDEX IF NOT EXISTS contracts_author_unique ON public.contracts (author_id);
CREATE INDEX IF NOT EXISTS activity_log_entity_idx ON public.activity_log (entity, entity_id, created_at DESC);