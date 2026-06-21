-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)
-- before running `npm run seed`.

-- 1. Drop the check constraint that blocks task_number = 0 (used for notes)
ALTER TABLE daily_tasks DROP CONSTRAINT IF EXISTS daily_tasks_task_number_check;

-- 2. Drop the unique constraint on exercise_schedule (each day can have multiple exercises)
ALTER TABLE exercise_schedule DROP CONSTRAINT IF EXISTS exercise_schedule_user_id_day_of_week_key;

-- 3. Add unique constraint for exercise_logs upsert
ALTER TABLE exercise_logs ADD CONSTRAINT exercise_logs_user_id_date_schedule_id_key UNIQUE (user_id, date, schedule_id);

-- 4. Create separate daily_notes table for the notes API
CREATE TABLE IF NOT EXISTS daily_notes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);
