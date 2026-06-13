import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { useSleepLog, useUpsertSleepLog, useSleepStats } from '../hooks/useSleep.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Sleep() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [targetWake, setTargetWake] = useState('05:00');
  const [targetSleep, setTargetSleep] = useState('22:00');
  const [actualWake, setActualWake] = useState('');
  const [actualSleep, setActualSleep] = useState('');
  const [period, setPeriod] = useState('week');

  const { data: sleepLog } = useSleepLog(date);
  const upsertSleep = useUpsertSleepLog();
  const { data: stats } = useSleepStats(period);

  useEffect(() => {
    if (sleepLog) {
      setTargetWake(sleepLog.target_wake || '05:00');
      setTargetSleep(sleepLog.target_sleep || '22:00');
      setActualWake(sleepLog.actual_wake || '');
      setActualSleep(sleepLog.actual_sleep || '');
    }
  }, [sleepLog]);

  function handleSave() {
    upsertSleep.mutate({
      date,
      target_wake: targetWake,
      target_sleep: targetSleep,
      actual_wake: actualWake || null,
      actual_sleep: actualSleep || null,
    });
  }

  const chartData = (stats || []).map(s => ({
    date: s.date?.slice(5),
    targetWake: s.target_wake ? parseFloat(s.target_wake.replace(':', '.')) : null,
    actualWake: s.actual_wake ? parseFloat(s.actual_wake.replace(':', '.')) : null,
    wakeOnTime: s.wakeOnTime,
    sleepOnTime: s.sleepOnTime,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Sleep Tracker</h1>
        <p className="text-[#a0aec0] text-sm mt-0.5">Log and monitor your sleep consistency.</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input w-auto"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">Target Wake</label>
            <input type="time" value={targetWake} onChange={(e) => setTargetWake(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Actual Wake</label>
            <input type="time" value={actualWake} onChange={(e) => setActualWake(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Target Sleep</label>
            <input type="time" value={targetSleep} onChange={(e) => setTargetSleep(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Actual Sleep</label>
            <input type="time" value={actualSleep} onChange={(e) => setActualSleep(e.target.value)} className="input" />
          </div>
        </div>

        <button onClick={handleSave} className="btn-primary" disabled={upsertSleep.isPending}>
          {upsertSleep.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider">Statistics</div>
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

        <div className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{ fill: '#a0aec0', fontSize: 11 }} />
                <YAxis tick={{ fill: '#a0aec0', fontSize: 11 }} domain={[0, 24]} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2d2d2d', borderRadius: 4 }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="targetWake" fill="#2d2d2d" name="Target Wake" />
                <Bar dataKey="actualWake" fill="#38a169" name="Actual Wake" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[#a0aec0] text-sm">No data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
