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
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-4 sm:p-5 bg-gradient-to-b from-amber-950/75 via-stone-900/50 to-amber-950/85 backdrop-blur-[2px] select-none">
      {/* Top row: Contact (Left) & Sound (Right) */}
      <div className="w-full flex items-center justify-between max-w-xs sm:max-w-sm pt-1">
        <button
          onClick={() => {
            sounds.playClick();
            onOpenContact();
          }}
          className="btn-wood px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 text-white font-game font-bold text-xs sm:text-sm tracking-wide shadow-md active:scale-95 transition-all"
        >
          <span>✉️</span>
          <span>CONTÁCTANOS</span>
        </button>

        <button
          onClick={() => {
            onToggleSound();
          }}
          className="w-10 h-10 rounded-2xl wood-board flex items-center justify-center text-white font-game shadow-md active:scale-95 transition-all border-2 border-amber-950"
          title={isMuted ? 'Activar Sonido' : 'Silenciar'}
        >
          <span className="text-xl">{isMuted ? '🔇' : '🔊'}</span>
        </button>
      </div>

      {/* Center: Official Logo Asset (Clean Proportions) */}
      <div className="flex flex-col items-center my-auto text-center max-w-[240px] sm:max-w-[280px]">
        <img
          src={resolveAssetUrl('assets/sprites/logo.png')}
          alt="Fox Thief Logo Oficial"
          className="w-full max-h-44 sm:max-h-52 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] animate-float-gentle"
        />
      </div>

      {/* Main Buttons stack (Compact and Balanced) */}
      <div className="w-full max-w-[260px] sm:max-w-[280px] flex flex-col gap-2.5 mb-2">
        <button
          onClick={() => {
            sounds.playClick();
            onPlay();
          }}
          className="btn-green w-full py-3 rounded-2xl flex items-center justify-center gap-2.5 text-white font-game text-xl sm:text-2xl tracking-wider shadow-xl active:scale-95 transition-all animate-pulse-glow"
        >
          <span className="text-2xl">▶</span>
          <span>JUGAR</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onOpenLeaderboard();
          }}
          className="btn-yellow w-full py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-2 text-amber-950 font-game text-sm sm:text-base tracking-wide shadow-md active:scale-95 transition-all"
        >
          <span className="text-lg">🏆</span>
          <span>TOP 50 JUGADORES</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onOpenHowToPlay();
          }}
          className="btn-blue w-full py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-2 text-white font-game text-sm sm:text-base tracking-wide shadow-md active:scale-95 transition-all"
        >
          <span className="text-lg">❓</span>
          <span>CÓMO JUGAR</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onOpenStats();
          }}
          className="btn-wood w-full py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-2 text-white font-game text-sm sm:text-base tracking-wide shadow-md active:scale-95 transition-all"
        >
          <span className="text-lg">📊</span>
          <span>MI RÉCORD LOCAL</span>
        </button>
      </div>

      <p className="font-game text-[10px] text-amber-300/70 tracking-wider">
        FOX THIEF • EDICIÓN OFICIAL
      </p>
    </div>
  );
};
