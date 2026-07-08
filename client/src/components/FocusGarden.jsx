import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Sun, Zap, Orbit, Gem } from 'lucide-react';

export default function FocusGarden() {
  const [harvested, setHarvested] = useState(0);
  const [growthPoints, setGrowthPoints] = useState(0);
  const [stage, setStage] = useState(0); // 0: Sprout, 1: Growing, 2: Tall, 3: Supernova

  useEffect(() => {
    const loadStats = () => {
      const count = parseInt(localStorage.getItem('dreamora_harvested_bamboo') || '0', 10);
      setHarvested(count);
      
      const points = parseInt(localStorage.getItem('dreamora_garden_points') || '0', 10);
      setGrowthPoints(points);
      
      if (points >= 100) {
        setStage(3);
      } else if (points >= 65) {
        setStage(2);
      } else if (points >= 25) {
        setStage(1);
      } else {
        setStage(0);
      }
    };

    loadStats();
    window.addEventListener('storage', loadStats);
    return () => window.removeEventListener('storage', loadStats);
  }, []);

  const waterPlant = () => {
    setGrowthPoints((prev) => {
      let nextPoints = prev + 10;
      let nextStage = stage;
      
      if (nextPoints >= 100) {
        nextPoints = 100;
        nextStage = 3;
      } else if (nextPoints >= 65) {
        nextStage = 2;
      } else if (nextPoints >= 25) {
        nextStage = 1;
      }

      setStage(nextStage);
      localStorage.setItem('dreamora_garden_points', nextPoints.toString());
      return nextPoints;
    });
  };

  const harvestCrystal = () => {
    if (stage === 3) {
      const nextHarvested = harvested + 1;
      setHarvested(nextHarvested);
      setStage(0);
      setGrowthPoints(0);
      localStorage.setItem('dreamora_harvested_bamboo', nextHarvested.toString());
      localStorage.setItem('dreamora_garden_points', '0');
      window.dispatchEvent(new Event('storage'));
    }
  };

  const getStageEmoji = () => {
    switch (stage) {
      case 1: return '🌿';
      case 2: return '🪴';
      case 3: return '🌳✨';
      case 0:
      default:
        return '🌱';
    }
  };

  const getStageName = () => {
    switch (stage) {
      case 1: return 'Bonsai Branch';
      case 2: return 'Styled Bonsai';
      case 3: return 'Majestic Bonsai!';
      case 0:
      default:
        return 'Zen Seedling';
    }
  };

  return (
    <div className="glass-panel p-5 flex flex-col items-center justify-between h-72 relative overflow-hidden animate-fade-in mt-4">
      {/* Background Orbits */}
      <div className="absolute top-2 right-2 text-xs opacity-20 pointer-events-none">🍃</div>
      
      <div className="text-center w-full">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1 flex items-center justify-center gap-1.5">
          <Sparkles size={13} className="text-[var(--primary)]" />
          Zen Garden
        </h3>
        <p className="text-xs text-[var(--text-muted)]">Nurture a majestic bonsai tree with your study focus</p>
      </div>

      {/* Visual Sprout Canvas */}
      <div className="relative my-1.5 flex flex-col items-center justify-center h-28 w-full bg-white/5 backdrop-blur-sm rounded-xl border border-[var(--border)] p-2">
        <div className="text-4xl animate-pulse filter drop-shadow-md select-none">{getStageEmoji()}</div>
        <span className="text-xs font-bold text-[var(--text-muted)] mt-2">{getStageName()}</span>
        <div className="w-2/3 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5 mt-1.5">
          <div 
            className="h-full progress-gradient rounded-full transition-all duration-300"
            style={{ width: `${growthPoints}%` }}
          />
        </div>
      </div>

      {/* Statistics and Actions */}
      <div className="flex justify-between items-center w-full px-2 text-xs">
        <div className="flex items-center gap-1">
          <Trophy size={12} className="text-amber-500" />
          <span className="font-semibold text-[var(--text-muted)]">Bonsais: <span className="font-bold text-[var(--primary)]">{harvested} 🪴</span></span>
        </div>
        <div className="flex gap-2">
          {stage === 3 ? (
            <button
              onClick={harvestCrystal}
              className="glass-button text-[11px] py-1 px-2.5 font-bold uppercase tracking-wider bg-[var(--primary)] text-white hover:opacity-90 transition-all border border-[var(--primary)] rounded-lg flex items-center gap-1"
            >
              <Trophy size={10} /> Harvest
            </button>
          ) : (
            <button
              onClick={waterPlant}
              className="glass-button text-[11px] py-1 px-2.5 font-bold uppercase tracking-wider bg-transparent text-[var(--primary)] hover:bg-[var(--primary-glow)] transition-all border border-[var(--border)] rounded-lg flex items-center gap-1"
              title="Grow bonsai tree via study focus"
            >
              <Sparkles size={10} /> Water Plant
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
