-- SleepSphere hardening migration (part 2: RLS restated idempotently).
-- Removes the profile DELETE policy so account deletion goes through
-- Supabase Auth (CASCADE cleans up logs). All other policies are
-- owner-only via auth.uid(), covering SELECT/INSERT/UPDATE/DELETE.
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifestyle_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;

DROP POLICY IF EXISTS "Users can view own sleep logs" ON sleep_logs;
CREATE POLICY "Users can view own sleep logs"
  ON sleep_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can create own sleep logs" ON sleep_logs;
CREATE POLICY "Users can create own sleep logs"
  ON sleep_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own sleep logs" ON sleep_logs;
CREATE POLICY "Users can update own sleep logs"
  ON sleep_logs FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can delete own sleep logs" ON sleep_logs;
CREATE POLICY "Users can delete own sleep logs"
  ON sleep_logs FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own lifestyle logs" ON lifestyle_logs;
CREATE POLICY "Users can view own lifestyle logs"
  ON lifestyle_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can create own lifestyle logs" ON lifestyle_logs;
CREATE POLICY "Users can create own lifestyle logs"
  ON lifestyle_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own lifestyle logs" ON lifestyle_logs;
CREATE POLICY "Users can update own lifestyle logs"
  ON lifestyle_logs FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can delete own lifestyle logs" ON lifestyle_logs;
CREATE POLICY "Users can delete own lifestyle logs"
  ON lifestyle_logs FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_lifestyle_logs_user_date ON lifestyle_logs(user_id, log_date DESC);
