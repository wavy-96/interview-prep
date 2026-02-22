-- Story 4.1b: Add openai_item_id for transcript upsert (deduplication on retries)
ALTER TABLE public.transcripts ADD COLUMN IF NOT EXISTS openai_item_id TEXT;
-- Unique constraint allows multiple NULLs; used for ON CONFLICT upsert
ALTER TABLE public.transcripts DROP CONSTRAINT IF EXISTS transcripts_openai_item_id_key;
ALTER TABLE public.transcripts ADD CONSTRAINT transcripts_openai_item_id_key UNIQUE (openai_item_id);
