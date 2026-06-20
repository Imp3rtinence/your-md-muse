
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

ALTER TABLE public.user_ai_profile
  ADD COLUMN IF NOT EXISTS interest_embedding vector(1536);

CREATE INDEX IF NOT EXISTS challenges_embedding_idx
  ON public.challenges USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS groups_embedding_idx
  ON public.groups USING hnsw (embedding vector_cosine_ops);

-- Match function: ähnliche Challenges per Cosine
CREATE OR REPLACE FUNCTION public.match_challenges(
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  exclude_id uuid DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  title text,
  description text,
  category public.challenge_category,
  creator_id uuid,
  participant_count int,
  hero_image_url text,
  similarity float
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.title, c.description, c.category, c.creator_id, c.participant_count, c.hero_image_url,
         1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.challenges c
  WHERE c.embedding IS NOT NULL
    AND c.visibility = 'public'
    AND (exclude_id IS NULL OR c.id <> exclude_id)
    AND (c.expires_at IS NULL OR c.expires_at > now())
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.match_crews(
  query_embedding vector(1536),
  match_count int DEFAULT 5
) RETURNS TABLE (
  id uuid,
  name text,
  emoji text,
  description text,
  kind text,
  member_count bigint,
  similarity float
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT g.id, g.name, g.emoji, g.description, g.kind,
         (SELECT count(*) FROM public.group_members m WHERE m.group_id = g.id),
         1 - (g.embedding <=> query_embedding) AS similarity
  FROM public.groups g
  WHERE g.embedding IS NOT NULL
  ORDER BY g.embedding <=> query_embedding
  LIMIT match_count;
$$;

REVOKE ALL ON FUNCTION public.match_challenges(vector, int, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.match_crews(vector, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_challenges(vector, int, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_crews(vector, int) TO authenticated, service_role;
