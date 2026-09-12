-- SleepSphere one-shot setup: tables + constraints + trigger.
-- Run in Supabase SQL Editor, then run GRANTS_AND_RLS.sql.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  age integer CHECK (age > 0 AND age < 150),
  gender text,
  occupation text,
  sleep_habits text,
  medical_history text,
  medications text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  bedtime time,
  wake_time time,
  total_hours decimal(4,1) CHECK (total_hours >= 0 AND total_hours <= 24),
  sleep_quality integer CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  dream_recall_frequency integer DEFAULT 0 CHECK (dream_recall_frequency >= 0),
  dream_description text,
  dream_mood text,
  dream_type text,
  dream_vividness integer CHECK (dream_vividness >= 1 AND dream_vividness <= 5),
  awakenings integer DEFAULT 0 CHECK (awakenings >= 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, log_date)
);

CREATE TABLE IF NOT EXISTS public.lifestyle_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  stress_level integer CHECK (stress_level >= 1 AND stress_level <= 10),
  exercise_duration integer DEFAULT 0 CHECK (exercise_duration >= 0),
  exercise_intensity text,
  caffeine_intake integer DEFAULT 0 CHECK (caffeine_intake >= 0),
  alcohol_intake integer DEFAULT 0 CHECK (alcohol_intake >= 0),
  screen_time integer DEFAULT 0 CHECK (screen_time >= 0),
  last_meal_time time,
  room_temperature decimal(4,1),
  noise_level text,
  light_level text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, log_date)
);
