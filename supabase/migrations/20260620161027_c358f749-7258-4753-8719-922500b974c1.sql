ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz,
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'friends';

ALTER TABLE public.groups
  DROP CONSTRAINT IF EXISTS groups_kind_check;

ALTER TABLE public.groups
  ADD CONSTRAINT groups_kind_check
  CHECK (kind IN ('friends','school','sport','neighborhood','other'));