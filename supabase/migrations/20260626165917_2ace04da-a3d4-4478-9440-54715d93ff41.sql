DROP POLICY IF EXISTS "dm update recipient" ON public.direct_messages;
CREATE POLICY "dm update recipient read_at" ON public.direct_messages
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());
REVOKE UPDATE ON public.direct_messages FROM authenticated;
GRANT UPDATE (read_at) ON public.direct_messages TO authenticated;