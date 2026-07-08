import React, { useState, useEffect } from 'react';
import { Target, Edit3, Plus, Trash2, Copy, Check, Sparkles } from 'lucide-react';

export default function StudyPlanner() {
  const [activeSubTab, setActiveSubTab] = useState('goals'); // goals, notes
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('dreamora_study_goals');
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, text: '🎯 Complete 25m Focus Session', completed: false, auto: 'focus' },
      { id: 2, text: '📋 Check off a study task', completed: false, auto: 'task' },
      { id: 3, text: '🪴 Nurture the Bonsai Tree', completed: false, auto: 'garden' }
    ];
  });
  const [newGoalText, setNewGoalText] = useState('');
  const [notes, setNotes] = useState(() => {
    return localStorage.getItem('dreamora_study_notes') || '';
  });
  const [copied, setCopied] = useState(false);

  // Save goals to localStorage
  useEffect(() => {
    localStorage.setItem('dreamora_study_goals', JSON.stringify(goals));
  }, [goals]);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem('dreamora_study_notes', notes);
  }, [notes]);

  // Listen to study activity to auto-check targets
  useEffect(() => {
    const checkStudyActivity = () => {
      // Check Focus Target if user has logged minutes
      const focusMinutes = parseInt(localStorage.getItem('dreamora_focus_minutes') || '0', 10);
      if (focusMinutes > 0) {
        setGoals(prev => prev.map(g => g.auto === 'focus' ? { ...g, completed: true } : g));
      }

      // Check Garden Target if garden points logged
      const gardenPoints = parseInt(localStorage.getItem('dreamora_garden_points') || '0', 10);
      if (gardenPoints > 0) {
        setGoals(prev => prev.map(g => g.auto === 'garden' ? { ...g, completed: true } : g));
      }
    };

    checkStudyActivity();
    window.addEventListener('storage', checkStudyActivity);
    return () => window.removeEventListener('storage', checkStudyActivity);
  }, []);

  const addGoal = (e) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    const newGoal = {
      id: Date.now(),
      text: newGoalText.trim(),
      completed: false
    };
    setGoals([...goals, newGoal]);
    setNewGoalText('');
  };

  const toggleGoal = (id) => {
    setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const deleteGoal = (id) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const copyNotes = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel p-5 flex flex-col justify-between h-[420px] relative overflow-hidden animate-fade-in">
      <div className="flex flex-col h-full">
        {/* Header Title */}
        <div className="text-center w-full mb-3 shrink-0">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1 flex items-center justify-center gap-1.5">
            <Sparkles size={14} className="text-[var(--primary)]" />
            Study Companion
          </h3>
          <p className="text-xs text-[var(--text-muted)]">Plan daily targets and take session scratchpad notes</p>
        </div>

        {/* Tab Selectors */}
        <div className="flex gap-2 p-1 bg-white/5 border border-[var(--border)] rounded-xl mb-4 shrink-0 justify-center">
          <button
            onClick={() => setActiveSubTab('goals')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeSubTab === 'goals'
                ? 'bg-[var(--primary-glow)] text-[var(--primary)] border border-[var(--border)] shadow-sm'
                : 'text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <Target size={12} />
            Targets
          </button>
          <button
            onClick={() => setActiveSubTab('notes')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeSubTab === 'notes'
                ? 'bg-[var(--primary-glow)] text-[var(--primary)] border border-[var(--border)] shadow-sm'
                : 'text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <Edit3 size={12} />
            Scratchpad
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {activeSubTab === 'goals' ? (
            <div className="flex flex-col h-full justify-between">
              {/* Goals List */}
              <div className="space-y-2 overflow-y-auto max-h-56 pr-0.5">
                {goals.map(goal => (
                  <div
                    key={goal.id}
                    className="flex items-center justify-between gap-2 p-2 bg-white/5 border border-[var(--border)] rounded-xl transition-all hover:bg-white/10"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={goal.completed}
                        onChange={() => toggleGoal(goal.id)}
                        className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer accent-[var(--primary)] shrink-0"
                      />
                      <span className={`text-[13px] truncate ${goal.completed ? 'line-through text-[var(--text-muted)] opacity-65' : 'text-[var(--text)]'}`}>
                        {goal.text}
                      </span>
                    </label>
                    {!goal.auto && (
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="text-gray-400 hover:text-red-400 transition-all p-1"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Goal Form */}
              <form onSubmit={addGoal} className="flex gap-2 mt-3 shrink-0 pt-2 border-t border-[var(--border)]">
                <input
                  type="text"
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                  placeholder="New session target..."
                  className="glass-input flex-1 text-[12px] h-8 bg-white/5 py-1 px-3 border border-[var(--border)] rounded-xl placeholder-[var(--text-muted)] text-[var(--text)] focus:border-[var(--primary)] outline-none"
                />
                <button
                  type="submit"
                  className="bg-[var(--primary)] text-white hover:opacity-90 transition-all rounded-xl w-8 h-8 flex items-center justify-center border border-[var(--primary)] shrink-0"
                >
                  <Plus size={14} />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col h-full justify-between">
              {/* Scratchpad Text Area */}
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type temporary session notes, formulas, or reminders here..."
                className="w-full flex-1 min-h-[160px] bg-white/5 border border-[var(--border)] rounded-xl text-sm font-mono p-3 text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] outline-none resize-none h-full"
              />

              {/* Actions Bar */}
              <div className="flex justify-end gap-2 mt-3 shrink-0 pt-2 border-t border-[var(--border)]">
                <button
                  onClick={copyNotes}
                  className="glass-button text-[11px] py-1.5 px-3.5 font-bold uppercase tracking-wider bg-[var(--primary-glow)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all border border-[var(--border)] rounded-xl flex items-center gap-1.5"
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  {copied ? 'Copied!' : 'Copy Notes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
