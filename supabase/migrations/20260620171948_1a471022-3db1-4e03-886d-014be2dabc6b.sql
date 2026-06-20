GRANT INSERT, UPDATE ON public.user_ai_profile TO authenticated;

CREATE POLICY "own profile insert" ON public.user_ai_profile
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own profile update" ON public.user_ai_profile
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);