import React from 'react';
import { sounds } from '../audio/soundManager';
import { resolveAssetUrl } from '../game/AssetManager';

interface MainMenuProps {
  onPlay: () => void;
  onOpenHowToPlay: () => void;
  onOpenLeaderboard: () => void;
  onOpenStats: () => void;
  onOpenContact: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onPlay,
  onOpenHowToPlay,
  onOpenLeaderboard,
  onOpenStats,
  onOpenContact,
  isMuted,
  onToggleSound,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between items-center px-3 py-2 sm:px-6 sm:py-4 bg-gradient-to-b from-amber-950/80 via-stone-900/60 to-amber-950/90 backdrop-blur-[2px] select-none overflow-y-auto">
      {/* Top row: Contact (Left) & Sound (Right) */}
      <div className="w-full flex items-center justify-between max-w-[320px] pt-0.5 shrink-0">
        <button
          onClick={() => {
            sounds.playClick();
            onOpenContact();
          }}
          className="btn-wood px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl sm:rounded-2xl flex items-center gap-1.5 text-white font-game font-bold text-xs tracking-wide shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <span>✉️</span>
          <span>CONTÁCTANOS</span>
        </button>

        <button
          onClick={() => {
            onToggleSound();
          }}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl wood-board flex items-center justify-center text-white font-game shadow-md active:scale-95 transition-all border-2 border-amber-950 cursor-pointer"
          title={isMuted ? 'Activar Sonido' : 'Silenciar'}
        >
          <span className="text-base sm:text-xl">{isMuted ? '🔇' : '🔊'}</span>
        </button>
      </div>

      {/* Center: Official Logo Asset (Clean Proportions, Flexible & Scaleable) */}
      <div className="flex flex-col items-center justify-center my-auto py-1 shrink min-h-0">
        <img
          src={resolveAssetUrl('assets/sprites/logo.png')}
          alt="Fox Thief Logo Oficial"
          className="max-h-24 sm:max-h-40 max-w-[200px] sm:max-w-[260px] object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] animate-float-gentle"
        />
      </div>

      {/* Main Buttons stack (Compact, Ergonomic & Visible on all Mobile Screens) */}
      <div className="w-full max-w-[260px] sm:max-w-[280px] flex flex-col gap-1.5 sm:gap-2.5 pb-1 shrink-0">
        <button
          onClick={() => {
            sounds.playClick();
            onPlay();
          }}
          className="btn-green w-full py-2 sm:py-3.5 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 text-white font-game text-lg sm:text-2xl tracking-wider shadow-xl active:scale-95 transition-all animate-pulse-glow cursor-pointer"
        >
          <span className="text-xl sm:text-2xl">▶</span>
          <span>JUGAR</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onOpenLeaderboard();
          }}
          className="btn-yellow w-full py-1.5 sm:py-2.5 rounded-xl flex items-center justify-center gap-2 text-amber-950 font-game text-xs sm:text-sm font-extrabold tracking-wide shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <span className="text-base">🏆</span>
          <span>TOP 50 JUGADORES</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onOpenHowToPlay();
          }}
          className="btn-blue w-full py-1.5 sm:py-2 rounded-xl flex items-center justify-center gap-2 text-white font-game text-xs sm:text-sm font-bold tracking-wide shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <span className="text-base">❓</span>
          <span>CÓMO JUGAR</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onOpenStats();
          }}
          className="btn-wood w-full py-1.5 sm:py-2 rounded-xl flex items-center justify-center gap-2 text-white font-game text-xs sm:text-sm font-bold tracking-wide shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <span className="text-base">📊</span>
          <span>MI RÉCORD LOCAL</span>
        </button>
      </div>

      {/* Footer text */}
      <p className="font-game text-[9px] sm:text-[10px] text-amber-300/70 tracking-wider text-center shrink-0">
        FOX THIEF • EDICIÓN OFICIAL
      </p>
    </div>
  );
};
