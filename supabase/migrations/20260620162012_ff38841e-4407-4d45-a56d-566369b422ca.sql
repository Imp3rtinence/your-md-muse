
CREATE TABLE public.user_ai_profile (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  summary text,
  traits jsonb NOT NULL DEFAULT '{}'::jsonb,
  suggested_challenges jsonb NOT NULL DEFAULT '[]'::jsonb,
  suggested_crew_kinds jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_ai_profile TO authenticated;
GRANT ALL ON public.user_ai_profile TO service_role;

ALTER TABLE public.user_ai_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile read" ON public.user_ai_profile
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER user_ai_profile_touch
  BEFORE UPDATE ON public.user_ai_profile
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
