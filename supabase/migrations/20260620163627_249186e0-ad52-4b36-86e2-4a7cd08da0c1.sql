
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS difficulty text CHECK (difficulty IN ('leicht','mittel','mutig'));

CREATE INDEX IF NOT EXISTS challenges_tags_gin ON public.challenges USING gin(tags);
