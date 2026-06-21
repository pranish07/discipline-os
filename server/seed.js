import { supabase } from './supabase/supabaseClient.js';

const EMAIL = 'pranishshrestha181@gmail.com';

async function getUserId() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) throw new Error(`Failed to list users: ${error.message}`);
  const user = users.find(u => u.email === EMAIL);
  if (!user) throw new Error(`User ${EMAIL} not found`);
  return user.id;
}

async function seed() {
  const userId = await getUserId();
  console.log(`Seeding data for user: ${EMAIL} (${userId})`);

  const today = new Date();
  const daysAgo = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  };

  // ── Sleep Logs (14 days) ──
  const sleepLogs = [];
  for (let i = 13; i >= 0; i--) {
    const date = daysAgo(i);
    const hr = 22 + Math.floor(Math.random() * 2);
    const sleepMin = Math.floor(Math.random() * 30);
    const wakeHr = 6 + Math.floor(Math.random() * 2);
    const wakeMin = Math.floor(Math.random() * 60);
    sleepLogs.push({
      user_id: userId,
      date,
      target_sleep: '22:30',
      target_wake: '06:30',
      actual_sleep: `${hr}:${String(sleepMin).padStart(2, '0')}`,
      actual_wake: `${wakeHr}:${String(wakeMin).padStart(2, '0')}`,
    });
  }
  const { error: sleepErr } = await supabase.from('sleep_logs').upsert(sleepLogs, { onConflict: 'user_id,date' });
  if (sleepErr) console.error('Sleep seed error:', sleepErr.message);
  else console.log(`  ✓ ${sleepLogs.length} sleep logs`);

  // ── Daily Tasks (14 days, 3 tasks per day) ──
  const tasks = [];
  const taskTitles = [
    ['Morning meditation', 'Read 20 pages', 'Exercise'],
    ['Study 1 hour', 'Write in journal', 'Clean workspace'],
    ['Practice coding', 'Review goals', 'Evening walk'],
    ['Plan the day', 'Drink 8 glasses water', 'Stretch 10 min'],
    ['Learn a new skill', 'Organize desk', 'Call a friend'],
    ['Study 2 hours', 'Cook a healthy meal', 'Review week'],
    ['Work on project', 'Read industry news', 'Meditate'],
    ['Morning run', 'Practice instrument', 'Plan tomorrow'],
    ['Deep work session', 'Learn vocabulary', 'Journal'],
    ['Review finances', 'Clean room', 'Evening yoga'],
    ['Read 30 pages', 'Practice coding', 'Walk outside'],
    ['Plan meals', 'Study course', 'Reflect on day'],
    ['Workout', 'Read book', 'Prepare for bed'],
    ['Review week', 'Set next week goals', 'Relax'],
  ];
  for (let i = 13; i >= 0; i--) {
    const date = daysAgo(i);
    const titles = taskTitles[i % taskTitles.length];
    for (let j = 0; j < 3; j++) {
      const priorities = ['High', 'Medium', 'Low'];
      tasks.push({
        user_id: userId, date,
        task_number: j + 1,
        title: titles[j],
        priority: priorities[j],
        status: i > 2 ? 'done' : (j === 0 ? 'done' : 'pending'),
        notes: i > 2 ? 'Completed on time' : null,
      });
    }
  }
  const { error: tasksErr } = await supabase.from('daily_tasks').upsert(tasks, { onConflict: 'user_id,date,task_number' });
  if (tasksErr) console.error('Tasks seed error:', tasksErr.message);
  else console.log(`  ✓ ${tasks.length} daily tasks`);

  // ── Daily Notes (14 days) ──
  const noteTexts = [
    'Felt great today. Woke up early and meditated.',
    'Struggled with focus but pushed through.',
    'Good progress on the project.',
    'Slept well. Energy was high all day.',
    'Too much screen time. Need to cut back.',
    'Productive morning, slow afternoon.',
    'Went for a walk. Cleared my mind.',
    'Felt tired but completed everything.',
    'Great day. Learned something new.',
    'Could have done better. Tomorrow is a new day.',
    'Focused and disciplined. Streak alive.',
    'Skipped workout. Get back on track tomorrow.',
    'Good day overall. Stayed disciplined.',
    'Reflecting on the week. Steady progress.',
  ];
  const dailyNotes = [];
  for (let i = 13; i >= 0; i--) {
    dailyNotes.push({
      user_id: userId, date: daysAgo(i),
      content: noteTexts[i % noteTexts.length],
    });
  }
  const { error: notesErr } = await supabase.from('daily_notes').upsert(dailyNotes, { onConflict: 'user_id,date' });
  if (notesErr) console.error('Notes seed error:', notesErr.message);
  else console.log(`  ✓ ${dailyNotes.length} daily notes`);

  // ── Life Goals ──
  const goals = [
    { user_id: userId, title: 'Run a marathon', description: 'Complete a full marathon by end of year', category: 'Fitness', status: 'active', sort_order: 1 },
    { user_id: userId, title: 'Learn Spanish', description: 'Reach conversational fluency', category: 'Learning', status: 'active', sort_order: 2 },
    { user_id: userId, title: 'Read 50 books', description: 'Read 50 books this year across various genres', category: 'Learning', status: 'active', sort_order: 3 },
    { user_id: userId, title: 'Build a side project', description: 'Launch a SaaS product', category: 'Career', status: 'active', sort_order: 4 },
    { user_id: userId, title: 'Save $10,000', description: 'Emergency fund target', category: 'Finance', status: 'achieved', sort_order: 5, achieved_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  ];
  const { error: goalsErr } = await supabase.from('life_goals').insert(goals);
  if (goalsErr) console.error('Goals seed error:', goalsErr.message);
  else console.log(`  ✓ ${goals.length} life goals`);

  // ── Exercise Schedule (multiple per day) ──
  await supabase.from('exercise_schedule').delete().eq('user_id', userId);
  const schedule = [
    // Monday
    { user_id: userId, day_of_week: 1, exercise_name: 'Push-ups (15×3)', is_rest_day: false },
    { user_id: userId, day_of_week: 1, exercise_name: 'Bench Press (10×4)', is_rest_day: false },
    // Tuesday
    { user_id: userId, day_of_week: 2, exercise_name: 'Pull-ups (8×3)', is_rest_day: false },
    { user_id: userId, day_of_week: 2, exercise_name: 'Rows (12×4)', is_rest_day: false },
    // Wednesday
    { user_id: userId, day_of_week: 3, exercise_name: 'Running (30min)', is_rest_day: false },
    { user_id: userId, day_of_week: 3, exercise_name: 'Jump Rope (10min)', is_rest_day: false },
    // Thursday
    { user_id: userId, day_of_week: 4, exercise_name: 'Squats (12×4)', is_rest_day: false },
    { user_id: userId, day_of_week: 4, exercise_name: 'Lunges (10×3)', is_rest_day: false },
    // Friday
    { user_id: userId, day_of_week: 5, exercise_name: 'Planks (3×60s)', is_rest_day: false },
    { user_id: userId, day_of_week: 5, exercise_name: 'Crunches (20×3)', is_rest_day: false },
    // Saturday
    { user_id: userId, day_of_week: 6, exercise_name: '', is_rest_day: true },
    // Sunday
    { user_id: userId, day_of_week: 0, exercise_name: '', is_rest_day: true },
  ];
  const { error: schedErr } = await supabase.from('exercise_schedule').insert(schedule);
  if (schedErr) console.error('Schedule seed error:', schedErr.message);
  else console.log(`  ✓ ${schedule.length} exercise schedule entries`);

  // ── Exercise Logs (14 days) ──
  const exerciseLogs = [];
  const { data: allSched } = await supabase.from('exercise_schedule').select('id, day_of_week').eq('user_id', userId);
  for (let i = 13; i >= 0; i--) {
    const date = daysAgo(i);
    const dayOfWeek = new Date(date).getDay();
    const dayEntries = (allSched || []).filter(s => s.day_of_week === dayOfWeek && !s.is_rest_day);
    for (const entry of dayEntries) {
      exerciseLogs.push({
        user_id: userId, date,
        schedule_id: entry.id,
        status: i > 2 ? 'done' : (Math.random() > 0.5 ? 'done' : 'skipped'),
        notes: i > 2 ? 'Great session' : null,
      });
    }
  }
  if (exerciseLogs.length) {
    await supabase.from('exercise_logs').delete().eq('user_id', userId).gte('date', daysAgo(14));
    const { error: exErr } = await supabase.from('exercise_logs').insert(exerciseLogs);
    if (exErr) console.error('Exercise logs seed error:', exErr.message);
    else console.log(`  ✓ ${exerciseLogs.length} exercise logs`);
  }

  // ── Screen Time Logs (14 days) ──
  const screenTimeLogs = [];
  for (let i = 13; i >= 0; i--) {
    const date = daysAgo(i);
    const total = 120 + Math.floor(Math.random() * 300);
    const social = Math.floor(total * (0.1 + Math.random() * 0.3));
    const entertainment = Math.floor(total * (0.15 + Math.random() * 0.25));
    const productive = Math.floor(total * (0.2 + Math.random() * 0.4));
    screenTimeLogs.push({
      user_id: userId,
      date,
      total_minutes: total,
      social_minutes: social,
      entertainment_minutes: entertainment,
      productive_minutes: productive,
      notes: i % 5 === 0 ? 'High usage day' : null,
    });
  }
  const { error: stErr } = await supabase.from('screen_time_logs').upsert(screenTimeLogs, { onConflict: 'user_id,date' });
  if (stErr) console.error('Screen time seed error:', stErr.message);
  else console.log(`  ✓ ${screenTimeLogs.length} screen time logs`);

  // ── PMO Logs (some relapses scattered) ──
  const relapseDates = [12, 8, 3]; // days ago
  const pmoLogs = relapseDates.map(days => ({
    user_id: userId,
    relapsed_at: new Date(today.getTime() - days * 86400000).toISOString(),
    notes: `Relapse on ${daysAgo(days)}`,
  }));
  const { error: pmoErr } = await supabase.from('pmo_logs').insert(pmoLogs);
  if (pmoErr) console.error('PMO seed error:', pmoErr.message);
  else console.log(`  ✓ ${pmoLogs.length} PMO logs`);

  console.log('\nSeed complete!');
}

async function deleteSeed() {
  const userId = await getUserId();
  console.log(`Deleting seed data for user: ${EMAIL}`);

  const tables = ['sleep_logs', 'daily_tasks', 'daily_notes', 'life_goals', 'exercise_schedule', 'exercise_logs', 'pmo_logs', 'screen_time_logs'];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId);
    if (error) console.error(`Error deleting from ${table}:`, error.message);
    else console.log(`  ✓ Cleared ${table}`);
  }
  console.log('\nDelete complete!');
}

const isDelete = process.argv.includes('--delete') || process.argv.includes('-d');
if (isDelete) {
  deleteSeed().catch(console.error);
} else {
  seed().catch(console.error);
}
