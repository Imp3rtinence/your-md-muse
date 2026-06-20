
ALTER TABLE public.direct_messages DROP CONSTRAINT IF EXISTS direct_messages_body_check;
ALTER TABLE public.direct_messages
  ADD CONSTRAINT direct_messages_body_check
  CHECK (
    (body_cipher IS NOT NULL)
    OR (length(btrim(body)) BETWEEN 1 AND 2000)
  );
