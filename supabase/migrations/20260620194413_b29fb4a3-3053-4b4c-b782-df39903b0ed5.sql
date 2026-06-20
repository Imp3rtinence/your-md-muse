-- Fix EXPOSED_SENSITIVE_DATA: restrict profile reads to authenticated users only
DROP POLICY IF EXISTS "profiles read public-or-friends" ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;

CREATE POLICY "profiles read public-or-friends" ON public.profiles
FOR SELECT TO authenticated
USING (is_private = false OR public.are_friends(auth.uid(), id));

-- Fix PRIVILEGE_ESCALATION: prevent group members from escalating their own role to owner
CREATE POLICY "Owner updates members" ON public.group_members
FOR UPDATE TO authenticated
USING (public.is_group_owner(group_id, auth.uid()))
WITH CHECK (public.is_group_owner(group_id, auth.uid()));