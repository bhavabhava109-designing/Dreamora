import React, { useState } from 'react';
import { BookOpen, Coffee, Flame, Moon, Sparkles, User, Users } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const ROOMS = [
  {
    name: 'Deep Focus Library',
    category: 'Silent Library',
    icon: BookOpen,
    desc: 'Quiet desks for silent studying. Absolute silence requested.',
    theme: 'border-[var(--border)] bg-[var(--primary-glow)] text-[var(--primary)]',
    color: 'gray'
  },
  {
    name: 'Lo-Fi Cafe Desk',
    category: 'Cozy Cafe',
    icon: Coffee,
    desc: 'Mild ambient background noise. Perfect for casual writing or coding.',
    theme: 'border-[var(--border)] bg-[var(--primary-glow)] text-[var(--primary)]',
    color: 'gray'
  },
  {
    name: 'Skyline Study Lounge',
    category: 'Lo-fi Office',
    icon: Sparkles,
    desc: 'Deep focus lofi ambient tracks with a quiet, panoramic cityscape backdrop.',
    theme: 'border-[var(--border)] bg-[var(--primary-glow)] text-[var(--primary)]',
    color: 'gray'
  },
  {
    name: 'Rainy Forest Cabin',
    category: 'Nature Space',
    icon: Moon,
    desc: 'Surrounded by bird sounds and forest rain showers. Stay peaceful.',
    theme: 'border-[var(--border)] bg-[var(--primary-glow)] text-[var(--primary)]',
    color: 'gray'
  }
];

const AVATARS = ['🧑‍💻', '☕', '📚', '🧘', '✍️', '💡', '🎨', '🎧', '🌱', '🎓'];

export default function StudyRooms() {
  const { currentRoom, joinRoom, leaveRoom, nickname, avatar } = useSocket();

  const [inputName, setInputName] = useState(nickname || '');
  const [selectedAvatar, setSelectedAvatar] = useState(avatar || '🧑‍💻');
  const [targetRoom, setTargetRoom] = useState(null);

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!inputName.trim() || !targetRoom) return;
    joinRoom(inputName.trim(), targetRoom.name, selectedAvatar);
    setTargetRoom(null);
  };

  const selectRoomToJoin = (room) => {
    if (nickname) {
      // If name is already set in socket state, join immediately
      joinRoom(nickname, room.name, avatar);
    } else {
      // Open onboarding modal first
      setTargetRoom(room);
    }
  };

  return (
    <div className="glass-panel p-6 flex flex-col flex-1 min-h-0 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Virtual Study Rooms</h2>
          <p className="text-sm text-gray-400">Join a virtual productivity room to study synchronously with others</p>
        </div>
        {currentRoom && (
          <button
            onClick={leaveRoom}
            className="glass-button border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-glow)] bg-transparent"
          >
            Leave Current Room
          </button>
        )}
      </div>

      {currentRoom && (
        <div className="glass-panel p-4 mb-6 border-[var(--border)] bg-[var(--primary-glow)] flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce">🎯</span>
            <div>
              <p className="text-xs text-[var(--primary)] font-bold uppercase tracking-wider">Active Workspace</p>
              <h3 className="text-lg font-bold text-gray-100">{currentRoom}</h3>
            </div>
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <Users size={14} className="text-[var(--primary)]" />
            Check the right panel for live chat and active members
          </div>
        </div>
      )}

      {/* Grid of rooms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-1">
        {ROOMS.map((room) => {
          const RoomIcon = room.icon;
          const isActive = currentRoom === room.name;

          return (
            <div
              key={room.name}
              className={`glass-panel p-5 flex flex-col justify-between transition-all ${
                isActive ? 'border-[var(--primary)] bg-[var(--primary-glow)] shadow-inner' : 'hover:border-[var(--primary-hover)]'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2.5 rounded-lg border ${room.theme}`}>
                    <RoomIcon size={20} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/5 text-gray-400 px-2 py-0.5 rounded-full">
                    {room.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-1 text-gray-100">{room.name}</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">{room.desc}</p>
              </div>

              <div>
                {isActive ? (
                  <div className="w-full text-center py-2 bg-[var(--primary-glow)] text-[var(--primary)] font-bold rounded-lg border border-[var(--primary)] text-xs shadow-inner">
                    Current Study Space
                  </div>
                ) : (
                  <button
                    onClick={() => selectRoomToJoin(room)}
                    className="glass-button w-full text-xs"
                  >
                    Enter Study Room
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Onboarding / Profile setup modal */}
      {targetRoom && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="glass-panel p-6 max-w-sm w-full border-[var(--border)] bg-[var(--bg-dark)] shadow-2xl">
            <h3 className="text-xl font-bold mb-1 text-gray-100 flex items-center gap-2">
              <User size={18} className="text-[var(--primary)]" />
              Identify Yourself
            </h3>
            <p className="text-xs text-gray-400 mb-4">Set your nickname and avatar to join {targetRoom.name}</p>
            
            <form onSubmit={handleJoinSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">Nickname</label>
                <input
                  type="text"
                  placeholder="e.g. FocusFox"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="glass-input w-full"
                  maxLength={15}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">Select Avatar</label>
                <div className="grid grid-cols-5 gap-2 mt-1.5">
                  {AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`text-2xl p-1.5 rounded-lg border transition-all ${
                        selectedAvatar === av
                          ? 'border-[var(--primary)] bg-[var(--primary-glow)] scale-110 shadow-lg shadow-[var(--primary-glow)]'
                          : 'border-white/5 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2.5 mt-3">
                <button
                  type="submit"
                  className="glass-button flex-1"
                >
                  Join Room
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRoom(null)}
                  className="glass-button glass-button-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
