import { useState } from 'react';
import { useOverallStats } from '../hooks/useStats.js';
import { useSleepStats } from '../hooks/useSleep.js';
import { useTaskStats } from '../hooks/useTasks.js';
import { usePMOStats } from '../hooks/usePMO.js';
import { useExerciseStats } from '../hooks/useExercise.js';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';

export default function Stats() {
  const [period, setPeriod] = useState('day');

  const { data: overall } = useOverallStats(period);
  const { data: sleepStats } = useSleepStats(period);
  const { data: taskStats } = useTaskStats(period);
  const { data: pmoStats } = usePMOStats();
  const { data: exerciseStats } = useExerciseStats(period);

  const sleepChartData = (sleepStats || []).map(s => ({
    date: s.date?.slice(5),
    diff: s.wakeOnTime !== null ? (s.wakeOnTime ? 1 : 0) : null,
  }));

  const taskChartData = (taskStats?.days || []).slice(-30).map(d => ({
    date: d.date?.slice(5),
    done: d.done,
    total: d.total,
  }));

  const exerciseChartData = (() => {
    if (!exerciseStats?.logs) return [];
    const byWeek = {};
    exerciseStats.logs.forEach(l => {
      const week = l.date?.slice(0, 7);
      if (!byWeek[week]) byWeek[week] = { week, done: 0, total: 0 };
      byWeek[week].total += 1;
      if (l.status === 'done') byWeek[week].done += 1;
    });
    return Object.values(byWeek);
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Statistics</h1>
          <p className="text-[#a0aec0] text-sm mt-0.5">Your discipline breakdown.</p>
        </div>
        <div className="flex gap-1">
          {['day', 'week', 'month', 'year'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                period === p ? 'bg-white text-black' : 'text-[#a0aec0] hover:text-white'
              }`}
            >
              {p === 'day' ? 'Day' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider mb-2">Overall Discipline Score</div>
        <div className="text-5xl font-bold">{overall?.disciplineScore ?? 0}%</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider mb-3">Sleep Consistency</div>
          <div className="h-48">
            {sleepChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sleepChartData}>
                  <XAxis dataKey="date" tick={{ fill: '#a0aec0', fontSize: 10 }} />
                  <YAxis domain={[0, 1]} tick={{ fill: '#a0aec0', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #2d2d2d', borderRadius: 4 }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="diff" stroke="#38a169" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#a0aec0] text-sm">No sleep data</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider mb-3">Task Completion</div>
          <div className="h-48">
            {taskChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskChartData}>
                  <XAxis dataKey="date" tick={{ fill: '#a0aec0', fontSize: 10 }} />
                  <YAxis domain={[0, 3]} tick={{ fill: '#a0aec0', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #2d2d2d', borderRadius: 4 }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="done" fill="#38a169" name="Done" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#a0aec0] text-sm">No task data</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider mb-3">PMO Relapses</div>
          <div className="text-center py-8">
            <div className="text-3xl font-bold">{pmoStats?.totalThisMonth || 0}</div>
            <div className="text-xs text-[#a0aec0]">This month</div>
            <div className="text-sm mt-2 text-[#a0aec0]">
              Streak: {pmoStats?.currentStreak || 0} days
            </div>
          </div>
        </div>

        <div className="card">
          <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider mb-3">Exercise Adherence</div>
          <div className="h-48">
            {exerciseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={exerciseChartData}>
                  <XAxis dataKey="week" tick={{ fill: '#a0aec0', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#a0aec0', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #2d2d2d', borderRadius: 4 }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="done" fill="#38a169" name="Done" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#a0aec0] text-sm">No exercise data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
