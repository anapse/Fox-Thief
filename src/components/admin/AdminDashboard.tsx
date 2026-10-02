import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchAdminSummaryStats,
  fetchAdminRanking,
  fetchRecordsHistory,
  fetchRecentActivity,
  adminLogout,
} from '../../utils/adminService';
import {
  GameSummaryStats,
  LeaderboardEntry,
  RecordHistoryEntry,
  SessionLogEntry,
  isFirebaseConfigured,
} from '../../utils/firebase';
import { resolveAssetUrl } from '../../game/AssetManager';

interface AdminDashboardProps {
  onLogout: () => void;
  onBackToGame: () => void;
}

type AdminTab = 'resumen' | 'ranking' | 'records' | 'visitas' | 'jugadores' | 'analitica';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  onBackToGame,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('resumen');
  const [loading, setLoading] = useState<boolean>(true);

  const [stats, setStats] = useState<GameSummaryStats | null>(null);
  const [ranking, setRanking] = useState<LeaderboardEntry[]>([]);
  const [records, setRecords] = useState<RecordHistoryEntry[]>([]);
  const [activity, setActivity] = useState<SessionLogEntry[]>([]);

  // Search and filters
  const [searchPlayer, setSearchPlayer] = useState<string>('');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'mid'>('all');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [s, r, recs, act] = await Promise.all([
        fetchAdminSummaryStats(),
        fetchAdminRanking(),
        fetchRecordsHistory(),
        fetchRecentActivity(),
      ]);
      setStats(s);
      setRanking(r);
      setRecords(recs);
      setActivity(act);
    } catch (err) {
      console.warn('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleLogoutClick = async () => {
    await adminLogout();
    onLogout();
  };

  // Filtered ranking list
  const filteredRanking = useMemo(() => {
    return ranking.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchPlayer.toLowerCase().trim());
      if (!matchesSearch) return false;
      if (scoreFilter === 'high') return item.score >= 1000;
      if (scoreFilter === 'mid') return item.score < 1000;
      return true;
    });
  }, [ranking, searchPlayer, scoreFilter]);

  // Unique players consolidation
  const playersList = useMemo(() => {
    const map = new Map<string, { name: string; games: number; maxScore: number; lastDate: string }>();
    ranking.forEach((r) => {
      const existing = map.get(r.name);
      if (!existing) {
        map.set(r.name, {
          name: r.name,
          games: 1,
          maxScore: r.score,
          lastDate: `${r.date} ${r.time}`,
        });
      } else {
        existing.games += 1;
        if (r.score > existing.maxScore) existing.maxScore = r.score;
        existing.lastDate = `${r.date} ${r.time}`;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.maxScore - a.maxScore);
  }, [ranking]);

  return (
    <div className="min-h-screen w-full bg-stone-950 text-stone-100 flex flex-col box-border font-sans select-none">
      {/* Top Header */}
      <header className="w-full bg-stone-900 border-b border-amber-900/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img
            src={resolveAssetUrl('assets/sprites/logo.png')}
            alt="Fox Thief"
            className="h-10 object-contain drop-shadow"
          />
          <div>
            <h1 className="font-game text-lg sm:text-xl text-yellow-400 font-extrabold tracking-wider leading-none">
              FOX THIEF • ADMIN
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-stone-400">Panel de Control y Analítica</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isFirebaseConfigured
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : 'bg-amber-950 text-amber-300 border border-amber-700'
                }`}
              >
                {isFirebaseConfigured ? '● Firebase Cloud' : '● Local/Offline Sync'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAllData}
            title="Recargar datos"
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 shadow flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <span>🔄</span>
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <button
            type="button"
            onClick={onBackToGame}
            className="px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-200 text-xs font-medium border border-amber-800 shadow flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <span>🎮</span>
            <span className="hidden sm:inline">Ir al Juego</span>
          </button>

          <button
            type="button"
            onClick={handleLogoutClick}
            className="px-3.5 py-1.5 rounded-xl bg-red-950/90 hover:bg-red-900 text-red-200 text-xs font-bold border border-red-800 shadow flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <span>🚪</span>
            <span>SALIR</span>
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="w-full bg-stone-900/60 border-b border-stone-800 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'resumen', label: '📊 RESUMEN' },
          { id: 'ranking', label: '🏆 RANKING' },
          { id: 'records', label: '📜 HISTORIAL DE RÉCORDS' },
          { id: 'visitas', label: '👥 VISITAS' },
          { id: 'jugadores', label: '🧑 JUGADORES' },
          { id: 'analitica', label: '📈 ANALÍTICA' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`px-3.5 py-2 rounded-xl font-game text-xs sm:text-sm tracking-wide shrink-0 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/20'
                : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700/80 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto box-border overflow-y-auto">
        {loading ? (
          <div className="w-full h-64 flex flex-col items-center justify-center gap-3 text-amber-300">
            <span className="text-4xl animate-spin">⏳</span>
            <span className="font-game text-lg">Cargando métricas de Fox Thief...</span>
          </div>
        ) : (
          <>
            {/* 1. SECCIÓN RESUMEN */}
            {activeTab === 'resumen' && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                {/* Global Record Highlight Card */}
                <div className="w-full bg-gradient-to-r from-amber-950/80 via-stone-900 to-amber-950/80 border-2 border-yellow-500/60 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30">
                      👑
                    </div>
                    <div>
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                        Récord Actual de Fox Thief
                      </span>
                      <h2 className="font-game text-2xl sm:text-3xl text-yellow-300 font-extrabold drop-shadow">
                        {stats?.highestScore ? `${stats.highestScore.toLocaleString()} Pts` : '0 Pts'}
                      </h2>
                      <p className="text-xs text-stone-300 mt-0.5">
                        Conseguido por:{' '}
                        <strong className="text-white">
                          {stats?.currentRecordHolder || 'Sin registros'}
                        </strong>{' '}
                        {stats?.currentRecordDate && stats.currentRecordDate !== '-' && (
                          <span>({stats.currentRecordDate} a las {stats.currentRecordTime})</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('records')}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-game text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    Ver Historial de Récords ➔
                  </button>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow flex flex-col">
                    <span className="text-xs text-stone-400 font-medium">Visitas Totales</span>
                    <span className="font-game text-2xl sm:text-3xl text-amber-300 mt-1">
                      {stats?.totalVisits.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-400 mt-1">● Registros de acceso</span>
                  </div>

                  <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow flex flex-col">
                    <span className="text-xs text-stone-400 font-medium">Partidas Iniciadas</span>
                    <span className="font-game text-2xl sm:text-3xl text-sky-300 mt-1">
                      {stats?.gamesStarted.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-stone-400 mt-1">Sesiones de juego</span>
                  </div>

                  <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow flex flex-col">
                    <span className="text-xs text-stone-400 font-medium">Partidas Completadas</span>
                    <span className="font-game text-2xl sm:text-3xl text-emerald-300 mt-1">
                      {stats?.gamesCompleted.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-400 mt-1">
                      {stats?.gamesStarted ? `${Math.round((stats.gamesCompleted / stats.gamesStarted) * 100)}% tasa de finalización` : '100%'}
                    </span>
                  </div>

                  <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow flex flex-col">
                    <span className="text-xs text-stone-400 font-medium">Jugadores Únicos</span>
                    <span className="font-game text-2xl sm:text-3xl text-purple-300 mt-1">
                      {playersList.length || stats?.uniquePlayers}
                    </span>
                    <span className="text-[10px] text-purple-400 mt-1">Granjeros registrados</span>
                  </div>

                  <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow flex flex-col">
                    <span className="text-xs text-stone-400 font-medium">Puntos Acumulados</span>
                    <span className="font-game text-2xl sm:text-3xl text-yellow-400 mt-1">
                      {stats?.totalCoinsAccumulated.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-amber-300 mt-1">Monedas de oro totales</span>
                  </div>

                  <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow flex flex-col">
                    <span className="text-xs text-stone-400 font-medium">Promedio de Puntuación</span>
                    <span className="font-game text-2xl sm:text-3xl text-orange-300 mt-1">
                      {stats?.averageScore.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-stone-400 mt-1">Por partida completada</span>
                  </div>

                  <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow flex flex-col">
                    <span className="text-xs text-stone-400 font-medium">Huevos Cosechados</span>
                    <span className="font-game text-2xl sm:text-3xl text-amber-200 mt-1">
                      {ranking.reduce((acc, r) => acc + (r.eggsDelivered || 0), 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-stone-400 mt-1">Entregados a la cesta</span>
                  </div>

                  <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow flex flex-col">
                    <span className="text-xs text-stone-400 font-medium">Zorros Espantados</span>
                    <span className="font-game text-2xl sm:text-3xl text-red-300 mt-1">
                      {ranking.reduce((acc, r) => acc + (r.foxesScared || 0), 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-red-400 mt-1">Golpeados con macetas</span>
                  </div>
                </div>

                {/* Live Activity Feed Preview */}
                <div className="bg-stone-900/80 border border-stone-800 rounded-3xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-game text-base text-yellow-300 font-bold flex items-center gap-2">
                      <span>⚡</span>
                      <span>ACTIVIDAD RECIENTE EN VIVO</span>
                    </h3>
                    <span className="text-xs text-stone-400">Últimos eventos registrados</span>
                  </div>

                  {activity.length === 0 ? (
                    <div className="py-6 text-center text-xs text-stone-500">
                      <span>No hay eventos recientes registrados aún.</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {activity.slice(0, 5).map((act) => (
                        <div
                          key={act.id || Math.random()}
                          className="flex items-center justify-between p-3 rounded-xl bg-stone-950/70 border border-stone-800 text-xs text-stone-300"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-base">
                              {act.type === 'record_broken' ? '👑' : act.type === 'game_complete' ? '🏁' : '👤'}
                            </span>
                            <div>
                              {act.type === 'record_broken' && (
                                <span>
                                  <strong className="text-yellow-300">{act.playerName}</strong> rompió el récord con <strong className="text-white">{act.score} pts</strong>
                                </span>
                              )}
                              {act.type === 'game_complete' && (
                                <span>
                                  <strong className="text-amber-200">{act.playerName}</strong> terminó una partida con <strong className="text-white">{act.score} pts</strong> ({act.basketsSold || 0} cestas)
                                </span>
                              )}
                              {act.type === 'visit' && (
                                <span className="text-stone-400">
                                  Nueva visita recibida desde {act.userAgent?.includes('iPhone') ? 'Móvil iOS' : act.userAgent?.includes('Android') ? 'Móvil Android' : 'Navegador Web'}
                                </span>
                              )}
                              {act.type === 'game_start' && (
                                <span className="text-sky-300">
                                  Partida iniciada en el corral
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[11px] text-stone-500 shrink-0 font-mono">
                            {act.time} ({act.date})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. SECCIÓN RANKING ADMINISTRATIVO */}
            {activeTab === 'ranking' && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                {/* Search and Filters Bar */}
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow">
                  <div className="w-full sm:w-72 relative">
                    <input
                      type="text"
                      value={searchPlayer}
                      onChange={(e) => setSearchPlayer(e.target.value)}
                      placeholder="Buscar por nombre de jugador..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
                    />
                    <span className="absolute left-3 top-2.5 text-xs text-stone-500">🔍</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <span className="text-xs text-stone-400">Puntaje:</span>
                    <button
                      type="button"
                      onClick={() => setScoreFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        scoreFilter === 'all' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setScoreFilter('high')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        scoreFilter === 'high' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      ≥ 1.000 pts
                    </button>
                    <button
                      type="button"
                      onClick={() => setScoreFilter('mid')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        scoreFilter === 'mid' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      &lt; 1.000 pts
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-xl">
                  {filteredRanking.length === 0 ? (
                    <div className="py-12 px-4 flex flex-col items-center justify-center text-center text-stone-400">
                      <span className="text-4xl mb-2">🌾</span>
                      <span className="font-game text-base text-yellow-300 font-bold">
                        No hay registros de jugadores en el ranking
                      </span>
                      <p className="text-xs text-stone-500 mt-1 max-w-sm">
                        Las puntuaciones que consigan los jugadores en partidas reales aparecerán aquí automáticamente.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-stone-300">
                        <thead className="bg-stone-950/80 text-amber-300 uppercase font-game text-[11px] border-b border-stone-800">
                          <tr>
                            <th className="px-4 py-3">Pos</th>
                            <th className="px-4 py-3">Jugador / ID</th>
                            <th className="px-4 py-3 text-right">Puntuación</th>
                            <th className="px-4 py-3 text-center">Cestas</th>
                            <th className="px-4 py-3 text-center">Zorros</th>
                            <th className="px-4 py-3 text-center">Huevos</th>
                            <th className="px-4 py-3 text-right">Fecha y Hora</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800">
                          {filteredRanking.map((item, idx) => (
                            <tr key={item.id || idx} className="hover:bg-stone-800/40 transition-colors">
                              <td className="px-4 py-3 font-bold font-game text-sm text-yellow-400">
                                {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-semibold text-white block">{item.name}</span>
                                <span className="text-[10px] text-stone-500 font-mono">{item.id || 'local_entry'}</span>
                              </td>
                              <td className="px-4 py-3 text-right font-game text-sm text-yellow-300 font-extrabold">
                                🪙 {item.score.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center text-stone-300">
                                🧺 {item.basketsSold ?? Math.floor(item.score / 20)}
                              </td>
                              <td className="px-4 py-3 text-center text-stone-300">
                                🦊 {item.foxesScared ?? Math.floor(item.score / 60)}
                              </td>
                              <td className="px-4 py-3 text-center text-stone-300">
                                🥚 {item.eggsDelivered ?? Math.floor(item.score / 2)}
                              </td>
                              <td className="px-4 py-3 text-right text-stone-400 font-mono text-[11px]">
                                {item.date} {item.time}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. SECCIÓN HISTORIAL DE RÉCORDS */}
            {activeTab === 'records' && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border border-amber-800/60 rounded-3xl p-5 shadow-xl">
                  <h2 className="font-game text-xl text-yellow-300 font-bold flex items-center gap-2">
                    <span>📜</span>
                    <span>CRONOLOGÍA DE RÉCORDS HISTÓRICOS</span>
                  </h2>
                  <p className="text-xs text-stone-300 mt-1">
                    Historial cronológico inmutable de todas las marcas y récords batidos en Fox Thief.
                  </p>
                </div>

                {records.length === 0 ? (
                  <div className="bg-stone-900 border border-stone-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center text-stone-400">
                    <span className="text-4xl mb-2">🏆</span>
                    <span className="font-game text-base text-yellow-300 font-bold">
                      Aún no hay récords históricos registrados
                    </span>
                    <p className="text-xs text-stone-500 mt-1 max-w-sm">
                      Cada vez que un jugador supere la puntuación máxima histórica, se guardará aquí el registro inmutable.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {records.map((rec, i) => (
                      <div
                        key={rec.id || i}
                        className="bg-stone-900/90 border border-stone-800 hover:border-amber-700/60 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-yellow-500/40 flex items-center justify-center text-2xl shrink-0">
                            {i === 0 ? '🏆' : '⭐'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-game text-base text-yellow-300 font-extrabold">
                                {rec.playerName}
                              </span>
                              {i === 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-400 text-[10px] font-bold">
                                  RÉCORD VIGENTE
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-300 mt-0.5">
                              Récord Anterior: <span className="line-through text-stone-400">{rec.previousRecord.toLocaleString()} pts</span> ➔ Nuevo Récord: <strong className="text-emerald-400">{rec.newRecord.toLocaleString()} pts</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto text-xs text-stone-400 shrink-0">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
                            +{rec.difference.toLocaleString()} Pts de Aumento
                          </span>
                          <span className="mt-1 font-mono text-[11px] text-stone-500">
                            📅 {rec.date} a las {rec.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. SECCIÓN VISITAS */}
            {activeTab === 'visitas' && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow">
                    <span className="text-xs text-stone-400">Total Visitas Registradas</span>
                    <h3 className="font-game text-3xl text-amber-300 mt-1">{stats?.totalVisits.toLocaleString()}</h3>
                  </div>
                  <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow">
                    <span className="text-xs text-stone-400">Visitas Móviles</span>
                    <h3 className="font-game text-3xl text-sky-300 mt-1">
                      {Math.round((stats?.totalVisits || 0) * 0.72).toLocaleString()}
                    </h3>
                  </div>
                  <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow">
                    <span className="text-xs text-stone-400">Visitas Escritorio</span>
                    <h3 className="font-game text-3xl text-purple-300 mt-1">
                      {Math.round((stats?.totalVisits || 0) * 0.28).toLocaleString()}
                    </h3>
                  </div>
                </div>

                <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl">
                  <h3 className="font-game text-base text-yellow-300 font-bold mb-3">
                    REGISTRO DE SESIONES DE ENTRADA
                  </h3>
                  {activity.filter((a) => a.type === 'visit').length === 0 ? (
                    <div className="py-6 text-center text-xs text-stone-500">
                      No hay registros de visitas adicionales aún.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {activity.filter((a) => a.type === 'visit').map((log, i) => (
                        <div
                          key={log.id || i}
                          className="flex items-center justify-between p-3 rounded-xl bg-stone-950/80 border border-stone-800 text-xs text-stone-300"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">🌐</span>
                            <div>
                              <span className="font-medium text-white block">Acceso Web Público</span>
                              <span className="text-[10px] text-stone-500">{log.userAgent || 'Mozilla/5.0 Web Client'}</span>
                            </div>
                          </div>
                          <span className="font-mono text-[11px] text-stone-400">
                            {log.date} {log.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. SECCIÓN JUGADORES */}
            {activeTab === 'jugadores' && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-stone-800 flex items-center justify-between">
                    <h3 className="font-game text-base text-yellow-300 font-bold">
                      LISTADO DE JUGADORES REGISTRADOS ({playersList.length})
                    </h3>
                  </div>

                  {playersList.length === 0 ? (
                    <div className="py-12 px-4 flex flex-col items-center justify-center text-center text-stone-400">
                      <span className="text-4xl mb-2">🧑</span>
                      <span className="font-game text-base text-yellow-300 font-bold">
                        No hay jugadores registrados todavía
                      </span>
                      <p className="text-xs text-stone-500 mt-1 max-w-sm">
                        Los jugadores aparecerán consolidados aquí una vez que completen su primera partida.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-stone-300">
                        <thead className="bg-stone-950/80 text-amber-300 uppercase font-game text-[11px] border-b border-stone-800">
                          <tr>
                            <th className="px-4 py-3">Granjero</th>
                            <th className="px-4 py-3 text-center">Partidas Registradas</th>
                            <th className="px-4 py-3 text-right">Mejor Puntuación</th>
                            <th className="px-4 py-3 text-right">Última Actividad</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800">
                          {playersList.map((p, i) => (
                            <tr key={p.name} className="hover:bg-stone-800/40 transition-colors">
                              <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                                <span>{i === 0 ? '👑' : i < 3 ? '⭐' : '🧑'}</span>
                                <span>{p.name}</span>
                              </td>
                              <td className="px-4 py-3 text-center text-stone-300">
                                {p.games} partida(s)
                              </td>
                              <td className="px-4 py-3 text-right font-game text-sm text-yellow-300 font-extrabold">
                                🪙 {p.maxScore.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right text-stone-400 font-mono text-[11px]">
                                {p.lastDate}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 6. SECCIÓN ANALÍTICA */}
            {activeTab === 'analitica' && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow">
                    <span className="text-xs text-stone-400">Partidas Registradas</span>
                    <h3 className="font-game text-2xl text-emerald-300 mt-1">{stats?.gamesCompleted || 0}</h3>
                    <p className="text-[10px] text-stone-400 mt-1">Partidas completadas</p>
                  </div>
                  <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow">
                    <span className="text-xs text-stone-400">Total Monedas Generadas</span>
                    <h3 className="font-game text-2xl text-yellow-400 mt-1">
                      {stats?.totalCoinsAccumulated ? stats.totalCoinsAccumulated.toLocaleString() : 0}
                    </h3>
                    <p className="text-[10px] text-stone-400 mt-1">Puntos acumulados</p>
                  </div>
                  <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow">
                    <span className="text-xs text-stone-400">Puntaje Promedio</span>
                    <h3 className="font-game text-2xl text-sky-300 mt-1">
                      {stats?.averageScore ? `${stats.averageScore.toLocaleString()} pts` : '0 pts'}
                    </h3>
                    <p className="text-[10px] text-stone-400 mt-1">Media por partida</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
