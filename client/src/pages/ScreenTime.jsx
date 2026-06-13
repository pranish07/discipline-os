import { useState } from 'react';
import { format } from 'date-fns';
import { useScreenTimeLog, useUpsertScreenTime, useScreenTimeStats } from '../hooks/useScreenTime.js';
import { useYearStore } from '../store/yearStore.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function minutesToHours(m) {
  if (!m && m !== 0) return '--';
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}h ${min}m`;
}

export default function ScreenTime() {
  const year = useYearStore((s) => s.year);
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [totalMinutes, setTotalMinutes] = useState('');
  const [social, setSocial] = useState('');
  const [entertainment, setEntertainment] = useState('');
  const [productive, setProductive] = useState('');
  const [notes, setNotes] = useState('');
  const [period, setPeriod] = useState('week');

  const { data: log } = useScreenTimeLog(date);
  const upsert = useUpsertScreenTime();
  const { data: stats } = useScreenTimeStats(period, period === 'year' ? year : undefined);

  function handleSelectDate(e) {
    const d = e.target.value;
    setDate(d);
    if (log) {
      setTotalMinutes(log.total_minutes?.toString() || '');
      setSocial(log.social_minutes?.toString() || '');
      setEntertainment(log.entertainment_minutes?.toString() || '');
      setProductive(log.productive_minutes?.toString() || '');
      setNotes(log.notes || '');
    }
  }

  function handleSave() {
    upsert.mutate({
      date,
      total_minutes: parseInt(totalMinutes) || 0,
      social_minutes: social ? parseInt(social) : null,
      entertainment_minutes: entertainment ? parseInt(entertainment) : null,
      productive_minutes: productive ? parseInt(productive) : null,
      notes: notes || null,
    });
  }

  const chartData = (stats || []).map((s) => ({
    date: s.date?.slice(5),
    total: s.total_minutes ? Math.round(s.total_minutes / 60 * 10) / 10 : 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Screen Time</h1>
        <p className="text-[#a0aec0] text-sm mt-0.5">Track your daily screen usage.</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <input
            type="date"
            value={date}
            onChange={handleSelectDate}
            className="input w-auto"
          />
        </div>

        {log && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="label">Total (min)</label>
              <input type="number" className="input" value={totalMinutes} onChange={(e) => setTotalMinutes(e.target.value)} placeholder="e.g. 240" />
            </div>
            <div>
              <label className="label">Social (min)</label>
              <input type="number" className="input" value={social} onChange={(e) => setSocial(e.target.value)} placeholder="e.g. 60" />
            </div>
            <div>
              <label className="label">Entertainment (min)</label>
              <input type="number" className="input" value={entertainment} onChange={(e) => setEntertainment(e.target.value)} placeholder="e.g. 90" />
            </div>
            <div>
              <label className="label">Productive (min)</label>
              <input type="number" className="input" value={productive} onChange={(e) => setProductive(e.target.value)} placeholder="e.g. 120" />
            </div>
          </div>
        )}

        {!log && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="label">Total (min)</label>
              <input type="number" className="input" value={totalMinutes} onChange={(e) => setTotalMinutes(e.target.value)} placeholder="e.g. 240" />
            </div>
            <div>
              <label className="label">Social (min)</label>
              <input type="number" className="input" value={social} onChange={(e) => setSocial(e.target.value)} placeholder="e.g. 60" />
            </div>
            <div>
              <label className="label">Entertainment (min)</label>
              <input type="number" className="input" value={entertainment} onChange={(e) => setEntertainment(e.target.value)} placeholder="e.g. 90" />
            </div>
            <div>
              <label className="label">Productive (min)</label>
              <input type="number" className="input" value={productive} onChange={(e) => setProductive(e.target.value)} placeholder="e.g. 120" />
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="label">Notes</label>
          <input type="text" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
        </div>

        <button onClick={handleSave} className="btn-primary" disabled={upsert.isPending}>
          {upsert.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>

      {log && (
        <div className="card">
          <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider mb-3">Today's Breakdown</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-[#a0aec0] text-xs">Total</div>
              <div className="text-lg font-semibold">{minutesToHours(log.total_minutes)}</div>
            </div>
            <div>
              <div className="text-[#a0aec0] text-xs">Social</div>
              <div className="text-lg font-semibold">{minutesToHours(log.social_minutes)}</div>
            </div>
            <div>
              <div className="text-[#a0aec0] text-xs">Entertainment</div>
              <div className="text-lg font-semibold">{minutesToHours(log.entertainment_minutes)}</div>
            </div>
            <div>
              <div className="text-[#a0aec0] text-xs">Productive</div>
              <div className="text-lg font-semibold">{minutesToHours(log.productive_minutes)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider">History</div>
          <div className="flex gap-1">
            {['week', 'month', 'year'].map((p) => (
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
                <YAxis tick={{ fill: '#a0aec0', fontSize: 11 }} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#a0aec0', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2d2d2d', borderRadius: 4 }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value) => [`${value}h`, 'Screen Time']}
                />
                <Bar dataKey="total" fill="#805ad5" name="Screen Time" />
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
