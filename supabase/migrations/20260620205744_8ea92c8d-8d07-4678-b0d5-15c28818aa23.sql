ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS image_url text;

DROP FUNCTION IF EXISTS public.get_dm_thread(uuid, integer);
DROP FUNCTION IF EXISTS public.send_dm(uuid, text);

CREATE OR REPLACE FUNCTION public.send_dm(_recipient uuid, _body text, _image_url text DEFAULT NULL)
 RETURNS uuid
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $function$
DECLARE v_id uuid; v_sender uuid := auth.uid(); v_body text := COALESCE(_body, '');
BEGIN
  IF v_sender IS NULL THEN RAISE EXCEPTION 'Nicht eingeloggt'; END IF;
  IF v_sender = _recipient THEN RAISE EXCEPTION 'Du kannst dir nicht selbst schreiben'; END IF;
  IF length(btrim(v_body)) = 0 AND _image_url IS NULL THEN RAISE EXCEPTION 'Leere Nachricht'; END IF;
  IF length(v_body) > 4000 THEN RAISE EXCEPTION 'Nachricht zu lang'; END IF;
  IF NOT public.are_friends(v_sender, _recipient) THEN RAISE EXCEPTION 'Du kannst nur Freund:innen schreiben'; END IF;
  INSERT INTO public.direct_messages (sender_id, recipient_id, body, body_cipher, image_url)
  VALUES (v_sender, _recipient, '',
    CASE WHEN length(btrim(v_body)) > 0 THEN extensions.pgp_sym_encrypt(v_body, public._dm_key()) ELSE NULL END,
    _image_url)
  RETURNING id INTO v_id;
  RETURN v_id;
END $function$;

CREATE OR REPLACE FUNCTION public.get_dm_thread(_other uuid, _limit integer DEFAULT 500)
 RETURNS TABLE(id uuid, sender_id uuid, recipient_id uuid, body text, image_url text, created_at timestamptz, read_at timestamptz)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $function$
  SELECT d.id, d.sender_id, d.recipient_id,
    CASE WHEN d.body_cipher IS NOT NULL THEN extensions.pgp_sym_decrypt(d.body_cipher, public._dm_key())
         ELSE COALESCE(d.body, '') END,
    d.image_url, d.created_at, d.read_at
  FROM public.direct_messages d
  WHERE (d.sender_id = auth.uid() AND d.recipient_id = _other)
     OR (d.sender_id = _other AND d.recipient_id = auth.uid())
  ORDER BY d.created_at ASC
  LIMIT GREATEST(1, LEAST(_limit, 1000));
$function$;

CREATE OR REPLACE FUNCTION public.list_dm_threads()
 RETURNS TABLE(other_id uuid, other_username text, other_display_name text, other_avatar_url text, last_body text, last_at timestamptz, last_sender_id uuid, unread_count integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $function$
  WITH pairs AS (
    SELECT CASE WHEN sender_id = auth.uid() THEN recipient_id ELSE sender_id END AS other_id,
      CASE WHEN body_cipher IS NOT NULL THEN extensions.pgp_sym_decrypt(body_cipher, public._dm_key())
           WHEN image_url IS NOT NULL THEN '📷 Bild' ELSE body END AS body,
      created_at, sender_id
    FROM public.direct_messages
    WHERE sender_id = auth.uid() OR recipient_id = auth.uid()
  ),
  last_msg AS (SELECT DISTINCT ON (other_id) other_id, body, created_at, sender_id FROM pairs ORDER BY other_id, created_at DESC),
  unread AS (SELECT sender_id AS other_id, COUNT(*)::int AS n FROM public.direct_messages
             WHERE recipient_id = auth.uid() AND read_at IS NULL GROUP BY sender_id)
  SELECT lm.other_id, p.username, p.display_name, p.avatar_url,
         lm.body, lm.created_at, lm.sender_id, COALESCE(u.n, 0)
  FROM last_msg lm JOIN public.profiles p ON p.id = lm.other_id
  LEFT JOIN unread u ON u.other_id = lm.other_id ORDER BY lm.created_at DESC;
$function$;

CREATE POLICY "chat-media upload own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "chat-media read participants"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-media' AND EXISTS (
  SELECT 1 FROM public.direct_messages d
  WHERE d.image_url = storage.objects.name
    AND (d.sender_id = auth.uid() OR d.recipient_id = auth.uid())
));

CREATE POLICY "chat-media delete own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);