import { useState } from 'react';
import { usePMOStats, useLogRelapse, useRelapses } from '../hooks/usePMO.js';
import { format, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const motivational = {
  7: '7 days — Your discipline is building.',
  14: '14 days — You are in control.',
  21: '21 days — Three weeks strong. Keep going.',
  30: '30 days — You are stronger than your impulses.',
  60: '60 days — Two months. Remarkable.',
  90: '90 days — A new standard of living.',
};

function getMotivation(streak) {
  const thresholds = [90, 60, 30, 21, 14, 7];
  for (const t of thresholds) {
    if (streak >= t) return motivational[t];
  }
  return 'Stay strong. Every day counts.';
}

export default function PMO() {
  const { data: stats } = usePMOStats();
  const logRelapse = useLogRelapse();
  const { data: relapses } = useRelapses();
  const [confirm, setConfirm] = useState(false);
  const [period, setPeriod] = useState('month');

  function handleRelapse() {
    logRelapse.mutate(null, {
      onSuccess: () => setConfirm(false),
    });
  }

  const now = new Date();
  const filteredRelapses = (relapses || []).filter(r => {
    const d = new Date(r.relapsed_at);
    if (period === 'week') return d > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === 'year') return d.getFullYear() === now.getFullYear();
    return true;
  });

  const yearChartData = Array.from({ length: 12 }, (_, i) => {
    const monthRelapses = (relapses || []).filter(r => {
      const d = new Date(r.relapsed_at);
      return d.getMonth() === i && d.getFullYear() === now.getFullYear();
    });
    return { month: format(new Date(now.getFullYear(), i, 1), 'MMM'), relapses: monthRelapses.length };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">PMO Tracker</h1>
        <p className="text-[#a0aec0] text-sm mt-0.5">Abstinence is strength. Track your streak.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-3xl font-bold">{stats?.currentStreak || 0}</div>
          <div className="text-xs text-[#a0aec0]">Current streak (days)</div>
        </div>
        <div className="card">
          <div className="text-3xl font-bold">{stats?.longestStreak || 0}</div>
          <div className="text-xs text-[#a0aec0]">Longest streak</div>
        </div>
        <div className="card">
          <div className="text-3xl font-bold text-[#e53e3e]">{stats?.totalThisMonth || 0}</div>
          <div className="text-xs text-[#a0aec0]">This month</div>
        </div>
        <div className="card">
          <div className="text-3xl font-bold">{stats?.totalAllTime || 0}</div>
          <div className="text-xs text-[#a0aec0]">All time relapses</div>
        </div>
      </div>

      <div className="card">
        <p className="text-sm italic text-[#a0aec0] mb-4">{getMotivation(stats?.currentStreak || 0)}</p>
        {!confirm ? (
          <button onClick={() => setConfirm(true)} className="btn-danger">
            Log Relapse
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-[#a0aec0]">Are you sure? This will reset your streak.</p>
            <div className="flex gap-2">
              <button onClick={handleRelapse} className="btn-danger" disabled={logRelapse.isPending}>
                {logRelapse.isPending ? 'Logging...' : 'Confirm Relapse'}
              </button>
              <button onClick={() => setConfirm(false)} className="btn-ghost">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider">Relapse History</div>
          <div className="flex gap-1">
            {['week', 'month', 'year'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2 py-1 text-xs rounded ${period === p ? 'bg-white text-black' : 'text-[#a0aec0] hover:text-white'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {filteredRelapses.length === 0 ? (
          <p className="text-sm text-[#a0aec0]">No relapses this period. Keep going.</p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {filteredRelapses.map(r => (
              <div key={r.id} className="flex justify-between text-sm py-1 border-b border-[#2d2d2d] last:border-0">
                <span className="text-[#e53e3e]">[!]</span>
                <span>{format(parseISO(r.relapsed_at), 'MMM d, yyyy HH:mm')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider mb-4">Year Overview</div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearChartData}>
              <XAxis dataKey="month" tick={{ fill: '#a0aec0', fontSize: 11 }} />
              <YAxis tick={{ fill: '#a0aec0', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #2d2d2d', borderRadius: 4 }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="relapses" fill="#e53e3e" name="Relapses" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
