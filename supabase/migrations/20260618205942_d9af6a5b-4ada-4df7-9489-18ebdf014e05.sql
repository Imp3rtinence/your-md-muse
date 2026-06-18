
-- ENUMS
CREATE TYPE public.friendship_status AS ENUM ('pending','accepted','blocked');
CREATE TYPE public.challenge_category AS ENUM ('creative','active','friendly','skill','learning');
CREATE TYPE public.challenge_visibility AS ENUM ('friends','group','public');
CREATE TYPE public.report_status AS ENUM ('open','reviewed','dismissed');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  birth_year INT,
  aura INT NOT NULL DEFAULT 0,
  streak_days INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  is_private BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base TEXT;
  candidate TEXT;
  i INT := 0;
BEGIN
  base := lower(regexp_replace(coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1), 'user'), '[^a-z0-9_]', '', 'g'));
  IF base = '' THEN base := 'user'; END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) LOOP
    i := i + 1; candidate := base || i::text;
  END LOOP;
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, candidate, COALESCE(NEW.raw_user_meta_data->>'display_name', candidate));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- FRIENDSHIPS (directional request, then accepted)
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.friendship_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (requester_id <> addressee_id),
  UNIQUE (requester_id, addressee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Security-definer helper
CREATE OR REPLACE FUNCTION public.are_friends(a UUID, b UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
      AND ((requester_id = a AND addressee_id = b) OR (requester_id = b AND addressee_id = a))
  );
$$;

-- CHALLENGES (with chain parent)
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category public.challenge_category NOT NULL,
  visibility public.challenge_visibility NOT NULL DEFAULT 'friends',
  region TEXT,
  parent_challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
  is_daily BOOLEAN NOT NULL DEFAULT false,
  participant_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX challenges_creator_idx ON public.challenges(creator_id);
CREATE INDEX challenges_parent_idx ON public.challenges(parent_challenge_id);
CREATE INDEX challenges_created_idx ON public.challenges(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- SUBMISSIONS (proofs)
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id)
);
CREATE INDEX submissions_challenge_idx ON public.submissions(challenge_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- COMMENTS (with threads)
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX comments_challenge_idx ON public.comments(challenge_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- REACTIONS (stickers instead of likes)
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
  sticker TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((challenge_id IS NOT NULL) <> (submission_id IS NOT NULL))
);
CREATE UNIQUE INDEX reactions_unique_challenge ON public.reactions(user_id, challenge_id, sticker) WHERE challenge_id IS NOT NULL;
CREATE UNIQUE INDEX reactions_unique_submission ON public.reactions(user_id, submission_id, sticker) WHERE submission_id IS NOT NULL;
GRANT SELECT, INSERT, DELETE ON public.reactions TO authenticated;
GRANT ALL ON public.reactions TO service_role;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- BADGES
CREATE TABLE public.badges (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT
);
GRANT SELECT ON public.badges TO authenticated, anon;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges readable by everyone" ON public.badges FOR SELECT USING (true);

INSERT INTO public.badges (slug, name, description, icon) VALUES
  ('first-challenge','Erste Challenge','Du hast deine erste Challenge gestartet.','🚀'),
  ('first-finish','Erster Abschluss','Du hast deine erste Challenge abgeschlossen.','✅'),
  ('streak-7','7-Tage-Streak','7 Tage am Stück aktiv.','🔥'),
  ('streak-30','30-Tage-Streak','30 Tage am Stück aktiv.','💎'),
  ('crazy-50','50 Challenges – das crazy','50 Challenges abgeschlossen.','🤯'),
  ('group-leader','Gruppenleiter','Eine Gruppe gegründet.','👑'),
  ('trendsetter','Trendsetter','Deine Challenge wurde von vielen aufgegriffen.','📈'),
  ('chain-starter','Ketten-Starter','Deine Kette hat ≥10 Leute erreicht.','⛓️');

-- USER BADGES
CREATE TABLE public.user_badges (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_slug TEXT NOT NULL REFERENCES public.badges(slug) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_slug)
);
GRANT SELECT, INSERT ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- AURA events
CREATE TABLE public.aura_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  reason TEXT NOT NULL,
  ref_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX aura_user_idx ON public.aura_events(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.aura_events TO authenticated;
GRANT ALL ON public.aura_events TO service_role;
ALTER TABLE public.aura_events ENABLE ROW LEVEL SECURITY;

-- REPORTS
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status public.report_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES ============

-- PROFILES: own profile always; others if not private OR friends
CREATE POLICY "profiles read self" ON public.profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "profiles read public-or-friends" ON public.profiles FOR SELECT
  USING (is_private = false OR public.are_friends(auth.uid(), id));
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- FRIENDSHIPS: visible to both sides
CREATE POLICY "friendships read involved" ON public.friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "friendships create as requester" ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "friendships update by addressee" ON public.friendships FOR UPDATE
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id)
  WITH CHECK (auth.uid() = addressee_id OR auth.uid() = requester_id);
CREATE POLICY "friendships delete involved" ON public.friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- CHALLENGES: visibility rules
CREATE POLICY "challenges read by visibility" ON public.challenges FOR SELECT
  USING (
    creator_id = auth.uid()
    OR visibility = 'public'
    OR (visibility = 'friends' AND public.are_friends(auth.uid(), creator_id))
  );
CREATE POLICY "challenges insert own" ON public.challenges FOR INSERT
  WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "challenges update own" ON public.challenges FOR UPDATE
  USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "challenges delete own" ON public.challenges FOR DELETE
  USING (auth.uid() = creator_id);

-- SUBMISSIONS: readable by users who can read the parent challenge
CREATE POLICY "submissions read via challenge" ON public.submissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = challenge_id));
CREATE POLICY "submissions insert own" ON public.submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "submissions delete own" ON public.submissions FOR DELETE
  USING (auth.uid() = user_id);

-- COMMENTS
CREATE POLICY "comments read via challenge" ON public.comments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = challenge_id));
CREATE POLICY "comments insert own" ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments delete own" ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- REACTIONS
CREATE POLICY "reactions read all" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "reactions insert own" ON public.reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions delete own" ON public.reactions FOR DELETE
  USING (auth.uid() = user_id);

-- USER BADGES
CREATE POLICY "user_badges read all" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "user_badges insert own" ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- AURA
CREATE POLICY "aura read own" ON public.aura_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "aura insert own" ON public.aura_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- REPORTS
CREATE POLICY "reports insert own" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports read own" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

-- ============ AURA & PARTICIPANT TRIGGERS ============

CREATE OR REPLACE FUNCTION public.on_submission_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.challenges SET participant_count = participant_count + 1 WHERE id = NEW.challenge_id;
  UPDATE public.profiles SET aura = aura + 20 WHERE id = NEW.user_id;
  INSERT INTO public.aura_events (user_id, amount, reason, ref_id) VALUES (NEW.user_id, 20, 'submission', NEW.id);
  -- first-finish badge
  INSERT INTO public.user_badges (user_id, badge_slug) VALUES (NEW.user_id, 'first-finish')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_submission_insert AFTER INSERT ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.on_submission_insert();

CREATE OR REPLACE FUNCTION public.on_challenge_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET aura = aura + 10 WHERE id = NEW.creator_id;
  INSERT INTO public.aura_events (user_id, amount, reason, ref_id) VALUES (NEW.creator_id, 10, 'create_challenge', NEW.id);
  INSERT INTO public.user_badges (user_id, badge_slug) VALUES (NEW.creator_id, 'first-challenge')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_challenge_insert AFTER INSERT ON public.challenges
FOR EACH ROW EXECUTE FUNCTION public.on_challenge_insert();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_friendships_touch BEFORE UPDATE ON public.friendships FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ STORAGE POLICIES ============
-- proofs bucket: authenticated users upload to <uid>/... and read all (so allowed viewers see proofs)
CREATE POLICY "proofs read auth" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'proofs');
CREATE POLICY "proofs upload own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "proofs delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'proofs' AND owner = auth.uid());

-- avatars: public read, owner write
CREATE POLICY "avatars read all" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
CREATE POLICY "avatars upload own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid());
CREATE POLICY "avatars delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid());
