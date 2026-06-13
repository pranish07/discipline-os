import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SleepAPI, TaskAPI, PMOAPI, ExerciseAPI, ScreenAPI, GoalAPI } from '../utils/api.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const subTabs = ['sleep', 'tasks', 'pmo', 'exercise', 'screen', 'goals'];

const subTabLabels = {
  sleep: 'Sleep', tasks: 'Tasks', pmo: 'PMO', exercise: 'Exercise', screen: 'Screen', goals: 'Goals',
};

const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const label = h === 0 ? `12:${String(m).padStart(2, '0')} AM` : h < 12 ? `${h}:${String(m).padStart(2, '0')} AM` : h === 12 ? `12:${String(m).padStart(2, '0')} PM` : `${h - 12}:${String(m).padStart(2, '0')} PM`;
    TIME_OPTIONS.push({ val, label });
  }
}

function TimeSelect({ value, onChange, ...props }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="input" style={{ width: '100%' }} {...props}>
      {TIME_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
    </select>
  );
}

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
  const [log, setLog] = useState(null);
  const [last7, setLast7] = useState([]);

  const load = useCallback(async () => {
    const d = await SleepAPI.get(date).catch(() => null);
    setLog(d);
    if (d) { setTw(d.target_wake || '06:30'); setAw(d.actual_wake || ''); setTs(d.target_sleep || '22:30'); setAs(d.actual_sleep || ''); }
    else { setTw('06:30'); setAw(''); setTs('22:30'); setAs(''); }

    const now = new Date();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d2 = new Date(now); d2.setDate(d2.getDate() - i);
      const key = d2.toISOString().split('T')[0];
      const s = await SleepAPI.get(key).catch(() => null);
      data.push({
        date: key.slice(5),
        target: s?.target_wake ? parseFloat(s.target_wake.replace(':', '.')) : null,
        actual: s?.actual_wake ? parseFloat(s.actual_wake.replace(':', '.')) : null,
      });
    }
    setLast7(data);
  }, [date]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    await SleepAPI.upsert({ date, target_wake: tw, actual_wake: aw || null, target_sleep: ts, actual_sleep: as || null });
    await load();
  }

  async function remove() {
    if (!log?.id) return;
    await SleepAPI.remove(log.id);
    await load();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div style={{ marginBottom: 12 }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" style={{ width: 'auto' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div><label className="label">Target Wake</label><TimeSelect value={tw} onChange={setTw} /></div>
          <div><label className="label">Actual Wake</label><TimeSelect value={aw} onChange={setAw} /></div>
          <div><label className="label">Target Sleep</label><TimeSelect value={ts} onChange={setTs} /></div>
          <div><label className="label">Actual Sleep</label><TimeSelect value={as} onChange={setAs} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} className="btn btn-primary">Save</button>
          {log && <button onClick={remove} className="btn btn-danger" style={{ padding: '8px 14px' }}>Delete</button>}
        </div>
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

  const load = useCallback(async () => {
    const t = await TaskAPI.byDate(date).catch(() => []);
    setTasks(t);
    if (t.length) setTitles(t.map(x => x.title));
    else setTitles(['', '', '']);
  }, [date]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { TaskAPI.stats('all').then(setStats).catch(() => {}); }, []);

  async function saveTask(num) {
    if (!titles[num - 1].trim()) return;
    await TaskAPI.upsert({ date, task_number: num, title: titles[num - 1], priority: num === 1 ? 'High' : num === 2 ? 'Medium' : 'Low', status: 'pending' });
    await load();
  }

  async function toggle(task) {
    await TaskAPI.update(task.id, { status: task.status === 'done' ? 'pending' : 'done' });
    await load();
    const s = await TaskAPI.stats('all');
    setStats(s);
  }

  async function removeTask(id) {
    await TaskAPI.remove(id);
    await load();
    const s = await TaskAPI.stats('all');
    setStats(s);
  }

  const s = stats || { currentStreak: 0, completionRate: 0, daysAllDone: 0 };

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
                  <input type="checkbox" checked={task.status === 'done'} onChange={() => toggle(task)} style={{ accentColor: '#4ade80' }} />
                  <span style={{ fontSize: 13, color: task.status === 'done' ? '#555' : '#ccc', textDecoration: task.status === 'done' ? 'line-through' : 'none', flex: 1 }}>{task.title}</span>
                  <button onClick={() => removeTask(task.id)} className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 12, color: '#f87171' }}>Delete</button>
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
          <div><div style={{ fontSize: 24, fontWeight: 500 }}>{s.currentStreak}</div><div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Day streak</div></div>
          <div><div style={{ fontSize: 24, fontWeight: 500 }}>{s.completionRate}%</div><div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Completion</div></div>
          <div><div style={{ fontSize: 24, fontWeight: 500 }}>{s.daysAllDone}</div><div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Days done</div></div>
        </div>
      </div>
    </div>
  );
}

function PMOSection() {
  const [stats, setStats] = useState(null);
  const [relapses, setRelapses] = useState([]);

  useEffect(() => {
    PMOAPI.stats().then(setStats);
    PMOAPI.list().then(setRelapses).catch(() => setRelapses([]));
  }, []);

  async function logRelapse() {
    await PMOAPI.add({});
    const [s, r] = await Promise.all([PMOAPI.stats(), PMOAPI.list()]);
    setStats(s);
    setRelapses(r);
  }

  async function removeRelapse(id) {
    await PMOAPI.remove(id);
    const [s, r] = await Promise.all([PMOAPI.stats(), PMOAPI.list()]);
    setStats(s);
    setRelapses(r);
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

      {relapses.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Relapse History</div>
          {relapses.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a1a' }}>
              <span style={{ fontSize: 13, color: '#ccc' }}>
                {new Date(r.relapsed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              <button onClick={() => removeRelapse(r.id)} className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 12, color: '#f87171' }}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExerciseSection() {
  const [schedule, setSchedule] = useState([]);
  const [stats, setStats] = useState(null);
  const [notes, setNotes] = useState('');
  const [todayLog, setTodayLog] = useState(null);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const load = useCallback(async () => {
    let s = await ExerciseAPI.schedule().catch(() => []);
    if (s.length === 0) {
      s = [
        { id: 1, day_of_week: 1, exercise_name: 'Push', scheduled_time: '07:00', is_rest_day: false },
        { id: 2, day_of_week: 2, exercise_name: 'Pull', scheduled_time: '07:00', is_rest_day: false },
        { id: 3, day_of_week: 3, exercise_name: 'Cardio', scheduled_time: '06:30', is_rest_day: false },
        { id: 4, day_of_week: 4, exercise_name: 'Legs', scheduled_time: '07:00', is_rest_day: false },
        { id: 5, day_of_week: 5, exercise_name: 'Core', scheduled_time: '07:00', is_rest_day: false },
        { id: 6, day_of_week: 6, exercise_name: '', scheduled_time: null, is_rest_day: true },
        { id: 0, day_of_week: 0, exercise_name: '', scheduled_time: null, is_rest_day: true },
      ];
      await ExerciseAPI.saveSchedule(s);
    }
    setSchedule(s);
    const exStats = await ExerciseAPI.stats('week');
    setStats(exStats);
    const key = new Date().toISOString().split('T')[0];
    const logs = await ExerciseAPI.logs(key, key).catch(() => []);
    const tl = logs.find(l => l.status === 'done');
    setTodayLog(tl || null);
    if (tl) setNotes(tl.notes || '');
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
    const key = d.toISOString().split('T')[0];
    const sched = schedule.find(x => x.day_of_week === i);
    week.push({ date: key, day: days[i], schedule: sched });
  }

  async function logToday() {
    const key = now.toISOString().split('T')[0];
    const dow = now.getDay();
    const sched = schedule.find(x => x.day_of_week === dow);
    if (!sched || sched.is_rest_day) return;
    await ExerciseAPI.log({ date: key, schedule_id: sched.id, status: 'done', notes: notes || null });
    const exStats = await ExerciseAPI.stats('week');
    setStats(exStats);
    const logs = await ExerciseAPI.logs(key, key);
    setTodayLog(logs.find(l => l.status === 'done') || null);
  }

  async function removeTodayLog() {
    if (!todayLog?.id) return;
    await ExerciseAPI.removeLog(todayLog.id);
    setTodayLog(null);
    setNotes('');
    const exStats = await ExerciseAPI.stats('week');
    setStats(exStats);
  }

  const s = stats || { totalDone: 0, totalScheduled: 0, currentStreak: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>This Week</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {week.map(w => {
            const done = /* will refresh from stats */ false;
            return (
              <div key={w.date} style={{
                flexShrink: 0, width: 64, height: 64, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                background: '#111',
                color: '#888',
                border: w.date === now.toISOString().split('T')[0] ? '2px solid #fff' : '1px solid #333',
                fontSize: 11, fontWeight: 500,
              }}>
                <span>{w.day}</span>
                <span>{w.schedule?.is_rest_day ? '—' : ''}</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <input className="input" placeholder="e.g. 20 x 5 sets, 10 reps" value={notes} onChange={e => setNotes(e.target.value)} style={{ flex: 1 }} />
          {todayLog ? (
            <button onClick={removeTodayLog} className="btn btn-danger">Remove</button>
          ) : (
            <button onClick={logToday} className="btn btn-primary">Log workout</button>
          )}
        </div>
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
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [log, setLog] = useState(null);
  const [monthData, setMonthData] = useState([]);

  const load = useCallback(async () => {
    const d = await ScreenAPI.get(date).catch(() => null);
    setLog(d);
    if (d) { setHours(String(Math.floor(d.total_minutes / 60))); setMinutes(String(d.total_minutes % 60)); }
    else { setHours(''); setMinutes(''); }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const data = [];
    const d2 = new Date(monthStart);
    while (d2 <= now) {
      const key = d2.toISOString().split('T')[0];
      const entry = await ScreenAPI.get(key).catch(() => null);
      data.push({ date: key.slice(5), hours: entry ? Math.round(entry.total_minutes / 60 * 10) / 10 : 0 });
      d2.setDate(d2.getDate() + 1);
    }
    setMonthData(data);
  }, [date]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    const total = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
    await ScreenAPI.upsert({ date, total_minutes: total });
    await load();
  }

  async function remove() {
    if (!log?.id) return;
    await ScreenAPI.remove(log.id);
    await load();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div style={{ marginBottom: 12 }}><input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" style={{ width: 'auto' }} /></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
          <div style={{ flex: 1 }}>
            <label className="label">Hours</label>
            <input type="number" className="input" value={hours} onChange={e => setHours(e.target.value)} placeholder="e.g. 3" min="0" />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Minutes</label>
            <input type="number" className="input" value={minutes} onChange={e => setMinutes(e.target.value)} placeholder="e.g. 30" min="0" max="59" />
          </div>
          <button onClick={save} className="btn btn-primary" style={{ height: 36 }}>Save</button>
          {log && <button onClick={remove} className="btn btn-danger" style={{ height: 36 }}>Delete</button>}
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

  useEffect(() => { GoalAPI.list().then(setGoals).catch(() => setGoals([])); }, []);

  async function add() {
    if (!title.trim()) return;
    await GoalAPI.add({ title, description: desc, category: '' });
    setTitle(''); setDesc('');
    const g = await GoalAPI.list();
    setGoals(g);
  }

  async function toggleStatus(g) {
    await GoalAPI.update(g.id, { status: g.status === 'active' ? 'achieved' : 'active' });
    const list = await GoalAPI.list();
    setGoals(list);
  }

  async function remove(g) {
    await GoalAPI.remove(g.id);
    const list = await GoalAPI.list();
    setGoals(list);
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
  const { subtab } = useParams();
  const navigate = useNavigate();
  const current = subTabs.includes(subtab) ? subtab : 'sleep';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
        {subTabs.map(st => (
          <button
            key={st}
            onClick={() => navigate(`/track/${st}`)}
            style={{
              padding: '6px 14px', fontSize: 13, fontWeight: 500, borderRadius: 8, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: current === st ? '#fff' : 'transparent',
              color: current === st ? '#0a0a0a' : '#888',
            }}
          >
            {subTabLabels[st]}
          </button>
        ))}
      </div>

      {current === 'sleep' && <SleepSection />}
      {current === 'tasks' && <TasksSection />}
      {current === 'pmo' && <PMOSection />}
      {current === 'exercise' && <ExerciseSection />}
      {current === 'screen' && <ScreenSection />}
      {current === 'goals' && <GoalsSection />}
    </div>
  );
}