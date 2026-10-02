import React, { useState, useEffect } from 'react';
import { sounds } from '../../audio/soundManager';
import { getLocalLeaderboard, fetchTop50Ranking } from '../../utils/leaderboardService';
import { PlayerRank } from '../../types/game';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerCoins?: number;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [ranks, setRanks] = useState<PlayerRank[]>(() => getLocalLeaderboard());
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      // 1. Instantly display whatever is cached locally
      setRanks(getLocalLeaderboard());

      // 2. Fetch live data directly from Firebase Firestore
      setLoading(true);
      fetchTop50Ranking()
        .then((liveRanks) => {
          if (Array.isArray(liveRanks)) {
            setRanks(liveRanks);
          }
        })
        .catch((err) => {
          console.warn('Error retrieving live leaderboard:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-sm wood-board rounded-3xl p-5 flex flex-col items-center border-4 border-amber-950 shadow-2xl relative max-h-[92vh]">
        {/* Header Ribbon */}
        <div className="px-6 py-1.5 rounded-2xl bg-gradient-to-b from-yellow-500 to-amber-600 border-3 border-amber-950 shadow-lg -mt-3 mb-3">
          <h2 className="font-game text-xl sm:text-2xl text-amber-950 tracking-wider font-extrabold drop-shadow">
            TOP 50 JUGADORES
          </h2>
        </div>

        {/* Subtitle */}
        <p className="text-[11px] text-amber-200 mb-2 font-medium text-center">
          Tabla de clasificación oficial de Fox Thief
        </p>

        {/* Scrollable List or Empty State */}
        <div className="w-full flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 my-1 max-h-[58vh]">
          {loading && ranks.length === 0 ? (
            <div className="w-full py-8 flex flex-col items-center justify-center text-center my-auto">
              <span className="text-3xl animate-spin mb-2">⏳</span>
              <span className="font-game text-xs text-amber-200">Cargando clasificación...</span>
            </div>
          ) : ranks.length === 0 ? (
            <div className="w-full py-8 px-4 flex flex-col items-center justify-center text-center bg-amber-950/40 rounded-2xl border border-amber-800/60 my-auto">
              <span className="text-4xl mb-2">🌾</span>
              <span className="font-game text-sm text-yellow-300 font-bold block">
                ¡TABLA DE POSICIONES VACÍA!
              </span>
              <p className="text-xs text-amber-200/90 mt-1 leading-relaxed max-w-[220px]">
                Aún no hay registros de puntuación. ¡Juega una partida para registrar el primer récord!
              </p>
            </div>
          ) : (
            ranks.map((p) => {
              const isTop3 = p.rank <= 3;
              const rankBadgeColor =
                p.rank === 1
                  ? 'bg-yellow-400 text-yellow-950 border-yellow-200'
                  : p.rank === 2
                  ? 'bg-slate-300 text-slate-900 border-white'
                  : p.rank === 3
                  ? 'bg-amber-600 text-amber-100 border-amber-400'
                  : 'bg-amber-900/60 text-amber-200 border-amber-700';

              return (
                <div
                  key={`${p.rank}-${p.name}`}
                  className={`flex items-center justify-between p-2 sm:p-2.5 rounded-2xl border-2 transition-all ${
                    p.isPlayer
                      ? 'bg-gradient-to-r from-yellow-200 to-amber-100 border-amber-500 shadow-md ring-2 ring-yellow-400'
                      : 'bg-amber-100/90 border-amber-800/60 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {/* Rank Badge */}
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-game font-bold text-xs border shadow ${rankBadgeColor}`}
                    >
                      {isTop3 ? (p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉') : `#${p.rank}`}
                    </div>

                    {/* Avatar */}
                    <span className="text-lg">{p.avatar}</span>

                    {/* Name */}
                    <span
                      className={`font-game text-xs sm:text-sm tracking-wide ${
                        p.isPlayer ? 'text-amber-950 font-extrabold' : 'text-stone-800'
                      }`}
                    >
                      {p.name}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-1 font-game text-xs sm:text-sm text-amber-950 font-bold">
                    <span>🪙</span>
                    <span>{p.score.toLocaleString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="btn-wood w-full py-2.5 rounded-2xl flex items-center justify-center gap-2 text-white font-game text-base tracking-wide shadow-md active:scale-95 transition-all mt-3 cursor-pointer"
        >
          CERRAR
        </button>
      </div>
    </div>
  );
};
