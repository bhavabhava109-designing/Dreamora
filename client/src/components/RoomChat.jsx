import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, MessageSquare, Flame, Trophy, Heart, Coffee, ShieldAlert } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const CHEERS = [
  { emoji: '🔥', label: 'Fire' },
  { emoji: '👏', label: 'Applause' },
  { emoji: '🚀', label: 'Rocket' },
  { emoji: '💯', label: 'Perfect' },
  { emoji: '🎉', label: 'Party' }
];

export default function RoomChat() {
  const {
    roomUsers,
    chatMessages,
    sendMessage,
    sendCheer,
    activeCheer,
    isConnected
  } = useSocket();

  const [activeTab, setActiveTab] = useState('chat'); // chat, members
  const [inputText, setInputText] = useState('');
  const [cheerList, setCheerList] = useState([]);
  
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom when messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeTab]);

  // Display floating cheer emojis in the DOM on activeCheer trigger
  useEffect(() => {
    if (activeCheer) {
      const newCheer = {
        id: activeCheer.id,
        emoji: activeCheer.emoji,
        nickname: activeCheer.nickname,
        driftX: (Math.random() * 100 - 50) + 'px',
        rotation: (Math.random() * 40 - 20) + 'deg'
      };

      setCheerList((prev) => [...prev, newCheer]);

      // Remove after animation finishes
      const timer = setTimeout(() => {
        setCheerList((prev) => prev.filter((c) => c.id !== newCheer.id));
      }, 2200);

      return () => clearTimeout(timer);
    }
  }, [activeCheer]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const triggerCheer = (emoji) => {
    sendCheer(emoji);
  };

  const getStatusBadge = (status) => {
    if (status.includes('Focusing')) {
      return 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-glow)] font-bold';
    } else if (status.includes('Resting')) {
      return 'border-[var(--border)] text-[var(--text-muted)] bg-black/10';
    }
    return 'border-white/10 text-gray-400 bg-white/5';
  };

  return (
    <div className="glass-panel flex flex-col flex-1 min-h-0 relative overflow-hidden animate-fade-in">
      {/* Floating Cheers Overlay Container */}
      {cheerList.map((cheer) => (
        <div
          key={cheer.id}
          className="cheer-emoji"
          style={{
            '--drift-x': cheer.driftX,
            '--rotation': cheer.rotation
          }}
        >
          <div className="flex flex-col items-center">
            <span className="text-4xl filter drop-shadow-lg">{cheer.emoji}</span>
            <span className="text-[10px] bg-black/85 text-[var(--primary)] font-bold px-1.5 py-0.5 rounded border border-[var(--border)] mt-1 whitespace-nowrap">
              {cheer.nickname}
            </span>
          </div>
        </div>
      ))}

      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-black/20 p-1">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'chat'
              ? 'bg-[var(--primary-glow)] text-[var(--primary)] font-bold border border-[var(--border)]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <MessageSquare size={14} />
          Live Chat ({chatMessages.length})
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'members'
              ? 'bg-[var(--primary-glow)] text-[var(--primary)] font-bold border border-[var(--border)]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users size={14} />
          Study Partners ({roomUsers.length})
        </button>
      </div>

      {/* Connection warning bar */}
      {!isConnected && (
        <div className="bg-amber-600/10 border-b border-amber-600/20 text-amber-500 p-2 text-center text-[10px] font-semibold flex items-center justify-center gap-1.5">
          <ShieldAlert size={12} />
          Connecting to study space server...
        </div>
      )}

      {/* Tab Content Panels */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'chat' ? (
          <>
            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {chatMessages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
                  <MessageSquare size={32} className="mb-1 text-[var(--primary-glow)]" />
                  <p className="text-xs">Welcome to the study chat!</p>
                  <p className="text-[10px] text-gray-600">Be supportive and keep each other motivated.</p>
                </div>
              )}
              
              {chatMessages.map((msg, idx) => {
                if (msg.system) {
                  return (
                    <div key={idx} className="text-center my-1">
                      <span className="text-[10px] bg-white/5 border border-white/5 text-gray-400 rounded-full px-2.5 py-0.5">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={idx} className="flex gap-2.5 items-start animate-fade-in">
                    <span className="text-xl bg-white/5 p-1 rounded-lg border border-white/5">{msg.avatar}</span>
                    <div className="flex-1 min-w-0 bg-white/5 rounded-2xl px-3.5 py-2 border border-white/5">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="font-semibold text-xs text-[var(--primary)]">{msg.nickname}</span>
                        <span className="text-[9px] text-gray-500">{msg.timestamp}</span>
                      </div>
                      <p className="text-xs text-gray-200 break-words leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Send Form */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/5 bg-black/25 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isConnected ? "Send message..." : "Reconnecting..."}
                disabled={!isConnected}
                className="glass-input flex-1 py-2"
              />
              <button
                type="submit"
                disabled={!isConnected || !inputText.trim()}
                className="glass-button p-2"
              >
                <Send size={14} />
              </button>
            </form>
          </>
        ) : (
          /* Members presence list */
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <div className="flex-1 flex flex-col gap-2">
              {roomUsers.map((user) => (
                <div
                  key={user.id}
                  className="glass-panel p-3 flex justify-between items-center border-white/5 bg-white/5 hover:bg-white/10"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-1 bg-black/20 rounded-lg border border-white/5">{user.avatar}</span>
                    <div>
                      <span className="font-semibold text-xs block text-gray-100">{user.nickname}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border inline-block mt-0.5 ${getStatusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick cheers bar */}
            {isConnected && (
              <div className="p-3 border border-[var(--border)] bg-[var(--primary-glow)] rounded-xl">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] mb-2 text-center">
                  🙌 Cheer Your Study Partners
                </p>
                <div className="flex justify-around">
                  {CHEERS.map((cheer) => (
                    <button
                      key={cheer.label}
                      onClick={() => triggerCheer(cheer.emoji)}
                      className="text-xl p-1.5 hover:bg-white/10 rounded-lg transition-transform hover:scale-125 duration-100 active:scale-95"
                      title={cheer.label}
                    >
                      {cheer.emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
