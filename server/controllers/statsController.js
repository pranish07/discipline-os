import { supabase } from '../supabase/supabaseClient.js';

export async function getOverallStats(req, res) {
  const { period = 'today' } = req.query;
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  let startDate;
  let endDate = today;

  switch (period) {
    case 'today':
      startDate = today;
      break;
    case 'yesterday': {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      startDate = d.toISOString().split('T')[0];
      endDate = startDate;
      break;
    }
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate = startDate.toISOString().split('T')[0];
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      break;
    default:
      startDate = today;
  }

  const [sleepData, tasksData, pmoData, exerciseData] = await Promise.all([
    supabase.from('sleep_logs').select('*').eq('user_id', req.user.id).gte('date', startDate).lte('date', endDate).order('date', { ascending: true }),
    supabase.from('daily_tasks').select('*').eq('user_id', req.user.id).gte('date', startDate).lte('date', endDate).order('date', { ascending: true }),
    supabase.from('pmo_logs').select('*').eq('user_id', req.user.id).gte('relapsed_at', startDate).lte('relapsed_at', endDate + 'T23:59:59Z'),
    supabase.from('exercise_logs').select('*').eq('user_id', req.user.id).gte('date', startDate).lte('date', endDate),
  ]);

  const sleep = sleepData.data || [];
  const tasks = tasksData.data || [];
  const pmo = pmoData.data || [];
  const exercise = exerciseData.data || [];

  const disciplineScore = calculateDisciplineScore(sleep, tasks, pmo, exercise, startDate, today);

  res.json({
    sleep: { logs: sleep, count: sleep.length },
    tasks: { logs: tasks, count: tasks.length },
    pmo: { relapses: pmo, count: pmo.length },
    exercise: { logs: exercise, count: exercise.length },
    disciplineScore,
  });
}

function calculateDisciplineScore(sleepLogs, tasks, pmoLogs, exerciseLogs, startDate, endDate) {
  const metrics = { hit: 0, total: 0 };

  for (const log of sleepLogs) {
    metrics.total += 2;
    if (log.actual_wake && log.target_wake) {
      const diff = Math.abs(
        new Date(`2000-01-01T${log.actual_wake}`) - new Date(`2000-01-01T${log.target_wake}`)
      );
      if (diff <= 15 * 60 * 1000) metrics.hit += 1;
    }
    if (log.actual_sleep && log.target_sleep) {
      const diff = Math.abs(
        new Date(`2000-01-01T${log.actual_sleep}`) - new Date(`2000-01-01T${log.target_sleep}`)
      );
      if (diff <= 15 * 60 * 1000) metrics.hit += 1;
    }
  }

  const taskDays = {};
  for (const t of tasks) {
    if (!taskDays[t.date]) taskDays[t.date] = { total: 0, done: 0 };
    taskDays[t.date].total += 1;
    if (t.status === 'done') taskDays[t.date].done += 1;
  }
  for (const day of Object.values(taskDays)) {
    metrics.total += 1;
    if (day.done === day.total) metrics.hit += 1;
  }

  metrics.total += pmoLogs.length > 0 ? 0 : 1;
  if (pmoLogs.length === 0) metrics.hit += 1;

  for (const log of exerciseLogs) {
    metrics.total += 1;
    if (log.status === 'done') metrics.hit += 1;
  }

  if (metrics.total === 0) return 0;
  return Math.round((metrics.hit / metrics.total) * 100);
}
