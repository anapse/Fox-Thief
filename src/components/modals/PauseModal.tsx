import React from 'react';
import { sounds } from '../../audio/soundManager';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onMainMenu,
  isMuted,
  onToggleSound,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xs wood-board rounded-3xl p-6 flex flex-col items-center border-4 border-amber-950 shadow-2xl relative">
        {/* Header Ribbon */}
        <div className="absolute -top-6 px-6 py-2 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-700 border-3 border-amber-950 shadow-lg">
          <h2 className="font-game text-2xl text-yellow-100 tracking-wider font-extrabold drop-shadow">
            PAUSA
          </h2>
        </div>

        <div className="w-full flex flex-col gap-3 mt-6">
          {/* Reanudar */}
          <button
            onClick={() => {
              sounds.playClick();
              onResume();
            }}
            className="btn-green w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-white font-game text-xl tracking-wide shadow-md active:scale-95 transition-all"
          >
            <span>▶</span>
            <span>REANUDAR</span>
          </button>

          {/* Reiniciar */}
          <button
            onClick={() => {
              sounds.playClick();
              onRestart();
            }}
            className="btn-yellow w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-amber-950 font-game text-lg tracking-wide shadow-md active:scale-95 transition-all"
          >
            <span>🔄</span>
            <span>REINICIAR</span>
          </button>

          {/* Control de Sonido */}
          <button
            onClick={() => {
              onToggleSound();
            }}
            className="btn-blue w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-white font-game text-lg tracking-wide shadow-md active:scale-95 transition-all"
          >
            <span>{isMuted ? '🔇' : '🔊'}</span>
            <span>SONIDO: {isMuted ? 'DESACTIVADO' : 'ACTIVADO'}</span>
          </button>

          {/* Menú Principal */}
          <button
            onClick={() => {
              sounds.playClick();
              onMainMenu();
            }}
            className="btn-wood w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-white font-game text-lg tracking-wide shadow-md active:scale-95 transition-all"
          >
            <span>🏠</span>
            <span>MENÚ PRINCIPAL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
