/**
 * Pure, framework-free input validation helpers for SleepSphere.
 *
 * Why this file exists:
 * - Supabase CHECK constraints are the last line of defence, but they
 *   return cryptic Postgres errors. Validating on the client first gives
 *   users clear messages and avoids wasted network round-trips.
 * - Keeping validation in pure functions (no React, no Supabase) makes it
 *   unit-testable and easy to explain in an interview.
 *
 * Design rule: every validator returns a list of human-readable error
 * strings. Empty list = valid.
 */

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  // Supabase PostgREST errors are plain objects ({ message, code, details, hint }),
  // NOT Error instances — so `instanceof Error` misses them and callers previously
  // fell through to the generic fallback, hiding the real cause (missing table,
  // RLS denial, expired JWT, bad API key, ...). Extract message + code instead.
  if (error && typeof error === 'object') {
    const maybe = error as { message?: unknown; code?: unknown };
    if (typeof maybe.message === 'string' && maybe.message) {
      return typeof maybe.code === 'string' && maybe.code
        ? `${maybe.message} (code: ${maybe.code})`
        : maybe.message;
    }
  }
  return fallback;
}

export function isValidEmail(email: string): boolean {
  // Pragmatic RFC-5322 subset: one @, non-empty local + domain parts, a dot in the domain.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(password: string): string | null {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters long.';
  }
  if (password.length > 72) {
    // bcrypt (used by Supabase Auth) truncates beyond 72 bytes; flag it early.
    return 'Password must be 72 characters or fewer.';
  }
  return null;
}

export function isFutureDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateStr > today;
}

function toNumber(value: string): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export interface SleepLogInput {
  log_date: string;
  bedtime: string;
  wake_time: string;
  total_hours: string;
  sleep_quality: string;
  dream_recall_frequency: string;
  dream_vividness: string;
  awakenings: string;
  dream_description: string;
}

export function validateSleepLog(input: SleepLogInput): string[] {
  const errors: string[] = [];

  if (!input.log_date) errors.push('Please select a date.');
  else if (isFutureDate(input.log_date)) errors.push('Log date cannot be in the future.');

  const totalHours = toNumber(input.total_hours);
  if (totalHours !== null && (totalHours < 0 || totalHours > 24)) {
    errors.push('Total sleep must be between 0 and 24 hours.');
  }

  const quality = toNumber(input.sleep_quality);
  if (quality !== null && (!Number.isInteger(quality) || quality < 1 || quality > 10)) {
    errors.push('Sleep quality must be a whole number between 1 and 10.');
  }

  const recall = toNumber(input.dream_recall_frequency);
  if (recall !== null && (!Number.isInteger(recall) || recall < 0 || recall > 20)) {
    errors.push('Dream recall frequency must be a whole number between 0 and 20.');
  }

  const vividness = toNumber(input.dream_vividness);
  if (vividness !== null && (!Number.isInteger(vividness) || vividness < 1 || vividness > 5)) {
    errors.push('Dream vividness must be a whole number between 1 and 5.');
  }

  const awakenings = toNumber(input.awakenings);
  if (awakenings !== null && (!Number.isInteger(awakenings) || awakenings < 0 || awakenings > 30)) {
    errors.push('Awakenings must be a whole number between 0 and 30.');
  }

  if (input.dream_description && input.dream_description.length > 5000) {
    errors.push('Dream description must be 5,000 characters or fewer.');
  }

  return errors;
}

export interface LifestyleLogInput {
  log_date: string;
  stress_level: string;
  exercise_duration: string;
  caffeine_intake: string;
  alcohol_intake: string;
  screen_time: string;
  room_temperature: string;
}

export function validateLifestyleLog(input: LifestyleLogInput): string[] {
  const errors: string[] = [];

  if (!input.log_date) errors.push('Please select a date.');
  else if (isFutureDate(input.log_date)) errors.push('Log date cannot be in the future.');

  const stress = toNumber(input.stress_level);
  if (stress !== null && (!Number.isInteger(stress) || stress < 1 || stress > 10)) {
    errors.push('Stress level must be a whole number between 1 and 10.');
  }

  const exercise = toNumber(input.exercise_duration);
  if (exercise !== null && (!Number.isInteger(exercise) || exercise < 0 || exercise > 1440)) {
    errors.push('Exercise duration must be between 0 and 1440 minutes.');
  }

  const caffeine = toNumber(input.caffeine_intake);
  if (caffeine !== null && (!Number.isInteger(caffeine) || caffeine < 0 || caffeine > 30)) {
    errors.push('Caffeine intake must be a whole number between 0 and 30.');
  }

  const alcohol = toNumber(input.alcohol_intake);
  if (alcohol !== null && (!Number.isInteger(alcohol) || alcohol < 0 || alcohol > 30)) {
    errors.push('Alcohol intake must be a whole number between 0 and 30.');
  }

  const screen = toNumber(input.screen_time);
  if (screen !== null && (!Number.isInteger(screen) || screen < 0 || screen > 1440)) {
    errors.push('Screen time must be between 0 and 1440 minutes.');
  }

  const temp = toNumber(input.room_temperature);
  if (temp !== null && (temp < -10 || temp > 45)) {
    errors.push('Room temperature must be between -10°C and 45°C.');
  }

  return errors;
}

export interface ProfileInput {
  name: string;
  age: string;
}

export function validateProfile(input: ProfileInput): string[] {
  const errors: string[] = [];

  if (!input.name.trim()) errors.push('Please enter your name.');
  else if (input.name.trim().length > 120) errors.push('Name must be 120 characters or fewer.');

  const age = toNumber(input.age);
  if (age === null || !Number.isInteger(age) || age <= 0 || age >= 150) {
    errors.push('Please enter a valid age between 1 and 149.');
  }

  return errors;
}
