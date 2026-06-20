
-- 1. Submissions: only readable if viewer can also see the underlying challenge
DROP POLICY IF EXISTS "submissions read via challenge" ON public.submissions;
CREATE POLICY "submissions read via challenge" ON public.submissions
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = submissions.challenge_id
      AND (
        c.creator_id = auth.uid()
        OR c.visibility = 'public'
        OR (c.visibility = 'friends' AND public.are_friends(auth.uid(), c.creator_id))
      )
  )
);

-- 2. Comments: same visibility scope
DROP POLICY IF EXISTS "comments read via challenge" ON public.comments;
CREATE POLICY "comments read via challenge" ON public.comments
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = comments.challenge_id
      AND (
        c.creator_id = auth.uid()
        OR c.visibility = 'public'
        OR (c.visibility = 'friends' AND public.are_friends(auth.uid(), c.creator_id))
      )
  )
);

-- 3. Friendships: only addressee can accept/reject
DROP POLICY IF EXISTS "friendships update by addressee" ON public.friendships;
CREATE POLICY "friendships update by addressee" ON public.friendships
FOR UPDATE TO authenticated
USING (auth.uid() = addressee_id)
WITH CHECK (auth.uid() = addressee_id);

-- 4. user_badges: restrict read to authenticated
DROP POLICY IF EXISTS "user_badges read all" ON public.user_badges;
CREATE POLICY "user_badges read all" ON public.user_badges
FOR SELECT TO authenticated USING (true);

-- 5. match_crews: enforce membership filter
CREATE OR REPLACE FUNCTION public.match_crews(query_embedding vector, match_count integer DEFAULT 5)
 RETURNS TABLE(id uuid, name text, emoji text, description text, kind text, member_count bigint, similarity double precision)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT g.id, g.name, g.emoji, g.description, g.kind,
         (SELECT count(*) FROM public.group_members m WHERE m.group_id = g.id),
         1 - (g.embedding <=> query_embedding) AS similarity
  FROM public.groups g
  WHERE g.embedding IS NOT NULL
    AND (
      g.kind = 'public'
      OR public.is_group_member(g.id, auth.uid())
    )
  ORDER BY g.embedding <=> query_embedding
  LIMIT match_count;
$function$;

-- 6. Proofs storage bucket: tighten SELECT
DROP POLICY IF EXISTS "proofs read auth" ON storage.objects;
CREATE POLICY "proofs read own or hero" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'proofs'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR (storage.foldername(name))[1] = 'hero'
  )
);

-- 7. Direct messages: remove from realtime publication (server-side encrypted; clients poll via get_dm_thread)
ALTER PUBLICATION supabase_realtime DROP TABLE public.direct_messages;
