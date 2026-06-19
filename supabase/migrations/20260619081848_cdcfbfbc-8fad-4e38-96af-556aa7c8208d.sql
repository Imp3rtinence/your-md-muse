
-- Direct messages
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  CHECK (sender_id <> recipient_id)
);

CREATE INDEX dm_pair_idx ON public.direct_messages
  (LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at DESC);
CREATE INDEX dm_recipient_unread_idx ON public.direct_messages(recipient_id) WHERE read_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dm read involved" ON public.direct_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "dm insert as sender to friend" ON public.direct_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND public.are_friends(sender_id, recipient_id));

CREATE POLICY "dm update recipient" ON public.direct_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "dm delete sender" ON public.direct_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;

-- Thread overview
CREATE OR REPLACE FUNCTION public.list_dm_threads()
RETURNS TABLE (
  other_id uuid,
  other_username text,
  other_display_name text,
  other_avatar_url text,
  last_body text,
  last_at timestamptz,
  last_sender_id uuid,
  unread_count int
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH pairs AS (
    SELECT
      CASE WHEN sender_id = auth.uid() THEN recipient_id ELSE sender_id END AS other_id,
      body, created_at, sender_id
    FROM public.direct_messages
    WHERE sender_id = auth.uid() OR recipient_id = auth.uid()
  ),
  last_msg AS (
    SELECT DISTINCT ON (other_id) other_id, body, created_at, sender_id
    FROM pairs
    ORDER BY other_id, created_at DESC
  ),
  unread AS (
    SELECT sender_id AS other_id, COUNT(*)::int AS n
    FROM public.direct_messages
    WHERE recipient_id = auth.uid() AND read_at IS NULL
    GROUP BY sender_id
  )
  SELECT
    lm.other_id, p.username, p.display_name, p.avatar_url,
    lm.body, lm.created_at, lm.sender_id,
    COALESCE(u.n, 0)
  FROM last_msg lm
  JOIN public.profiles p ON p.id = lm.other_id
  LEFT JOIN unread u ON u.other_id = lm.other_id
  ORDER BY lm.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.mark_dm_thread_read(_other uuid)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE public.direct_messages
  SET read_at = now()
  WHERE recipient_id = auth.uid() AND sender_id = _other AND read_at IS NULL;
$$;

-- User search (privacy-safe: minimal columns, prefix match, requires >=2 chars)
CREATE OR REPLACE FUNCTION public.search_users(_q text)
RETURNS TABLE(id uuid, username text, display_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, username, display_name, avatar_url
  FROM public.profiles
  WHERE id <> auth.uid()
    AND length(btrim(_q)) >= 2
    AND (username ILIKE btrim(_q) || '%' OR display_name ILIKE btrim(_q) || '%')
  ORDER BY username
  LIMIT 10;
$$;

-- Friend request helpers
CREATE OR REPLACE FUNCTION public.send_friend_request(_other uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_existing public.friendships%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Nicht eingeloggt'; END IF;
  IF _other = auth.uid() THEN RAISE EXCEPTION 'Nicht möglich'; END IF;

  SELECT * INTO v_existing FROM public.friendships
  WHERE (requester_id = auth.uid() AND addressee_id = _other)
     OR (requester_id = _other AND addressee_id = auth.uid())
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    IF v_existing.status = 'accepted' THEN RETURN; END IF;
    -- If the other person already requested, accept it
    IF v_existing.requester_id = _other AND v_existing.status = 'pending' THEN
      UPDATE public.friendships SET status = 'accepted' WHERE id = v_existing.id;
      RETURN;
    END IF;
    RETURN;
  END IF;

  INSERT INTO public.friendships (requester_id, addressee_id, status)
  VALUES (auth.uid(), _other, 'pending');
END; $$;

CREATE OR REPLACE FUNCTION public.respond_friend_request(_other uuid, _accept boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Nicht eingeloggt'; END IF;
  IF _accept THEN
    UPDATE public.friendships SET status = 'accepted'
    WHERE requester_id = _other AND addressee_id = auth.uid() AND status = 'pending';
  ELSE
    DELETE FROM public.friendships
    WHERE requester_id = _other AND addressee_id = auth.uid() AND status = 'pending';
  END IF;
END; $$;
