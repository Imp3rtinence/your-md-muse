
-- 1) Avatars: drop public-read policy, keep authenticated-only
DROP POLICY IF EXISTS "avatars read all" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are viewable by authenticated users" ON storage.objects;
CREATE POLICY "avatars read authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

-- 2) Group invites: restrict token visibility to creator (or owner)
DROP POLICY IF EXISTS "Members read invites" ON public.group_invites;
CREATE POLICY "Creator or owner read invites"
  ON public.group_invites FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR public.is_group_owner(group_id, auth.uid()));

-- 3) Reactions: add visibility branch for reactions attached directly to a challenge
CREATE POLICY "reactions read via challenge direct"
  ON public.reactions FOR SELECT
  TO authenticated
  USING (
    submission_id IS NULL
    AND challenge_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = reactions.challenge_id
        AND (
          c.creator_id = auth.uid()
          OR c.visibility = 'public'::public.challenge_visibility
          OR (c.visibility = 'friends'::public.challenge_visibility AND public.are_friends(auth.uid(), c.creator_id))
          OR (c.visibility = 'private'::public.challenge_visibility AND public.is_invited_to_challenge(c.id, auth.uid()))
        )
    )
  );
