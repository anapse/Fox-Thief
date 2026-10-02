import React, { useState, useEffect } from 'react';
import { sounds } from '../../audio/soundManager';
import { GameStats } from '../../types/game';
import { getSavedStats } from '../../utils/storage';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [stats, setStats] = useState<GameStats>(() => getSavedStats());

  useEffect(() => {
    setStats(getSavedStats());
  }, [isOpen]);

  const statItems = [
    {
      label: 'Récord de Monedas',
      value: stats.highScore,
      icon: '🏆',
      highlight: true,
    },
    {
      label: 'Monedas Actuales',
      value: stats.totalCoins,
      icon: '🪙',
    },
    {
      label: 'Huevos Entregados',
      value: stats.eggsDelivered,
      icon: '🥚',
    },
    {
      label: 'Cestas Completadas (x10)',
      value: stats.basketsSold,
      icon: '🧺',
    },
    {
      label: 'Zorros Espantados',
      value: stats.foxesScared,
      icon: '🪴💥',
    },
    {
      label: 'Huevos Robados',
      value: stats.eggsStolen,
      icon: '🦊',
    },
  ];

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm wood-board rounded-3xl p-5 flex flex-col items-center border-4 border-amber-950 shadow-2xl relative">
        {/* Header Ribbon */}
        <div className="px-6 py-1.5 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-700 border-3 border-amber-950 shadow-lg -mt-3 mb-4">
          <h2 className="font-game text-2xl text-yellow-100 tracking-wider font-extrabold drop-shadow">
            MI RÉCORD LOCAL
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-2.5">
          {statItems.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center text-center shadow-md ${
                item.highlight
                  ? 'bg-gradient-to-b from-yellow-200 to-amber-100 border-amber-500 ring-2 ring-yellow-400'
                  : 'bg-amber-100/95 border-amber-800/80'
              }`}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="font-game text-xl sm:text-2xl text-amber-950 font-bold leading-tight">
                {item.value}
              </span>
              <span className="text-[11px] text-amber-900/85 font-medium leading-tight mt-1">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="btn-wood w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-white font-game text-lg tracking-wide shadow-md active:scale-95 transition-all mt-4"
        >
          <span>VOLVER</span>
        </button>
      </div>
    </div>
  );
};
