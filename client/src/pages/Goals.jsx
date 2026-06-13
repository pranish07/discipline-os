import { useState } from 'react';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '../hooks/useGoals.js';

const categories = ['Career', 'Health', 'Finance', 'Relationships', 'Personal'];

export default function Goals() {
  const { data: goals } = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Personal');
  const [newDescription, setNewDescription] = useState('');
  const [editingId, setEditingId] = useState(null);

  const activeGoals = (goals || []).filter(g => g.status === 'active');
  const achievedGoals = (goals || []).filter(g => g.status === 'achieved');

  function handleCreate() {
    if (!newTitle.trim()) return;
    createGoal.mutate({ title: newTitle, description: newDescription, category: newCategory });
    setNewTitle('');
    setNewDescription('');
    setNewCategory('Personal');
  }

  function handleAchieve(goal) {
    updateGoal.mutate({ id: goal.id, status: 'achieved', achieved_at: new Date().toISOString() });
  }

  function handleDelete(id) {
    deleteGoal.mutate(id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Life Goals</h1>
        <p className="text-[#a0aec0] text-sm mt-0.5">Your lifelong ambitions. No due dates.</p>
      </div>

      <div className="card">
        <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider mb-3">Add a Goal</div>
        <div className="space-y-3">
          <input
            className="input"
            placeholder="What is your life goal?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <div className="flex gap-3">
            <select className="input w-auto" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <button onClick={handleCreate} className="btn-primary" disabled={createGoal.isPending}>
              Add
            </button>
          </div>
          <textarea
            className="input"
            placeholder="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      {activeGoals.length > 0 && (
        <div className="card">
          <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider mb-3">
            Active Goals ({activeGoals.length})
          </div>
          <div className="space-y-2">
            {activeGoals.map((goal) => (
              <div key={goal.id} className="flex items-start gap-3 py-2 border-b border-[#2d2d2d] last:border-0">
                <span className="text-xs text-[#a0aec0] font-mono mt-0.5">{goal.sort_order}.</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{goal.title}</div>
                  {goal.description && <div className="text-xs text-[#a0aec0] mt-0.5">{goal.description}</div>}
                  <span className="text-xs text-[#a0aec0]">{goal.category}</span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleAchieve(goal)} className="text-xs text-[#38a169] hover:underline">
                    Achieve
                  </button>
                  <button onClick={() => handleDelete(goal.id)} className="text-xs text-[#e53e3e] hover:underline">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {achievedGoals.length > 0 && (
        <div className="card opacity-60">
          <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider mb-3">
            Achieved ({achievedGoals.length})
          </div>
          <div className="space-y-1">
            {achievedGoals.map((goal) => (
              <div key={goal.id} className="flex items-center gap-2 text-sm text-[#a0aec0]">
                <span className="text-[#38a169]">[✓]</span>
                <span className="line-through">{goal.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
