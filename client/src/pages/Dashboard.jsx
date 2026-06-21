import { useGoals } from '../hooks/useGoals.js';
import { useSleepLog, useUpsertSleepLog } from '../hooks/useSleep.js';
import { useTasks } from '../hooks/useTasks.js';
import { usePMOStats } from '../hooks/usePMO.js';
import { useExerciseStats } from '../hooks/useExercise.js';
import { useScreenTimeLog } from '../hooks/useScreenTime.js';
import { format, parseISO } from 'date-fns';

const today = format(new Date(), 'yyyy-MM-dd');
const dayName = format(new Date(), 'EEEE, MMMM d');

const motivationalMessages = [
  'Stay locked in.',
  'Discipline is freedom.',
  'One day at a time.',
  'Into the summit of the gods',
  'No excuses. Do the work.',
  'Absolute freedom is waiting',
];

export default function Dashboard() {
  const { data: goals } = useGoals();
  const { data: sleepLog } = useSleepLog(today);
  const { data: tasks } = useTasks(today);
  const { data: pmoStats } = usePMOStats();
  const { data: exerciseStats } = useExerciseStats('week');
  const { data: screenTime } = useScreenTimeLog(today);
  const upsertSleep = useUpsertSleepLog();

  const message = motivationalMessages[new Date().getDay() % motivationalMessages.length];
  const activeGoals = (goals || []).filter(g => g.status === 'active').slice(0, 15);

  const isWakeOnTime = () => {
    if (!sleepLog?.actual_wake || !sleepLog?.target_wake) return null;
    const diff = Math.abs(
      new Date(`2000-01-01T${sleepLog.actual_wake}`) - new Date(`2000-01-01T${sleepLog.target_wake}`)
    );
    return diff <= 15 * 60 * 1000;
  };

  const isSleepOnTime = () => {
    if (!sleepLog?.actual_sleep || !sleepLog?.target_sleep) return null;
    const diff = Math.abs(
      new Date(`2000-01-01T${sleepLog.actual_sleep}`) - new Date(`2000-01-01T${sleepLog.target_sleep}`)
    );
    return diff <= 15 * 60 * 1000;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">{dayName}</h1>
        <p className="text-[#a0aec0] text-sm mt-0.5">{message}</p>
      </div>

      {activeGoals.length > 0 && (
        <div className="card">
          <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider mb-3">Life Goals</div>
          <ol className="list-decimal list-inside space-y-1">
            {activeGoals.map((goal) => (
              <li key={goal.id} className="text-sm text-white/90">{goal.title}</li>
            ))}
          </ol>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider mb-3">Sleep</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#a0aec0]">Wake</span>
              <span className={isWakeOnTime() === null ? 'text-[#a0aec0]' : isWakeOnTime() ? 'text-[#38a169]' : 'text-[#e53e3e]'}>
                {sleepLog?.target_wake || '--:--'} {isWakeOnTime() !== null && (isWakeOnTime() ? '[✓]' : '[✗]')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#a0aec0]">Sleep</span>
              <span className={isSleepOnTime() === null ? 'text-[#a0aec0]' : isSleepOnTime() ? 'text-[#38a169]' : 'text-[#e53e3e]'}>
                {sleepLog?.target_sleep || '--:--'} {isSleepOnTime() !== null && (isSleepOnTime() ? '[✓]' : '[✗]')}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider mb-3">Tasks</div>
          <div className="space-y-2">
            {(!tasks || tasks.length === 0) && (
              <p className="text-sm text-[#a0aec0]">No tasks set for today.</p>
            )}
            {tasks?.map((task) => (
              <div key={task.id} className="flex items-center gap-2 text-sm">
                <span className={task.status === 'done' ? 'text-[#38a169]' : 'text-[#a0aec0]'}>
                  {task.status === 'done' ? '[✓]' : '[ ]'}
                </span>
                <span className={task.status === 'done' ? 'line-through text-[#a0aec0]' : ''}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider mb-3">PMO</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#a0aec0]">Streak</span>
              <span className="font-medium">{pmoStats?.currentStreak || 0} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#a0aec0]">Last relapse</span>
              <span>{pmoStats?.lastRelapse ? format(parseISO(pmoStats.lastRelapse), 'MMM d') : 'Never'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#a0aec0]">This month</span>
              <span className="text-[#e53e3e]">{pmoStats?.totalThisMonth || 0}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider mb-3">Exercise</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#a0aec0]">This week</span>
              <span>{exerciseStats?.totalDone || 0}/{exerciseStats?.totalScheduled || 0} done</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#a0aec0]">Streak</span>
              <span className={exerciseStats?.currentStreak > 0 ? 'text-[#38a169]' : 'text-[#a0aec0]'}>
                {exerciseStats?.currentStreak || 0} days
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider mb-3">Screen Time</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#a0aec0]">Today</span>
              <span>
                {screenTime?.total_minutes != null
                  ? `${Math.floor(screenTime.total_minutes / 60)}h ${screenTime.total_minutes % 60}m`
                  : '--'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
