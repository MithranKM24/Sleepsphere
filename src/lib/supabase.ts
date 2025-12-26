import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender?: string;
  occupation?: string;
  sleep_habits?: string;
  medical_history?: string;
  medications?: string;
  created_at: string;
  updated_at: string;
}

export interface SleepLog {
  id: string;
  user_id: string;
  log_date: string;
  bedtime?: string;
  wake_time?: string;
  total_hours?: number;
  sleep_quality?: number;
  dream_recall_frequency?: number;
  dream_description?: string;
  dream_mood?: string;
  dream_type?: string;
  dream_vividness?: number;
  awakenings?: number;
  created_at: string;
}

export interface LifestyleLog {
  id: string;
  user_id: string;
  log_date: string;
  stress_level?: number;
  exercise_duration?: number;
  exercise_intensity?: string;
  caffeine_intake?: number;
  alcohol_intake?: number;
  screen_time?: number;
  last_meal_time?: string;
  room_temperature?: number;
  noise_level?: string;
  light_level?: string;
  created_at: string;
}
