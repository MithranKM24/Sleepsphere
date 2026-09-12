-- SleepSphere hardening migration (part 1: constraints + trigger).
-- See README section "Database & security" for rationale.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sleep_logs_total_hours_sane') THEN
    ALTER TABLE sleep_logs ADD CONSTRAINT sleep_logs_total_hours_sane
      CHECK (total_hours IS NULL OR (total_hours >= 0 AND total_hours <= 24));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sleep_logs_recall_sane') THEN
    ALTER TABLE sleep_logs ADD CONSTRAINT sleep_logs_recall_sane
      CHECK (dream_recall_frequency IS NULL OR (dream_recall_frequency >= 0 AND dream_recall_frequency <= 20));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sleep_logs_awakenings_sane') THEN
    ALTER TABLE sleep_logs ADD CONSTRAINT sleep_logs_awakenings_sane
      CHECK (awakenings IS NULL OR (awakenings >= 0 AND awakenings <= 30));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sleep_logs_vividness_sane') THEN
    ALTER TABLE sleep_logs ADD CONSTRAINT sleep_logs_vividness_sane
      CHECK (dream_vividness IS NULL OR (dream_vividness >= 1 AND dream_vividness <= 5));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sleep_logs_quality_sane') THEN
    ALTER TABLE sleep_logs ADD CONSTRAINT sleep_logs_quality_sane
      CHECK (sleep_quality IS NULL OR (sleep_quality >= 1 AND sleep_quality <= 10));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lifestyle_logs_bounds_sane') THEN
    ALTER TABLE lifestyle_logs ADD CONSTRAINT lifestyle_logs_bounds_sane CHECK (
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

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
