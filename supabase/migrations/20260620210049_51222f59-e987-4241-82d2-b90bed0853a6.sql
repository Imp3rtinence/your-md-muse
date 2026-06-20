UPDATE public.direct_messages SET body = '' WHERE body <> '';
REVOKE SELECT (body) ON public.direct_messages FROM authenticated, anon;

DROP POLICY IF EXISTS "Owner updates members" ON public.group_members;
CREATE POLICY "Owner updates members"
  ON public.group_members FOR UPDATE TO authenticated
  USING (public.is_group_owner(group_id, auth.uid()))
  WITH CHECK (public.is_group_owner(group_id, auth.uid()) AND role = 'member');

DROP POLICY IF EXISTS "proofs read authenticated" ON storage.objects;
CREATE POLICY "proofs read via challenge visibility"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'proofs'
  AND EXISTS (
    SELECT 1
    FROM public.submissions s
    JOIN public.challenges c ON c.id = s.challenge_id
    WHERE s.media_url = storage.objects.name
      AND (
        s.user_id = auth.uid()
        OR c.creator_id = auth.uid()
        OR c.visibility = 'public'
        OR (c.visibility = 'friends' AND public.are_friends(auth.uid(), c.creator_id))
        OR (c.visibility = 'private' AND public.is_invited_to_challenge(c.id, auth.uid()))
      )
  )
);