import React, { useState, useEffect, useRef } from 'react';
import { Timer, ClipboardList, Users, Volume2, VolumeX, BarChart2, Menu, X, MessageSquare, Compass, Cpu, Sun, Moon, Edit3, Flame } from 'lucide-react';
import { SocketProvider, useSocket } from './context/SocketContext';
import PomodoroTimer from './components/PomodoroTimer';
import TodoManager from './components/TodoManager';
import StudyRooms from './components/StudyRooms';
import SoundMixer from './components/SoundMixer';
import Analytics from './components/Analytics';
import RoomChat from './components/RoomChat';
import CustomCursor from './components/CustomCursor';
import StudyPlanner from './components/StudyPlanner';
import FocusGarden from './components/FocusGarden';
import Flashcards from './components/Flashcards';
import './App.css';

const WALLPAPERS = {
  minimal: '',
  sakura: '/sakura_study.png',
  fuji: '/fuji_study.png',
  cafe: '/cafe_study.png'
};

function MainAppShell() {
  const [activeTab, setActiveTab] = useState('timer'); // timer, tasks, rooms, mixer, analytics
  const [selectedTask, setSelectedTask] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('dreamora_theme') || 'nebula';
  });
  const [wallpaper, setWallpaper] = useState(() => {
    return localStorage.getItem('dreamora_wallpaper') || (localStorage.getItem('dreamora_theme') === 'solar' ? 'sakura' : 'fuji');
  });

  const isInitialMount = useRef(true);

  useEffect(() => {
    localStorage.setItem('dreamora_wallpaper', wallpaper);

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Automatically trigger ambient soundscapes matching the study scene
    const PRESETS = {
      minimal: {},
      sakura: { lofi: 0.5, wind: 0.2 },
      fuji: { lofi: 0.4, wind: 0.3 },
      cafe: { rain: 0.5, cafe: 0.4 }
    };

    const preset = PRESETS[wallpaper] || {};
    const tracks = ['rain', 'cafe', 'wind', 'waves', 'lofi', 'synth'];
    const newMixerState = tracks.reduce((acc, t) => {
      acc[t] = { 
        playing: !!preset[t], 
        volume: preset[t] || 0.5 
      };
      return acc;
    }, {});

    localStorage.setItem('dreamora_mixer_state', JSON.stringify(newMixerState));
    window.dispatchEvent(new Event('storage'));
  }, [wallpaper]);

  useEffect(() => {
    const root = document.documentElement;
    root.className = '';
    root.classList.add(`theme-${theme}`);
    localStorage.setItem('dreamora_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const nextTheme = prev === 'nebula' ? 'solar' : 'nebula';
      // Automatically swap between the custom Mount Fuji and Cozy Sakura wallpapers
      if (nextTheme === 'solar' && (wallpaper === 'minimal' || wallpaper === 'fuji')) {
        setWallpaper('sakura');
      } else if (nextTheme === 'nebula' && wallpaper === 'sakura') {
        setWallpaper('fuji');
      }
      return nextTheme;
    });
  };

  // Get or create a persistent anonymous user session ID
  const [userId] = useState(() => {
    let saved = localStorage.getItem('dreamora_user_session_id');
    if (!saved) {
      saved = 'usr_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('dreamora_user_session_id', saved);
    }
    return saved;
  });

  const [time, setTime] = useState(() => new Date());
  const [soundActive, setSoundActive] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkSoundActive = () => {
      const saved = localStorage.getItem('dreamora_mixer_state');
      if (saved) {
        try {
          const state = JSON.parse(saved);
          const active = Object.values(state).some(t => t.playing);
          setSoundActive(active);
        } catch (e) {
          console.error(e);
        }
      }
    };
    checkSoundActive();
    window.addEventListener('storage', checkSoundActive);
    return () => window.removeEventListener('storage', checkSoundActive);
  }, []);

  const toggleAllSounds = () => {
    const saved = localStorage.getItem('dreamora_mixer_state');
    if (!saved) return;
    try {
      const state = JSON.parse(saved);
      if (soundActive) {
        Object.keys(state).forEach(k => { state[k].playing = false; });
      } else {
        // Activate a soft preset: Lo-Fi and forest wind
        state.lofi = { playing: true, volume: 0.4 };
        state.wind = { playing: true, volume: 0.2 };
      }
      localStorage.setItem('dreamora_mixer_state', JSON.stringify(state));
      window.dispatchEvent(new Event('storage'));
      setSoundActive(!soundActive);
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const { currentRoom, nickname, avatar, joinRoom } = useSocket();

  const [isEditing, setIsEditing] = useState(false);
  const [tempNickname, setTempNickname] = useState('');
  const [tempAvatar, setTempAvatar] = useState('🦊');
  const [streak, setStreak] = useState(0);

  // Sync temp profile values when nickname/avatar change from socket
  useEffect(() => {
    if (nickname) setTempNickname(nickname);
    if (avatar) setTempAvatar(avatar);
  }, [nickname, avatar]);

  // Fetch streak from analytics endpoint dynamically
  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const apiHost = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const res = await fetch(`${apiHost}/api/analytics?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setStreak(data.streak || 0);
        }
      } catch (err) {
        console.error('Error loading sidebar profile stats:', err);
      }
    };
    fetchStreak();
    window.addEventListener('storage', fetchStreak);
    return () => window.removeEventListener('storage', fetchStreak);
  }, [userId, activeTab]);

  const handleSaveProfile = () => {
    if (!tempNickname.trim()) return;
    joinRoom(tempNickname.trim(), currentRoom || '', tempAvatar);
    setIsEditing(false);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'timer': return 'Focus Space';
      case 'tasks': return 'Task Planner';
      case 'rooms': return 'Collab Rooms';
      case 'mixer': return 'Ambient Soundscape';
      case 'analytics': return 'Performance Report';
      default: return 'Dreamora';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden text-[var(--text)] font-sans relative bg-gradient-to-br from-[var(--bg-dark)] to-[var(--bg-dark-end)]">

      {/* Galaxy animated stars */}
      <div className="galaxy-stars"></div>

      {/* Background visual styling */}
      <div className="absolute top-[10%] left-[20%] w-[350px] h-[350px] rounded-full bg-[var(--primary-glow)] filter blur-[80px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[10%] right-[20%] w-[350px] h-[350px] rounded-full bg-[var(--secondary-glow)] filter blur-[100px] pointer-events-none z-0"></div>

      {/* Sidebar Backdrop Overlay on Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-20"
        ></div>
      )}

      {/* Left Navigation Sidebar */}
      <aside
        className={`w-64 sidebar-panel flex flex-col justify-between p-4 z-30 transition-transform duration-300 lg:translate-x-0 lg:static fixed top-0 bottom-0 left-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Logo Header */}
          <div className="flex items-center justify-between px-2 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[var(--primary-glow)] border border-[var(--border)] shadow-lg shadow-[var(--primary-glow)] flex items-center justify-center">
                <img src="/logo.png" alt="Dreamora Logo" className="w-5 h-5 object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-[var(--text)] font-heading flex items-center gap-1.5">
                  DREAMORA
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">STUDY WORKSPACE</span>
              </div>
            </div>
            {/* Dark/Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[var(--text-muted)] hover:text-[var(--text)] transition-all flex items-center justify-center"
              title="Toggle Theme"
            >
              {theme === 'nebula' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-400" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => handleTabChange('timer')}
              className={`flex items-center gap-3.5 px-4 py-3 text-sm font-semibold rounded-xl transition-all border ${
                activeTab === 'timer'
                  ? 'bg-[var(--primary-glow)] border-[var(--border)] text-[var(--primary)] shadow-inner'
                  : 'border-transparent text-gray-400 hover:text-[var(--text)] hover:bg-white/5'
              }`}
            >
              <Timer size={18} />
              Focus Timer
            </button>

            <button
              onClick={() => handleTabChange('tasks')}
              className={`flex items-center gap-3.5 px-4 py-3 text-sm font-semibold rounded-xl transition-all border ${
                activeTab === 'tasks'
                  ? 'bg-[var(--primary-glow)] border-[var(--border)] text-[var(--primary)] shadow-inner'
                  : 'border-transparent text-gray-400 hover:text-[var(--text)] hover:bg-white/5'
              }`}
            >
              <ClipboardList size={18} />
              Study Tasks
            </button>

            <button
              onClick={() => handleTabChange('rooms')}
              className={`flex items-center gap-3.5 px-4 py-3 text-sm font-semibold rounded-xl transition-all border ${
                activeTab === 'rooms'
                  ? 'bg-[var(--primary-glow)] border-[var(--border)] text-[var(--primary)] shadow-inner'
                  : 'border-transparent text-gray-400 hover:text-[var(--text)] hover:bg-white/5'
              }`}
            >
              <Users size={18} />
              Study Rooms
            </button>

            <button
              onClick={() => handleTabChange('mixer')}
              className={`flex items-center gap-3.5 px-4 py-3 text-sm font-semibold rounded-xl transition-all border ${
                activeTab === 'mixer'
                  ? 'bg-[var(--primary-glow)] border-[var(--border)] text-[var(--primary)] shadow-inner'
                  : 'border-transparent text-gray-400 hover:text-[var(--text)] hover:bg-white/5'
              }`}
            >
              <Volume2 size={18} />
              Ambient Mixer
            </button>

            <button
              onClick={() => handleTabChange('analytics')}
              className={`flex items-center gap-3.5 px-4 py-3 text-sm font-semibold rounded-xl transition-all border ${
                activeTab === 'analytics'
                  ? 'bg-[var(--primary-glow)] border-[var(--border)] text-[var(--primary)] shadow-inner'
                  : 'border-transparent text-gray-400 hover:text-[var(--text)] hover:bg-white/5'
              }`}
            >
              <BarChart2 size={18} />
              Analytics Report
            </button>
          </nav>
        </div>

        {/* User Card */}
        <div className="glass-panel p-3 border-[var(--border)] flex flex-col gap-2.5">
          {isEditing ? (
            <div className="flex flex-col gap-2.5">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Choose Avatar</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {['🦊', '🐼', '🐨', '🦁', '🤖', '🧑‍💻', '🦄'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setTempAvatar(emoji)}
                    className={`text-lg p-1 rounded-lg transition-all hover:bg-white/10 flex items-center justify-center ${
                      tempAvatar === emoji ? 'bg-white/10 border border-[var(--primary)]' : 'border border-transparent'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 mt-1">
                <input
                  type="text"
                  value={tempNickname}
                  onChange={(e) => setTempNickname(e.target.value)}
                  className="glass-input w-full text-xs py-1.5 px-3 h-8 border border-[var(--border)] rounded-lg bg-white/5 text-[var(--text)] outline-none focus:border-[var(--primary)] font-bold"
                  placeholder="Enter name..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveProfile();
                  }}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-all uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="bg-[var(--primary)] text-white text-[10px] font-bold px-4 py-1.5 rounded-lg uppercase tracking-wider hover:opacity-90 transition-all border border-[var(--primary)]"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-2xl p-1 bg-white/5 rounded-lg border border-[var(--border)] flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer"
                  title="Click to edit profile avatar"
                >
                  {avatar || '🦊'}
                </button>
                <div className="min-w-0 flex-1 relative group">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-[var(--text)] truncate max-w-[90px]">
                      {nickname || 'Guest Student'}
                    </span>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-all p-0.5"
                      title="Edit profile"
                    >
                      <Edit3 size={11} />
                    </button>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] block truncate font-medium">
                    {currentRoom ? `In: ${currentRoom}` : 'Studying Alone'}
                  </span>
                </div>
              </div>

              {/* Streak Badge */}
              <div className="flex items-center gap-1 px-2 py-1 bg-[var(--primary-glow)] border border-[var(--border)] rounded-lg shrink-0 select-none">
                <Flame size={12} className="text-amber-500 animate-pulse" />
                <span className="text-[10px] font-extrabold text-[var(--primary)] font-mono">{streak}d</span>
              </div>
              
              {currentRoom && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Mobile Header Bar */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-black/20 border-b border-white/5 h-16 shrink-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-[var(--primary-glow)] border border-[var(--border)] text-[var(--text)]"
          >
            <Menu size={18} />
          </button>
          <h2 className="text-md font-bold font-heading tracking-tight text-center">
            {getTabTitle()}
          </h2>
          <div className="w-8 h-8 flex items-center justify-center text-lg bg-white/5 border border-white/10 rounded-lg">
            {avatar || '🧑‍💻'}
          </div>
        </div>

        {/* Main Study Zone Panel */}
        <main className="flex-1 flex flex-col px-6 py-4 lg:py-6 overflow-hidden min-h-0">
          {/* Desktop-only Header Bar */}
          <div className="hidden lg:flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold font-heading tracking-tight flex items-center gap-2">
              {getTabTitle()}
            </h2>
            <div className="flex items-center gap-3">
              {/* Quick Ambient Soundscape Mute/Unmute */}
              <button
                onClick={toggleAllSounds}
                className={`flex items-center gap-2 text-xs border px-4 py-2 rounded-xl font-bold shadow-sm transition-all ${
                  soundActive
                    ? 'bg-[var(--primary-glow)] border-[var(--primary)] text-[var(--primary)] shadow-sm'
                    : 'bg-white/5 border-white/5 text-[var(--text-muted)] hover:bg-white/10'
                }`}
                title={soundActive ? 'Mute all background soundscapes' : 'Play calming background lofi'}
              >
                {soundActive ? <Volume2 size={13} className="text-[var(--primary)]" /> : <VolumeX size={13} />}
                <span>{soundActive ? 'Ambient Play' : 'Ambient Mute'}</span>
              </button>

              {/* Minimalist Live Study Clock */}
              <div className="flex items-center gap-2 text-xs bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-[var(--text-muted)] font-mono font-bold shadow-sm">
                <span>⏱️ {formatTime(time)}</span>
              </div>
              <div className="flex items-center gap-3 text-xs bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-gray-400">
                <span>Server Status: <span className="text-[var(--primary)] font-bold">Online</span></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span>
              </div>
            </div>
          </div>
          <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
            {/* Center Content Panel */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {activeTab === 'timer' && (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto pr-1">
                  <div className="md:col-span-2 flex flex-col min-h-0">
                    <PomodoroTimer
                      selectedTask={selectedTask}
                      setSelectedTask={setSelectedTask}
                      userId={userId}
                    />
                  </div>
                  <div className="flex flex-col min-h-0">
                    <StudyPlanner />
                    <FocusGarden />
                  </div>
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto pr-1">
                  <div className="md:col-span-2 flex flex-col min-h-0">
                    <TodoManager
                      selectedTask={selectedTask}
                      setSelectedTask={setSelectedTask}
                      userId={userId}
                    />
                  </div>
                  <div className="flex flex-col min-h-0">
                    <Flashcards />
                  </div>
                </div>
              )}

              {activeTab === 'rooms' && (
                <StudyRooms />
              )}

              {/* SoundMixer is kept mounted to keep synthesis running in the background while studying */}
              <div className={activeTab === 'mixer' ? 'flex flex-col flex-1 min-h-0 animate-fade-in' : 'hidden'}>
                <SoundMixer />
              </div>

              {activeTab === 'analytics' && (
                <Analytics
                  userId={userId}
                />
              )}

            </div>

            {/* Right Sidebar (Collab chat) - Desktop only, aligned to match main content */}
            {currentRoom && (
              <aside className="w-80 hidden xl:flex flex-col min-h-0 shrink-0">
                <RoomChat />
              </aside>
            )}
          </div>
        </main>
      </div>

      {/* Floating Action Button for Mobile Chat overlay */}
      {currentRoom && (
        <button
          onClick={() => setShowMobileChat(true)}
          className="xl:hidden fixed bottom-6 right-6 p-4 rounded-full bg-[var(--primary)] border border-[var(--primary-hover)] shadow-lg shadow-[var(--primary-glow)] z-40 text-[var(--bg-dark)] flex items-center justify-center animate-bounce hover:scale-105 active:scale-95 transition-transform"
        >
          <MessageSquare size={20} />
        </button>
      )}

      {/* Mobile Chat Slide-over Modal Container */}
      {showMobileChat && currentRoom && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-45 flex flex-col justify-end xl:hidden">
          <div className="flex justify-between items-center p-4 border-b border-white/5 bg-[var(--bg-dark)] shrink-0">
            <h3 className="font-bold text-sm text-[var(--primary)]">Room: {currentRoom}</h3>
            <button
              onClick={() => setShowMobileChat(false)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 p-4 bg-[var(--bg-dark)] overflow-hidden">
            <RoomChat />
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <CustomCursor />
      <MainAppShell />
    </SocketProvider>
  );
}
