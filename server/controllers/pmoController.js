import { supabase } from '../supabase/supabaseClient.js';
import { startOfDay, endOfDay } from 'date-fns';

export async function getRelapses(req, res) {
  const { start_date, end_date } = req.query;
  let query = supabase
    .from('pmo_logs')
    .select('*')
    .eq('user_id', req.user.id)
    .order('relapsed_at', { ascending: false });

  if (start_date) query = query.gte('relapsed_at', start_date);
  if (end_date) query = query.lte('relapsed_at', end_date);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function logRelapse(req, res) {
  const { notes } = req.body;

  const { data, error } = await supabase
    .from('pmo_logs')
    .insert({
      user_id: req.user.id,
      relapsed_at: new Date().toISOString(),
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

export async function getPMOStats(req, res) {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfThisYear = new Date(now.getFullYear(), 0, 1);

  const [allRelapses, thisMonth, thisYear] = await Promise.all([
    supabase
      .from('pmo_logs')
      .select('relapsed_at')
      .eq('user_id', req.user.id)
      .order('relapsed_at', { ascending: false }),
    supabase
      .from('pmo_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .gte('relapsed_at', startOfThisMonth.toISOString()),
    supabase
      .from('pmo_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .gte('relapsed_at', startOfThisYear.toISOString()),
  ]);

  if (allRelapses.error) return res.status(400).json({ error: allRelapses.error.message });

  const relapses = allRelapses.data;
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  if (relapses.length > 0) {
    const lastRelapse = new Date(relapses[0].relapsed_at);
    currentStreak = Math.floor((now.getTime() - lastRelapse.getTime()) / (1000 * 60 * 60 * 24));

    const relapseDates = relapses.map(r => new Date(r.relapsed_at).toISOString().split('T')[0]).sort();
    for (let i = 0; i < relapseDates.length - 1; i++) {
      const diff = Math.floor(
        (new Date(relapseDates[i + 1]).getTime() - new Date(relapseDates[i]).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      tempStreak = diff - 1;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    }

    const firstRelapse = new Date(relapseDates[0]);
    const daysSinceFirst = Math.floor((now.getTime() - firstRelapse.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceFirst > longestStreak) longestStreak = daysSinceFirst;
  } else {
    const { data: userData } = await supabase.auth.admin.getUserById(req.user.id);
    currentStreak = 0;
  }

  res.json({
    currentStreak,
    longestStreak,
    totalThisMonth: thisMonth.count || 0,
    totalThisYear: thisYear.count || 0,
    totalAllTime: relapses.length,
    lastRelapse: relapses.length > 0 ? relapses[0].relapsed_at : null,
  });
}

export async function updateRelapse(req, res) {
  const { id } = req.params;
  const updates = req.body;
  delete updates.user_id;
  delete updates.id;

  const { data, error } = await supabase
    .from('pmo_logs')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function deleteRelapse(req, res) {
  const { id } = req.params;
  const { error } = await supabase
    .from('pmo_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
}
