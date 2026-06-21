import { supabase } from '../supabase/supabaseClient.js';
import { format } from 'date-fns';

export async function getSchedule(req, res) {
  const { data, error } = await supabase
    .from('exercise_schedule')
    .select('*')
    .eq('user_id', req.user.id)
    .order('day_of_week', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function saveSchedule(req, res) {
  const { schedule } = req.body;
  if (!Array.isArray(schedule)) {
    return res.status(400).json({ error: 'Schedule must be an array' });
  }

  await supabase.from('exercise_schedule').delete().eq('user_id', req.user.id);

  const entries = schedule.map(day => ({
    user_id: req.user.id,
    day_of_week: day.day_of_week,
    exercise_name: day.exercise_name || '',
    scheduled_time: day.scheduled_time || null,
    is_rest_day: day.is_rest_day || false,
  }));

  const { data, error } = await supabase
    .from('exercise_schedule')
    .insert(entries)
    .select()
    .order('day_of_week', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function addScheduleItem(req, res) {
  const { day_of_week, exercise_name } = req.body;
  if (day_of_week === undefined || day_of_week === null || !exercise_name?.trim()) {
    return res.status(400).json({ error: 'day_of_week and exercise_name are required' });
  }
  const { data, error } = await supabase
    .from('exercise_schedule')
    .insert({ user_id: req.user.id, day_of_week, exercise_name: exercise_name.trim(), is_rest_day: false })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function updateScheduleItem(req, res) {
  const { id } = req.params;
  const updates = req.body;
  delete updates.user_id;
  delete updates.id;
  const { data, error } = await supabase
    .from('exercise_schedule')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function deleteScheduleItem(req, res) {
  const { id } = req.params;
  const { error } = await supabase
    .from('exercise_schedule')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
}

export async function getLogs(req, res) {
  const { start_date, end_date } = req.query;
  let query = supabase
    .from('exercise_logs')
    .select('*, exercise_schedule(*)')
    .eq('user_id', req.user.id)
    .order('date', { ascending: false });

  if (start_date) query = query.gte('date', start_date);
  if (end_date) query = query.lte('date', end_date);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function upsertLog(req, res) {
  const { date, schedule_id, status, notes } = req.body;
  if (!date || !schedule_id || !status) {
    return res.status(400).json({ error: 'Date, schedule_id, and status are required' });
  }

  const { data, error } = await supabase
    .from('exercise_logs')
    .upsert(
      {
        user_id: req.user.id,
        date,
        schedule_id,
        status,
        notes: notes || null,
      },
      { onConflict: 'user_id,date,schedule_id' }
    )
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function updateLog(req, res) {
  const { id } = req.params;
  const updates = req.body;
  delete updates.user_id;
  delete updates.id;

  const { data, error } = await supabase
    .from('exercise_logs')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function deleteLog(req, res) {
  const { id } = req.params;
  const { error } = await supabase
    .from('exercise_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
}

export async function getExerciseStats(req, res) {
  const { period = 'month' } = req.query;
  const now = new Date();
  let startDate;

  switch (period) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
  }

  const startStr = startDate.toISOString().split('T')[0];

  const [scheduleResult, logsResult] = await Promise.all([
    supabase.from('exercise_schedule').select('*').eq('user_id', req.user.id),
    supabase
      .from('exercise_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .gte('date', startStr)
      .order('date', { ascending: true }),
  ]);

  if (scheduleResult.error) return res.status(400).json({ error: scheduleResult.error.message });
  if (logsResult.error) return res.status(400).json({ error: logsResult.error.message });

  const totalScheduled = logsResult.data.length;
  const totalDone = logsResult.data.filter(l => l.status === 'done').length;
  const totalSkipped = logsResult.data.filter(l => l.status === 'skipped').length;
  const completionRate = totalScheduled > 0 ? Math.round((totalDone / totalScheduled) * 100) : 0;

  let currentStreak = 0;
  const sorted = [...logsResult.data].sort((a, b) => b.date.localeCompare(a.date));
  for (const log of sorted) {
    if (log.status === 'done') currentStreak++;
    else break;
  }

  res.json({
    logs: logsResult.data,
    schedule: scheduleResult.data,
    totalScheduled,
    totalDone,
    totalSkipped,
    completionRate,
    currentStreak,
  });
}
