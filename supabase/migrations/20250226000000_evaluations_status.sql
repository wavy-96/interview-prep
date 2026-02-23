-- Story 8.1: Add evaluation_status for pending/failed tracking
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS evaluation_status TEXT
  DEFAULT 'completed' CHECK (evaluation_status IN ('pending', 'completed', 'failed'));
