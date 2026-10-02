import React, { useState, useEffect } from 'react';
import { GameStats } from '../../types/game';
import { isScoreInTop50, savePlayerScore } from '../../utils/leaderboardService';
import { sounds } from '../../audio/soundManager';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  stats: GameStats;
  onContinueToMenu: () => void;
  onViewLeaderboard: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  stats,
  onContinueToMenu,
  onViewLeaderboard,
}) => {
  if (!isOpen) return null;

  const [inTop50, setInTop50] = useState<boolean>(false);
  const [playerName, setPlayerName] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [playerRank, setPlayerRank] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    const qualifies = isScoreInTop50(score);
    setInTop50(qualifies);
    setIsSaved(false);
    setPlayerRank(0);
    setPlayerName('');
    setErrorMessage('');
  }, [isOpen, score]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = playerName.trim();
    if (!trimmed) {
      setErrorMessage('Por favor escribe un nombre válido.');
      return;
    }
    if (trimmed.length < 2) {
      setErrorMessage('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const result = await savePlayerScore(trimmed, score, stats);
      if (result.success) {
        sounds.playBasketSold();
        setPlayerRank(result.rank);
        setIsSaved(true);
      } else {
        setErrorMessage('Error al registrar nombre. Intenta de nuevo.');
      }
    } catch {
      setErrorMessage('Error al conectar. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 select-none">
      <div className="w-full max-w-sm wood-board rounded-3xl p-5 flex flex-col items-center border-4 border-amber-950 shadow-2xl relative text-center">
        {/* Header Ribbon */}
        <div className="px-6 py-2 rounded-2xl bg-gradient-to-b from-red-600 to-red-800 border-3 border-amber-950 shadow-xl -mt-4 mb-3">
          <h2 className="font-game text-2xl sm:text-3xl text-yellow-100 tracking-wider font-extrabold drop-shadow">
            ¡FIN DE LA PARTIDA!
          </h2>
        </div>

        {/* Score Plaque */}
        <div className="w-full bg-amber-950/70 border-2 border-amber-800/80 rounded-2xl p-3 my-2 shadow-inner">
          <span className="text-xs text-amber-300 font-bold uppercase tracking-wider block">
            Puntuación Final
          </span>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-3xl">🪙</span>
            <span className="font-game text-4xl text-yellow-300 drop-shadow-md">
              {score}
            </span>
          </div>
        </div>

        {/* Match Stats Summary */}
        <div className="w-full grid grid-cols-2 gap-2 my-2 text-left">
          <div className="bg-amber-100/90 border border-amber-800/60 rounded-xl p-2 flex items-center gap-2">
            <span className="text-xl">🧺</span>
            <div className="flex flex-col">
              <span className="text-[10px] text-amber-900 font-bold uppercase leading-none">Cestas</span>
              <span className="font-game text-base text-amber-950 leading-tight">{stats.basketsSold}</span>
            </div>
          </div>
          <div className="bg-amber-100/90 border border-amber-800/60 rounded-xl p-2 flex items-center gap-2">
            <span className="text-xl">🦊💥</span>
            <div className="flex flex-col">
              <span className="text-[10px] text-amber-900 font-bold uppercase leading-none">Espantados</span>
              <span className="font-game text-base text-amber-950 leading-tight">{stats.foxesScared}</span>
            </div>
          </div>
        </div>

        {/* TOP 50 FLOW */}
        {inTop50 ? (
          <div className="w-full mt-2">
            {!isSaved ? (
              <form onSubmit={handleSaveName} className="w-full flex flex-col gap-2.5">
                <div className="bg-gradient-to-r from-yellow-500/20 via-amber-400/30 to-yellow-500/20 border-2 border-yellow-400/80 rounded-2xl p-2.5 shadow-md">
                  <span className="font-game text-base sm:text-lg text-yellow-300 font-extrabold tracking-wide drop-shadow block">
                    🏆 ¡ENTRASTE AL TOP 50! 🏆
                  </span>
                  <p className="text-xs text-amber-200 mt-0.5 leading-snug">
                    Tu récord entra en la tabla de mejores granjeros. Escribe tu nombre para guardar tu lugar:
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={playerName}
                    onChange={(e) => {
                      setPlayerName(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Escribe tu Nombre / Apodo"
                    className="w-full px-3 py-2.5 rounded-xl bg-amber-100 border-2 border-amber-900 text-amber-950 font-game text-base text-center placeholder:text-amber-800/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-inner"
                    autoFocus
                  />
                  {errorMessage && (
                    <p className="text-xs text-red-400 font-bold mt-1 leading-tight">
                      ⚠️ {errorMessage}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-green w-full py-3 rounded-2xl font-game text-base sm:text-lg text-white shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>💾</span>
                  <span>{isSaving ? 'GUARDANDO...' : 'GUARDAR EN EL TOP 50'}</span>
                </button>
              </form>
            ) : (
              <div className="w-full flex flex-col gap-2.5 animate-in fade-in duration-300">
                <div className="bg-gradient-to-b from-emerald-600 to-emerald-800 border-2 border-emerald-400 rounded-2xl p-3 text-white shadow-xl">
                  <span className="text-3xl block">🎉👑</span>
                  <h3 className="font-game text-xl text-yellow-200 font-extrabold mt-1 drop-shadow">
                    ¡GUARDADO CON ÉXITO!
                  </h3>
                  <p className="text-sm font-game text-white mt-1">
                    Granjero: <span className="text-yellow-300 font-bold">{playerName}</span>
                  </p>
                  <div className="mt-2 inline-block px-3 py-1 bg-emerald-950/60 rounded-xl border border-emerald-300/40 font-game text-sm text-yellow-300">
                    Posición en el Ranking: #{playerRank}
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      onViewLeaderboard();
                    }}
                    className="btn-yellow flex-1 py-2.5 rounded-2xl font-game text-sm text-amber-950 shadow-md active:scale-95 transition-all"
                  >
                    🏆 VER TOP 50
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      onContinueToMenu();
                    }}
                    className="btn-green flex-1 py-2.5 rounded-2xl font-game text-sm text-white shadow-md active:scale-95 transition-all"
                  >
                    CONTINUAR
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full mt-3 flex flex-col gap-3">
            <p className="text-xs text-amber-200/90 leading-snug">
              ¡Buen intento! Necesitas un puntaje mayor para entrar al Top 50. ¡Inténtalo de nuevo!
            </p>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onContinueToMenu();
              }}
              className="btn-green w-full py-3 rounded-2xl font-game text-lg text-white shadow-xl active:scale-95 transition-all"
            >
              CONTINUAR AL MENÚ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
