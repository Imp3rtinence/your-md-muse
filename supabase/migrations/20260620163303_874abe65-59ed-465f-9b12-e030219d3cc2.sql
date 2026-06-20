
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS created_by_ai boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS challenges_created_by_ai_idx ON public.challenges(created_by_ai) WHERE created_by_ai = true;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
