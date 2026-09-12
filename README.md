# SleepSphere — Sleep & Dream Health Platform

React + TypeScript + Tailwind CSS frontend backed by Supabase (PostgreSQL + Auth).
Users log nightly sleep/dreams and daily lifestyle factors, then get
rule-based trend charts, averages, a sleep-health score and personalized
recommendations computed from their own data.

> Note on the name: insights are **rule-based statistics** (thresholds over
> your recorded data), not a machine-learning model. The Health tab carries a
> "not medical advice" disclaimer. Don't claim ML/AI on a resume for this.

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS (dark theme, responsive)
- Supabase: Auth (email/password) + PostgreSQL via PostgREST
- No other backend — all data access is direct Supabase queries gated by RLS

## Getting started

1. Create a free project at https://supabase.com (Project Settings → API
   gives you the URL + anon key).
2. Copy env template and fill it in:
   ```bash
   cp .env.example .env
   ```
   Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   Use the **anon/public** key only — never the `service_role` key in frontend code.
3. Apply the database migrations (Supabase Dashboard → SQL Editor, run in order):
   - `supabase/migrations/20251021080156_create_sleep_tracker_schema.sql`
   - `supabase/migrations/20260201000000_harden_sleep_tracker.sql`
   - `supabase/migrations/20260201000001_restate_rls_policies.sql`
   Or with the Supabase CLI: `supabase db push`.
4. Install + run:
   ```bash
   npm install
   npm run dev        # local dev server
   npm run typecheck  # tsc --noEmit
   npm run build      # production build to dist/
   ```
5. Auth: if "Confirm email" is on (Supabase → Authentication → Providers →
   Email), new sign-ups must click the email link before signing in. The app
   shows a message explaining this after registration.

## Database & security

Tables: `user_profiles` (PK = `auth.users.id`), `sleep_logs`, `lifestyle_logs`.
Each log row has `UNIQUE(user_id, log_date)` (one entry per user per day),
range CHECKs (e.g. quality 1–10, hours 0–24), and `(user_id, log_date)`
indexes for time-series queries. `user_profiles.updated_at` is maintained by
the `trg_user_profiles_updated_at` trigger.

How user data is protected (interview-ready summary):
- Supabase Auth issues a JWT per session; PostgREST exposes `auth.uid()`.
- RLS is enabled on all tables; every policy is owner-only, e.g.
  `USING (user_id = auth.uid())` for SELECT/UPDATE/DELETE and
  `WITH CHECK (user_id = auth.uid())` for INSERT/UPDATE.
- The browser uses only the anon key; there is deliberately **no DELETE
  policy on `user_profiles`** (account deletion goes through Supabase Auth,
  `ON DELETE CASCADE` cleans up logs) and the `service_role` key is never
  used in this project.
- Frontend validation (`src/lib/validation.ts`) gives friendly errors; DB
  CHECK constraints are the real enforcers of valid ranges.

