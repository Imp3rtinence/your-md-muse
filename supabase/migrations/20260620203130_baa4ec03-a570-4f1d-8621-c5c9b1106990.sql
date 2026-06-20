
CREATE OR REPLACE FUNCTION public.profiles_protect_sensitive_cols()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow trusted server contexts (service role, postgres/supabase_admin during SECURITY DEFINER triggers)
  IF auth.role() = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin', 'supabase_auth_admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.aura IS DISTINCT FROM OLD.aura
     OR NEW.weekly_aura IS DISTINCT FROM OLD.weekly_aura
     OR NEW.league_tier IS DISTINCT FROM OLD.league_tier
     OR NEW.streak_days IS DISTINCT FROM OLD.streak_days
     OR NEW.last_active_date IS DISTINCT FROM OLD.last_active_date
     OR NEW.week_start IS DISTINCT FROM OLD.week_start
     OR NEW.is_ai_bot IS DISTINCT FROM OLD.is_ai_bot
     OR NEW.bot_persona IS DISTINCT FROM OLD.bot_persona THEN
    RAISE EXCEPTION 'protected profile columns can only be modified by trusted server code';
  END IF;
  RETURN NEW;
END;
$$;
