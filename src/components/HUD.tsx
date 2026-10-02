import React, { useEffect, useState } from 'react';
import { sounds } from '../audio/soundManager';

interface HUDProps {
  coins: number;
  basketCount: number;
  basketCapacity: number;
  health: number; // 0.0 to 3.0 in steps of 0.5
  maxHealth?: number;
  onOpenPause: () => void;
}

// Component to render individual Heart (Full, Half, or Empty)
const HeartIcon: React.FC<{ fillState: 'full' | 'half' | 'empty' }> = ({ fillState }) => {
  if (fillState === 'full') {
    return (
      <span className="text-xs sm:text-sm leading-none drop-shadow-[0_2px_4px_rgba(225,29,72,0.6)] animate-in zoom-in duration-200">
        ❤️
      </span>
    );
  }
  if (fillState === 'half') {
    return (
      <div className="relative w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center">
        {/* Base empty heart */}
        <span className="absolute inset-0 text-xs sm:text-sm opacity-40 leading-none">🖤</span>
        {/* Left half filled */}
        <span className="absolute inset-0 text-xs sm:text-sm leading-none overflow-hidden w-[52%]">❤️</span>
      </div>
    );
  }
  return (
    <span className="text-xs sm:text-sm leading-none opacity-30 grayscale">
      🖤
    </span>
  );
};

export const HUD: React.FC<HUDProps> = ({
  coins,
  basketCount,
  basketCapacity,
  health = 3.0,
  onOpenPause,
}) => {
  const [coinPop, setCoinPop] = useState(false);
  const [eggPop, setEggPop] = useState(false);
  const [heartHurt, setHeartHurt] = useState(false);
  const isFull = basketCount >= basketCapacity;

  useEffect(() => {
    setCoinPop(true);
    const t = setTimeout(() => setCoinPop(false), 300);
    return () => clearTimeout(t);
  }, [coins]);

  useEffect(() => {
    setEggPop(true);
    const t = setTimeout(() => setEggPop(false), 300);
    return () => clearTimeout(t);
  }, [basketCount]);

  useEffect(() => {
    setHeartHurt(true);
    const t = setTimeout(() => setHeartHurt(false), 350);
    return () => clearTimeout(t);
  }, [health]);

  const progressPercent = Math.min(100, Math.round((basketCount / basketCapacity) * 100));

  // Determine heart slot states (3 hearts max)
  const getHeartFill = (slotIndex: number): 'full' | 'half' | 'empty' => {
    const value = health - slotIndex;
    if (value >= 1.0) return 'full';
    if (value >= 0.5) return 'half';
    return 'empty';
  };

  return (
    <div className="absolute top-0 left-0 right-0 w-full px-2 py-1.5 sm:px-3 sm:py-2 flex items-center justify-between gap-1 sm:gap-2 pointer-events-none z-30 select-none box-border">
      {/* 1. SINGLE VERTICAL COMBINED PANEL: [ CORAZONES + MONEDAS ] */}
      {/* 
        ┌──────────────────┐
        │ ❤️ ❤️ ❤️         │
        │ 🪙 310           │
        └──────────────────┘
      */}
      <div
        className={`pointer-events-auto flex flex-col justify-center gap-1 px-2.5 py-1.5 rounded-2xl bg-gradient-to-b from-amber-900/95 via-stone-900/95 to-amber-950/95 border-2 ${
          heartHurt
            ? 'border-rose-500 ring-2 ring-rose-500 scale-105'
            : coinPop
            ? 'border-yellow-400 ring-2 ring-yellow-400 scale-105'
            : 'border-amber-700/80'
        } shadow-xl shrink-0 transition-transform duration-200 min-w-[95px] sm:min-w-[110px]`}
      >
        {/* Row 1: Hearts */}
        <div className="flex items-center justify-center gap-1">
          <HeartIcon fillState={getHeartFill(0)} />
          <HeartIcon fillState={getHeartFill(1)} />
          <HeartIcon fillState={getHeartFill(2)} />
        </div>

        {/* Row 2: Coin Icon + Amount */}
        <div className="flex items-center justify-center gap-1.5 pt-0.5 border-t border-amber-800/40">
          <span className="text-xs sm:text-sm leading-none">🪙</span>
          <span className="font-game text-xs sm:text-sm text-yellow-300 font-extrabold tracking-wide drop-shadow leading-none">
            {coins}
          </span>
        </div>
      </div>

      {/* 2. INDEPENDENT EGGS BASKET PANEL: [ 🥚 0 / 10 ] */}
      <div
        className={`pointer-events-auto flex flex-col items-center justify-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl bg-gradient-to-b from-amber-900/95 to-amber-950/95 border-2 ${
          isFull
            ? 'border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.6)] animate-bounce'
            : 'border-amber-700/80'
        } shadow-xl shrink-0 transition-transform duration-200 ${eggPop ? 'scale-105' : 'scale-100'}`}
      >
        <div className="flex items-center gap-1">
          <span className="text-xs sm:text-sm leading-none">🥚</span>
          <span className="font-game text-xs sm:text-base text-white tracking-wider drop-shadow leading-none">
            {basketCount} <span className="text-amber-300/80 text-[10px] sm:text-xs font-sans">/ {basketCapacity}</span>
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-12 sm:w-16 h-1 bg-amber-950 rounded-full overflow-hidden border border-amber-800/80 mt-1">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isFull
                ? 'bg-gradient-to-r from-yellow-400 to-amber-300 animate-pulse'
                : 'bg-gradient-to-r from-amber-400 to-yellow-300'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 3. INDEPENDENT PAUSE BUTTON: [ ⏸️ ] */}
      <div className="pointer-events-auto flex items-center shrink-0">
        <button
          onClick={() => {
            sounds.playClick();
            onOpenPause();
          }}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 active:scale-90 border-2 border-amber-950 shadow-xl transition-all flex items-center justify-center text-white"
          title="Pausar juego"
          aria-label="Pausa"
        >
          <div className="flex items-center gap-0.5 sm:gap-1">
            <div className="w-1 h-3 sm:h-3.5 bg-white rounded-sm shadow-sm" />
            <div className="w-1 h-3 sm:h-3.5 bg-white rounded-sm shadow-sm" />
          </div>
        </button>
      </div>
    </div>
  );
};
