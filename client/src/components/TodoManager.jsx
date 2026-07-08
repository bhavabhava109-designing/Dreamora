import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, AlertCircle, Play, Star } from 'lucide-react';

export default function TodoManager({ selectedTask, setSelectedTask, userId }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const apiHost = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiHost}/api/tasks?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await fetch(`${apiHost}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          priority,
          estimatedPomodoros,
          userId
        })
      });

      if (res.ok) {
        const newTask = await res.json();
        setTasks([newTask, ...tasks]);
        setTitle('');
        setDescription('');
        setPriority('medium');
        setEstimatedPomodoros(1);
        setIsAdding(false);
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const res = await fetch(`${apiHost}/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed })
      });

      if (res.ok) {
        const updated = await res.json();
        setTasks(tasks.map(t => t._id === task._id ? updated : t));
        
        // Update selected task state if it was toggled
        if (selectedTask && selectedTask._id === task._id) {
          setSelectedTask(updated);
        }
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`${apiHost}/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setTasks(tasks.filter(t => t._id !== taskId));
        if (selectedTask && selectedTask._id === taskId) {
          setSelectedTask(null);
        }
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const getPriorityColor = (p) => {
    switch (p) {
      case 'high': return 'text-[var(--primary)] border-[var(--primary)] bg-[var(--primary-glow)] font-bold';
      case 'medium': return 'text-[var(--text)] border-[var(--border)] bg-black/10';
      case 'low': default: return 'text-[var(--text-muted)] border-[var(--border)] bg-black/5';
    }
  };

  return (
    <div className="glass-panel p-6 flex flex-col flex-1 min-h-0 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Study Tasks</h2>
          <p className="text-sm text-gray-400">Select a target task before starting your Pomodoro timer</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="glass-button flex items-center gap-2"
        >
          <Plus size={16} />
          {isAdding ? 'Cancel' : 'New Task'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddTask} className="glass-panel p-4 mb-6 flex flex-col gap-3 border-dashed border-[var(--border)]">
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase block mb-1">Task Title *</label>
            <input
              type="text"
              placeholder="e.g. Study React Hooks"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input w-full"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase block mb-1">Description</label>
            <textarea
              placeholder="e.g. Read official documentation and build sandbox demos"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input w-full resize-none h-16"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-gray-400 font-semibold uppercase block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="glass-input w-full bg-[var(--bg-dark)]"
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
            <div className="w-28">
              <label className="text-xs text-gray-400 font-semibold uppercase block mb-1">Est. Tomatos</label>
              <input
                type="number"
                min="1"
                max="10"
                value={estimatedPomodoros}
                onChange={(e) => setEstimatedPomodoros(parseInt(e.target.value))}
                className="glass-input w-full text-center"
              />
            </div>
          </div>
          <button type="submit" className="glass-button w-full mt-2">
            Create Task
          </button>
        </form>
      )}

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2.5">
          <span className="cosmic-loader text-3xl">🪐</span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Organizing cosmic database...</span>
        </div>
      )}

      {!loading && tasks.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500 border border-dashed border-[var(--border)] rounded-xl">
          <AlertCircle size={40} className="mb-2 text-[var(--primary-glow)]" />
          <p className="font-semibold text-gray-400">No tasks created yet</p>
          <p className="text-xs max-w-xs mt-1">Create a study task to log focus completions and track estimated Pomodoros.</p>
        </div>
      )}

      {!loading && tasks.length > 0 && (
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-6">
          {activeTasks.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Active Tasks ({activeTasks.length})</h3>
              <div className="flex flex-col gap-2">
                {activeTasks.map(task => {
                  const isSelected = selectedTask && selectedTask._id === task._id;
                  return (
                    <div
                      key={task._id}
                      className={`glass-panel p-4 flex justify-between items-start gap-4 cursor-pointer hover:border-[var(--primary-hover)] transition-all ${
                        isSelected ? 'border-[var(--primary)] bg-[var(--primary-glow)]' : ''
                      }`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleComplete(task);
                        }}
                        className="text-gray-400 hover:text-[var(--primary)] transition-colors mt-0.5"
                      >
                        <Circle size={18} />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm text-gray-100 truncate">{task.title}</h4>
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-bold bg-[var(--primary)] text-[var(--bg-dark)] px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Star size={10} fill="currentColor" /> ACTIVE TARGET
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                          <span>🍅 Progress: {task.completedPomodoros}/{task.estimatedPomodoros} pomodoros</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {!isSelected && (
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/5"
                            title="Set as target"
                          >
                            <Play size={14} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task._id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-[var(--primary)] rounded hover:bg-white/5"
                          title="Delete Task"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {completedTasks.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Completed Tasks ({completedTasks.length})</h3>
              <div className="flex flex-col gap-2 opacity-65">
                {completedTasks.map(task => (
                  <div
                    key={task._id}
                    className="glass-panel p-4 flex justify-between items-center gap-4 border-[var(--border)] bg-black/10"
                  >
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm line-through text-gray-400 truncate">{task.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                        <span>🍅 Completed: {task.completedPomodoros}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="p-1.5 text-gray-500 hover:text-[var(--primary)] rounded hover:bg-white/5"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
