import { supabase } from '../supabase/supabaseClient.js';

export async function getTasks(req, res) {
  const { date } = req.query;
  let query = supabase
    .from('daily_tasks')
    .select('*')
    .eq('user_id', req.user.id)
    .order('task_number', { ascending: true });

  if (date) query = query.eq('date', date);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function getTasksRange(req, res) {
  const { start_date, end_date } = req.query;
  let query = supabase
    .from('daily_tasks')
    .select('*')
    .eq('user_id', req.user.id)
    .order('date', { ascending: false })
    .order('task_number', { ascending: true });

  if (start_date) query = query.gte('date', start_date);
  if (end_date) query = query.lte('date', end_date);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function upsertTask(req, res) {
  const { date, task_number, title, priority, status, notes } = req.body;
  if (!date || task_number === undefined || task_number === null) {
    return res.status(400).json({ error: 'Date and task_number are required' });
  }
  if (task_number !== 0 && !title) {
    return res.status(400).json({ error: 'Title is required for non-notes tasks' });
  }

  const payload = {
    user_id: req.user.id,
    date,
    task_number,
    title,
    priority: priority || 'Medium',
    status: status || 'pending',
    notes: notes || null,
  };

  const { data, error } = await supabase
    .from('daily_tasks')
    .upsert(payload, { onConflict: 'user_id,date,task_number' })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function updateTask(req, res) {
  const { id } = req.params;
  const updates = req.body;
  delete updates.user_id;
  delete updates.id;

  const { data, error } = await supabase
    .from('daily_tasks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function deleteTask(req, res) {
  const { id } = req.params;
  const { error } = await supabase
    .from('daily_tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
}

export async function getTaskStats(req, res) {
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

  const { data, error } = await supabase
    .from('daily_tasks')
    .select('*')
    .eq('user_id', req.user.id)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });

  const dayMap = {};
  for (const task of data) {
    if (!dayMap[task.date]) dayMap[task.date] = { total: 0, done: 0 };
    dayMap[task.date].total += 1;
    if (task.status === 'done') dayMap[task.date].done += 1;
  }

  const daysArray = Object.entries(dayMap).map(([date, stats]) => ({
    date,
    ...stats,
    allDone: stats.done === stats.total,
  }));

  daysArray.sort((a, b) => a.date.localeCompare(b.date));

  let currentStreak = 0;
  for (let i = daysArray.length - 1; i >= 0; i--) {
    if (daysArray[i].allDone) currentStreak++;
    else break;
  }

  const totalDays = daysArray.length;
  const daysAllDone = daysArray.filter(d => d.allDone).length;
  const completionRate = totalDays > 0 ? Math.round((daysAllDone / totalDays) * 100) : 0;

  res.json({
    days: daysArray,
    currentStreak,
    completionRate,
    totalDays,
    daysAllDone,
  });
}
