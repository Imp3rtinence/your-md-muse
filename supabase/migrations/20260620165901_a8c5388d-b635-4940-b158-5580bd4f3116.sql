
-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Vault-Secret für DM-Verschlüsselung anlegen, wenn noch nicht da
DO $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'dm_message_key') INTO v_exists;
  IF NOT v_exists THEN
    PERFORM vault.create_secret(encode(gen_random_bytes(32), 'hex'), 'dm_message_key', 'Symmetric key for DM body encryption');
  END IF;
END $$;

-- Neue Spalte für verschlüsselten Body
ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS body_cipher bytea;

-- Helper, der den Schlüssel aus dem Vault holt
CREATE OR REPLACE FUNCTION public._dm_key()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = vault, public
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'dm_message_key' LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public._dm_key() FROM PUBLIC, anon, authenticated;

-- Backfill bestehender Klartexte → cipher, dann body leeren
UPDATE public.direct_messages
SET body_cipher = extensions.pgp_sym_encrypt(body, public._dm_key()),
    body = ''
WHERE body_cipher IS NULL AND body IS NOT NULL AND body <> '';

-- Send-RPC: prüft Freundschaft, verschlüsselt, schreibt
CREATE OR REPLACE FUNCTION public.send_dm(_recipient uuid, _body text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_id uuid;
  v_sender uuid := auth.uid();
BEGIN
  IF v_sender IS NULL THEN RAISE EXCEPTION 'Nicht eingeloggt'; END IF;
  IF v_sender = _recipient THEN RAISE EXCEPTION 'Du kannst dir nicht selbst schreiben'; END IF;
  IF _body IS NULL OR length(btrim(_body)) = 0 THEN RAISE EXCEPTION 'Leere Nachricht'; END IF;
  IF length(_body) > 4000 THEN RAISE EXCEPTION 'Nachricht zu lang'; END IF;
  IF NOT public.are_friends(v_sender, _recipient) THEN
    RAISE EXCEPTION 'Du kannst nur Freund:innen schreiben';
  END IF;

  INSERT INTO public.direct_messages (sender_id, recipient_id, body, body_cipher)
  VALUES (v_sender, _recipient, '', extensions.pgp_sym_encrypt(_body, public._dm_key()))
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.send_dm(uuid, text) TO authenticated;

-- Thread laden mit entschlüsseltem Body
CREATE OR REPLACE FUNCTION public.get_dm_thread(_other uuid, _limit int DEFAULT 500)
RETURNS TABLE(id uuid, sender_id uuid, recipient_id uuid, body text, created_at timestamptz, read_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    d.id, d.sender_id, d.recipient_id,
    CASE
      WHEN d.body_cipher IS NOT NULL THEN extensions.pgp_sym_decrypt(d.body_cipher, public._dm_key())
      ELSE d.body
    END AS body,
    d.created_at, d.read_at
  FROM public.direct_messages d
  WHERE (d.sender_id = auth.uid() AND d.recipient_id = _other)
     OR (d.sender_id = _other AND d.recipient_id = auth.uid())
  ORDER BY d.created_at ASC
  LIMIT GREATEST(1, LEAST(_limit, 1000));
$$;
GRANT EXECUTE ON FUNCTION public.get_dm_thread(uuid, int) TO authenticated;

-- list_dm_threads aktualisieren (Body entschlüsseln)
CREATE OR REPLACE FUNCTION public.list_dm_threads()
RETURNS TABLE(other_id uuid, other_username text, other_display_name text, other_avatar_url text, last_body text, last_at timestamptz, last_sender_id uuid, unread_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  WITH pairs AS (
    SELECT
      CASE WHEN sender_id = auth.uid() THEN recipient_id ELSE sender_id END AS other_id,
      CASE
        WHEN body_cipher IS NOT NULL THEN extensions.pgp_sym_decrypt(body_cipher, public._dm_key())
        ELSE body
      END AS body,
      created_at, sender_id
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
  SELECT lm.other_id, p.username, p.display_name, p.avatar_url,
         lm.body, lm.created_at, lm.sender_id, COALESCE(u.n, 0)
  FROM last_msg lm
  JOIN public.profiles p ON p.id = lm.other_id
  LEFT JOIN unread u ON u.other_id = lm.other_id
  ORDER BY lm.created_at DESC;
$$;

-- Direkt-Insert/Update auf Klartext-Body unterbinden:
-- RLS auf direct_messages weiterhin lassen, aber Insert-Policy revoken und nur RPC zulassen.
REVOKE INSERT ON public.direct_messages FROM authenticated;
GRANT SELECT, UPDATE(read_at) ON public.direct_messages TO authenticated;
