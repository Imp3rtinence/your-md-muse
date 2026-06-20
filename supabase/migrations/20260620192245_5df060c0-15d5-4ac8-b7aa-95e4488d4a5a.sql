REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (username, display_name, avatar_url, bio, birth_year, is_private, interests, onboarded_at, updated_at) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.profiles_protect_sensitive_cols()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.aura IS DISTINCT FROM OLD.aura
     OR NEW.weekly_aura IS DISTINCT FROM OLD.weekly_aura
     OR NEW.league_tier IS DISTINCT FROM OLD.league_tier
     OR NEW.streak_days IS DISTINCT FROM OLD.streak_days
     OR NEW.last_active_date IS DISTINCT FROM OLD.last_active_date
     OR NEW.week_start IS DISTINCT FROM OLD.week_start
     OR NEW.is_ai_bot IS DISTINCT FROM OLD.is_ai_bot
     OR NEW.bot_persona IS DISTINCT FROM OLD.bot_persona THEN
    RAISE EXCEPTION 'protected profile columns can only be modified by trusted server code';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_sensitive_cols ON public.profiles;
CREATE TRIGGER profiles_protect_sensitive_cols
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_protect_sensitive_cols();

DROP POLICY IF EXISTS "user_badges insert own" ON public.user_badges;
DROP POLICY IF EXISTS "aura insert own" ON public.aura_events;
REVOKE INSERT ON public.user_badges FROM authenticated, anon;
REVOKE INSERT ON public.aura_events FROM authenticated, anon;
GRANT ALL ON public.user_badges TO service_role;
GRANT ALL ON public.aura_events TO service_role;

DROP POLICY IF EXISTS "reactions read all" ON public.reactions;
CREATE POLICY "reactions read via challenge" ON public.reactions
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.submissions s
    JOIN public.challenges c ON c.id = s.challenge_id
    WHERE s.id = reactions.submission_id
      AND (
        c.creator_id = auth.uid()
        OR s.user_id = auth.uid()
        OR c.visibility = 'public'
        OR (c.visibility = 'friends' AND public.are_friends(auth.uid(), c.creator_id))
      )
  )
);

DROP POLICY IF EXISTS "anyone can read translations" ON public.challenge_translations;
REVOKE SELECT ON public.challenge_translations FROM anon;
GRANT SELECT ON public.challenge_translations TO authenticated;
CREATE POLICY "challenge_translations read via challenge"
ON public.challenge_translations
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_translations.challenge_id
      AND (
        c.creator_id = auth.uid()
        OR c.visibility = 'public'
        OR (c.visibility = 'friends' AND public.are_friends(auth.uid(), c.creator_id))
      )
  )
);

DROP POLICY IF EXISTS "badges readable by everyone" ON public.badges;
REVOKE SELECT ON public.badges FROM anon;
GRANT SELECT ON public.badges TO authenticated;
CREATE POLICY "badges read global or own personal"
ON public.badges
FOR SELECT TO authenticated USING (
  COALESCE(is_personal, false) = false
  OR owner_user_id = auth.uid()
);

ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;
ALTER TABLE public.reports
  ADD CONSTRAINT reports_reporter_id_fkey
  FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;