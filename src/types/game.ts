export interface Hen {
  id: number;
  level: number; // 0: top, 1: middle, 2: bottom
  x: number;
  y: number;
  nestX: number;
  nestY: number;
  state: 'idle' | 'laying' | 'happy';
  layTimer: number;
  layInterval: number;
  bobPhase: number;
}

export interface Egg {
  id: string;
  sourceHenId: number;
  x: number;
  y: number;
  state: 'rolling' | 'nest' | 'dragging' | 'collected' | 'stolen';
  rollProgress: number; // 0 to 1 along ramp
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  glowPhase: number;
  isSuper?: boolean; // Special Super Egg variant
}

export interface FlowerPot {
  id: number;
  originalX: number;
  originalY: number;
  x: number;
  y: number;
  state: 'ready' | 'falling' | 'broken' | 'cooldown';
  vy: number;
  cooldownTimer: number;
  flowerColor: string;
}

export type FoxState = 'idle' | 'walking' | 'bonked' | 'stealing' | 'taunting' | 'fleeing' | 'escaped';

export interface Fox {
  x: number;
  y: number;
  vx: number;
  state: FoxState;
  stateTimer: number;
  tauntMessage: string;
  stolenEgg: boolean;
  facing: 'left' | 'right';
  animTimer: number;
  targetEggId?: string;
  dizzyStars: { angle: number; dist: number }[];
  isFast?: boolean; // Zorro Rápido variant (every 10th fox)
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'sparkle' | 'feather' | 'coin' | 'shard' | 'star' | 'confetti';
  rotation?: number;
  vRot?: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  life: number;
}

export interface Basket {
  x: number;
  y: number;
  width: number;
  height: number;
  eggCount: number;
  capacity: number;
  shakeTimer: number;
  celebrating: boolean;
}

export interface GameStats {
  totalCoins: number;
  highScore: number;
  eggsDelivered: number;
  foxesScared: number;
  basketsSold: number;
  eggsStolen: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  icon: string;
}

export interface PlayerRank {
  rank: number;
  name: string;
  score: number;
  avatar: string;
  isPlayer?: boolean;
}
