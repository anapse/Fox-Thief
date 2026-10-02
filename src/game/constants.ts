export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;
export const ASPECT_RATIO = 9 / 16;

export const BASKET_CAPACITY = 25; // Updated to 25 eggs capacity
export const BASE_BASKET_VALUE = 10;

// Coop positions and hen perches aligned with the wooden coop in fondo.png
export const COOP = {
  x: 0,
  y: 200,
  width: 180,
  height: 480,
  hens: [
    { id: 0, level: 0, x: 92, y: 380, rampEndX: 215, rampEndY: 480 },
    { id: 1, level: 1, x: 92, y: 480, rampEndX: 215, rampEndY: 570 },
    { id: 2, level: 2, x: 92, y: 580, rampEndX: 215, rampEndY: 660 },
  ],
};

// Ground landing zone bounds for variable egg positions
export const GROUND_ZONE = {
  minX: 165,
  maxX: 360,
  minY: 670,
  maxY: 775,
};

// Central ground nest coordinates
export const COLLECTION_NEST = {
  x: 215,
  y: 685,
  radius: 75,
};

// Wicker basket in the farm yard
export const BASKET = {
  x: 405,
  y: 790,
  width: 280,
  height: 195,
};

// Flower pots placed on top of the wall (y = 315)
export const WALL_Y = 315;
export const POT_SLOTS = [
  { id: 0, x: 280, y: 315 },
  { id: 1, x: 380, y: 315 },
  { id: 2, x: 480, y: 315 },
  { id: 3, x: 580, y: 315 },
  { id: 4, x: 660, y: 315 },
];

export const POT_COOLDOWN_DEFAULT = 18.0; // Strategic cooldown; recovered +1 on basket completion
export const POT_GRAVITY = 1500; // px/s^2

// Fox parameters
export const FOX_START_X = 760;
export const FOX_WALL_Y = 540; // Path aligned so falling pots hit him cleanly
export const FOX_SPEED_BASE = 115; // px per second
export const FOX_SPEED_FAST = 215; // Zorro Rápido (every 10th fox)
export const FOX_TAUNT_DURATION = 3.0; // Taunt duration
export const FOX_TAUNT_MESSAGES = [
  '¡JAJAJA! 🥚',
  '¡GRACIAS POR EL HUEVO!',
  '¡MUY LENTO, GRANJERO!',
  '¡DELICIOSO!',
  '¡UPS, ESTE ES MÍO!',
  '¡ÑAM ÑAM! 🦊',
];
