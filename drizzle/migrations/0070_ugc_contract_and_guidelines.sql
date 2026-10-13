ALTER TABLE public.creator_signatures ADD COLUMN IF NOT EXISTS document_slug text NOT NULL DEFAULT 'creator-agreement';
ALTER TABLE public.creator_signatures ADD COLUMN IF NOT EXISTS contract_snapshot text;
ALTER TABLE public.creator_signatures ADD COLUMN IF NOT EXISTS contract_lang text;
ALTER TABLE public.creator_signatures DROP CONSTRAINT IF EXISTS creator_signatures_creator_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS creator_signatures_creator_doc_key ON public.creator_signatures (creator_id, document_slug) WHERE creator_id IS NOT NULL;
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS guidelines_accepted_at timestamptz;
COMMENT ON COLUMN public.creators.rules_accepted_at IS 'DEPRECATED for UGC: replaced by guidelines_accepted_at (creator-rules document no longer in the UGC flow)';