
-- Location columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS location_updated_at timestamptz;

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision;

CREATE INDEX IF NOT EXISTS challenges_latlng_idx ON public.challenges (lat, lng) WHERE lat IS NOT NULL;

-- Auto-fill challenge lat/lng from creator profile on insert
CREATE OR REPLACE FUNCTION public.challenge_fill_location()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.lat IS NULL OR NEW.lng IS NULL THEN
    SELECT lat, lng INTO NEW.lat, NEW.lng FROM public.profiles WHERE id = NEW.creator_id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_challenges_fill_location ON public.challenges;
CREATE TRIGGER trg_challenges_fill_location
  BEFORE INSERT ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.challenge_fill_location();

-- Invites table
CREATE TABLE IF NOT EXISTS public.challenge_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  invited_user_id uuid NOT NULL,
  invited_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, invited_user_id)
);
GRANT SELECT, INSERT, DELETE ON public.challenge_invites TO authenticated;
GRANT ALL ON public.challenge_invites TO service_role;
ALTER TABLE public.challenge_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites read involved" ON public.challenge_invites FOR SELECT TO authenticated
  USING (invited_user_id = auth.uid() OR invited_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = challenge_id AND c.creator_id = auth.uid()));
CREATE POLICY "invites insert by creator" ON public.challenge_invites FOR INSERT TO authenticated
  WITH CHECK (invited_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = challenge_id AND c.creator_id = auth.uid()));
CREATE POLICY "invites delete by creator" ON public.challenge_invites FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = challenge_id AND c.creator_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.is_invited_to_challenge(_challenge uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.challenge_invites WHERE challenge_id = _challenge AND invited_user_id = _user);
$$;
REVOKE EXECUTE ON FUNCTION public.is_invited_to_challenge(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_invited_to_challenge(uuid, uuid) TO authenticated;

-- Rewrite SELECT policy on challenges to include 'private'
DROP POLICY IF EXISTS "challenges read by visibility" ON public.challenges;
CREATE POLICY "challenges read by visibility" ON public.challenges FOR SELECT TO authenticated
  USING (
    creator_id = auth.uid()
    OR visibility = 'public'::public.challenge_visibility
    OR (visibility = 'friends'::public.challenge_visibility AND public.are_friends(auth.uid(), creator_id))
    OR (visibility = 'private'::public.challenge_visibility AND public.is_invited_to_challenge(id, auth.uid()))
  );

-- Location RPC
CREATE OR REPLACE FUNCTION public.update_my_location(_lat double precision, _lng double precision)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Nicht eingeloggt'; END IF;
  IF _lat < -90 OR _lat > 90 OR _lng < -180 OR _lng > 180 THEN RAISE EXCEPTION 'Ungültige Koordinaten'; END IF;
  UPDATE public.profiles SET lat = _lat, lng = _lng, location_updated_at = now() WHERE id = auth.uid();
END $$;
REVOKE EXECUTE ON FUNCTION public.update_my_location(double precision, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_my_location(double precision, double precision) TO authenticated;

-- Adaptive nearby challenges: always returns up to _target closest visible challenges
CREATE OR REPLACE FUNCTION public.nearby_challenges(_target int DEFAULT 20)
RETURNS TABLE (
  id uuid, title text, description text, category challenge_category, creator_id uuid,
  participant_count int, hero_image_url text, visibility challenge_visibility,
  created_at timestamptz, expires_at timestamptz, lat double precision, lng double precision,
  distance_km double precision
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH me AS (SELECT lat AS mlat, lng AS mlng FROM public.profiles WHERE id = auth.uid())
  SELECT c.id, c.title, c.description, c.category, c.creator_id,
         c.participant_count, c.hero_image_url, c.visibility,
         c.created_at, c.expires_at, c.lat, c.lng,
         CASE
           WHEN c.lat IS NULL OR c.lng IS NULL OR me.mlat IS NULL OR me.mlng IS NULL THEN NULL
           ELSE 6371 * acos(LEAST(1, GREATEST(-1,
             cos(radians(me.mlat)) * cos(radians(c.lat)) *
             cos(radians(c.lng) - radians(me.mlng)) +
             sin(radians(me.mlat)) * sin(radians(c.lat))
           )))
         END AS distance_km
  FROM public.challenges c, me
  WHERE (c.expires_at IS NULL OR c.expires_at > now())
    AND (
      c.creator_id = auth.uid()
      OR c.visibility = 'public'::public.challenge_visibility
      OR (c.visibility = 'friends'::public.challenge_visibility AND public.are_friends(auth.uid(), c.creator_id))
      OR (c.visibility = 'private'::public.challenge_visibility AND public.is_invited_to_challenge(c.id, auth.uid()))
    )
  ORDER BY
    CASE WHEN (SELECT mlat FROM me) IS NULL OR c.lat IS NULL THEN 1 ELSE 0 END,
    distance_km NULLS LAST,
    c.created_at DESC
  LIMIT GREATEST(1, LEAST(_target, 100));
$$;
REVOKE EXECUTE ON FUNCTION public.nearby_challenges(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nearby_challenges(int) TO authenticated;
