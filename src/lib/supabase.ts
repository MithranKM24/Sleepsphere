import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
      'Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. ' +
      'See README.md for where to find these values.'
  );
}

/**
 * Browser Supabase client using the **anon (public) key**.
 *
 * Interview point: the anon key is safe to ship in frontend code because
 * all tables have Row Level Security enabled — PostgREST checks
 * `auth.uid()` on every query. The `service_role` key bypasses RLS and
 * must NEVER appear in frontend code; it stays server-side only (and this
 * project does not need it at all).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender?: string | null;
  occupation?: string | null;
  sleep_habits?: string | null;
  medical_history?: string | null;
  medications?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SleepLog {
  id: string;
  user_id: string;
  log_date: string;
  bedtime?: string | null;
  wake_time?: string | null;
  total_hours?: number | null;
  sleep_quality?: number | null;
  dream_recall_frequency?: number | null;
  dream_description?: string | null;
  dream_mood?: string | null;
  dream_type?: string | null;
  dream_vividness?: number | null;
  awakenings?: number | null;
  created_at: string;
}

export interface LifestyleLog {
  id: string;
  user_id: string;
  log_date: string;
  stress_level?: number | null;
  exercise_duration?: number | null;
  exercise_intensity?: string | null;
  caffeine_intake?: number | null;
  alcohol_intake?: number | null;
  screen_time?: number | null;
  last_meal_time?: string | null;
  room_temperature?: number | null;
  noise_level?: string | null;
  light_level?: string | null;
  created_at: string;
}

