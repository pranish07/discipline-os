import { supabase } from '../supabase/supabaseClient.js';

export async function getScreenTimeLog(req, res) {
  const { date } = req.query;
  if (!date) {
    const { data, error } = await supabase
      .from('screen_time_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .order('date', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  }

  const { data, error } = await supabase
    .from('screen_time_logs')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('date', date)
    .maybeSingle();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function upsertScreenTimeLog(req, res) {
  const { date, total_minutes, social_minutes, entertainment_minutes, productive_minutes, notes } = req.body;
  if (!date) return res.status(400).json({ error: 'Date is required' });

  const { data, error } = await supabase
    .from('screen_time_logs')
    .upsert({
      user_id: req.user.id,
      date,
      total_minutes: total_minutes ?? 0,
      social_minutes: social_minutes ?? null,
      entertainment_minutes: entertainment_minutes ?? null,
      productive_minutes: productive_minutes ?? null,
      notes: notes ?? null,
    }, { onConflict: 'user_id,date' })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function getScreenTimeStats(req, res) {
  const { period, year } = req.query;
  const now = new Date();
  let startDate;

  if (year) {
    startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    const { data, error } = await supabase
      .from('screen_time_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  }

  switch (period) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), 0, 1);
  }

  const { data, error } = await supabase
    .from('screen_time_logs')
    .select('*')
    .eq('user_id', req.user.id)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', now.toISOString().split('T')[0])
    .order('date', { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function updateScreenTimeLog(req, res) {
  const { id } = req.params;
  const updates = req.body;
  delete updates.user_id;
  delete updates.id;

  const { data, error } = await supabase
    .from('screen_time_logs')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function deleteScreenTimeLog(req, res) {
  const { id } = req.params;
  const { error } = await supabase
    .from('screen_time_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
}
