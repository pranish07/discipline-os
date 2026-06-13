import { useState, useEffect } from 'react';
import { SleepStore, TaskStore, PMOStore, ExerciseStore, ScreenStore, GoalStore } from '../utils/storage.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const subTabs = ['Sleep', 'Tasks', 'PMO', 'Exercise', 'Screen', 'Goals'];

function fmtHM(m) {
  if (m == null) return '--';
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function SleepSection() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [tw, setTw] = useState('06:30');
  const [aw, setAw] = useState('');
  const [ts, setTs] = useState('22:30');
  const [as, setAs] = useState('');

  const log = SleepStore.get(date);
  useEffect(() => {
    if (log) { setTw(log.target_wake || '06:30'); setAw(log.actual_wake || ''); setTs(log.target_sleep || '22:30'); setAs(log.actual_sleep || ''); }
    else { setTw('06:30'); setAw(''); setTs('22:30'); setAs(''); }
  }, [date, log]);

  function save() {
    SleepStore.upsert({ date, target_wake: tw, actual_wake: aw || null, target_sleep: ts, actual_sleep: as || null });
  }

  const now = new Date();
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const s = SleepStore.get(key);
    last7.push({
      date: key.slice(5),
      target: s?.target_wake ? parseFloat(s.target_wake.replace(':', '.')) : null,
      actual: s?.actual_wake ? parseFloat(s.actual_wake.replace(':', '.')) : null,
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div style={{ marginBottom: 12 }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" style={{ width: 'auto' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div><label className="label">Target Wake</label><input type="time" value={tw} onChange={e => setTw(e.target.value)} className="input" /></div>
          <div><label className="label">Actual Wake</label><input type="time" value={aw} onChange={e => setAw(e.target.value)} className="input" /></div>
          <div><label className="label">Target Sleep</label><input type="time" value={ts} onChange={e => setTs(e.target.value)} className="input" /></div>
          <div><label className="label">Actual Sleep</label><input type="time" value={as} onChange={e => setAs(e.target.value)} className="input" /></div>
        </div>
        <button onClick={save} className="btn btn-primary">Save</button>
      </div>

      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Last 7 Days</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7}>
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} />
              <YAxis domain={[0, 24]} tick={{ fill: '#888', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#161616', border: '1px solid #222', borderRadius: 8, fontSize: 13 }} labelStyle={{ color: '#e5e5e5' }} />
              <Bar dataKey="target" fill="#333" name="Target" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" fill="#4ade80" name="Actual" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function TasksSection() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [tasks, setTasks] = useState([]);
  const [titles, setTitles] = useState(['', '', '']);
  const [stats, setStats] = useState(null);

  useEffect(() => { const t = TaskStore.byDate(date); setTasks(t); if (t.length) setTitles(t.map(x => x.title)); else setTitles(['', '', '']); }, [date]);
  useEffect(() => { setStats(TaskStore.stats('all')); }, []);

  function saveTask(num) {
    if (!titles[num - 1].trim()) return;
    TaskStore.upsert({ date, task_number: num, title: titles[num - 1], priority: num === 1 ? 'High' : num === 2 ? 'Medium' : 'Low', status: 'pending' });
    setTasks(TaskStore.byDate(date));
  }

  function toggle(id, current) {
    TaskStore.upsert({ ...current, status: current.status === 'done' ? 'pending' : 'done' });
    setTasks(TaskStore.byDate(date));
    setStats(TaskStore.stats('all'));
  }

  const s = stats || { streak: 0, completionRate: 0, completedDays: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div style={{ marginBottom: 12 }}><input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" style={{ width: 'auto' }} /></div>
        {[1, 2, 3].map(num => {
          const task = tasks.find(t => t.task_number === num);
          return (
            <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              {task ? (
                <>
                  <input type="checkbox" checked={task.status === 'done'} onChange={() => toggle(task.id || task.task_number, task)} style={{ accentColor: '#4ade80' }} />
                  <span style={{ fontSize: 13, color: task.status === 'done' ? '#555' : '#ccc', textDecoration: task.status === 'done' ? 'line-through' : 'none', flex: 1 }}>{task.title}</span>
                </>
              ) : (
                <>
                  <input type="text" className="input" placeholder={`Task ${num}`} value={titles[num - 1]} onChange={e => { const t = [...titles]; t[num - 1] = e.target.value; setTitles(t); }} style={{ flex: 1 }} />
                  <button onClick={() => saveTask(num)} className="btn btn-primary" style={{ padding: '8px 12px' }}>Set</button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }}>
          <div><div style={{ fontSize: 24, fontWeight: 500 }}>{s.streak}</div><div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Day streak</div></div>
          <div><div style={{ fontSize: 24, fontWeight: 500 }}>{s.completionRate}%</div><div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Completion</div></div>
          <div><div style={{ fontSize: 24, fontWeight: 500 }}>{s.completedDays}</div><div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Days done</div></div>
        </div>
      </div>
    </div>
  );
}

function PMOSection() {
  const [stats, setStats] = useState(null);

  useEffect(() => { setStats(PMOStore.stats()); }, []);

  function logRelapse() {
    PMOStore.add({ id: Date.now(), relapsed_at: new Date().toISOString(), notes: '' });
    setStats(PMOStore.stats());
  }

  const s = stats || { currentStreak: 0, totalThisMonth: 0, lastRelapse: null };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
        <div style={{ fontSize: 56, fontWeight: 500, lineHeight: 1 }}>{s.currentStreak}</div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>day streak</div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 16 }}>Last relapse: {s.lastRelapse ? new Date(s.lastRelapse).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}</div>
        <div style={{ fontSize: 13, color: s.totalThisMonth > 0 ? '#f87171' : '#888', marginTop: 4 }}>This month: {s.totalThisMonth}</div>
        <button onClick={logRelapse} className="btn btn-danger" style={{ marginTop: 20 }}>Log relapse</button>
      </div>
    </div>
  );
}

function ExerciseSection() {
  const [schedule, setSchedule] = useState([]);
  const [weekLogs, setWeekLogs] = useState([]);
  const [stats, setStats] = useState(null);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    let s = ExerciseStore.schedule();
    if (s.length === 0) {
      s = [
        { day_of_week: 1, exercise_name: 'Push', scheduled_time: '07:00', is_rest_day: false },
        { day_of_week: 2, exercise_name: 'Pull', scheduled_time: '07:00', is_rest_day: false },
        { day_of_week: 3, exercise_name: 'Cardio', scheduled_time: '06:30', is_rest_day: false },
        { day_of_week: 4, exercise_name: 'Legs', scheduled_time: '07:00', is_rest_day: false },
        { day_of_week: 5, exercise_name: 'Core', scheduled_time: '07:00', is_rest_day: false },
        { day_of_week: 6, exercise_name: '', scheduled_time: null, is_rest_day: true },
        { day_of_week: 0, exercise_name: '', scheduled_time: null, is_rest_day: true },
      ];
      ExerciseStore.saveSchedule(s);
    }
    setSchedule(s);
    setStats(ExerciseStore.stats('week'));
  }, []);

  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
    const key = d.toISOString().split('T')[0];
    const sched = schedule.find(s => s.day_of_week === i);
    const log = ExerciseStore.logs().find(l => l.date === key);
    week.push({ date: key, day: days[i], schedule: sched, log });
  }

  function logToday() {
    const key = now.toISOString().split('T')[0];
    const dow = now.getDay();
    const sched = schedule.find(s => s.day_of_week === dow);
    if (!sched || sched.is_rest_day) return;
    ExerciseStore.log({ date: key, schedule_id: sched.day_of_week, status: 'done' });
    setStats(ExerciseStore.stats('week'));
    setWeekLogs(ExerciseStore.logs());
  }

  const s = stats || { totalDone: 0, totalScheduled: 0, currentStreak: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>This Week</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {week.map(w => {
            const done = ExerciseStore.logs().find(l => l.date === w.date && l.status === 'done');
            return (
              <div key={w.date} style={{
                flexShrink: 0, width: 64, height: 64, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                background: done ? '#4ade80' : w.schedule?.is_rest_day ? '#222' : '#111',
                color: done || w.schedule?.is_rest_day ? '#0a0a0a' : '#888',
                border: w.date === now.toISOString().split('T')[0] ? '2px solid #fff' : '1px solid #333',
                fontSize: 11, fontWeight: 500,
              }}>
                <span>{w.day}</span>
                <span>{done ? '✓' : w.schedule?.is_rest_day ? '—' : ''}</span>
              </div>
            );
          })}
        </div>
        <button onClick={logToday} className="btn btn-primary" style={{ marginTop: 12 }}>Log today's workout</button>
      </div>

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, textAlign: 'center' }}>
          <div><div style={{ fontSize: 24, fontWeight: 500 }}>{s.totalDone} / {s.totalScheduled}</div><div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>This week</div></div>
          <div><div style={{ fontSize: 24, fontWeight: 500 }}>{s.currentStreak}</div><div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Day streak</div></div>
        </div>
      </div>
    </div>
  );
}

function ScreenSection() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [minutes, setMinutes] = useState('');
  const log = ScreenStore.get(date);

  useEffect(() => {
    if (log) setMinutes(String(log.total_minutes));
  }, [date, log]);

  function save() {
    ScreenStore.upsert({ date, total_minutes: parseInt(minutes) || 0 });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthData = [];
  const d = new Date(monthStart);
  while (d <= now) {
    const key = d.toISOString().split('T')[0];
    const entry = ScreenStore.get(key);
    monthData.push({ date: key.slice(5), hours: entry ? Math.round(entry.total_minutes / 60 * 10) / 10 : 0 });
    d.setDate(d.getDate() + 1);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div style={{ marginBottom: 12 }}><input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" style={{ width: 'auto' }} /></div>
        {log && (
          <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>Today: {fmtHM(log.total_minutes)}</div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
          <div style={{ flex: 1 }}>
            <label className="label">Minutes</label>
            <input type="number" className="input" value={minutes} onChange={e => setMinutes(e.target.value)} placeholder="e.g. 240" />
          </div>
          <button onClick={save} className="btn btn-primary" style={{ height: 36 }}>Save</button>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>This Month</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthData}>
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#161616', border: '1px solid #222', borderRadius: 8, fontSize: 13 }} labelStyle={{ color: '#e5e5e5' }} formatter={v => [`${v}h`, 'Screen Time']} />
              <Bar dataKey="hours" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function GoalsSection() {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [editing, setEditing] = useState(null);

  useEffect(() => { setGoals(GoalStore.list()); }, []);

  function add() {
    if (!title.trim()) return;
    GoalStore.add({ id: Date.now(), title, description: desc, category: '', status: 'active', sort_order: goals.length + 1 });
    setTitle(''); setDesc('');
    setGoals(GoalStore.list());
  }

  function toggleStatus(g) {
    GoalStore.update(g.id, { status: g.status === 'active' ? 'achieved' : 'active' });
    setGoals(GoalStore.list());
  }

  function remove(g) {
    GoalStore.remove(g.id);
    setGoals(GoalStore.list());
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Add Goal</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input className="input" placeholder="Goal title" value={title} onChange={e => setTitle(e.target.value)} />
          <input className="input" placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} />
          <button onClick={add} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Add</button>
        </div>
      </div>

      {goals.map(g => (
        <div key={g.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: g.status === 'achieved' ? '#555' : '#e5e5e5', textDecoration: g.status === 'achieved' ? 'line-through' : 'none' }}>{g.title}</div>
            {g.description && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{g.description}</div>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => toggleStatus(g)} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>
              {g.status === 'active' ? 'Done' : 'Undo'}
            </button>
            <button onClick={() => remove(g)} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12, color: '#f87171' }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Track() {
  const [sub, setSub] = useState('Sleep');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
        {subTabs.map(st => (
          <button
            key={st}
            onClick={() => setSub(st)}
            style={{
              padding: '6px 14px', fontSize: 13, fontWeight: 500, borderRadius: 8, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: sub === st ? '#fff' : 'transparent',
              color: sub === st ? '#0a0a0a' : '#888',
            }}
          >
            {st}
          </button>
        ))}
      </div>

      {sub === 'Sleep' && <SleepSection />}
      {sub === 'Tasks' && <TasksSection />}
      {sub === 'PMO' && <PMOSection />}
      {sub === 'Exercise' && <ExerciseSection />}
      {sub === 'Screen' && <ScreenSection />}
      {sub === 'Goals' && <GoalsSection />}
    </div>
  );
}
