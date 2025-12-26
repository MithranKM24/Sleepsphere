/*
  # Sleep & Dream Tracker Database Schema

  ## Overview
  Complete database schema for tracking user profiles, sleep patterns, dreams, and lifestyle factors
  with comprehensive analysis capabilities and health detection features.

  ## New Tables

  ### 1. `user_profiles`
  Stores user demographic and medical information
  - `id` (uuid, primary key) - Links to auth.users
  - `name` (text) - User's full name
  - `age` (integer) - User's age
  - `gender` (text) - User's gender
  - `occupation` (text) - User's occupation
  - `sleep_habits` (text) - General sleep habits and preferences
  - `medical_history` (text) - Relevant medical history
  - `medications` (text) - Current medications and supplements
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `sleep_logs`
  Tracks daily sleep and dream data
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - Links to user_profiles
  - `log_date` (date) - Date of the sleep log
  - `bedtime` (time) - Time went to bed
  - `wake_time` (time) - Time woke up
  - `total_hours` (decimal) - Total sleep duration
  - `sleep_quality` (integer) - Quality rating 1-10
  - `dream_recall_frequency` (integer) - How many dreams recalled
  - `dream_description` (text) - Detailed dream description
  - `dream_mood` (text) - Mood during dream (happy, anxious, fearful, etc.)
  - `dream_type` (text) - Type of dream (lucid, recurring, nightmare, etc.)
  - `dream_vividness` (integer) - Vividness rating 1-5
  - `awakenings` (integer) - Number of times woken up
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. `lifestyle_logs`
  Tracks daily lifestyle factors affecting sleep
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - Links to user_profiles
  - `log_date` (date) - Date of the lifestyle log
  - `stress_level` (integer) - Daily stress rating 1-10
  - `exercise_duration` (integer) - Exercise duration in minutes
  - `exercise_intensity` (text) - Intensity level (low, moderate, high)
  - `caffeine_intake` (integer) - Caffeine servings consumed
  - `alcohol_intake` (integer) - Alcohol servings consumed
  - `screen_time` (integer) - Screen time before bed in minutes
  - `last_meal_time` (time) - Time of last meal before sleep
  - `room_temperature` (decimal) - Room temperature in celsius
  - `noise_level` (text) - Noise level (quiet, moderate, loud)
  - `light_level` (text) - Light level (dark, dim, bright)
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Separate policies for SELECT, INSERT, UPDATE, and DELETE operations
  - All policies require authentication
  - Ownership verified through user_id matching auth.uid()

  ## Indexes
  - Created on user_id and log_date columns for efficient querying
  - Enables fast retrieval of time-series data for analysis

  ## Important Notes
  1. All timestamps use timestamptz for timezone awareness
  2. Ratings use integer constraints to enforce valid ranges
  3. Foreign key constraints ensure data integrity
  4. Default values prevent null issues
  5. Unique constraint on user_id + log_date prevents duplicate entries
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
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

-- Create sleep_logs table
CREATE TABLE IF NOT EXISTS sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  bedtime time,
  wake_time time,
  total_hours decimal(4,2) CHECK (total_hours >= 0 AND total_hours <= 24),
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

-- Create lifestyle_logs table
CREATE TABLE IF NOT EXISTS lifestyle_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_lifestyle_logs_user_date ON lifestyle_logs(user_id, log_date DESC);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifestyle_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for sleep_logs
CREATE POLICY "Users can view own sleep logs"
  ON sleep_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own sleep logs"
  ON sleep_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sleep logs"
  ON sleep_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own sleep logs"
  ON sleep_logs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for lifestyle_logs
CREATE POLICY "Users can view own lifestyle logs"
  ON lifestyle_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own lifestyle logs"
  ON lifestyle_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own lifestyle logs"
  ON lifestyle_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own lifestyle logs"
  ON lifestyle_logs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());