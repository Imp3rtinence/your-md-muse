
-- ============ groups ============
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 50),
  description text CHECK (description IS NULL OR char_length(description) <= 280),
  emoji text NOT NULL DEFAULT '👥',
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  members_can_invite boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- ============ group_members ============
CREATE TABLE public.group_members (
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
CREATE INDEX group_members_user_idx ON public.group_members(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- ============ group_invites ============
CREATE TABLE public.group_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  max_uses int,
  use_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX group_invites_group_idx ON public.group_invites(group_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_invites TO authenticated;
GRANT ALL ON public.group_invites TO service_role;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- ============ helper functions (security definer to avoid recursive RLS) ============
CREATE OR REPLACE FUNCTION public.is_group_member(_group uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = _group AND user_id = _user);
$$;
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_group_owner(_group uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = _group AND user_id = _user AND role = 'owner');
$$;
REVOKE EXECUTE ON FUNCTION public.is_group_owner(uuid, uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_owner(uuid, uuid) TO authenticated, service_role;

-- ============ groups policies ============
CREATE POLICY "Members read their groups" ON public.groups FOR SELECT TO authenticated
  USING (public.is_group_member(id, auth.uid()));
CREATE POLICY "Anyone authenticated can create a group" ON public.groups FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Owner can update group" ON public.groups FOR UPDATE TO authenticated
  USING (public.is_group_owner(id, auth.uid())) WITH CHECK (public.is_group_owner(id, auth.uid()));
CREATE POLICY "Owner can delete group" ON public.groups FOR DELETE TO authenticated
  USING (public.is_group_owner(id, auth.uid()));

-- ============ group_members policies ============
CREATE POLICY "Members read membership" ON public.group_members FOR SELECT TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));
-- Insert: either self-join (handled via RPC join_group_with_token) OR owner adding someone they're friends with
CREATE POLICY "Owner adds members" ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (public.is_group_owner(group_id, auth.uid()));
CREATE POLICY "User leaves group" ON public.group_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_group_owner(group_id, auth.uid()));

-- ============ group_invites policies ============
CREATE POLICY "Members read invites" ON public.group_invites FOR SELECT TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Allowed users create invites" ON public.group_invites FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND (
      public.is_group_owner(group_id, auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.members_can_invite
          AND public.is_group_member(group_id, auth.uid())
      )
    )
  );
CREATE POLICY "Creator deletes invite" ON public.group_invites FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_group_owner(group_id, auth.uid()));

-- ============ creator becomes owner automatically ============
CREATE OR REPLACE FUNCTION public.on_group_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.creator_id, 'owner');
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_on_group_insert AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.on_group_insert();

-- ============ join via token (security definer; checks expiry & usage) ============
CREATE OR REPLACE FUNCTION public.join_group_with_token(_token text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_group uuid;
  v_uses int;
  v_max int;
  v_expires timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Nicht eingeloggt'; END IF;
  SELECT group_id, use_count, max_uses, expires_at INTO v_group, v_uses, v_max, v_expires
  FROM public.group_invites WHERE token = _token;
  IF v_group IS NULL THEN RAISE EXCEPTION 'Einladung ungültig'; END IF;
  IF v_expires < now() THEN RAISE EXCEPTION 'Einladung abgelaufen'; END IF;
  IF v_max IS NOT NULL AND v_uses >= v_max THEN RAISE EXCEPTION 'Einladung verbraucht'; END IF;
  INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (v_group, auth.uid(), 'member')
    ON CONFLICT DO NOTHING;
  UPDATE public.group_invites SET use_count = use_count + 1 WHERE token = _token;
  RETURN v_group;
END; $$;
REVOKE EXECUTE ON FUNCTION public.join_group_with_token(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.join_group_with_token(text) TO authenticated;

-- ============ preview an invite without joining (for /join/:token landing page) ============
CREATE OR REPLACE FUNCTION public.preview_group_invite(_token text)
RETURNS TABLE(group_id uuid, group_name text, emoji text, member_count bigint, expired boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT g.id, g.name, g.emoji,
         (SELECT count(*) FROM public.group_members m WHERE m.group_id = g.id),
         (i.expires_at < now())
  FROM public.group_invites i JOIN public.groups g ON g.id = i.group_id
  WHERE i.token = _token;
$$;
REVOKE EXECUTE ON FUNCTION public.preview_group_invite(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.preview_group_invite(text) TO authenticated;

-- ============ owner can add a friend directly ============
CREATE OR REPLACE FUNCTION public.add_friend_to_group(_group uuid, _friend uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Nicht eingeloggt'; END IF;
  IF NOT (public.is_group_owner(_group, auth.uid())
          OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = _group AND g.members_can_invite
                     AND public.is_group_member(_group, auth.uid()))) THEN
    RAISE EXCEPTION 'Keine Berechtigung';
  END IF;
  IF NOT public.are_friends(auth.uid(), _friend) THEN
    RAISE EXCEPTION 'Nur Freunde können direkt hinzugefügt werden';
  END IF;
  INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (_group, _friend, 'member') ON CONFLICT DO NOTHING;
END; $$;
REVOKE EXECUTE ON FUNCTION public.add_friend_to_group(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.add_friend_to_group(uuid, uuid) TO authenticated;

-- updated_at trigger
CREATE TRIGGER trg_groups_updated BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
