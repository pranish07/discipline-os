import { useState, useEffect } from 'react';
import { SleepStore, TaskStore, PMOStore, ExerciseStore, ScreenStore, GoalStore } from '../utils/storage.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

function computeScore() {
  const sleepStats = SleepStore.stats('month');
  const taskStats = TaskStore.stats('month');
  const pmoStats = PMOStore.stats();
  const exStats = ExerciseStore.stats('month');

  const sleepScore = sleepStats.length > 0 ? Math.round(sleepStats.filter(s => s.wakeOnTime && s.sleepOnTime).length / sleepStats.length * 100) : 0;
  const taskScore = taskStats.completionRate || 0;
  const exScore = exStats.totalScheduled > 0 ? Math.round(exStats.totalDone / exStats.totalScheduled * 100) : 0;
  const pmoScore = pmoStats.currentStreak >= 7 ? 100 : pmoStats.currentStreak >= 3 ? 60 : pmoStats.currentStreak >= 1 ? 30 : 0;

  return Math.round((sleepScore + taskScore + exScore + pmoScore) / 4);
}

export default function Stats() {
  const [score, setScore] = useState(0);
  const [pmoStats, setPmoStats] = useState(null);
  const [sleepData, setSleepData] = useState([]);
  const [taskData, setTaskData] = useState([]);
  const [exData, setExData] = useState([]);
  const [screenData, setScreenData] = useState([]);

  useEffect(() => {
    setScore(computeScore());
    setPmoStats(PMOStore.stats());

    const sleepStats = SleepStore.stats('week');
    setSleepData(sleepStats.map(s => ({
      date: s.date?.slice(5),
      onTime: s.wakeOnTime === true && s.sleepOnTime === true ? 1 : s.wakeOnTime === false || s.sleepOnTime === false ? 0 : null,
    })));

    const taskStats = TaskStore.stats('month');
    setTaskData((taskStats.days || []).slice(-14).map(d => ({ date: d.date?.slice(5), done: d.done, total: d.total })));

    const exStats = ExerciseStore.stats('month');
    const byWeek = {};
    (exStats.logs || []).forEach(l => {
      const week = l.date?.slice(0, 7);
      if (!byWeek[week]) byWeek[week] = { week, done: 0, total: 0 };
      byWeek[week].total += 1;
      if (l.status === 'done') byWeek[week].done += 1;
    });
    setExData(Object.values(byWeek));

    const year = new Date().getFullYear();
    const yearScreen = ScreenStore.yearData(year);
    setScreenData(yearScreen.map(s => ({ date: s.date?.slice(5), hours: s.total_minutes ? Math.round(s.total_minutes / 60 * 10) / 10 : 0 })));
  }, []);

  const p = pmoStats || { currentStreak: 0, totalThisMonth: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
        <div style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Screen Time — {new Date().getFullYear()}</div>
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
