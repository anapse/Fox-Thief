import { GameStats, ShopItem, PlayerRank } from '../types/game';

const STATS_KEY = 'foxtiefo_stats';
const SHOP_KEY = 'foxtiefo_shop';
const LEADERBOARD_KEY = 'foxtiefo_leaderboard';

export const INITIAL_STATS: GameStats = {
  totalCoins: 120, // Start with 120 coins as seen in the reference mockups!
  highScore: 120,
  eggsDelivered: 15,
  foxesScared: 4,
  basketsSold: 1,
  eggsStolen: 0,
};

export const INITIAL_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'golden_eggs',
    name: 'Huevos de Oro',
    description: 'Aumenta el valor de venta de cada cesta (+5 monedas extra por nivel).',
    cost: 50,
    level: 1,
    maxLevel: 5,
    icon: '🥚✨',
  },
  {
    id: 'turbo_hens',
    name: 'Maíz Energético',
    description: 'Tus gallinas ponen huevos un 15% más rápido por cada nivel.',
    cost: 75,
    level: 1,
    maxLevel: 5,
    icon: '🌽⚡',
  },
  {
    id: 'heavy_pots',
    name: 'Macetas Reforzadas',
    description: 'Las macetas se recuperan más rápido tras ser lanzadas.',
    cost: 60,
    level: 1,
    maxLevel: 4,
    icon: '🪴🛡️',
  },
  {
    id: 'fox_alarm',
    name: 'Campana de Alerta',
    description: 'Señala la llegada del Zorro Ladrón con más anticipación visual.',
    cost: 100,
    level: 1,
    maxLevel: 3,
    icon: '🔔🦊',
  },
];

export function getSavedStats(): GameStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ...INITIAL_STATS };
    return { ...INITIAL_STATS, ...JSON.parse(raw) };
  } catch {
    return { ...INITIAL_STATS };
  }
}

export function saveStats(stats: GameStats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export function getSavedShop(): ShopItem[] {
  try {
    const raw = localStorage.getItem(SHOP_KEY);
    if (!raw) return INITIAL_SHOP_ITEMS;
    const parsed: ShopItem[] = JSON.parse(raw);
    return INITIAL_SHOP_ITEMS.map((item) => {
      const match = parsed.find((p) => p.id === item.id);
      return match ? { ...item, ...match } : item;
    });
  } catch {
    return INITIAL_SHOP_ITEMS;
  }
}

export function saveShop(items: ShopItem[]) {
  try {
    localStorage.setItem(SHOP_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

const DEFAULT_LEADERBOARD_NAMES = [
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

export function getLeaderboard(playerCoins: number): PlayerRank[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    let baseList: PlayerRank[] = [];
    if (raw) {
      baseList = JSON.parse(raw);
    } else {
      let topScore = 4850;
      baseList = DEFAULT_LEADERBOARD_NAMES.slice(0, 49).map((name, idx) => {
        topScore = Math.max(150, Math.floor(topScore - (30 + Math.random() * 95)));
        return {
          rank: idx + 1,
          name,
          score: topScore,
          avatar: ['🐔', '🦊', '🥚', '🪴', '🌾', '🧺'][idx % 6],
        };
      });
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(baseList));
    }

    // Insert current player
    const playerEntry: PlayerRank = {
      rank: 0,
      name: 'Tú (Granjero)',
      score: playerCoins,
      avatar: '👑',
      isPlayer: true,
    };

    const combined = [...baseList.filter(p => !p.isPlayer), playerEntry];
    combined.sort((a, b) => b.score - a.score);

    // Re-rank 1 to 50
    return combined.slice(0, 50).map((p, index) => ({
      ...p,
      rank: index + 1,
    }));
  } catch {
    return [];
  }
}
