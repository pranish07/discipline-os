import { supabase } from '../supabase/supabaseClient.js';

export async function getNotes(req, res) {
  const { date } = req.query;
  let query = supabase
    .from('daily_notes')
    .select('*')
    .eq('user_id', req.user.id);
  if (date) query = query.eq('date', date);
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data?.[0] || { content: '' });
}

export async function upsertNotes(req, res) {
  const { date, content } = req.body;
  if (!date) return res.status(400).json({ error: 'Date is required' });
  const { data, error } = await supabase
    .from('daily_notes')
    .upsert({ user_id: req.user.id, date, content: content || '' }, { onConflict: 'user_id,date' })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}
