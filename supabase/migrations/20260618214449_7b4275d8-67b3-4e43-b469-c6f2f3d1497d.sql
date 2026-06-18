ALTER TABLE public.challenges ADD COLUMN expires_at timestamptz;
CREATE INDEX IF NOT EXISTS challenges_expires_at_idx ON public.challenges (expires_at);