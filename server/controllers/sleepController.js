import { supabase } from '../supabase/supabaseClient.js';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export async function getSleepLogs(req, res) {
  const { start_date, end_date } = req.query;
  let query = supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', req.user.id)
    .order('date', { ascending: false });

  if (start_date) query = query.gte('date', start_date);
  if (end_date) query = query.lte('date', end_date);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function getSleepLog(req, res) {
  const { date } = req.params;
  const { data, error } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('date', date)
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function upsertSleepLog(req, res) {
  const { date, target_wake, target_sleep, actual_wake, actual_sleep } = req.body;
  if (!date) return res.status(400).json({ error: 'Date is required' });

  const payload = {
    user_id: req.user.id,
    date,
    target_wake: target_wake || null,
    target_sleep: target_sleep || null,
    actual_wake: actual_wake || null,
    actual_sleep: actual_sleep || null,
  };

  const { data, error } = await supabase
    .from('sleep_logs')
    .upsert(payload, { onConflict: 'user_id,date' })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function getSleepStats(req, res) {
  const { period = 'week' } = req.query;
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
      startDate.setDate(now.getDate() - 7);
  }

  const { data, error } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', req.user.id)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });

  const stats = data.map(entry => {
    const wakeOnTime = entry.actual_wake && entry.target_wake
      ? Math.abs(
          (parseISO(`2000-01-01T${entry.actual_wake}`).getTime() -
            parseISO(`2000-01-01T${entry.target_wake}`).getTime()) /
            (1000 * 60)
        ) <= 15
      : null;
    const sleepOnTime = entry.actual_sleep && entry.target_sleep
      ? Math.abs(
          (parseISO(`2000-01-01T${entry.actual_sleep}`).getTime() -
            parseISO(`2000-01-01T${entry.target_sleep}`).getTime()) /
            (1000 * 60)
        ) <= 15
      : null;

    let totalSleep = null;
    if (entry.actual_wake && entry.actual_sleep) {
      const wakeParts = entry.actual_wake.split(':');
      const sleepParts = entry.actual_sleep.split(':');
      const wakeDate = new Date(2000, 0, 1, +wakeParts[0], +wakeParts[1]);
      const sleepDate = new Date(2000, 0, 1, +sleepParts[0], +sleepParts[1]);
      if (sleepDate > wakeDate) {
        sleepDate.setDate(sleepDate.getDate() - 1);
      }
      totalSleep = Math.round((wakeDate.getTime() - sleepDate.getTime()) / (1000 * 60 * 60) * 10) / 10;
    }

    return {
      date: entry.date,
      target_wake: entry.target_wake,
      target_sleep: entry.target_sleep,
      actual_wake: entry.actual_wake,
      actual_sleep: entry.actual_sleep,
      wakeOnTime,
      sleepOnTime,
      totalSleep,
    };
  });

  res.json(stats);
}

export async function updateSleepLog(req, res) {
  const { id } = req.params;
  const updates = req.body;
  delete updates.user_id;
  delete updates.id;

  const { data, error } = await supabase
    .from('sleep_logs')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function deleteSleepLog(req, res) {
  const { id } = req.params;
  const { error } = await supabase
    .from('sleep_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
}
