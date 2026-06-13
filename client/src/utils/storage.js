const KEYS = {
  SLEEP: 'dos_sleep',
  TASKS: 'dos_tasks',
  PMO: 'dos_pmo',
  EXERCISE: 'dos_exercise',
  SCREEN: 'dos_screen',
  GOALS: 'dos_goals',
};

function get(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function set(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export const SleepStore = {
  list() { return get(KEYS.SLEEP); },
  get(date) { return this.list().find(s => s.date === date) || null; },
  upsert(entry) {
    const all = this.list();
    const idx = all.findIndex(s => s.date === entry.date);
    if (idx >= 0) all[idx] = { ...all[idx], ...entry };
    else all.push(entry);
    set(KEYS.SLEEP, all);
    return entry;
  },
  range(startDate, endDate) {
    return this.list().filter(s => s.date >= startDate && s.date <= endDate);
  },
  stats(period) {
    const now = new Date();
    let start;
    if (period === 'week') { const d = new Date(now); d.setDate(d.getDate() - d.getDay()); start = d; }
    else if (period === 'month') { start = new Date(now.getFullYear(), now.getMonth(), 1); }
    else { start = new Date(now.getFullYear(), 0, 1); }
    const end = new Date(now);
    const logs = this.range(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
    return logs.map(s => ({
      ...s,
      wakeOnTime: s.target_wake && s.actual_wake ? Math.abs(new Date(`2000-01-01T${s.actual_wake}`) - new Date(`2000-01-01T${s.target_wake}`)) <= 15 * 60 * 1000 : null,
      sleepOnTime: s.target_sleep && s.actual_sleep ? Math.abs(new Date(`2000-01-01T${s.actual_sleep}`) - new Date(`2000-01-01T${s.target_sleep}`)) <= 15 * 60 * 1000 : null,
    }));
  },
};

export const TaskStore = {
  list() { return get(KEYS.TASKS); },
  byDate(date) { return this.list().filter(t => t.date === date).sort((a, b) => a.task_number - b.task_number); },
  upsert(task) {
    const all = this.list();
    const idx = all.findIndex(t => t.date === task.date && t.task_number === task.task_number);
    if (idx >= 0) all[idx] = { ...all[idx], ...task };
    else all.push(task);
    set(KEYS.TASKS, all);
    return task;
  },
  range(startDate, endDate) {
    return this.list().filter(t => t.date >= startDate && t.date <= endDate);
  },
  stats(period) {
    const now = new Date();
    let start;
    if (period === 'week') { const d = new Date(now); d.setDate(d.getDate() - d.getDay()); start = d; }
    else if (period === 'month') { start = new Date(now.getFullYear(), now.getMonth(), 1); }
    else { start = new Date(now.getFullYear(), 0, 1); }
    const end = new Date(now);
    const tasks = this.range(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
    const days = {};
    tasks.forEach(t => {
      if (!days[t.date]) days[t.date] = { date: t.date, total: 0, done: 0 };
      days[t.date].total += 1;
      if (t.status === 'done') days[t.date].done += 1;
    });
    const daysArr = Object.values(days);
    const completedDays = daysArr.filter(d => d.done === d.total).length;
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'done').length;

    let streak = 0;
    const d = new Date(now);
    while (true) {
      const key = d.toISOString().split('T')[0];
      const day = days[key];
      if (day && day.done === day.total) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }

    return { days: daysArr, totalTasks, doneTasks, completionRate: totalTasks ? Math.round(doneTasks / totalTasks * 100) : 0, completedDays, streak };
  },
};

export const PMOStore = {
  list() { return get(KEYS.PMO); },
  add(entry) {
    const all = this.list();
    all.push(entry);
    set(KEYS.PMO, all);
    return entry;
  },
  remove(id) {
    set(KEYS.PMO, this.list().filter(e => e.id !== id));
  },
  stats() {
    const logs = this.list().sort((a, b) => new Date(b.relapsed_at) - new Date(a.relapsed_at));
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalThisMonth = logs.filter(l => new Date(l.relapsed_at) >= monthStart).length;
    const lastRelapse = logs.length > 0 ? logs[0].relapsed_at : null;

    let currentStreak = 0;
    if (logs.length > 0) {
      const d = new Date(now);
      const last = new Date(logs[0].relapsed_at);
      currentStreak = Math.floor((now - last) / 86400000);
    }

    let longestStreak = 0;
    if (logs.length > 0) {
      const sorted = logs.map(l => new Date(l.relapsed_at)).sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        const gap = Math.floor((sorted[i] - sorted[i - 1]) / 86400000);
        if (gap > longestStreak) longestStreak = gap;
      }
      const first = Math.floor((sorted[0] - new Date(0)) / 86400000);
      if (first > longestStreak) longestStreak = first;
    }

    return { currentStreak, longestStreak, totalThisMonth, lastRelapse, totalAllTime: logs.length };
  },
};

export const ExerciseStore = {
  schedule() {
    try { return JSON.parse(localStorage.getItem('dos_exercise_schedule')) || []; }
    catch { return []; }
  },
  saveSchedule(sched) {
    localStorage.setItem('dos_exercise_schedule', JSON.stringify(sched));
  },
  logs() { return get(KEYS.EXERCISE); },
  log(entry) {
    const all = this.logs();
    const idx = all.findIndex(l => l.date === entry.date && l.schedule_id === entry.schedule_id);
    if (idx >= 0) all[idx] = { ...all[idx], ...entry };
    else all.push(entry);
    set(KEYS.EXERCISE, all);
  },
  stats(period) {
    const now = new Date();
    let start;
    if (period === 'week') { const d = new Date(now); d.setDate(d.getDate() - d.getDay()); start = d; }
    else if (period === 'month') { start = new Date(now.getFullYear(), now.getMonth(), 1); }
    else { start = new Date(now.getFullYear(), 0, 1); }
    const end = new Date(now);
    const logs = get(KEYS.EXERCISE).filter(l => l.date >= start.toISOString().split('T')[0] && l.date <= end.toISOString().split('T')[0]);
    const totalDone = logs.filter(l => l.status === 'done').length;
    const totalScheduled = logs.length;
    const schedule = this.schedule();
    const activeDays = schedule.filter(s => !s.is_rest_day).length;

    let streak = 0;
    const d = new Date(now);
    while (true) {
      const key = d.toISOString().split('T')[0];
      const log = logs.find(l => l.date === key);
      if (log && log.status === 'done') { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }

    return { totalDone, totalScheduled, activeDays, currentStreak: streak, logs };
  },
};

export const ScreenStore = {
  list() { return get(KEYS.SCREEN); },
  get(date) { return this.list().find(s => s.date === date) || null; },
  upsert(entry) {
    const all = this.list();
    const idx = all.findIndex(s => s.date === entry.date);
    if (idx >= 0) all[idx] = { ...all[idx], ...entry };
    else all.push(entry);
    set(KEYS.SCREEN, all);
    return entry;
  },
  range(startDate, endDate) {
    return this.list().filter(s => s.date >= startDate && s.date <= endDate);
  },
  yearData(year) {
    return this.list().filter(s => s.date.startsWith(String(year)));
  },
};

export const GoalStore = {
  list() { return get(KEYS.GOALS); },
  add(goal) {
    const all = this.list();
    all.push(goal);
    set(KEYS.GOALS, all);
    return goal;
  },
  update(id, patch) {
    const all = this.list();
    const idx = all.findIndex(g => g.id === id);
    if (idx >= 0) { all[idx] = { ...all[idx], ...patch }; set(KEYS.GOALS, all); }
  },
  remove(id) {
    set(KEYS.GOALS, this.list().filter(g => g.id !== id));
  },
  active() { return this.list().filter(g => g.status === 'active'); },
};
