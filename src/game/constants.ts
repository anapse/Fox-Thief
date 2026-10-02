export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;
export const ASPECT_RATIO = 9 / 16;

export const BASKET_CAPACITY = 10;
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

// Central ground nest moved higher, right near the coop ramps
export const COLLECTION_NEST = {
  x: 215,
  y: 685,
  radius: 75,
};

// Even larger Wicker basket in the farm yard
export const BASKET = {
  x: 405,
  y: 790,
  width: 280,
  height: 195,
};

// Flower pots placed higher up on top of the wall (y = 315)
export const WALL_Y = 315;
export const POT_SLOTS = [
  { id: 0, x: 280, y: 315 },
  { id: 1, x: 380, y: 315 },
  { id: 2, x: 480, y: 315 },
  { id: 3, x: 580, y: 315 },
  { id: 4, x: 660, y: 315 },
];

export const POT_COOLDOWN_DEFAULT = 3.8; // seconds
export const POT_GRAVITY = 1500; // px/s^2

// Fox parameters: enters lower on the screen (y = 540) so pots fall onto him
export const FOX_START_X = 760;
export const FOX_WALL_Y = 540; // Lower path so falling pots cleanly hit him
export const FOX_SPEED_BASE = 95; // px per second
export const FOX_TAUNT_DURATION = 3.2; // Taunt duration
export const FOX_TAUNT_MESSAGES = [
  '¡JAJAJA! 🥚',
  '¡GRACIAS POR EL HUEVO!',
  '¡MUY LENTO, GRANJERO!',
  '¡DELICIOSO!',
  '¡UPS, ESTE ES MÍO!',
  '¡ÑAM ÑAM! 🦊',
];
