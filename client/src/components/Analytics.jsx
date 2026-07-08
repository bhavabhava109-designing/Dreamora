import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Clock, Flame, Award, HelpCircle } from 'lucide-react';

export default function Analytics({ userId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredBar, setHoveredBar] = useState(null);
  
  // Track dynamic milestone values
  const [breaths, setBreaths] = useState(() => {
    return parseInt(localStorage.getItem('dreamora_breaths_count') || '0', 10);
  });
  const [mockUnlocked, setMockUnlocked] = useState(() => {
    return localStorage.getItem('dreamora_mock_unlocked') === 'true';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setBreaths(parseInt(localStorage.getItem('dreamora_breaths_count') || '0', 10));
      setMockUnlocked(localStorage.getItem('dreamora_mock_unlocked') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleToggleMockUnlock = () => {
    const nextVal = !mockUnlocked;
    setMockUnlocked(nextVal);
    localStorage.setItem('dreamora_mock_unlocked', nextVal.toString());
    if (nextVal) {
      localStorage.setItem('dreamora_breaths_count', '5');
      setBreaths(5);
    } else {
      localStorage.removeItem('dreamora_breaths_count');
      setBreaths(0);
    }
    window.dispatchEvent(new Event('storage'));
  };

  const apiHost = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiHost}/api/analytics?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching analytics stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center gap-2.5 flex-1 min-h-0 animate-fade-in">
        <span className="cosmic-loader text-3xl">⏳</span>
        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Compiling productivity report...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center text-center flex-1 min-h-0 animate-fade-in text-gray-500">
        <HelpCircle size={40} className="text-[var(--primary-glow)] mb-2" />
        <p className="font-semibold text-gray-400">Failed to load analytics</p>
        <button onClick={fetchStats} className="glass-button mt-4 text-xs">
          Try Again
        </button>
      </div>
    );
  }

  const formatHours = (mins) => {
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    if (hrs === 0) return `${m}m`;
    return `${hrs}h ${m}m`;
  };

  const getProductivityScore = () => {
    if (stats.totalSessions === 0) return 0;
    // Base score on hours + task ratio
    const taskRatio = stats.totalTasksCount > 0 ? stats.completedTasksCount / stats.totalTasksCount : 1;
    const hoursFactor = Math.min(stats.totalFocusMinutes / 240, 1); // Max score from 4 hours
    const score = Math.round((hoursFactor * 60) + (taskRatio * 40));
    return score;
  };

  // Custom SVG Bar Chart Math
  const maxHours = Math.max(...stats.dailyTrend.map(d => d.hours), 1.5); // At least scale to 1.5 hrs
  const chartHeight = 120;
  const chartWidth = 320;
  const barWidth = 24;
  const gap = 16;
  const startX = 20;

  return (
    <div className="glass-panel p-6 flex flex-col flex-1 min-h-0 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Productivity Analytics</h2>
          <p className="text-sm text-gray-400">Real-time statistics of your focus hours and task outcomes</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleToggleMockUnlock} 
            className={`glass-button text-xs flex items-center gap-1.5 transition-all ${mockUnlocked ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/5' : ''}`}
          >
            {mockUnlocked ? '🔒 Lock Progress' : '🔓 Unlock All Milestones'}
          </button>
          <button onClick={fetchStats} className="glass-button text-xs flex items-center gap-1.5">
            Refresh Data
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-6">

      {/* Metrics Dashboard Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Metric 1: Focus Hours */}
        <div className="glass-panel p-4 flex items-center gap-4 bg-[var(--primary-glow)] border-[var(--border)]">
          <div className="p-3 rounded-xl bg-black/10 text-[var(--primary)] border border-[var(--border)]">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-medium">Focus Time</span>
            <span className="text-xl font-bold tracking-tight text-white">{formatHours(stats.totalFocusMinutes)}</span>
          </div>
        </div>

        {/* Metric 2: Completed Tasks */}
        <div className="glass-panel p-4 flex items-center gap-4 bg-[var(--primary-glow)] border-[var(--border)]">
          <div className="p-3 rounded-xl bg-black/10 text-[var(--primary)] border border-[var(--border)]">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-medium">Tasks Completed</span>
            <span className="text-xl font-bold tracking-tight text-white">
              {stats.completedTasksCount}/{stats.totalTasksCount}
            </span>
          </div>
        </div>

        {/* Metric 3: Active Streak */}
        <div className="glass-panel p-4 flex items-center gap-4 bg-[var(--primary-glow)] border-[var(--border)]">
          <div className="p-3 rounded-xl bg-black/10 text-[var(--primary)] border border-[var(--border)]">
            <Flame size={20} className="animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-medium">Daily Streak</span>
            <span className="text-xl font-bold tracking-tight text-white">{stats.streak} {stats.streak === 1 ? 'day' : 'days'}</span>
          </div>
        </div>

        {/* Metric 4: Productivity Score */}
        <div className="glass-panel p-4 flex items-center gap-4 bg-[var(--primary-glow)] border-[var(--border)]">
          <div className="p-3 rounded-xl bg-black/10 text-[var(--primary)] border border-[var(--border)]">
            <Award size={20} />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-medium">Productivity Score</span>
            <span className="text-xl font-bold tracking-tight text-white">{getProductivityScore()}/100</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Focus Trend (Custom SVG Chart) */}
        <div className="glass-panel p-5 flex flex-col justify-between h-64">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Focus Trend (Daily Hours)</h3>
            <p className="text-[10px] text-gray-500">Visual mapping of minutes studied over the last 7 days</p>
          </div>

          <div className="relative flex justify-center items-end h-36 mt-2">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-w-sm h-full">
              {/* Gridlines */}
              <line x1="10" y1={chartHeight / 2} x2={chartWidth - 10} y2={chartHeight / 2} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
              <line x1="10" y1="10" x2={chartWidth - 10} y2="10" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />

              {/* Bars */}
              {stats.dailyTrend.map((day, idx) => {
                const barHeight = Math.max((day.hours / maxHours) * (chartHeight - 30), 2);
                const x = startX + idx * (barWidth + gap);
                const y = chartHeight - 20 - barHeight;
                const isHovered = hoveredBar === idx;

                return (
                  <g key={day.date}>
                    {/* Interactive rect */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="4"
                      fill={isHovered ? 'url(#cosmicGlow)' : 'var(--primary-glow)'}
                      stroke={isHovered ? 'var(--primary)' : 'var(--border)'}
                      strokeWidth="1.5"
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredBar(idx)}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                    {/* Date label */}
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight - 4}
                      fill="var(--text-muted)"
                      fontSize="9"
                      fontFamily="var(--font-body)"
                      textAnchor="middle"
                      className="opacity-75"
                    >
                      {day.name}
                    </text>
                  </g>
                );
              })}

              {/* Gradients */}
              <defs>
                <linearGradient id="cosmicGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--primary-glow)" />
                </linearGradient>
              </defs>
            </svg>

            {/* Floating Tooltip */}
            {hoveredBar !== null && (
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 glass-panel px-3 py-1 bg-slate-950/90 border-[var(--border)] text-[var(--primary)] pointer-events-none shadow-lg text-[10px] font-bold">
                {stats.dailyTrend[hoveredBar].name}: {formatHours(Math.round(stats.dailyTrend[hoveredBar].hours * 60))}
              </div>
            )}
          </div>
        </div>

        {/* Room Category Distribution */}
        <div className="glass-panel p-5 flex flex-col h-64">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Category Focus Breakdown</h3>
          <p className="text-[10px] text-gray-500 mb-4">Minutes logged in each study space</p>

          <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 pr-1">
            {stats.roomStats.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center text-[11px] text-gray-500">
                No rooms entered yet. Timer completions in rooms log here.
              </div>
            ) : (
              stats.roomStats.map((room) => {
                const percentage = stats.totalFocusMinutes > 0 ? (room.value / stats.totalFocusMinutes) * 100 : 0;
                
                return (
                  <div key={room.name} className="flex flex-col gap-1">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-semibold text-gray-300 truncate max-w-xs">{room.name}</span>
                      <span className="font-mono text-gray-400">{formatHours(room.value)} ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-[var(--primary)] rounded-full transition-all duration-500 shadow-glow"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Dynamic Productivity Milestones */}
      <div className="mt-6 border-t border-[var(--border)] pt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
          <span>🏆</span> Academic & Focus Milestones
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Milestone 1: Focus Master */}
          {(() => {
            const unlocked = mockUnlocked || stats.totalFocusMinutes >= 120;
            return (
              <div className={`glass-panel p-3.5 flex flex-col items-center justify-center text-center gap-2 border-[var(--border)] transition-all ${unlocked ? 'bg-[var(--primary-glow)] border-[var(--primary)]/30 scale-100' : 'opacity-50 bg-black/10'}`}>
                <span className="text-3xl" title="Deep Focus Master">⏱️</span>
                <div>
                  <span className="font-bold text-xs block text-gray-100">Focus Master</span>
                  <span className="text-[9px] text-gray-500">
                    {unlocked ? 'Study 2+ hours logged' : `${stats.totalFocusMinutes}/120 mins logged`}
                  </span>
                </div>
                {unlocked ? (
                  <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Unlocked</span>
                ) : (
                  <span className="text-[9px] uppercase font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">Locked</span>
                )}
              </div>
            );
          })()}

          {/* Milestone 2: Mindful Scholar */}
          {(() => {
            const unlocked = mockUnlocked || breaths >= 3;
            return (
              <div className={`glass-panel p-3.5 flex flex-col items-center justify-center text-center gap-2 border-[var(--border)] transition-all ${unlocked ? 'bg-[var(--primary-glow)] border-[var(--primary)]/30 scale-100' : 'opacity-50 bg-black/10'}`}>
                <span className="text-3xl" title="Mindful Scholar">🧘</span>
                <div>
                  <span className="font-bold text-xs block text-gray-100">Mindful Scholar</span>
                  <span className="text-[9px] text-gray-500">
                    {unlocked ? 'Relax 3+ loops completed' : `${breaths}/3 breathing loops`}
                  </span>
                </div>
                {unlocked ? (
                  <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Unlocked</span>
                ) : (
                  <span className="text-[9px] uppercase font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">Locked</span>
                )}
              </div>
            );
          })()}

          {/* Milestone 3: Task Champion */}
          {(() => {
            const unlocked = mockUnlocked || stats.completedTasksCount >= 3;
            return (
              <div className={`glass-panel p-3.5 flex flex-col items-center justify-center text-center gap-2 border-[var(--border)] transition-all ${unlocked ? 'bg-[var(--primary-glow)] border-[var(--primary)]/30 scale-100' : 'opacity-50 bg-black/10'}`}>
                <span className="text-3xl" title="Task Champion">📋</span>
                <div>
                  <span className="font-bold text-xs block text-gray-100">Task Champion</span>
                  <span className="text-[9px] text-gray-500">
                    {unlocked ? 'Complete 3+ study tasks' : `${stats.completedTasksCount}/3 tasks completed`}
                  </span>
                </div>
                {unlocked ? (
                  <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Unlocked</span>
                ) : (
                  <span className="text-[9px] uppercase font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">Locked</span>
                )}
              </div>
            );
          })()}

          {/* Milestone 4: Study Streak */}
          {(() => {
            const unlocked = mockUnlocked || stats.streak >= 3;
            return (
              <div className={`glass-panel p-3.5 flex flex-col items-center justify-center text-center gap-2 border-[var(--border)] transition-all ${unlocked ? 'bg-[var(--primary-glow)] border-[var(--primary)]/30 scale-100' : 'opacity-50 bg-black/10'}`}>
                <span className="text-3xl" title="Study Streak">🔥</span>
                <div>
                  <span className="font-bold text-xs block text-gray-100">Study Streak</span>
                  <span className="text-[9px] text-gray-500">
                    {unlocked ? 'Maintain 3+ days streak' : `${stats.streak}/3 days streak`}
                  </span>
                </div>
                {unlocked ? (
                  <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Unlocked</span>
                ) : (
                  <span className="text-[9px] uppercase font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">Locked</span>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
