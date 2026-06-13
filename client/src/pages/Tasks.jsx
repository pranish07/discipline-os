import { useState } from 'react';
import { format } from 'date-fns';
import { useTasks, useUpsertTask, useUpdateTask, useTaskStats } from '../hooks/useTasks.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Tasks() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [titles, setTitles] = useState(['', '', '']);

  const { data: tasks } = useTasks(date);
  const upsertTask = useUpsertTask();
  const updateTask = useUpdateTask();
  const { data: stats } = useTaskStats('month');

  const isPast = date < today;
  const todayTasks = (tasks || []).sort((a, b) => a.task_number - b.task_number);
  const allSet = todayTasks.length === 3;

  function handleSaveAll() {
    for (let i = 0; i < 3; i++) {
      if (titles[i].trim()) {
        upsertTask.mutate({
          date,
          task_number: i + 1,
          title: titles[i],
          priority: 'Medium',
          status: 'pending',
        });
      }
    }
  }

  function handleToggle(task) {
    updateTask.mutate({
      id: task.id,
      status: task.status === 'done' ? 'pending' : 'done',
    });
  }

  const chartData = (stats?.days || []).slice(-30).map(d => ({
    date: d.date?.slice(5),
    done: d.done,
    total: d.total,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Daily Tasks</h1>
        <p className="text-[#a0aec0] text-sm mt-0.5">Exactly 3 tasks per day. No more, no less.</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input w-auto"
          />
          {isPast && <span className="text-xs text-[#a0aec0]">Read-only (archived)</span>}
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((num) => {
            const task = todayTasks.find(t => t.task_number === num);
            return (
              <div key={num} className="flex items-center gap-3">
                <span className="text-xs text-[#a0aec0] font-mono w-4">{num}.</span>
                {task ? (
                  <>
                    <button
                      onClick={() => !isPast && handleToggle(task)}
                      className={`text-sm ${isPast ? 'cursor-default' : 'cursor-pointer'}`}
                      disabled={isPast}
                    >
                      <span className={task.status === 'done' ? 'text-[#38a169]' : 'text-[#a0aec0]'}>
                        {task.status === 'done' ? '[✓]' : '[ ]'}
                      </span>
                    </button>
                    <span className={`text-sm flex-1 ${task.status === 'done' ? 'line-through text-[#a0aec0]' : ''}`}>
                      {task.title}
                    </span>
                    {!isPast && (
                      <button
                        onClick={() => handleToggle(task)}
                        className="text-xs text-[#a0aec0] hover:text-white"
                      >
                        {task.status === 'done' ? 'Undo' : 'Done'}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-[#a0aec0]">[ ]</span>
                    <input
                      className="input flex-1"
                      placeholder={isPast ? 'No task set' : `Task ${num}`}
                      value={titles[num - 1]}
                      onChange={(e) => {
                        const next = [...titles];
                        next[num - 1] = e.target.value;
                        setTitles(next);
                      }}
                      disabled={isPast}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>

        {!isPast && !allSet && (
          <button onClick={handleSaveAll} className="btn-primary mt-4" disabled={upsertTask.isPending}>
            {upsertTask.isPending ? 'Saving...' : 'Set Tasks'}
          </button>
        )}

        {allSet && !isPast && (
          <p className="text-xs text-[#38a169] mt-4">All 3 tasks set for today.</p>
        )}
      </div>

      <div className="card">
        <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider mb-4">Statistics</div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-2xl font-bold">{stats?.currentStreak || 0}</div>
            <div className="text-xs text-[#a0aec0]">Day streak</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats?.completionRate || 0}%</div>
            <div className="text-xs text-[#a0aec0]">Completion</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats?.daysAllDone || 0}</div>
            <div className="text-xs text-[#a0aec0]">Days all done</div>
          </div>
        </div>

        <div className="h-48">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{ fill: '#a0aec0', fontSize: 10 }} />
                <YAxis tick={{ fill: '#a0aec0', fontSize: 11 }} domain={[0, 3]} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2d2d2d', borderRadius: 4 }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="done" fill="#38a169" name="Done" radius={[2, 2, 0, 0]} />
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
