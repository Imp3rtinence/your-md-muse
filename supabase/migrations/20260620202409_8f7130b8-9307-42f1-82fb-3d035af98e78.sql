
-- Replace overly restrictive proofs read policy
DROP POLICY IF EXISTS "proofs read own or hero" ON storage.objects;
CREATE POLICY "proofs read authenticated"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'proofs');

-- Deduplicate avatar read policies
DROP POLICY IF EXISTS "Avatars are viewable by authenticated users" ON storage.objects;
-- keep "avatars read all"
