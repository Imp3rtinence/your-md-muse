
CREATE TABLE IF NOT EXISTS public.weekly_recaps (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  summary text NOT NULL,
  suggestion text NOT NULL,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_start)
);

GRANT SELECT ON public.weekly_recaps TO authenticated;
GRANT ALL ON public.weekly_recaps TO service_role;

ALTER TABLE public.weekly_recaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own recap read" ON public.weekly_recaps
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
