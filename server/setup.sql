-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)
-- before running `npm run seed`.

-- 1. Drop the check constraint that blocks task_number = 0 (used for notes)
ALTER TABLE daily_tasks DROP CONSTRAINT IF EXISTS daily_tasks_task_number_check;

-- 2. Add unique constraint for exercise_schedule upsert
ALTER TABLE exercise_schedule ADD CONSTRAINT exercise_schedule_user_id_day_of_week_key UNIQUE (user_id, day_of_week);

-- 3. Add unique constraint for exercise_logs upsert
ALTER TABLE exercise_logs ADD CONSTRAINT exercise_logs_user_id_date_schedule_id_key UNIQUE (user_id, date, schedule_id);
