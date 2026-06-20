
-- A. KI-Bot-Profile als Community-Mitglieder

-- 1. Neue Spalten auf profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_ai_bot boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_persona jsonb;

CREATE INDEX IF NOT EXISTS profiles_is_ai_bot_idx ON public.profiles(is_ai_bot) WHERE is_ai_bot = true;

-- 2. Bot-User in auth.users anlegen (echte User damit FKs intakt bleiben), Profile via handle_new_user Trigger NICHT — wir setzen sie hier kontrolliert.
-- Wir umgehen handle_new_user, indem wir nach Insert in auth.users gleich das profile updaten (Trigger legt zuerst Default-Profile an).

DO $$
DECLARE
  bots jsonb := '[
    {"username":"lumi",   "display":"Lumi",   "emoji":"✨", "bio":"Mag Sonnenuntergänge und mutige Ideen.", "specialty":"kreativ"},
    {"username":"brix",   "display":"Brix",   "emoji":"⚡", "bio":"Bewegung macht den Kopf frei.", "specialty":"sport"},
    {"username":"mossi",  "display":"Mossi",  "emoji":"🌿", "bio":"Wald, Wind, Wunder.", "specialty":"natur"},
    {"username":"nuvo",   "display":"Nuvo",   "emoji":"☁️", "bio":"Träumt laut, denkt leise.", "specialty":"kreativ"},
    {"username":"pippa",  "display":"Pippa",  "emoji":"🎈", "bio":"Kleine Quests, große Freude.", "specialty":"alltag"},
    {"username":"kuro",   "display":"Kuro",   "emoji":"🌙", "bio":"Nachtmensch mit Plan.", "specialty":"mut"},
    {"username":"echo",   "display":"Echo",   "emoji":"🎧", "bio":"Hört zu, schickt was zurück.", "specialty":"sozial"},
    {"username":"vesper", "display":"Vesper", "emoji":"🌌", "bio":"Sammelt Momente nach Sonnenuntergang.", "specialty":"reflexion"},
    {"username":"tilda",  "display":"Tilda",  "emoji":"🪴", "bio":"Wachsen, langsam aber sicher.", "specialty":"natur"},
    {"username":"fenn",   "display":"Fenn",   "emoji":"🦊", "bio":"Neugierig auf alles.", "specialty":"entdecken"},
    {"username":"solé",   "display":"Solé",   "emoji":"🌞", "bio":"Morgens als Erste:r wach.", "specialty":"sport"},
    {"username":"rooki",  "display":"Rooki",  "emoji":"🛼", "bio":"Probiert lieber als zu zögern.", "specialty":"mut"}
  ]'::jsonb;
  bot jsonb;
  v_user_id uuid;
BEGIN
  FOR bot IN SELECT * FROM jsonb_array_elements(bots)
  LOOP
    -- skip wenn schon vorhanden
    IF EXISTS (SELECT 1 FROM public.profiles WHERE username = (bot->>'username')) THEN
      CONTINUE;
    END IF;

    v_user_id := gen_random_uuid();

    -- Auth-User anlegen (minimal, kein Login möglich - kein Passwort)
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'bot+' || (bot->>'username') || '@komma.bot',
      '',
      now(), now(), now(),
      jsonb_build_object('provider','system','providers',ARRAY['system']::text[],'is_bot',true),
      jsonb_build_object('username', bot->>'username', 'display_name', bot->>'display'),
      false, '', '', '', ''
    );

    -- handle_new_user Trigger hat Profile angelegt → updaten
    UPDATE public.profiles
    SET username = bot->>'username',
        display_name = bot->>'display',
        bio = bot->>'bio',
        is_ai_bot = true,
        onboarded_at = now(),
        bot_persona = jsonb_build_object(
          'emoji', bot->>'emoji',
          'specialty', bot->>'specialty'
        )
    WHERE id = v_user_id;
  END LOOP;
END $$;
