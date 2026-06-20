
-- 1. Revoke column-level SELECT on direct_messages.image_url and body_cipher; clients must use get_dm_thread RPC
REVOKE SELECT (image_url) ON public.direct_messages FROM authenticated, anon;

-- 2. Fix submissions read policy to include private+invite branch
DROP POLICY IF EXISTS "submissions read via challenge" ON public.submissions;
CREATE POLICY "submissions read via challenge" ON public.submissions
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = submissions.challenge_id
      AND (
        c.creator_id = auth.uid()
        OR c.visibility = 'public'::public.challenge_visibility
        OR (c.visibility = 'friends'::public.challenge_visibility AND public.are_friends(auth.uid(), c.creator_id))
        OR (c.visibility = 'private'::public.challenge_visibility AND public.is_invited_to_challenge(c.id, auth.uid()))
      )
  )
);
