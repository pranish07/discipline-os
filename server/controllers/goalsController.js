import { supabase } from '../supabase/supabaseClient.js';

export async function getGoals(req, res) {
  const { data, error } = await supabase
    .from('life_goals')
    .select('*')
    .eq('user_id', req.user.id)
    .order('sort_order', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function createGoal(req, res) {
  const { title, description, category } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const { count, error: countError } = await supabase
    .from('life_goals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', req.user.id);

  if (countError) return res.status(400).json({ error: countError.message });

  const { data, error } = await supabase
    .from('life_goals')
    .insert({
      user_id: req.user.id,
      title,
      description,
      category,
      sort_order: count + 1,
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

export async function updateGoal(req, res) {
  const { id } = req.params;
  const updates = req.body;
  delete updates.user_id;
  delete updates.id;

  const { data, error } = await supabase
    .from('life_goals')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function deleteGoal(req, res) {
  const { id } = req.params;
  const { error } = await supabase
    .from('life_goals')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
}
