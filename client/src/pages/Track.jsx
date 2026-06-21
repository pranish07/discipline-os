import { useState, useEffect, useCallback } from 'react';
import { SleepAPI, TaskAPI, PMOAPI, ExerciseAPI, ScreenAPI, GoalAPI } from '../utils/api.js';

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
    <select value={value || ''} onChange={e => onChange(e.target.value)} className="input" style={{ width: '100%' }} {...props}>
      <option value="" disabled>Select time…</option>
      {TIME_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
    </select>
  );
}

function fmtHM(m) {
  if (m == null) return '--';
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function SleepSection({ date }) {
  const [draft, setDraft] = useState({ tw: '06:30', aw: '', ts: '22:30', as: '' });
  const [log, setLog] = useState(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    const d = await SleepAPI.get(date).catch(() => null);
    setLog(d);
    if (d) { setDraft({ tw: d.target_wake || '06:30', aw: d.actual_wake || '', ts: d.target_sleep || '22:30', as: d.actual_sleep || '' }); setEditing(false); }
    else { setDraft({ tw: '06:30', aw: '', ts: '22:30', as: '' }); setEditing(false); }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    await SleepAPI.upsert({ date, target_wake: draft.tw, actual_wake: draft.aw || null, target_sleep: draft.ts, actual_sleep: draft.as || null });
    await load();
  }

  async function remove() {
    if (!log?.id) return;
    await SleepAPI.remove(log.id);
    await load();
  }

  async function handleEdit() {
    const d = await SleepAPI.get(date).catch(() => null);
    if (d) {
      setDraft({ tw: d.target_wake || '06:30', aw: d.actual_wake || '', ts: d.target_sleep || '22:30', as: d.actual_sleep || '' });
    }
    setEditing(true);
  }

  function field(label, value) {
    return (
      <div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 15, color: value ? '#e5e5e5' : '#555' }}>{value || '--'}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 500, color: '#e5e5e5' }}>Sleep</div>
      <div className="card">
        {!log && !editing ? (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <button onClick={() => setEditing(true)} className="btn btn-primary">Add Sleep</button>
          </div>
        ) : editing ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label className="label">Target Wake</label><TimeSelect value={draft.tw} onChange={v => setDraft(p => ({ ...p, tw: v }))} /></div>
              <div><label className="label">Actual Wake</label><TimeSelect value={draft.aw} onChange={v => setDraft(p => ({ ...p, aw: v }))} /></div>
              <div><label className="label">Target Sleep</label><TimeSelect value={draft.ts} onChange={v => setDraft(p => ({ ...p, ts: v }))} /></div>
              <div><label className="label">Actual Sleep</label><TimeSelect value={draft.as} onChange={v => setDraft(p => ({ ...p, as: v }))} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={save} className="btn btn-primary">Save</button>
              {log && <button onClick={remove} className="btn btn-danger" style={{ padding: '8px 14px' }}>Delete</button>}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {field('Target Wake', draft.tw)}
              {field('Actual Wake', draft.aw)}
              {field('Target Sleep', draft.ts)}
              {field('Actual Sleep', draft.as)}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleEdit} className="btn btn-primary">Edit</button>
              <button onClick={remove} className="btn btn-danger" style={{ padding: '8px 14px' }}>Delete</button>
            </div>
          </>
        )}
      </div>

    </div>
  );
}

function TasksSection({ date }) {
  const [tasks, setTasks] = useState([]);
  const [titles, setTitles] = useState(['', '', '']);
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);

  const load = useCallback(async () => {
    const t = await TaskAPI.byDate(date).catch(() => []);
    setTasks(t);
    const regular = t.filter(x => x.task_number > 0);
    if (regular.length) setTitles(regular.map(x => x.title));
    else setTitles(['', '', '']);
    const task1 = t.find(x => x.task_number === 1);
    setNotes(task1?.notes || '');
    setEditingNotes(false);
  }, [date]);

  useEffect(() => { load(); }, [load]);

  async function saveNotes() {
    if (!notes.trim()) return deleteNotes();
    const task1 = tasks.find(x => x.task_number === 1);
    if (task1) {
      await TaskAPI.update(task1.id, { notes });
    } else {
      await TaskAPI.upsert({ date, task_number: 1, title: '.notes', priority: 'Medium', status: 'pending', notes });
    }
    await load();
  }

  async function deleteNotes() {
    const task1 = tasks.find(x => x.task_number === 1);
    if (task1) {
      await TaskAPI.update(task1.id, { notes: null });
    }
    await load();
  }

  async function saveTask(num) {
    if (!titles[num - 1].trim()) return;
    const existing = tasks.find(x => x.task_number === num);
    await TaskAPI.upsert({
      date, task_number: num,
      title: titles[num - 1],
      priority: num === 1 ? 'High' : num === 2 ? 'Medium' : 'Low',
      status: 'pending',
      notes: num === 1 ? (notes || null) : (existing?.notes || null),
    });
    await load();
  }

  async function toggle(task) {
    await TaskAPI.update(task.id, { status: task.status === 'done' ? 'pending' : 'done' });
    await load();
  }

  async function removeTask(id) {
    await TaskAPI.remove(id);
    await load();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 500, color: '#e5e5e5' }}>Tasks</div>
      <div className="card">
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
        <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Notes</div>
        {!notes && !editingNotes ? (
          <div style={{ textAlign: 'center', padding: '8px' }}>
            <button onClick={() => setEditingNotes(true)} className="btn btn-primary">Add Notes</button>
          </div>
        ) : editingNotes ? (
          <>
            <textarea className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Write your notes here…" style={{ width: '100%', minHeight: 80, resize: 'vertical', marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveNotes} className="btn btn-primary">Save</button>
              <button onClick={() => { setEditingNotes(false); load(); }} className="btn btn-ghost">Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#ccc', marginBottom: 8, minHeight: 40 }}>{notes}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditingNotes(true)} className="btn btn-primary">Edit</button>
              <button onClick={deleteNotes} className="btn btn-danger">Delete</button>
            </div>
          </>
        )}
      </div>

    </div>
  );
}

function PMOSection() {
  const [stats, setStats] = useState(null);
  const [relapses, setRelapses] = useState([]);
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    PMOAPI.stats().then(setStats).catch(() => {});
    PMOAPI.list().then(setRelapses).catch(() => setRelapses([]));
  }, []);

  useEffect(() => {
    if (!stats?.lastRelapse) return;
    function tick() {
      const ms = Date.now() - new Date(stats.lastRelapse).getTime();
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setElapsed(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [stats?.lastRelapse]);

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

  const s = stats || { totalAllTime: 0, lastRelapse: null, currentStreak: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 500, color: '#e5e5e5' }}>PMO</div>
      <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Total relapses</div>
        <div style={{ fontSize: 36, fontWeight: 500, lineHeight: 1, marginBottom: 8 }}>{s.totalAllTime}</div>
        {s.lastRelapse && (
          <>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 2 }}>Since last relapse</div>
            <div style={{ fontSize: 28, fontWeight: 500, fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>{elapsed}</div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
              Streak: {s.currentStreak} day{s.currentStreak !== 1 ? 's' : ''}
            </div>
          </>
        )}
        <button onClick={logRelapse} className="btn btn-danger">Log relapse</button>
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
  const [logs, setLogs] = useState({});
  const [noteInputs, setNoteInputs] = useState({});
  const [newExName, setNewExName] = useState({});

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const load = useCallback(async () => {
    let s = await ExerciseAPI.schedule().catch(() => []);
    if (s.length === 0) {
      const defaults = [
        { day_of_week: 1, exercise_name: 'Push', scheduled_time: '07:00', is_rest_day: false },
        { day_of_week: 2, exercise_name: 'Pull', scheduled_time: '07:00', is_rest_day: false },
        { day_of_week: 3, exercise_name: 'Cardio', scheduled_time: '06:30', is_rest_day: false },
        { day_of_week: 4, exercise_name: 'Legs', scheduled_time: '07:00', is_rest_day: false },
        { day_of_week: 5, exercise_name: 'Core', scheduled_time: '07:00', is_rest_day: false },
        { day_of_week: 6, exercise_name: '', scheduled_time: null, is_rest_day: true },
        { day_of_week: 0, exercise_name: '', scheduled_time: null, is_rest_day: true },
      ];
      s = await ExerciseAPI.saveSchedule(defaults);
    }
    setSchedule(s);

    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
    const startKey = weekStart.toISOString().split('T')[0];
    const endKey = weekEnd.toISOString().split('T')[0];

    const allLogs = await ExerciseAPI.logs(startKey, endKey).catch(() => []);
    const logMap = {};
    const noteMap = {};
    for (const l of allLogs) {
      const key = `${l.schedule_id}_${l.date}`;
      logMap[key] = l;
      if (l.notes) noteMap[key] = l.notes;
    }
    setLogs(logMap);
    setNoteInputs(noteMap);
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const todayKey = now.toISOString().split('T')[0];
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());

  async function toggleExercise(date, scheduleId) {
    const key = `${scheduleId}_${date}`;
    if (logs[key]) {
      await ExerciseAPI.removeLog(logs[key].id);
      const next = { ...logs };
      delete next[key];
      setLogs(next);
    } else {
      const log = await ExerciseAPI.log({ date, schedule_id: scheduleId, status: 'done', notes: noteInputs[key] || null });
      setLogs(prev => ({ ...prev, [key]: log }));
    }
  }

  async function saveExerciseNotes(date, scheduleId) {
    const key = `${scheduleId}_${date}`;
    const log = logs[key];
    if (!log) return;
    const updated = await ExerciseAPI.updateLog(log.id, { notes: noteInputs[key] || null });
    setLogs(prev => ({ ...prev, [key]: updated }));
  }

  async function addExercise(dow) {
    const name = newExName[dow];
    if (!name?.trim()) return;
    const item = await ExerciseAPI.addScheduleItem({ day_of_week: dow, exercise_name: name.trim() });
    setSchedule(prev => [...prev, item]);
    setNewExName(prev => ({ ...prev, [dow]: '' }));
  }

  async function removeExercise(id) {
    await ExerciseAPI.deleteScheduleItem(id);
    setSchedule(prev => prev.filter(x => x.id !== id));
  }

  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
    const key = d.toISOString().split('T')[0];
    const exercises = schedule.filter(x => x.day_of_week === i);
    week.push({ date: key, day: days[i], dayOfWeek: i, exercises });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 500, color: '#e5e5e5' }}>Exercise</div>
      {week.map(w => {
        const isToday = w.date === todayKey;
        return (
          <div key={w.date} className="card" style={{ padding: 12, border: isToday ? '1px solid #555' : undefined }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e5e5', marginBottom: 8 }}>{w.day}</div>
            {w.exercises.length === 0 && <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>No exercises</div>}
            {w.exercises.map(ex => {
              const key = `${ex.id}_${w.date}`;
              return (
                <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <input type="checkbox" checked={!!logs[key]} onChange={() => toggleExercise(w.date, ex.id)} style={{ accentColor: '#4ade80' }} />
                  <span style={{ flex: 1, fontSize: 13, color: logs[key] ? '#555' : '#ccc', textDecoration: logs[key] ? 'line-through' : 'none' }}>{ex.exercise_name}</span>
                  <input className="input" placeholder="Notes" value={noteInputs[key] || ''} onChange={e => setNoteInputs(prev => ({ ...prev, [key]: e.target.value }))} style={{ width: 120, fontSize: 12 }} />
                  {logs[key] && <button onClick={() => saveExerciseNotes(w.date, ex.id)} className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: 11 }}>Save</button>}
                  <button onClick={() => removeExercise(ex.id)} className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: 11, color: '#f87171' }}>✕</button>
                </div>
              );
            })}
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <input className="input" placeholder="Add exercise…" value={newExName[w.dayOfWeek] || ''} onChange={e => setNewExName(prev => ({ ...prev, [w.dayOfWeek]: e.target.value }))} style={{ flex: 1, fontSize: 12 }} />
              <button onClick={() => addExercise(w.dayOfWeek)} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }}>Add</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScreenSection({ date }) {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [log, setLog] = useState(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    const d = await ScreenAPI.get(date).catch(() => null);
    setLog(d);
    if (d) { setHours(String(Math.floor(d.total_minutes / 60))); setMinutes(String(d.total_minutes % 60)); setEditing(false); }
    else { setHours(''); setMinutes(''); setEditing(false); }
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

  async function handleEdit() {
    const d = await ScreenAPI.get(date).catch(() => null);
    if (d) { setHours(String(Math.floor(d.total_minutes / 60))); setMinutes(String(d.total_minutes % 60)); }
    setEditing(true);
  }

  function fmtScreen(m) {
    if (m == null) return '--';
    const h = Math.floor(m / 60);
    const min = m % 60;
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 500, color: '#e5e5e5' }}>Screen Time</div>
      <div className="card">
        {!log && !editing ? (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <button onClick={() => setEditing(true)} className="btn btn-primary">Add Screen Time</button>
          </div>
        ) : editing ? (
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
            <button onClick={() => { setEditing(false); load(); }} className="btn btn-ghost" style={{ height: 36 }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 15, color: '#e5e5e5' }}>{fmtScreen(log.total_minutes)}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleEdit} className="btn btn-primary" style={{ height: 36 }}>Edit</button>
              <button onClick={remove} className="btn btn-danger" style={{ height: 36 }}>Delete</button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

function GoalsSection() {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { GoalAPI.list().then(setGoals).catch(() => setGoals([])); }, []);

  async function add() {
    if (!title.trim()) return;
    await GoalAPI.add({ title, description: desc, category: '' });
    setTitle(''); setDesc(''); setShowForm(false);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#e5e5e5' }}>Goals</div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 13 }}>
            <span className="hide-mobile">Add Goal</span>
            <span className="show-mobile">+</span>
          </button>
        )}
      </div>
      {showForm && (
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Add Goal</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input className="input" placeholder="Goal title" value={title} onChange={e => setTitle(e.target.value)} />
            <input className="input" placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} />
            <button onClick={add} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Add</button>
          </div>
        </div>
      )}

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
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#e5e5e5' }}>Track</div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" style={{ width: 'auto' }} />
      </div>
      <GoalsSection />
      <SleepSection date={date} />
      <TasksSection date={date} />
      <PMOSection />
      <ExerciseSection />
      <ScreenSection date={date} />
    </div>
  );
}