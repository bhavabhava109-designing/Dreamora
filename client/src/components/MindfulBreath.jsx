import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Box, Wind, Activity, Flower2 } from 'lucide-react';

const BREATHING_MODES = [
  {
    name: 'Box Breathing',
    desc: '4-4-4-4 cycle to clear stress and gain focus.',
    icon: Box,
    sequence: [
      { phase: 'inhale', duration: 4, label: 'Breathe In... 🌬️', instruction: 'Fill your lungs with energy' },
      { phase: 'hold', duration: 4, label: 'Hold... 🧘', instruction: 'Settle into absolute stillness' },
      { phase: 'exhale', duration: 4, label: 'Breathe Out... 💨', instruction: 'Release all stress and distraction' },
      { phase: 'hold_out', duration: 4, label: 'Hold Empty... 🍃', instruction: 'Rest in pure silence' }
    ]
  },
  {
    name: '4-7-8 Calm',
    desc: 'Deep relaxation sequence to reset nervous system.',
    icon: Wind,
    sequence: [
      { phase: 'inhale', duration: 4, label: 'Breathe In... 🌬️', instruction: 'Inhale peace slowly' },
      { phase: 'hold', duration: 7, label: 'Hold... 🧘', instruction: 'Let the calm settle deep within' },
      { phase: 'exhale', duration: 8, label: 'Breathe Out... 💨', instruction: 'Slowly exhale all tension' }
    ]
  },
  {
    name: 'Coherent',
    desc: '5-5 pattern to optimize heart rate variability.',
    icon: Activity,
    sequence: [
      { phase: 'inhale', duration: 5, label: 'Breathe In... 🌬️', instruction: 'Smooth, deep inhalation' },
      { phase: 'exhale', duration: 5, label: 'Breathe Out... 💨', instruction: 'Smooth, deep exhalation' }
    ]
  }
];

export default function MindfulBreath() {
  const [isActive, setIsActive] = useState(false);
  const [modeIndex, setModeIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(4);

  // Track completed breathing sessions in local storage to update milestones
  useEffect(() => {
    if (isActive && stepIndex === 0) {
      const currentBreaths = parseInt(localStorage.getItem('dreamora_breaths_count') || '0', 10);
      localStorage.setItem('dreamora_breaths_count', (currentBreaths + 1).toString());
      window.dispatchEvent(new Event('storage'));
    }
  }, [stepIndex, isActive]);

  // Main declarative setTimeout countdown tick
  useEffect(() => {
    if (!isActive) return;

    const timer = setTimeout(() => {
      if (timeLeft <= 1) {
        const currentMode = BREATHING_MODES[modeIndex];
        const nextStep = (stepIndex + 1) % currentMode.sequence.length;
        setStepIndex(nextStep);
        setTimeLeft(currentMode.sequence[nextStep].duration);
      } else {
        setTimeLeft(timeLeft - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isActive, timeLeft, stepIndex, modeIndex]);

  const toggleBreath = () => {
    if (isActive) {
      setIsActive(false);
      setStepIndex(0);
      setTimeLeft(BREATHING_MODES[modeIndex].sequence[0].duration);
    } else {
      setIsActive(true);
    }
  };

  const isSegmentActive = (segIdx) => {
    if (!isActive) return false;
    
    if (modeIndex === 0) {
      // Box Breathing
      return stepIndex === segIdx;
    } else if (modeIndex === 1) {
      // 4-7-8 Calm
      if (segIdx === 0) return stepIndex === 0;
      if (segIdx === 1) return stepIndex === 1;
      if (segIdx === 2 || segIdx === 3) return stepIndex === 2;
    } else if (modeIndex === 2) {
      // Coherent
      if (segIdx === 0 || segIdx === 1) return stepIndex === 0;
      if (segIdx === 2 || segIdx === 3) return stepIndex === 1;
    }
    return false;
  };

  const currentMode = BREATHING_MODES[modeIndex];
  const activeStep = currentMode.sequence[stepIndex];

  return (
    <div className="glass-panel p-6 flex flex-col items-center justify-between h-[420px] relative overflow-hidden animate-fade-in">
      {/* Title Header */}
      <div className="text-center w-full">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1 flex items-center justify-center gap-1.5">
          <Flower2 size={14} className="text-[var(--primary)]" />
          Mindful Breath
        </h3>
        <p className="text-[10px] text-[var(--text-muted)]">{currentMode.desc}</p>
        
        {/* Mode Selector Buttons */}
        <div className="flex gap-2 justify-center mt-3.5 w-full">
          {BREATHING_MODES.map((mode, idx) => {
            const IconComponent = mode.icon;
            const isSelected = modeIndex === idx;
            return (
              <button
                key={mode.name}
                disabled={isActive}
                onClick={() => {
                  setModeIndex(idx);
                  setStepIndex(0);
                  setTimeLeft(mode.sequence[0].duration);
                }}
                className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all border flex items-center gap-1.5 ${
                  isSelected 
                    ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white border-transparent shadow-md' 
                    : 'bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--primary-glow)] disabled:opacity-50'
                }`}
              >
                <IconComponent size={11} />
                {mode.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Breathing Loop Graphic */}
      <div className="relative my-3 flex items-center justify-center w-48 h-48 select-none">
        <svg viewBox="0 0 160 160" className="w-full h-full">
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Inactive Base Box */}
          <path
            d="M 45,25 L 115,25 A 20,20 0 0 1 135,45 L 135,115 A 20,20 0 0 1 115,135 L 45,135 A 20,20 0 0 1 25,115 L 25,45 A 20,20 0 0 1 45,25 Z"
            fill="none"
            stroke="var(--border)"
            strokeWidth="1.5"
            opacity="0.6"
          />

          {/* Clockwise Segments */}
          {/* Segment 0: Top (Inhale) */}
          <path
            d="M 25,45 A 20,20 0 0 1 45,25 L 115,25 A 20,20 0 0 1 135,45"
            fill="none"
            stroke={isSegmentActive(0) ? "var(--primary)" : "transparent"}
            strokeWidth="3.5"
            strokeLinecap="round"
            filter={isSegmentActive(0) ? "url(#glow)" : "none"}
            className="transition-all duration-300"
          />
          {/* Segment 1: Right (Hold In) */}
          <path
            d="M 135,45 L 135,115 A 20,20 0 0 1 115,135"
            fill="none"
            stroke={isSegmentActive(1) ? "var(--primary)" : "transparent"}
            strokeWidth="3.5"
            strokeLinecap="round"
            filter={isSegmentActive(1) ? "url(#glow)" : "none"}
            className="transition-all duration-300"
          />
          {/* Segment 2: Bottom (Exhale) */}
          <path
            d="M 115,135 L 45,135 A 20,20 0 0 1 25,115"
            fill="none"
            stroke={isSegmentActive(2) ? "var(--secondary)" : "transparent"}
            strokeWidth="3.5"
            strokeLinecap="round"
            filter={isSegmentActive(2) ? "url(#glow)" : "none"}
            className="transition-all duration-300"
          />
          {/* Segment 3: Left (Hold Out / Exhale End) */}
          <path
            d="M 25,115 L 25,45 A 20,20 0 0 1 45,25"
            fill="none"
            stroke={isSegmentActive(3) ? "var(--secondary)" : "transparent"}
            strokeWidth="3.5"
            strokeLinecap="round"
            filter={isSegmentActive(3) ? "url(#glow)" : "none"}
            className="transition-all duration-300"
          />

          {/* Directional Chevron Arrows */}
          <path
            d="M 78,21 L 83,25 L 78,29"
            fill="none"
            stroke={isSegmentActive(0) ? "var(--primary)" : "var(--text-muted)"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isSegmentActive(0) ? 1 : 0.4}
          />
          <path
            d="M 131,78 L 135,83 L 139,78"
            fill="none"
            stroke={isSegmentActive(1) ? "var(--primary)" : "var(--text-muted)"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isSegmentActive(1) ? 1 : 0.4}
          />
          <path
            d="M 82,131 L 77,135 L 82,139"
            fill="none"
            stroke={isSegmentActive(2) ? "var(--secondary)" : "var(--text-muted)"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isSegmentActive(2) ? 1 : 0.4}
          />
          {modeIndex === 0 && (
            <path
              d="M 21,83 L 25,77 L 29,83"
              fill="none"
              stroke={isSegmentActive(3) ? "var(--secondary)" : "var(--text-muted)"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isSegmentActive(3) ? 1 : 0.4}
            />
          )}

          {/* Outer Segment Labels */}
          {/* Top Label */}
          <text x="80" y="8" fill={isSegmentActive(0) ? "#10B981" : "var(--text-muted)"} opacity={isSegmentActive(0) ? 1 : 0.5} fontSize="7.5" fontWeight="bold" textAnchor="middle">
            {modeIndex === 2 ? '5s' : '4s'}
          </text>
          <text x="80" y="16" fill={isSegmentActive(0) ? "#10B981" : "var(--text-muted)"} opacity={isSegmentActive(0) ? 1 : 0.5} fontSize="6.5" fontWeight="extrabold" textAnchor="middle" letterSpacing="0.5">
            INHALE
          </text>

          {/* Right Label */}
          {modeIndex !== 2 && (
            <>
              <text x="143" y="78" fill={isSegmentActive(1) ? "#8B5CF6" : "var(--text-muted)"} opacity={isSegmentActive(1) ? 1 : 0.5} fontSize="7.5" fontWeight="bold" textAnchor="start">
                {modeIndex === 1 ? '7s' : '4s'}
              </text>
              <text x="143" y="86" fill={isSegmentActive(1) ? "#8B5CF6" : "var(--text-muted)"} opacity={isSegmentActive(1) ? 1 : 0.5} fontSize="6.5" fontWeight="extrabold" textAnchor="start" letterSpacing="0.5">
                HOLD
              </text>
            </>
          )}

          {/* Bottom Label */}
          <text x="80" y="146" fill={isSegmentActive(2) ? "#3B82F6" : "var(--text-muted)"} opacity={isSegmentActive(2) ? 1 : 0.5} fontSize="7.5" fontWeight="bold" textAnchor="middle">
            {modeIndex === 2 ? '5s' : (modeIndex === 1 ? '8s' : '4s')}
          </text>
          <text x="80" y="154" fill={isSegmentActive(2) ? "#3B82F6" : "var(--text-muted)"} opacity={isSegmentActive(2) ? 1 : 0.5} fontSize="6.5" fontWeight="extrabold" textAnchor="middle" letterSpacing="0.5">
            EXHALE
          </text>

          {/* Left Label */}
          {modeIndex === 0 && (
            <>
              <text x="17" y="78" fill={isSegmentActive(3) ? "#06B6D4" : "var(--text-muted)"} opacity={isSegmentActive(3) ? 1 : 0.5} fontSize="7.5" fontWeight="bold" textAnchor="end">
                4s
              </text>
              <text x="17" y="86" fill={isSegmentActive(3) ? "#06B6D4" : "var(--text-muted)"} opacity={isSegmentActive(3) ? 1 : 0.5} fontSize="6.5" fontWeight="extrabold" textAnchor="end" letterSpacing="0.5">
                HOLD
              </text>
            </>
          )}

          {/* Center Countdown Circle with breathing scale animation */}
          <circle
            cx="80"
            cy="80"
            r="28"
            fill="rgba(124, 58, 237, 0.15)"
            stroke="var(--primary)"
            strokeWidth="1.5"
            className="origin-center"
            style={{
              transform: !isActive ? 'scale(1)' : (activeStep.phase === 'inhale' || activeStep.phase === 'hold' ? 'scale(1.25)' : 'scale(0.85)'),
              transformOrigin: '80px 80px',
              transition: `transform ${isActive ? activeStep.duration : 0.5}s ease-in-out`
            }}
          />
          <text x="80" y="77" fill="var(--text)" fontSize="20" fontWeight="800" textAnchor="middle" dominantBaseline="middle">
            {timeLeft}
          </text>
          <text x="80" y="93" fill="var(--primary)" fontSize="6" fontWeight="extrabold" textAnchor="middle" letterSpacing="1">
            SECONDS
          </text>
        </svg>
      </div>

      {/* Phase messages */}
      <div className="text-center min-h-[40px]">
        <h4 className="font-bold text-xs text-[var(--text)] flex items-center justify-center gap-1.5">
          {isActive ? activeStep.label : 'Ready to center your mind?'}
        </h4>
        <p className="text-[9px] text-[var(--text-muted)] mt-0.5">
          {isActive ? activeStep.instruction : 'Select a technique and click Start'}
        </p>
      </div>

      {/* Control Button */}
      <button
        onClick={toggleBreath}
        className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white hover:opacity-90 transition-all rounded-full py-2 px-8 font-bold uppercase tracking-wider text-[10px] shadow-lg flex items-center justify-center gap-2 w-44"
      >
        {isActive ? (
          <>
            <Square size={9} fill="currentColor" />
            Stop Session
          </>
        ) : (
          <>
            <Play size={9} fill="currentColor" />
            Start Breath
          </>
        )}
      </button>
    </div>
  );
}
