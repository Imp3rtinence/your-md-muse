-- Revoke sensitive column SELECT on profiles
REVOKE SELECT (lat, lng, location_updated_at) ON public.profiles FROM authenticated, anon;

-- Tighten reactions policies to authenticated role only
DROP POLICY IF EXISTS "reactions insert own" ON public.reactions;
DROP POLICY IF EXISTS "reactions delete own" ON public.reactions;

CREATE POLICY "reactions insert own" ON public.reactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reactions delete own" ON public.reactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);