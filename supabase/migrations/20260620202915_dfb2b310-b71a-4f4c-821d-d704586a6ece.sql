
CREATE OR REPLACE FUNCTION public.list_friend_requests()
RETURNS TABLE(
  friendship_id uuid,
  direction text,
  other_id uuid,
  username text,
  display_name text,
  avatar_url text,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    f.id,
    CASE WHEN f.addressee_id = auth.uid() THEN 'incoming' ELSE 'outgoing' END,
    CASE WHEN f.addressee_id = auth.uid() THEN f.requester_id ELSE f.addressee_id END,
    p.username, p.display_name, p.avatar_url,
    f.created_at
  FROM public.friendships f
  JOIN public.profiles p
    ON p.id = CASE WHEN f.addressee_id = auth.uid() THEN f.requester_id ELSE f.addressee_id END
  WHERE f.status = 'pending'
    AND (f.requester_id = auth.uid() OR f.addressee_id = auth.uid())
  ORDER BY f.created_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.list_friend_requests() FROM anon;
GRANT EXECUTE ON FUNCTION public.list_friend_requests() TO authenticated;
