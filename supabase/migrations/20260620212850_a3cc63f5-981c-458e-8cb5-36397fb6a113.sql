
-- 1) comments: allow invitees of private challenges to read
DROP POLICY IF EXISTS "comments read via challenge" ON public.comments;
CREATE POLICY "comments read via challenge" ON public.comments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = comments.challenge_id
      AND (
        c.creator_id = auth.uid()
        OR c.visibility = 'public'::challenge_visibility
        OR (c.visibility = 'friends'::challenge_visibility AND public.are_friends(auth.uid(), c.creator_id))
        OR (c.visibility = 'private'::challenge_visibility AND public.is_invited_to_challenge(c.id, auth.uid()))
      )
  )
);

-- 2) challenge_translations: same gap
DROP POLICY IF EXISTS "challenge_translations read via challenge" ON public.challenge_translations;
CREATE POLICY "challenge_translations read via challenge" ON public.challenge_translations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_translations.challenge_id
      AND (
        c.creator_id = auth.uid()
        OR c.visibility = 'public'::challenge_visibility
        OR (c.visibility = 'friends'::challenge_visibility AND public.are_friends(auth.uid(), c.creator_id))
        OR (c.visibility = 'private'::challenge_visibility AND public.is_invited_to_challenge(c.id, auth.uid()))
      )
  )
);

-- 3) DM recipients should only be able to update read_at — enforce via column grants
REVOKE UPDATE ON public.direct_messages FROM authenticated, anon;
GRANT UPDATE (read_at) ON public.direct_messages TO authenticated;

-- 4) Fix mutable search_path on email queue helper functions
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
