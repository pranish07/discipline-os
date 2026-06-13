import { useState, useEffect, useMemo } from 'react';
import { SleepAPI, TaskAPI, PMOAPI, ExerciseAPI, ScreenAPI } from '../utils/api.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const periods = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

export default function Stats() {
  const [period, setPeriod] = useState('month');
  const [sleepData, setSleepData] = useState([]);
  const [taskData, setTaskData] = useState([]);
  const [exData, setExData] = useState([]);
  const [screenData, setScreenData] = useState([]);
  const [score, setScore] = useState(0);
  const [pmoStats, setPmoStats] = useState(null);

  useEffect(() => {
    Promise.all([
      SleepAPI.stats(period === 'week' ? 'week' : period === 'month' ? 'month' : 'week').then(d => {
        const r = periodRange(period);
        setSleepData(d.filter(s => s.date >= r.start && s.date <= r.end).map(s => ({
          date: s.date?.slice(5),
          onTime: s.wakeOnTime === true && s.sleepOnTime === true ? 1 : s.wakeOnTime === false || s.sleepOnTime === false ? 0 : null,
        })));
      }).catch(() => setSleepData([])),
      TaskAPI.stats(period === 'week' ? 'week' : period === 'month' ? 'month' : 'month').then(d => {
        const r = periodRange(period);
        setTaskData((d.days || []).filter(day => day.date >= r.start && day.date <= r.end).map(day => ({ date: day.date?.slice(5), done: day.done, total: day.total })));
      }).catch(() => setTaskData([])),
      ExerciseAPI.stats(period === 'week' ? 'week' : period === 'month' ? 'month' : 'year').then(d => {
        const r = periodRange(period);
        const weeks = {};
        (d.logs || []).filter(l => l.date >= r.start && l.date <= r.end).forEach(l => {
          const week = l.date?.slice(0, 7);
          if (!weeks[week]) weeks[week] = { week, done: 0, total: 0 };
          weeks[week].total += 1;
          if (l.status === 'done') weeks[week].done += 1;
        });
        setExData(Object.values(weeks));
      }).catch(() => setExData([])),
      PMOAPI.stats().then(setPmoStats).catch(() => setPmoStats(null)),
      ScreenAPI.list().then(all => {
        const r = periodRange(period);
        setScreenData(all.filter(s => s.date >= r.start && s.date <= r.end).map(s => ({
          date: s.date?.slice(5),
          hours: s.total_minutes ? Math.round(s.total_minutes / 60 * 10) / 10 : 0,
        })));
      }).catch(() => setScreenData([])),
    ]);
  }, [period]);

  const p = pmoStats || { currentStreak: 0, totalThisMonth: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label className="label" style={{ margin: 0 }}>Period</label>
        <select value={period} onChange={e => setPeriod(e.target.value)} className="input" style={{ width: 'auto' }}>
          {periods.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Discipline Score</div>
          <div style={{ fontSize: 48, fontWeight: 500, lineHeight: 1 }}>{score}%</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>PMO Streak</div>
          <div style={{ fontSize: 48, fontWeight: 500, lineHeight: 1 }}>{p.currentStreak}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>days</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Sleep Consistency</div>
          <div style={{ height: 180 }}>
            {sleepData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sleepData}>
                  <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} />
                  <YAxis domain={[0, 1]} tick={{ fill: '#888', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#161616', border: '1px solid #222', borderRadius: 8, fontSize: 13 }} labelStyle={{ color: '#e5e5e5' }} />
                  <Line type="monotone" dataKey="onTime" stroke="#4ade80" dot={{ r: 3 }} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 13 }}>No data</div>
            )}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Task Completion</div>
          <div style={{ height: 180 }}>
            {taskData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskData}>
                  <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} />
                  <YAxis domain={[0, 3]} tick={{ fill: '#888', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#161616', border: '1px solid #222', borderRadius: 8, fontSize: 13 }} labelStyle={{ color: '#e5e5e5' }} />
                  <Bar dataKey="done" fill="#4ade80" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 13 }}>No data</div>
            )}
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>PMO Relapses</div>
          <div style={{ fontSize: 48, fontWeight: 500, lineHeight: 1, color: p.totalThisMonth > 0 ? '#f87171' : '#4ade80' }}>{p.totalThisMonth}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>this month</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Streak: {p.currentStreak} days</div>
        </div>

        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Exercise Adherence</div>
          <div style={{ height: 180 }}>
            {exData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={exData}>
                  <XAxis dataKey="week" tick={{ fill: '#888', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#888', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#161616', border: '1px solid #222', borderRadius: 8, fontSize: 13 }} labelStyle={{ color: '#e5e5e5' }} />
                  <Bar dataKey="done" fill="#4ade80" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 13 }}>No data</div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Screen Time</div>
        <div style={{ height: 220 }}>
          {screenData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={screenData}>
                <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#161616', border: '1px solid #222', borderRadius: 8, fontSize: 13 }} labelStyle={{ color: '#e5e5e5' }} formatter={v => [`${v}h`, 'Screen Time']} />
                <Bar dataKey="hours" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 13 }}>No data</div>
          )}
        </div>
      </div>
    </div>
  );
}

function periodRange(key) {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  let start;
  if (key === 'today') { start = end; }
  else if (key === 'yesterday') {
    const d = new Date(now); d.setDate(d.getDate() - 1);
    start = d.toISOString().split('T')[0];
  } else if (key === 'week') {
    const d = new Date(now); d.setDate(now.getDate() - now.getDay());
    start = d.toISOString().split('T')[0];
  } else if (key === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  } else {
    start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
  }
  return { start, end };
}