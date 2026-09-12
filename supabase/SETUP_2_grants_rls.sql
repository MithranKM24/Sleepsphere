-- SleepSphere setup part 2: grants + RLS + extras. Run after SETUP_1_tables.sql.
-- GRANTs are required: without them PostgREST errors even with correct RLS.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sleep_logs_recall_sane') THEN
    ALTER TABLE public.sleep_logs ADD CONSTRAINT sleep_logs_recall_sane
      CHECK (dream_recall_frequency IS NULL OR (dream_recall_frequency >= 0 AND dream_recall_frequency <= 20));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sleep_logs_awakenings_sane') THEN
    ALTER TABLE public.sleep_logs ADD CONSTRAINT sleep_logs_awakenings_sane
      CHECK (awakenings IS NULL OR (awakenings >= 0 AND awakenings <= 30));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lifestyle_logs_bounds_sane') THEN
    ALTER TABLE public.lifestyle_logs ADD CONSTRAINT lifestyle_logs_bounds_sane CHECK (
      (stress_level IS NULL OR (stress_level >= 1 AND stress_level <= 10))
      AND (exercise_duration IS NULL OR (exercise_duration >= 0 AND exercise_duration <= 1440))
      AND (caffeine_intake IS NULL OR (caffeine_intake >= 0 AND caffeine_intake <= 30))
      AND (alcohol_intake IS NULL OR (alcohol_intake >= 0 AND alcohol_intake <= 30))
      AND (screen_time IS NULL OR (screen_time >= 0 AND screen_time <= 1440))
      AND (room_temperature IS NULL OR (room_temperature >= -10 AND room_temperature <= 45))
    );
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON public.sleep_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_lifestyle_logs_user_date ON public.lifestyle_logs(user_id, log_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sleep_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lifestyle_logs TO authenticated;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lifestyle_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can create own profile" ON public.user_profiles;
CREATE POLICY "Users can create own profile"
  ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;

DROP POLICY IF EXISTS "Users can view own sleep logs" ON public.sleep_logs;
CREATE POLICY "Users can view own sleep logs"
  ON public.sleep_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can create own sleep logs" ON public.sleep_logs;
CREATE POLICY "Users can create own sleep logs"
  ON public.sleep_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own sleep logs" ON public.sleep_logs;
CREATE POLICY "Users can update own sleep logs"
  ON public.sleep_logs FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can delete own sleep logs" ON public.sleep_logs;
CREATE POLICY "Users can delete own sleep logs"
  ON public.sleep_logs FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own lifestyle logs" ON public.lifestyle_logs;
CREATE POLICY "Users can view own lifestyle logs"
  ON public.lifestyle_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can create own lifestyle logs" ON public.lifestyle_logs;
CREATE POLICY "Users can create own lifestyle logs"
  ON public.lifestyle_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own lifestyle logs" ON public.lifestyle_logs;
CREATE POLICY "Users can update own lifestyle logs"
  ON public.lifestyle_logs FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can delete own lifestyle logs" ON public.lifestyle_logs;
CREATE POLICY "Users can delete own lifestyle logs"
  ON public.lifestyle_logs FOR DELETE TO authenticated USING (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
