import { useEffect, useState } from 'react';
import { SleepStore, TaskStore, PMOStore, ExerciseStore, GoalStore, ScreenStore } from '../utils/storage.js';

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
    setSleep(SleepStore.get(today));
    setTasks(TaskStore.byDate(today));
    setPmoStats(PMOStore.stats());
    setExStats(ExerciseStore.stats('week'));
    setGoals(GoalStore.active());
    setScreen(ScreenStore.get(today));
  }, [today]);

  function toggleTask(task) {
    const updated = { ...task, status: task.status === 'done' ? 'pending' : 'done' };
    TaskStore.upsert(updated);
    setTasks(prev => prev.map(t => t.task_number === task.task_number ? updated : t));
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>{dayName}</h1>
        <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>{msg}</p>
      </div>

      {goals.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Life Goals</div>
          <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {goals.map(g => (
              <li key={g.id} style={{ fontSize: 13, color: '#ccc' }}>{g.title}</li>
            ))}
          </ol>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Sleep</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>Wake</span>
              <span style={{ color: isWakeOnTime() === null ? '#888' : isWakeOnTime() ? '#4ade80' : '#f87171' }}>
                {sleep?.target_wake || '--:--'} {isWakeOnTime() !== null && (isWakeOnTime() ? '✓' : '✗')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>Sleep</span>
              <span style={{ color: isSleepOnTime() === null ? '#888' : isSleepOnTime() ? '#4ade80' : '#f87171' }}>
                {sleep?.target_sleep || '--:--'} {isSleepOnTime() !== null && (isSleepOnTime() ? '✓' : '✗')}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Tasks</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tasks.length === 0 && <p style={{ fontSize: 13, color: '#888', margin: 0 }}>No tasks today.</p>}
            {tasks.map(t => (
              <label key={t.task_number} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={t.status === 'done'} onChange={() => toggleTask(t)} style={{ accentColor: '#4ade80' }} />
                <span style={{ color: t.status === 'done' ? '#555' : '#ccc', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>PMO</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>Streak</span>
              <span style={{ fontWeight: 500 }}>{pmoStats?.currentStreak || 0} days</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>Last relapse</span>
              <span>{pmoStats?.lastRelapse ? new Date(pmoStats.lastRelapse).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>This month</span>
              <span style={{ color: pmoStats?.totalThisMonth > 0 ? '#f87171' : '#888' }}>{pmoStats?.totalThisMonth || 0}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Exercise</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>This week</span>
              <span>{exStats?.totalDone || 0} / {exStats?.totalScheduled || 0} done</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>Streak</span>
              <span style={{ color: exStats?.currentStreak > 0 ? '#4ade80' : '#888' }}>{exStats?.currentStreak || 0} days</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Screen Time</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#888' }}>Today</span>
            <span>{screen ? fmtHM(screen.total_minutes) : '--'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
