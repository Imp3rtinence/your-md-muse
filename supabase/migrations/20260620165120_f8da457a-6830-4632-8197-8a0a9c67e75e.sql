
-- G5 Mehrsprachigkeit
CREATE TABLE public.challenge_translations (
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  lang text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (challenge_id, lang)
);
GRANT SELECT ON public.challenge_translations TO authenticated, anon;
GRANT ALL ON public.challenge_translations TO service_role;
ALTER TABLE public.challenge_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read translations"
  ON public.challenge_translations FOR SELECT
  USING (true);

-- G7 Personalisierte Badges (Erweiterung bestehender badges-Tabelle)
ALTER TABLE public.badges
  ADD COLUMN IF NOT EXISTS is_personal boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS ai_reason text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_badges_owner ON public.badges(owner_user_id) WHERE is_personal;
