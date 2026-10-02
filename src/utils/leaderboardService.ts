import { PlayerRank, GameStats } from '../types/game';
import {
  fetchFirebaseTop50,
  addFirebaseScoreWithRecordCheck,
  isFirebaseConfigured,
} from './firebase';

const LEADERBOARD_STORAGE_KEY = 'fox_thief_top50_ranking';

const DEFAULT_TOP50_NAMES = [
  'GranjeroPepe', 'CluckMaster', 'FoxHunter99', 'HuevoSupremo', 'DonaGallina',
  'ElZorroPillo', 'RancheroChic', 'SuperClucker', 'GranjaFeliz', 'Trotamundos',
  'PicoDeOro', 'HueveriaCentral', 'ZorroAsustado', 'MacetaVeloz', 'ReinaPollo',
  'PatioMagico', 'AlasPoderosas', 'DonCresta', 'FincaDorada', 'CestaLlena',
  'CampesinoPro', 'VallaSegura', 'MacetazoHero', 'PollitoPio', 'GranjaStar',
  'TurboHuevo', 'GuardiánGranja', 'GallinaZen', 'ZorroHuyendo', 'GranjeroMax',
  'NidoReal', 'PlumaLigera', 'CorralAlegre', 'GalloFeroz', 'MacetaCertera',
  'ElMaizal', 'PicoFino', 'HuevosFrescos', 'CrestaRoja', 'GranjaSolar',
  'ZorroPasmado', 'CampoVerde', 'Espantapajaros', 'GallineroVip', 'PichonCrack',
  'AvispaGranjera', 'SolDeMayo', 'VientoNorte', 'HuevoCentella', 'GranjeroPro'
];

function generateDefaultLeaderboard(): PlayerRank[] {
  let score = 4850;
  return DEFAULT_TOP50_NAMES.map((name, idx) => {
    score = Math.max(30, score - (idx < 5 ? 300 : idx < 20 ? 120 : 60));
    const avatars = ['🐔', '🦊', '🥚', '🪴', '🌾', '🧺', '🌽'];
    return {
      rank: idx + 1,
      name,
      score,
      avatar: avatars[idx % avatars.length],
    };
  });
}

export function getLocalLeaderboard(): PlayerRank[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (!raw) {
      const defaults = generateDefaultLeaderboard();
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    const parsed: PlayerRank[] = JSON.parse(raw);
    return parsed.sort((a, b) => b.score - a.score).slice(0, 50).map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  } catch {
    return generateDefaultLeaderboard();
  }
}

export async function fetchTop50Ranking(): Promise<PlayerRank[]> {
  if (isFirebaseConfigured) {
    const remote = await fetchFirebaseTop50();
    if (remote && remote.length > 0) {
      const mapped: PlayerRank[] = remote.map((entry, idx) => ({
        rank: idx + 1,
        name: entry.name,
        score: entry.score,
        avatar: ['👑', '🐔', '🦊', '🥚', '🪴', '🌾'][idx % 6],
      }));
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(mapped));
      return mapped;
    }
  }
  return getLocalLeaderboard();
}

export function isScoreInTop50(score: number): boolean {
  if (score <= 0) return false;
  const list = getLocalLeaderboard();
  if (list.length < 50) return true;
  const lowestScore = list[list.length - 1].score;
  return score >= lowestScore;
}

export async function savePlayerScore(
  playerName: string,
  score: number,
  stats?: GameStats
): Promise<{ success: boolean; rank: number }> {
  const cleanName = playerName.trim();
  if (!cleanName || cleanName.length < 2) {
    return { success: false, rank: 0 };
  }

  // 1. Save to local storage first for offline / immediate reliability
  const list = getLocalLeaderboard();
  const newEntry: PlayerRank = {
    rank: 0,
    name: cleanName,
    score,
    avatar: '👑',
    isPlayer: true,
  };

  const updatedList = [...list, newEntry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)
    .map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

  localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(updatedList));

  const playerRankIndex = updatedList.findIndex(
    (item) => item.name === cleanName && item.score === score
  );
  const finalRank = playerRankIndex !== -1 ? playerRankIndex + 1 : 50;

  // 2. Sync to Firebase if configured and check record
  if (isFirebaseConfigured) {
    try {
      await addFirebaseScoreWithRecordCheck(cleanName, score, {
        basketsSold: stats?.basketsSold,
        foxesScared: stats?.foxesScared,
        eggsDelivered: stats?.eggsDelivered,
      });
    } catch (e) {
      console.warn('Firebase background sync error:', e);
    }
  }

  return { success: true, rank: finalRank };
}
