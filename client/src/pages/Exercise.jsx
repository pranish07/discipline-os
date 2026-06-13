import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useSchedule, useSaveSchedule, useExerciseLogs, useUpsertExerciseLog, useExerciseStats } from '../hooks/useExercise.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Exercise() {
  const { data: schedule } = useSchedule();
  const saveSchedule = useSaveSchedule();
  const { data: logs } = useExerciseLogs();
  const upsertLog = useUpsertExerciseLog();
  const { data: stats } = useExerciseStats('month');

  const [editing, setEditing] = useState(false);
  const [scheduleForm, setScheduleForm] = useState(
    Array.from({ length: 7 }, (_, i) => ({
      day_of_week: i,
      exercise_name: '',
      scheduled_time: '06:00',
      is_rest_day: i === 0,
    }))
  );

  useEffect(() => {
    if (schedule && schedule.length > 0 && !editing) {
      setScheduleForm(
        Array.from({ length: 7 }, (_, i) => {
          const existing = schedule.find(s => s.day_of_week === i);
          return existing || { day_of_week: i, exercise_name: '', scheduled_time: '06:00', is_rest_day: false };
        })
      );
    }
  }, [schedule, editing]);

  function handleSaveSchedule() {
    saveSchedule.mutate(scheduleForm, { onSuccess: () => setEditing(false) });
  }

  function handleLog(scheduleId, status) {
    upsertLog.mutate({
      date: format(new Date(), 'yyyy-MM-dd'),
      schedule_id: scheduleId,
      status,
    });
  }

  const today = new Date().getDay();
  const todaySchedule = (schedule || []).find(s => s.day_of_week === today);
  const todayLog = (logs || []).find(l => l.date === format(new Date(), 'yyyy-MM-dd'));

  const chartData = (() => {
    if (!stats?.logs) return [];
    const byWeek = {};
    stats.logs.forEach(l => {
      const week = l.date?.slice(0, 7);
      if (!byWeek[week]) byWeek[week] = { week, done: 0, skipped: 0, total: 0 };
      byWeek[week].total += 1;
      if (l.status === 'done') byWeek[week].done += 1;
      if (l.status === 'skipped') byWeek[week].skipped += 1;
    });
    return Object.values(byWeek);
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Exercise Tracker</h1>
        <p className="text-[#a0aec0] text-sm mt-0.5">Log your workouts and build consistency.</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider">
            Today — {dayNames[today]}
          </div>
        </div>
        {todaySchedule && !todaySchedule.is_rest_day ? (
          <div>
            <p className="text-sm">{todaySchedule.exercise_name || 'Rest day'}</p>
            <p className="text-xs text-[#a0aec0]">{todaySchedule.scheduled_time || ''}</p>
            {!todayLog ? (
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleLog(todaySchedule.id, 'done')} className="btn-primary text-xs">
                  Log Done
                </button>
                <button onClick={() => handleLog(todaySchedule.id, 'skipped')} className="btn-ghost text-xs">
                  Skip
                </button>
              </div>
            ) : (
              <p className={`text-xs mt-2 ${todayLog.status === 'done' ? 'text-[#38a169]' : 'text-[#e53e3e]'}`}>
                {todayLog.status === 'done' ? 'Workout logged [✓]' : 'Skipped [✗]'}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#a0aec0]">Rest day</p>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider">Weekly Schedule</div>
          <button onClick={() => setEditing(!editing)} className="text-xs text-[#a0aec0] hover:text-white">
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <div className="space-y-3">
            {scheduleForm.map((day, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-[#a0aec0] w-8">{dayNames[i]}</span>
                <input
                  type="checkbox"
                  checked={day.is_rest_day}
                  onChange={(e) => {
                    const next = [...scheduleForm];
                    next[i] = { ...next[i], is_rest_day: e.target.checked };
                    setScheduleForm(next);
                  }}
                  className="accent-white"
                />
                <span className="text-xs text-[#a0aec0]">Rest</span>
                {!day.is_rest_day && (
                  <>
                    <input
                      className="input flex-1"
                      placeholder="Exercise"
                      value={day.exercise_name}
                      onChange={(e) => {
                        const next = [...scheduleForm];
                        next[i] = { ...next[i], exercise_name: e.target.value };
                        setScheduleForm(next);
                      }}
                    />
                    <input
                      type="time"
                      className="input w-auto"
                      value={day.scheduled_time}
                      onChange={(e) => {
                        const next = [...scheduleForm];
                        next[i] = { ...next[i], scheduled_time: e.target.value };
                        setScheduleForm(next);
                      }}
                    />
                  </>
                )}
              </div>
            ))}
            <button onClick={handleSaveSchedule} className="btn-primary" disabled={saveSchedule.isPending}>
              Save Schedule
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {schedule?.map((day) => (
              <div key={day.id} className="flex items-center justify-between text-sm py-1">
                <span className="text-[#a0aec0] w-8">{dayNames[day.day_of_week]}</span>
                <span>{day.is_rest_day ? 'Rest' : day.exercise_name}</span>
                <span className="text-[#a0aec0] text-xs">{day.is_rest_day ? '' : day.scheduled_time}</span>
              </div>
            ))}
            {(!schedule || schedule.length === 0) && (
              <p className="text-sm text-[#a0aec0]">No schedule set. Click Edit to create one.</p>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider mb-4">Statistics</div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-2xl font-bold">{stats?.completionRate || 0}%</div>
            <div className="text-xs text-[#a0aec0]">Completion</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats?.totalDone || 0}/{stats?.totalScheduled || 0}</div>
            <div className="text-xs text-[#a0aec0]">Done/Scheduled</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats?.currentStreak || 0}</div>
            <div className="text-xs text-[#a0aec0]">Day streak</div>
          </div>
        </div>

        <div className="h-48">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="week" tick={{ fill: '#a0aec0', fontSize: 10 }} />
                <YAxis tick={{ fill: '#a0aec0', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2d2d2d', borderRadius: 4 }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="done" fill="#38a169" name="Done" stackId="a" />
                <Bar dataKey="skipped" fill="#e53e3e" name="Skipped" stackId="a" />
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
