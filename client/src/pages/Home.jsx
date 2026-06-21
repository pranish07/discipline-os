import { useEffect, useState } from 'react';
import { SleepAPI, TaskAPI, PMOAPI, ExerciseAPI, GoalAPI, ScreenAPI } from '../utils/api.js';

const messages = ['Discipline is freedom.', 'Stay locked in.', 'One day at a time.', 'Embrace the grind.', 'No excuses.'];

function fmtHM(m) {
  if (m == null) return '--';
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function Home() {
  const today = new Date().toISOString().split('T')[0];
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const [sleep, setSleep] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [pmoStats, setPmoStats] = useState(null);
  const [exStats, setExStats] = useState(null);
  const [goals, setGoals] = useState([]);
  const [screen, setScreen] = useState(null);

  useEffect(() => {
    Promise.all([
      SleepAPI.get(today).then(setSleep).catch(() => setSleep(null)),
      TaskAPI.byDate(today).then(setTasks).catch(() => setTasks([])),
      PMOAPI.stats().then(setPmoStats).catch(() => setPmoStats(null)),
      ExerciseAPI.stats('week').then(setExStats).catch(() => setExStats(null)),
      GoalAPI.list().then(g => setGoals(g.filter(x => x.status === 'active'))).catch(() => setGoals([])),
      ScreenAPI.get(today).then(setScreen).catch(() => setScreen(null)),
    ]);
  }, [today]);

  async function toggleTask(task) {
    await TaskAPI.update(task.id, { status: task.status === 'done' ? 'pending' : 'done' });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status === 'done' ? 'pending' : 'done' } : t));
    const s = await ExerciseAPI.stats('week');
    setExStats(s);
  }

  const msg = messages[new Date().getDay() % messages.length];

  const isWakeOnTime = () => {
    if (!sleep?.actual_wake || !sleep?.target_wake) return null;
    return Math.abs(new Date(`2000-01-01T${sleep.actual_wake}`) - new Date(`2000-01-01T${sleep.target_wake}`)) <= 15 * 60 * 1000;
  };

  const isSleepOnTime = () => {
    if (!sleep?.actual_sleep || !sleep?.target_sleep) return null;
    return Math.abs(new Date(`2000-01-01T${sleep.actual_sleep}`) - new Date(`2000-01-01T${sleep.target_sleep}`)) <= 15 * 60 * 1000;
  };

  const sleepSummary = () => {
    if (!sleep) return '—';
    const w = isWakeOnTime();
    const s = isSleepOnTime();
    return `Wake ${sleep.actual_wake || '—'} (${w === null ? '—' : w ? 'on time' : 'late'}) · Sleep ${sleep.actual_sleep || '—'} (${s === null ? '—' : s ? 'on time' : 'late'})`;
  };

  const doneCount = taskStats => taskStats?.totalDone ?? 0;
  const totalScheduled = taskStats => taskStats?.totalScheduled ?? 0;

  const es = exStats || { totalDone: 0, totalScheduled: 0, currentStreak: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 13, color: '#888', marginBottom: -4 }}>{dayName}</div>
      <div style={{ fontSize: 18, fontWeight: 500, fontStyle: 'italic', color: '#555' }}>"{msg}"</div>

      {goals.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Life Goals</div>
          {goals.map(g => (
            <div key={g.id} style={{ fontSize: 13, color: '#ccc', marginBottom: 4 }}>{g.title}</div>
          ))}
        </div>
      )}

      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Sleep</div>
        <div style={{ fontSize: 13, color: '#ccc' }}>{sleepSummary()}</div>
      </div>

      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Today's Tasks</div>
        {tasks.length === 0 ? (
          <div style={{ fontSize: 13, color: '#555' }}>No tasks set today</div>
        ) : (
          tasks.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <input type="checkbox" checked={t.status === 'done'} onChange={() => toggleTask(t)} style={{ accentColor: '#4ade80' }} />
              <span style={{ fontSize: 13, color: t.status === 'done' ? '#555' : '#ccc', textDecoration: t.status === 'done' ? 'line-through' : 'none', flex: 1 }}>{t.title}</span>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>PMO Streak</div>
          <div style={{ fontSize: 32, fontWeight: 500 }}>{pmoStats?.currentStreak ?? '—'}</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>days</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Exercise</div>
          <div style={{ fontSize: 24, fontWeight: 500 }}>{es.totalDone}/{es.totalScheduled}</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>this week</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Daily Streak</div>
          <div style={{ fontSize: 32, fontWeight: 500 }}>{es.currentStreak}</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>days</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Screen Time</div>
          <div style={{ fontSize: 24, fontWeight: 500 }}>{screen ? fmtHM(screen.total_minutes) : '—'}</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>today</div>
        </div>
      </div>
    </div>
  );
}