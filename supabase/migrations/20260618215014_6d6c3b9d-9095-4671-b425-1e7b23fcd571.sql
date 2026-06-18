
-- Add league fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS league_tier int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS weekly_aura int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS week_start date NOT NULL DEFAULT date_trunc('week', now())::date;

-- Helper: monday of current week
CREATE OR REPLACE FUNCTION public.current_week_start()
RETURNS date LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT date_trunc('week', now())::date;
$$;

-- Helper: ensure weekly_aura is reset if user's week_start is stale
CREATE OR REPLACE FUNCTION public.bump_weekly_aura(_user uuid, _amount int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles
  SET weekly_aura = CASE WHEN week_start < public.current_week_start() THEN _amount ELSE weekly_aura + _amount END,
      week_start  = public.current_week_start()
  WHERE id = _user;
END; $$;

-- Update existing triggers to also bump weekly aura
CREATE OR REPLACE FUNCTION public.on_submission_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.challenges SET participant_count = participant_count + 1 WHERE id = NEW.challenge_id;
  UPDATE public.profiles SET aura = aura + 20 WHERE id = NEW.user_id;
  PERFORM public.bump_weekly_aura(NEW.user_id, 20);
  INSERT INTO public.aura_events (user_id, amount, reason, ref_id) VALUES (NEW.user_id, 20, 'submission', NEW.id);
  INSERT INTO public.user_badges (user_id, badge_slug) VALUES (NEW.user_id, 'first-finish')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.on_challenge_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET aura = aura + 10 WHERE id = NEW.creator_id;
  PERFORM public.bump_weekly_aura(NEW.creator_id, 10);
  INSERT INTO public.aura_events (user_id, amount, reason, ref_id) VALUES (NEW.creator_id, 10, 'create_challenge', NEW.id);
  INSERT INTO public.user_badges (user_id, badge_slug) VALUES (NEW.creator_id, 'first-challenge')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

-- Weekly processing: promote top 7, demote bottom 5 per tier
CREATE OR REPLACE FUNCTION public.process_weekly_leagues()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t int;
BEGIN
  FOR t IN 1..8 LOOP
    -- Promote top 7 (only if not Apex)
    IF t < 8 THEN
      UPDATE public.profiles SET league_tier = t + 1
      WHERE id IN (
        SELECT id FROM public.profiles
        WHERE league_tier = t AND weekly_aura > 0
        ORDER BY weekly_aura DESC, aura DESC
        LIMIT 7
      );
    END IF;
    -- Demote bottom 5 (only if not Ember)
    IF t > 1 THEN
      UPDATE public.profiles SET league_tier = t - 1
      WHERE id IN (
        SELECT id FROM public.profiles
        WHERE league_tier = t
        ORDER BY weekly_aura ASC, aura ASC
        LIMIT 5
      );
    END IF;
  END LOOP;
  -- Reset weekly aura for all
  UPDATE public.profiles SET weekly_aura = 0, week_start = public.current_week_start();
END; $$;
