import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Settings, Check } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const FOCUS_QUOTES = [
  { text: "Your focus determines your reality.", author: "Qui-Gon Jinn" },
  { text: "Work hard in silence, let your success be your noise.", author: "Frank Ocean" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Focus is a matter of deciding what things you're not going to do.", author: "John Carmack" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" }
];

const DEFAULT_SETTINGS = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15
};

export default function PomodoroTimer({ selectedTask, setSelectedTask, userId }) {
  const { updateStatus, currentRoom } = useSocket();

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('dreamora_timer_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [mode, setMode] = useState('focus'); // focus, shortBreak, longBreak
  const [secondsLeft, setSecondsLeft] = useState(settings.focus * 60);
  const [isActive, setIsActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Custom temp states for settings form
  const [tempFocus, setTempFocus] = useState(settings.focus);
  const [tempShort, setTempShort] = useState(settings.shortBreak);
  const [tempLong, setTempLong] = useState(settings.longBreak);

  const [alarmSound, setAlarmSound] = useState(() => {
    return localStorage.getItem('dreamora_alarm_sound') || 'zen';
  });

  const [quote, setQuote] = useState(() => {
    const idx = Math.floor(Math.random() * FOCUS_QUOTES.length);
    return FOCUS_QUOTES[idx];
  });

  const timerRef = useRef(null);
  const totalSeconds = settings[mode] * 60;
  const apiHost = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Synchronize timer duration when mode or settings change
  useEffect(() => {
    setSecondsLeft(settings[mode] * 60);
    setIsActive(false);
  }, [mode, settings]);

  // Main countdown ticking logic
  useEffect(() => {
    if (isActive) {
      // Update Socket status to room
      if (mode === 'focus') {
        updateStatus('Focusing 🎯');
      } else {
        updateStatus('Resting ☕');
      }

      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsActive(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      updateStatus('Idle 💤');
    }

    return () => clearInterval(timerRef.current);
  }, [isActive, mode]);

  // Synthesize study chime using browser Web Audio API (highly reliable, offline compatible)
  const playCompletionSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (alarmSound === 'beep') {
        // Digital Beep: 3 rapid high-pitched square waves
        for (let i = 0; i < 3; i++) {
          const time = ctx.currentTime + i * 0.22;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(850, time);

          gain.gain.setValueAtTime(0.0001, time);
          gain.gain.linearRampToValueAtTime(0.08, time + 0.005);
          gain.gain.setValueAtTime(0.08, time + 0.09);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(time);
          osc.stop(time + 0.15);
        }
      } else if (alarmSound === 'woodblock') {
        // Woodblock percussion tap
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      } else {
        // Zen Chime (default)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc1.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.2); // A5
        gain1.gain.setValueAtTime(0.18, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc2.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.25); // C6
        gain2.gain.setValueAtTime(0.09, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 1.5);
        osc2.stop(ctx.currentTime + 1.5);
      }
    } catch (error) {
      console.warn('Web Audio synthesis not supported or blocked:', error);
    }
  };

  const handleTimerComplete = async () => {
    playCompletionSound();

    const durationPlayed = settings[mode];
    
    // Log focus session to analytics database
    try {
      await fetch(`${apiHost}/api/analytics/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          duration: durationPlayed,
          type: mode,
          roomName: currentRoom || 'Solo Space'
        })
      });
    } catch (e) {
      console.error('Failed to log analytics session:', e);
    }

    // If focus mode completed and a task is selected, log task Pomodoro increment
    if (mode === 'focus') {
      const currentPoints = parseInt(localStorage.getItem('dreamora_garden_points') || '0', 10);
      let nextPoints = currentPoints + 25;
      if (nextPoints > 100) nextPoints = 100;
      localStorage.setItem('dreamora_garden_points', nextPoints.toString());
      window.dispatchEvent(new Event('storage'));

      if (selectedTask) {
        try {
          const res = await fetch(`${apiHost}/api/tasks/${selectedTask._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              $inc: { completedPomodoros: 1 }
            })
          });
          if (res.ok) {
            const updated = await res.json();
            setSelectedTask(updated); // Sync state up
          }
        } catch (e) {
          console.error('Failed to update task Pomodoros:', e);
        }
      }
    }

    // Auto toggle to breaks/focus
    if (mode === 'focus') {
      setMode('shortBreak');
    } else {
      setMode('focus');
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft(settings[mode] * 60);
  };

  const skipTimer = () => {
    setIsActive(false);
    if (mode === 'focus') {
      setMode('shortBreak');
    } else if (mode === 'shortBreak') {
      setMode('longBreak');
    } else {
      setMode('focus');
    }
  };

  const saveSettings = (e) => {
    e.preventDefault();
    const newSettings = {
      focus: Number(tempFocus),
      shortBreak: Number(tempShort),
      longBreak: Number(tempLong)
    };
    setSettings(newSettings);
    localStorage.setItem('dreamora_timer_settings', JSON.stringify(newSettings));
    setShowSettings(false);
  };

  // SVG progress math
  const stroke = 8;
  const normalizedRadius = 80;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const strokeDashoffset = circumference - progress * circumference;

  // Time format helper
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel p-6 flex flex-col items-center justify-center flex-1 min-h-0 relative overflow-hidden animate-fade-in">
      {/* Motivation quote banner */}
      <div className="text-center max-w-sm mb-4 px-4 py-2 bg-white/5 border border-white/5 rounded-xl animate-fade-in pointer-events-none">
        <p className="text-xs italic text-gray-300 font-medium">"{quote.text}"</p>
        <p className="text-[10px] uppercase tracking-wider text-[var(--primary)] font-bold mt-1">— {quote.author}</p>
      </div>

      {/* Mode Selectors */}
      <div className="flex gap-2 p-1 bg-white/5 backdrop-blur-sm border border-[var(--border)] rounded-xl mb-6 z-10">
        <button
          onClick={() => setMode('focus')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            mode === 'focus' ? 'bg-[var(--primary)] text-[var(--bg-dark)] shadow font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          🎯 Focus
        </button>
        <button
          onClick={() => setMode('shortBreak')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            mode === 'shortBreak' ? 'bg-[var(--primary)] text-[var(--bg-dark)] shadow font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          ☕ Short Break
        </button>
        <button
          onClick={() => setMode('longBreak')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            mode === 'longBreak' ? 'bg-[var(--primary)] text-[var(--bg-dark)] shadow font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          💤 Long Break
        </button>
      </div>

      {/* Main Timer Display Circle */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-6 z-10">
        <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
          {/* Background circle track */}
          <circle
            stroke="var(--border)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={100}
            cy={100}
          />
          {/* Animated progress circle */}
          <circle
            stroke={mode === 'focus' ? 'var(--primary)' : 'var(--secondary)'}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.35s' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={100}
            cy={100}
            className={isActive ? 'drop-shadow-[0_0_8px_var(--primary-glow)]' : ''}
          />
        </svg>

        {/* Center Text */}
        <div className="absolute text-center flex flex-col items-center">
          <span className="text-5xl font-extrabold font-mono tracking-tight text-white mb-1">
            {formatTime(secondsLeft)}
          </span>
          <span className="text-xs uppercase font-bold tracking-widest text-[var(--primary)]">
            {mode === 'focus' ? 'Focus Mode' : 'Rest Break'}
          </span>
        </div>
      </div>

      {/* Linked Task Indicator */}
      <div className="text-center mb-6 min-h-12 z-10 max-w-sm">
        {selectedTask ? (
          <div className="glass-panel py-2 px-4 border-[var(--border)] bg-[var(--primary-glow)] inline-flex items-center gap-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-ping"></span>
            <p className="text-xs font-semibold text-gray-200">
              Focusing on: <span className="text-[var(--primary)] truncate max-w-xs">{selectedTask.title}</span>
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            No task selected. Your focus time will still be saved to analytics.
          </p>
        )}
      </div>

      {/* Control Action Buttons */}
      <div className="flex gap-4 items-center z-10">
        <button
          onClick={resetTimer}
          className="p-3 bg-white/5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white rounded-xl transition-all"
          title="Reset timer"
        >
          <RotateCcw size={18} />
        </button>

        <button
          onClick={toggleTimer}
          className={`p-5 rounded-2xl flex items-center justify-center transition-all ${
            isActive
              ? 'bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-white shadow-lg shadow-black/20'
              : 'bg-[var(--primary)] border border-[var(--primary-hover)] text-[var(--bg-dark)] hover:opacity-90 shadow-lg shadow-[var(--primary-glow)]'
          }`}
          title={isActive ? 'Pause' : 'Start'}
        >
          {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
        </button>

        <button
          onClick={skipTimer}
          className="p-3 bg-white/5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white rounded-xl transition-all"
          title="Skip mode"
        >
          <SkipForward size={18} />
        </button>
      </div>

      {/* Settings Panel Toggle */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="absolute bottom-6 right-6 p-2 text-gray-500 hover:text-gray-300 transition-colors"
      >
        <Settings size={18} />
      </button>

      {/* Settings Modal (Overlay) */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col justify-center p-6 z-35 animate-fade-in">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--text)]">
            <Settings size={18} className="text-[var(--primary)]" />
            Timer Durations (minutes)
          </h3>
          <form onSubmit={saveSettings} className="flex flex-col gap-4">
            <div className="flex justify-between items-center gap-4">
              <label className="text-sm text-gray-300">Focus Duration</label>
              <input
                type="number"
                min="1"
                max="60"
                value={tempFocus}
                onChange={(e) => setTempFocus(e.target.value)}
                className="glass-input w-24 text-center"
              />
            </div>
            <div className="flex justify-between items-center gap-4">
              <label className="text-sm text-gray-300">Short Break</label>
              <input
                type="number"
                min="1"
                max="30"
                value={tempShort}
                onChange={(e) => setTempShort(e.target.value)}
                className="glass-input w-24 text-center"
              />
            </div>
            <div className="flex justify-between items-center gap-4">
              <label className="text-sm text-gray-300">Long Break</label>
              <input
                type="number"
                min="1"
                max="60"
                value={tempLong}
                onChange={(e) => setTempLong(e.target.value)}
                className="glass-input w-24 text-center"
              />
            </div>
            <div className="flex justify-between items-center gap-4">
              <label className="text-sm text-gray-300">Alarm Sound</label>
              <select
                value={alarmSound}
                onChange={(e) => {
                  setAlarmSound(e.target.value);
                  localStorage.setItem('dreamora_alarm_sound', e.target.value);
                }}
                className="glass-input w-36 bg-[var(--bg-dark)]"
              >
                <option value="zen">🔔 Zen Chime</option>
                <option value="beep">⚡ Digital Beep</option>
                <option value="woodblock">🪵 Woodblock</option>
              </select>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="glass-button flex-1 flex items-center justify-center gap-1.5"
              >
                <Check size={16} />
                Save Settings
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="glass-button glass-button-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
