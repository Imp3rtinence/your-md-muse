-- 1. Revoke column-level SELECT on sensitive location columns
REVOKE SELECT (lat, lng, location_updated_at) ON public.profiles FROM authenticated, anon;
REVOKE SELECT (lat, lng) ON public.challenges FROM authenticated, anon;

-- 2. Tighten group_members INSERT policy: only 'member' role, only self or friend (via SECURITY DEFINER add_friend_to_group anyway)
DROP POLICY IF EXISTS "Owner adds members" ON public.group_members;
CREATE POLICY "Owner adds members"
  ON public.group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_group_owner(group_id, auth.uid())
    AND role = 'member'
    AND (user_id = auth.uid() OR public.are_friends(auth.uid(), user_id))
  );