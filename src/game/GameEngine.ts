import {
  Hen,
  Egg,
  FlowerPot,
  Fox,
  Particle,
  FloatingText,
  Basket,
  GameStats,
} from '../types/game';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  COOP,
  COLLECTION_NEST,
  GROUND_ZONE,
  BASKET,
  BASKET_CAPACITY,
  POT_SLOTS,
  POT_COOLDOWN_DEFAULT,
  POT_GRAVITY,
  FOX_START_X,
  FOX_WALL_Y,
  FOX_SPEED_BASE,
  FOX_SPEED_FAST,
  FOX_TAUNT_MESSAGES,
  FOX_TAUNT_DURATION,
} from './constants';
import { sounds } from '../audio/soundManager';
import { getSavedStats, saveStats, getSavedShop } from '../utils/storage';
import { assetManager } from './AssetManager';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private lastTime: number = 0;

  // Game entities
  private hens: Hen[] = [];
  private eggs: Egg[] = [];
  private pots: FlowerPot[] = [];
  private fox: Fox | null = null;
  private basket: Basket;
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  // Broken pot debris on ground
  private smashedPots: { x: number; y: number; alpha: number; frameIndex: number }[] = [];

  // Dragging state
  private draggingEgg: Egg | null = null;

  // Production and Fox Counters
  private totalEggsProduced: number = 0;
  private totalFoxSpawns: number = 0;

  // Persistent Celebration Banner (1.6 seconds)
  private celebrationBanner = {
    active: false,
    timer: 0,
    maxTimer: 1.6,
    title: '',
    subtitle: '',
  };

  // Flying Coins to HUD animation
  private flyingCoins: {
    x: number;
    y: number;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    progress: number;
    speed: number;
    radius: number;
    curveOffsetX: number;
    rotation: number;
    vRot: number;
  }[] = [];

  // Hearts / Health System (3.0 max, in intervals of 0.5)
  private health: number = 3.0;
  private maxHealth: number = 3.0;

  // Timers & Stats
  private foxSpawnTimer: number = 3.2;
  private foxSpawnInterval: number = 6.0;
  private isNextFoxFast: boolean = false;
  private gameTime: number = 0;

  private stats: GameStats;
  private shopUpgrades = getSavedShop();

  public onStateUpdate?: (data: {
    coins: number;
    basketCount: number;
    basketCapacity: number;
    health: number;
    maxHealth: number;
    foxActive: boolean;
  }) => void;

  public onGameOver?: (data: {
    score: number;
    stats: GameStats;
  }) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.stats = getSavedStats();

    this.basket = {
      x: BASKET.x,
      y: BASKET.y,
      width: BASKET.width,
      height: BASKET.height,
      eggCount: 0,
      capacity: BASKET_CAPACITY, // 25 eggs
      shakeTimer: 0,
      celebrating: false,
    };

    this.initEntities();
    this.setupInputs();
  }

  public reloadUpgrades() {
    this.shopUpgrades = getSavedShop();
  }

  private getUpgradeLevel(id: string): number {
    const item = this.shopUpgrades.find((u) => u.id === id);
    return item ? item.level : 1;
  }

  private initEntities() {
    const turboLevel = this.getUpgradeLevel('turbo_hens');
    // Paced, slower base interval (6.5s to 9.5s)
    const baseInterval = Math.max(6.0, 8.5 - (turboLevel - 1) * 0.6);

    // 3 Hens aligned to the tiers
    this.hens = COOP.hens.map((h) => ({
      id: h.id,
      level: h.level,
      x: h.x,
      y: h.y,
      nestX: h.x,
      nestY: h.y + 10,
      state: 'idle',
      layTimer: 1.5 + h.level * 2.2,
      layInterval: baseInterval + Math.random() * 2.0,
      bobPhase: Math.random() * Math.PI * 2,
    }));

    // 5 Flower pots on top of the wall
    const colors = ['#f43f5e', '#38bdf8', '#fbbf24', '#a855f7', '#ec4899'];
    this.pots = POT_SLOTS.map((slot, idx) => ({
      id: slot.id,
      originalX: slot.x,
      originalY: slot.y,
      x: slot.x,
      y: slot.y,
      state: 'ready',
      vy: 0,
      cooldownTimer: 0,
      flowerColor: colors[idx % colors.length],
    }));

    // Initial 2 eggs on the ground
    this.createGroundEgg();
    this.createGroundEgg();
  }

  private createGroundEgg() {
    const targetX = GROUND_ZONE.minX + Math.random() * (GROUND_ZONE.maxX - GROUND_ZONE.minX);
    const targetY = GROUND_ZONE.minY + Math.random() * (GROUND_ZONE.maxY - GROUND_ZONE.minY);
    this.totalEggsProduced += 1;

    this.eggs.push({
      id: 'egg_' + Math.random().toString(36).substring(2, 9),
      sourceHenId: 0,
      x: targetX,
      y: targetY,
      state: 'nest',
      rollProgress: 1,
      startX: 0,
      startY: 0,
      targetX,
      targetY,
      glowPhase: Math.random() * Math.PI * 2,
      isSuper: false,
    });
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    if (!this.isRunning) {
      this.start();
    } else {
      this.isPaused = false;
      this.lastTime = performance.now();
    }
  }

  public destroy() {
    this.isRunning = false;
  }

  private loop = (time: number) => {
    if (!this.isRunning) return;

    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    if (!this.isPaused) {
      this.update(dt);
    }
    this.render();

    requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.gameTime += dt;

    // Update Hens & Laying (Slower, more deliberate egg production)
    const turboLevel = this.getUpgradeLevel('turbo_hens');
    const layRateMultiplier = 1 + (turboLevel - 1) * 0.12;

    this.hens.forEach((hen) => {
      hen.bobPhase += dt * 3.0;
      hen.layTimer += dt * layRateMultiplier;

      if (hen.layTimer >= hen.layInterval && hen.state === 'idle') {
        hen.state = 'laying';
        setTimeout(() => {
          this.spawnEggFromHen(hen);
          hen.state = 'happy';
          setTimeout(() => {
            hen.state = 'idle';
            hen.layTimer = 0;
            // Slower paced subsequent laying
            hen.layInterval = Math.max(5.8, 8.0 - (turboLevel - 1) * 0.5 + Math.random() * 3.0);
          }, 800);
        }, 350);
      }
    });

    // Update Eggs
    for (let i = this.eggs.length - 1; i >= 0; i--) {
      const egg = this.eggs[i];
      egg.glowPhase += dt * 4.5;

      if (egg.state === 'rolling') {
        egg.rollProgress += dt * 1.3;
        const p = Math.min(egg.rollProgress, 1);
        egg.x = egg.startX + (egg.targetX - egg.startX) * p;
        egg.y = egg.startY + (egg.targetY - egg.startY) * p + Math.sin(p * Math.PI) * 18;

        if (p >= 1) {
          egg.state = 'nest';
          egg.x = egg.targetX;
          egg.y = egg.targetY;
          this.spawnSparkles(egg.x, egg.y, egg.isSuper ? 12 : 4, egg.isSuper ? '#fbbf24' : '#fde047');
        }
      } else if (egg.state === 'collected' || egg.state === 'stolen') {
        this.eggs.splice(i, 1);
      }
    }

    // Update Flower Pots
    this.pots.forEach((pot) => {
      if (pot.state === 'falling') {
        pot.vy += POT_GRAVITY * dt;
        pot.y += pot.vy * dt;

        // Collision check with Fox
        if (this.fox && (this.fox.state === 'walking' || this.fox.state === 'stealing')) {
          const potRadius = 38;
          const foxLeft = this.fox.x - 55;
          const foxRight = this.fox.x + 65;
          const foxTop = this.fox.y - 120;
          const foxBottom = this.fox.y + 30;

          if (
            pot.x + potRadius > foxLeft &&
            pot.x - potRadius < foxRight &&
            pot.y + 30 > foxTop &&
            pot.y - 30 < foxBottom
          ) {
            this.bonkFox();
            this.shatterPot(pot.x, pot.y, pot.flowerColor);
            pot.state = 'cooldown';
            pot.cooldownTimer = POT_COOLDOWN_DEFAULT;
            pot.x = pot.originalX;
            pot.y = pot.originalY;
            pot.vy = 0;
            return;
          }
        }

        // Pot hits dirt ground below fox path if missed (y >= 640)
        if (pot.y >= 640) {
          this.shatterPot(pot.x, pot.y, pot.flowerColor);
          pot.state = 'cooldown';
          pot.cooldownTimer = POT_COOLDOWN_DEFAULT;
          pot.x = pot.originalX;
          pot.y = pot.originalY;
          pot.vy = 0;
        }
      } else if (pot.state === 'cooldown') {
        pot.cooldownTimer -= dt;
        if (pot.cooldownTimer <= 0) {
          pot.state = 'ready';
          pot.cooldownTimer = 0;
          this.spawnSparkles(pot.x, pot.y, 6, '#4ade80');
        }
      }
    });

    // Update Smashed Pots fadeout
    for (let i = this.smashedPots.length - 1; i >= 0; i--) {
      const sp = this.smashedPots[i];
      sp.alpha -= dt * 0.4;
      if (sp.alpha <= 0) {
        this.smashedPots.splice(i, 1);
      }
    }

    // Update Fox
    this.updateFox(dt);

    // Update Basket celebration
    if (this.basket.shakeTimer > 0) {
      this.basket.shakeTimer -= dt;
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = 1 - p.life / p.maxLife;
      if (p.type === 'coin') {
        p.vy += 600 * dt;
      } else if (p.type === 'shard') {
        p.vy += 800 * dt;
      }
    }

    // Update Flying Coins towards HUD
    for (let i = this.flyingCoins.length - 1; i >= 0; i--) {
      const fc = this.flyingCoins[i];
      fc.progress += fc.speed * dt;
      fc.rotation += fc.vRot * dt;

      if (fc.progress > 0) {
        const p = Math.min(1, fc.progress);
        const ease = p * p * (3 - 2 * p);
        const midX = (fc.startX + fc.targetX) / 2 + fc.curveOffsetX;
        const midY = (fc.startY + fc.targetY) / 2 - 120;
        fc.x = (1 - ease) * (1 - ease) * fc.startX + 2 * (1 - ease) * ease * midX + ease * ease * fc.targetX;
        fc.y = (1 - ease) * (1 - ease) * fc.startY + 2 * (1 - ease) * ease * midY + ease * ease * fc.targetY;

        if (fc.progress >= 1) {
          sounds.playCoin();
          this.spawnSparkles(fc.targetX, fc.targetY, 4, '#fde047');
          this.flyingCoins.splice(i, 1);
        }
      }
    }

    // Update Celebration Banner timer
    if (this.celebrationBanner.active) {
      this.celebrationBanner.timer -= dt;
      if (this.celebrationBanner.timer <= 0) {
        this.celebrationBanner.active = false;
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      ft.alpha = Math.max(0, ft.life / 1.2);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Notify React UI
    if (this.onStateUpdate) {
      this.onStateUpdate({
        coins: this.stats.totalCoins,
        basketCount: this.basket.eggCount,
        basketCapacity: this.basket.capacity,
        health: this.health,
        maxHealth: this.maxHealth,
        foxActive: this.fox !== null,
      });
    }
  }

  private spawnEggFromHen(hen: Hen) {
    const config = COOP.hens[hen.level];
    sounds.playEggLay();

    this.totalEggsProduced += 1;

    // Super Egg spawns approximately every 100 eggs produced
    const isSuperEgg = this.totalEggsProduced > 0 && this.totalEggsProduced % 100 === 0;

    // Variable landing position within ground zone
    let targetX = GROUND_ZONE.minX + Math.random() * (GROUND_ZONE.maxX - GROUND_ZONE.minX);
    let targetY = GROUND_ZONE.minY + Math.random() * (GROUND_ZONE.maxY - GROUND_ZONE.minY);

    if (isSuperEgg) {
      // Super egg lands in slightly further distinctive spot
      targetX = 250 + Math.random() * 110;
      targetY = 700 + Math.random() * 75;
      this.addFloatingText('✨ ¡SÚPER HUEVO! ✨', targetX, targetY - 40, '#facc15', 34);
    }

    const egg: Egg = {
      id: 'egg_' + Math.random().toString(36).substring(2, 9),
      sourceHenId: hen.id,
      x: config.x,
      y: config.y - 15,
      state: 'rolling',
      rollProgress: 0,
      startX: config.x,
      startY: config.y - 15,
      targetX,
      targetY,
      glowPhase: 0,
      isSuper: isSuperEgg,
    };
    this.eggs.push(egg);

    this.spawnSparkles(egg.x, egg.y, isSuperEgg ? 14 : 5, isSuperEgg ? '#facc15' : '#ffffff');
  }

  private shatterPot(x: number, y: number, flowerColor: string) {
    sounds.playPotHitFox();

    this.smashedPots.push({
      x,
      y: Math.min(y, 560),
      alpha: 1.0,
      frameIndex: Math.floor(Math.random() * 4),
    });

    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 250;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 120,
        color: Math.random() > 0.4 ? '#b45309' : '#d97706',
        radius: 3 + Math.random() * 4,
        alpha: 1,
        life: 0,
        maxLife: 0.8,
        type: 'shard',
      });
    }
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 150;
      this.particles.push({
        x,
        y: y - 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        color: flowerColor,
        radius: 4 + Math.random() * 3,
        alpha: 1,
        life: 0,
        maxLife: 1.0,
        type: 'feather',
      });
    }
  }

  private updateFox(dt: number) {
    if (!this.fox) {
      this.foxSpawnTimer -= dt;

      // Predict if next fox is fast for pre-warning alert
      this.isNextFoxFast = (this.totalFoxSpawns + 1) % 10 === 0;

      if (this.foxSpawnTimer <= 0) {
        this.totalFoxSpawns += 1;
        // Every 10th fox is a Zorro Rápido
        const isFastFox = this.totalFoxSpawns % 10 === 0;

        const difficultyBonus = Math.min(40, Math.floor(this.gameTime / 30) * 5);
        const baseSpeed = isFastFox ? FOX_SPEED_FAST : FOX_SPEED_BASE;

        this.fox = {
          x: FOX_START_X,
          y: FOX_WALL_Y,
          vx: -(baseSpeed + difficultyBonus),
          state: 'walking',
          stateTimer: 0,
          tauntMessage: '',
          stolenEgg: false,
          facing: 'left',
          animTimer: 0,
          isFast: isFastFox,
          dizzyStars: [
            { angle: 0, dist: 28 },
            { angle: (Math.PI * 2) / 3, dist: 28 },
            { angle: (Math.PI * 4) / 3, dist: 28 },
          ],
        };

        if (isFastFox) {
          this.addFloatingText('⚡ ¡ZORRO RÁPIDO! ⚡', FOX_START_X - 100, FOX_WALL_Y - 90, '#facc15', 34);
        }

        // Moderate waiting interval (4.5s to 6.2s)
        this.foxSpawnInterval = Math.max(4.2, 5.8 - Math.min(2.0, this.gameTime / 40));
        this.foxSpawnTimer = this.foxSpawnInterval;
      }
      return;
    }

    const fox = this.fox;
    fox.animTimer += dt * (fox.isFast ? 14 : 8); // Faster animation cycle for fast fox

    if (fox.state === 'walking') {
      fox.x += fox.vx * dt;

      if (fox.x <= 230) {
        fox.state = 'stealing';
        fox.stateTimer = 0;
      }
    } else if (fox.state === 'stealing') {
      fox.stateTimer += dt;
      const dx = COLLECTION_NEST.x - fox.x;
      const dy = COLLECTION_NEST.y + 10 - fox.y;
      fox.x += dx * dt * (fox.isFast ? 6 : 4);
      fox.y += dy * dt * (fox.isFast ? 6 : 4);

      if (fox.stateTimer >= (fox.isFast ? 0.45 : 0.75) && !fox.stolenEgg) {
        // Steal ALL eggs currently on ground or rolling!
        const eggsOnGround = this.eggs.filter(
          (e) => e.state === 'nest' || e.state === 'rolling'
        );
        if (eggsOnGround.length > 0) {
          eggsOnGround.forEach((egg) => {
            egg.state = 'stolen';
          });
          fox.stolenEgg = true;
          this.stats.eggsStolen += eggsOnGround.length;
          saveStats(this.stats);
          this.addFloatingText(
            `¡ROBÓ ${eggsOnGround.length} HUEVO(S)! 🦊`,
            fox.x,
            fox.y - 130,
            '#ef4444',
            32
          );
        } else {
          fox.stolenEgg = true;
        }

        // Subtacts exactly 1 FULL HEART (-1.0) on fox theft
        this.health = Math.max(0, this.health - 1.0);
        sounds.playHurt();
        this.addFloatingText('💔 -1 VIDA', fox.x, fox.y - 170, '#f43f5e', 32);

        fox.state = 'taunting';
        fox.stateTimer = 0;
        fox.tauntMessage =
          FOX_TAUNT_MESSAGES[Math.floor(Math.random() * FOX_TAUNT_MESSAGES.length)];
        sounds.playFoxTaunt();

        if (this.health <= 0) {
          setTimeout(() => {
            this.triggerGameOver();
          }, 600);
        }
      }
    } else if (fox.state === 'taunting') {
      fox.stateTimer += dt;
      fox.y = COLLECTION_NEST.y + 10;
      if (fox.stateTimer >= FOX_TAUNT_DURATION) {
        fox.state = 'fleeing';
        fox.facing = 'left';
        fox.vx = fox.isFast ? -480 : -340;
        fox.y = COLLECTION_NEST.y + 10;
      }
    } else if (fox.state === 'bonked') {
      fox.stateTimer += dt;
      fox.dizzyStars.forEach((star) => {
        star.angle += dt * 6;
      });

      if (fox.stateTimer >= 0.85) {
        fox.state = 'fleeing';
        fox.facing = 'right';
        fox.vx = fox.isFast ? 460 : 340;
      }
    } else if (fox.state === 'fleeing') {
      fox.x += fox.vx * dt;

      if (fox.x < -180 || fox.x > GAME_WIDTH + 180) {
        this.fox = null;
      }
    }
  }

  private bonkFox() {
    if (!this.fox) return;
    this.fox.state = 'bonked';
    this.fox.stateTimer = 0;

    this.addFloatingText('¡PUM! ¡BONK!', this.fox.x + 30, this.fox.y - 50, '#ef4444', 38);

    this.stats.foxesScared += 1;
    this.stats.totalCoins += 5;
    if (this.stats.totalCoins > this.stats.highScore) {
      this.stats.highScore = this.stats.totalCoins;
    }
    saveStats(this.stats);

    this.addFloatingText('+5 Monedas', this.fox.x + 30, this.fox.y - 20, '#eab308', 26);
    this.spawnCoins(this.fox.x + 30, this.fox.y, 6);
  }

  private setupInputs() {
    const getCanvasPos = (clientX: number, clientY: number) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = GAME_WIDTH / rect.width;
      const scaleY = GAME_HEIGHT / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const handlePointerDown = (clientX: number, clientY: number) => {
      if (this.isPaused) return;
      const pos = getCanvasPos(clientX, clientY);

      // Check if clicked Flower Pot
      for (const pot of this.pots) {
        if (pot.state === 'ready') {
          const dist = Math.hypot(pos.x - pot.x, pos.y - pot.y);
          if (dist <= 52) {
            pot.state = 'falling';
            pot.vy = 80;
            sounds.playPotDrop();
            return;
          }
        }
      }

      // Check if clicked Egg in ground zone
      for (let i = this.eggs.length - 1; i >= 0; i--) {
        const egg = this.eggs[i];
        if (egg.state === 'nest' || egg.state === 'rolling') {
          const dist = Math.hypot(pos.x - egg.x, pos.y - egg.y);
          if (dist <= (egg.isSuper ? 68 : 54)) {
            this.draggingEgg = egg;
            egg.state = 'dragging';
            sounds.playEggPickup();
            return;
          }
        }
      }
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
      if (!this.draggingEgg) return;
      const pos = getCanvasPos(clientX, clientY);
      this.draggingEgg.x = pos.x;
      this.draggingEgg.y = pos.y;
    };

    const handlePointerUp = () => {
      if (!this.draggingEgg) return;
      const egg = this.draggingEgg;
      this.draggingEgg = null;

      const basketLeft = this.basket.x - 40;
      const basketRight = this.basket.x + this.basket.width + 40;
      const basketTop = this.basket.y - 40;
      const basketBottom = this.basket.y + this.basket.height + 40;

      if (
        egg.x >= basketLeft &&
        egg.x <= basketRight &&
        egg.y >= basketTop &&
        egg.y <= basketBottom
      ) {
        egg.state = 'collected';

        if (egg.isSuper) {
          // Super Egg immediately fills the basket completely!
          this.basket.eggCount = this.basket.capacity;
          this.stats.eggsDelivered += 1;
          saveStats(this.stats);
          sounds.playEggInBasket();
          this.addFloatingText('✨ ¡CESTA COMPLETADA! ✨', this.basket.x + this.basket.width / 2, this.basket.y - 50, '#facc15', 32);
          this.spawnSparkles(this.basket.x + this.basket.width / 2, this.basket.y + 40, 25, '#fbbf24');
          this.sellBasket();
        } else {
          this.basket.eggCount += 1;
          this.basket.shakeTimer = 0.25;
          this.stats.eggsDelivered += 1;
          saveStats(this.stats);

          sounds.playEggInBasket();
          this.spawnSparkles(egg.x, egg.y, 8, '#ffffff');

          if (this.basket.eggCount >= this.basket.capacity) {
            this.sellBasket();
          }
        }
      } else {
        // Return to a valid ground position
        egg.state = 'nest';
        egg.x = GROUND_ZONE.minX + Math.random() * (GROUND_ZONE.maxX - GROUND_ZONE.minX);
        egg.y = GROUND_ZONE.minY + Math.random() * (GROUND_ZONE.maxY - GROUND_ZONE.minY);
      }
    };

    this.canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      handlePointerDown(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => {
      handlePointerMove(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', () => {
      handlePointerUp();
    });

    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        if (e.touches.length > 0) {
          const t = e.touches[0];
          handlePointerDown(t.clientX, t.clientY);
        }
      },
      { passive: false }
    );
    window.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length > 0) {
          const t = e.touches[0];
          handlePointerMove(t.clientX, t.clientY);
        }
      },
      { passive: true }
    );
    window.addEventListener('touchend', () => {
      handlePointerUp();
    });
  }

  private sellBasket() {
    this.basket.eggCount = 0;
    this.basket.celebrating = true;
    this.basket.shakeTimer = 0.5;
    sounds.playBasketSold();

    const goldenEggLevel = this.getUpgradeLevel('golden_eggs');
    const basketValue = 10 + (goldenEggLevel - 1) * 5;

    this.stats.totalCoins += basketValue;
    this.stats.basketsSold += 1;
    if (this.stats.totalCoins > this.stats.highScore) {
      this.stats.highScore = this.stats.totalCoins;
    }
    saveStats(this.stats);

    // Heal +0.5 heart on successful basket sale (never exceeds 3.0)
    this.health = Math.min(this.maxHealth, this.health + 0.5);
    this.addFloatingText('❤️ +0.5 VIDA', this.basket.x + this.basket.width / 2, this.basket.y - 65, '#10b981', 28);

    // Recover ONLY +1 Flower Pot (instead of all pots)
    const potToRecover = this.pots.find((p) => p.state === 'cooldown');
    if (potToRecover) {
      potToRecover.state = 'ready';
      potToRecover.cooldownTimer = 0;
      this.spawnSparkles(potToRecover.x, potToRecover.y, 10, '#4ade80');
      this.addFloatingText('🪴 +1 MACETA', potToRecover.x, potToRecover.y - 45, '#4ade80', 26);
    }

    // Trigger celebration banner
    this.celebrationBanner = {
      active: true,
      timer: 1.6,
      maxTimer: 1.6,
      title: '🎉 ¡CANASTA LLENA! 🎉',
      subtitle: `+${basketValue} MONEDAS DE ORO 💰`,
    };

    // Spawn 10 flying coins that arc towards the HUD Coins panel
    for (let i = 0; i < 10; i++) {
      this.flyingCoins.push({
        x: this.basket.x + this.basket.width / 2 + (Math.random() - 0.5) * 80,
        y: this.basket.y + 35 + (Math.random() - 0.5) * 30,
        startX: this.basket.x + this.basket.width / 2,
        startY: this.basket.y + 35,
        targetX: 95,
        targetY: 48,
        progress: -(i * 0.08),
        speed: 1.4 + Math.random() * 0.4,
        radius: 9,
        curveOffsetX: (Math.random() - 0.5) * 160,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 10,
      });
    }

    // Particle celebration
    this.spawnConfetti(GAME_WIDTH / 2, 250, 60);
    this.spawnCoins(this.basket.x + this.basket.width / 2, this.basket.y, 35);
    this.spawnSparkles(this.basket.x + this.basket.width / 2, this.basket.y + 40, 30, '#fef08a');

    setTimeout(() => {
      this.basket.celebrating = false;
    }, 1200);
  }

  public triggerGameOver() {
    this.isPaused = true;
    sounds.playGameOver();
    if (this.onGameOver) {
      this.onGameOver({
        score: this.stats.totalCoins,
        stats: { ...this.stats },
      });
    }
  }

  public restartGame() {
    this.health = 3.0;
    this.eggs = [];
    this.fox = null;
    this.basket.eggCount = 0;
    this.flyingCoins = [];
    this.foxSpawnTimer = 3.2;
    this.totalEggsProduced = 0;
    this.totalFoxSpawns = 0;
    this.pots.forEach((p) => {
      p.state = 'ready';
      p.cooldownTimer = 0;
      p.y = p.originalY;
      p.vy = 0;
    });
    this.isPaused = false;
  }

  private spawnConfetti(x: number, y: number, count: number) {
    const confettiColors = ['#f43f5e', '#eab308', '#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#ec4899'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() - 0.5) * Math.PI * 1.8;
      const speed = 120 + Math.random() * 380;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 400,
        y: y + (Math.random() - 0.5) * 100,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 150,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        radius: 6 + Math.random() * 6,
        alpha: 1,
        life: 0,
        maxLife: 1.8 + Math.random() * 0.8,
        type: 'confetti',
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 12,
      });
    }
  }

  private spawnSparkles(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        radius: 2 + Math.random() * 4,
        alpha: 1,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4,
        type: 'sparkle',
      });
    }
  }

  private spawnCoins(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const speed = 150 + Math.random() * 320;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#eab308',
        radius: 7,
        alpha: 1,
        life: 0,
        maxLife: 1.2,
        type: 'coin',
        rotation: 0,
        vRot: (Math.random() - 0.5) * 10,
      });
    }
  }

  private addFloatingText(
    text: string,
    x: number,
    y: number,
    color: string,
    size: number = 24
  ) {
    this.floatingTexts.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      vy: -55,
      alpha: 1,
      color,
      size,
      life: 1.3,
    });
  }

  // ----------------------------------------------------
  // RENDERING ENGINE USING ONLY OFFICIAL ASSETS
  // ----------------------------------------------------
  private render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 1. OFFICIAL BACKGROUND (fondo.png)
    assetManager.drawSprite(ctx, 'background', 0, 0, GAME_WIDTH, GAME_HEIGHT, 0, 0);

    // 2. Red Danger Flashing Alert when fox is approaching or attacking
    this.renderDangerOverlay(ctx);

    // 3. OFFICIAL HENS (Gallina en el nido.png)
    this.renderHens(ctx);

    // 4. Smashed Pots on Ground (macetas.png Row 2)
    this.renderSmashedPots(ctx);

    // 5. OFFICIAL BASKET (Cesta.png)
    this.renderBasket(ctx);

    // 6. OFFICIAL FLOWER POTS ON WALL (macetas.png Row 0 & Row 1)
    this.renderPots(ctx);

    // 7. OFFICIAL SNEAKY FOX (zorro.png Spritesheet)
    this.renderFox(ctx);

    // 8. OFFICIAL EGGS (Huevo individual.png & Super Egg variant)
    this.renderEggs(ctx);

    // 9. Dragging Egg
    if (this.draggingEgg) {
      this.renderDraggingEgg(ctx, this.draggingEgg);
    }

    // 10. Floating texts and sparkles
    this.renderParticles(ctx);
    this.renderFlyingCoins(ctx);
    this.renderFloatingTexts(ctx);

    // 11. Persistent Celebration Banner (Canasta Llena)
    if (this.celebrationBanner.active) {
      this.renderCelebrationBanner(ctx);
    }
  }

  // Red Danger Warning Flashing Overlay (Requirements 13 & 14)
  private renderDangerOverlay(ctx: CanvasRenderingContext2D) {
    const isFoxAttacking =
      this.fox !== null &&
      (this.fox.state === 'walking' || this.fox.state === 'stealing');
    const isFoxIncoming = !this.fox && this.foxSpawnTimer <= 1.8;

    if (!isFoxAttacking && !isFoxIncoming) return;

    const isFast = this.fox ? Boolean(this.fox.isFast) : this.isNextFoxFast;
    // Fast Fox pulses faster (13 Hz) vs normal fox (7 Hz)
    const frequency = isFast ? 13 : 7;
    const pulse = Math.sin(this.gameTime * frequency) * 0.5 + 0.5;
    const baseAlpha = isFast ? 0.08 : 0.05;
    const peakAlpha = isFast ? 0.24 : 0.15;
    const currentAlpha = baseAlpha + pulse * (peakAlpha - baseAlpha);

    ctx.save();
    // Semi-transparent reddish flashing tint
    ctx.fillStyle = `rgba(220, 38, 38, ${currentAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Red danger edge vignette
    const gradient = ctx.createRadialGradient(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH * 0.25,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH * 0.75
    );
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0)');
    gradient.addColorStop(1, `rgba(185, 28, 28, ${(currentAlpha * 1.5).toFixed(3)})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.restore();
  }

  private renderFlyingCoins(ctx: CanvasRenderingContext2D) {
    this.flyingCoins.forEach((fc) => {
      if (fc.progress < 0) return;
      ctx.save();
      ctx.translate(fc.x, fc.y);
      ctx.rotate(fc.rotation);

      // Gold Coin Body
      ctx.beginPath();
      ctx.arc(0, 0, fc.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#facc15';
      ctx.fill();
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner sparkle
      ctx.beginPath();
      ctx.arc(-fc.radius * 0.3, -fc.radius * 0.3, fc.radius * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Dollar symbol
      ctx.fillStyle = '#713f12';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 0.5);

      ctx.restore();
    });
  }

  private renderCelebrationBanner(ctx: CanvasRenderingContext2D) {
    const cb = this.celebrationBanner;
    ctx.save();

    const progress = cb.timer / cb.maxTimer;
    const enterScale = Math.min(1, (cb.maxTimer - cb.timer) * 6);
    const alpha = Math.min(1, cb.timer * 3);

    ctx.globalAlpha = alpha;

    const bx = GAME_WIDTH / 2;
    const by = 195; // Top sky area
    const bannerW = 400 * enterScale;
    const bannerH = 100 * enterScale;

    if (bannerW > 50) {
      ctx.shadowColor = 'rgba(250, 204, 21, 0.8)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 4;

      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.roundRect(bx - bannerW / 2 - 6, by - bannerH / 2 - 6, bannerW + 12, bannerH + 12, 22);
      ctx.fill();

      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect(bx - bannerW / 2, by - bannerH / 2, bannerW, bannerH, 18);
      ctx.fill();

      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.shadowColor = 'transparent';

      ctx.font = '900 26px Lilita One, Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 4;
      ctx.strokeText(cb.title, bx, by - 10);
      ctx.fillText(cb.title, bx, by - 10);

      ctx.font = '800 21px Lilita One, Fredoka, sans-serif';
      ctx.fillStyle = '#4ade80';
      ctx.strokeText(cb.subtitle, bx, by + 22);
      ctx.fillText(cb.subtitle, bx, by + 22);

      const barW = (bannerW - 50) * progress;
      ctx.fillStyle = '#facc15';
      ctx.fillRect(bx - (bannerW - 50) / 2, by + 36, barW, 3.5);
    }

    ctx.restore();
  }

  private renderHens(ctx: CanvasRenderingContext2D) {
    this.hens.forEach((hen) => {
      const config = COOP.hens[hen.level];
      const bob = Math.sin(hen.bobPhase) * 1.5;
      const henX = config.x;
      const henY = config.y + bob;

      assetManager.drawSprite(
        ctx,
        'hen',
        henX,
        henY,
        160,
        107,
        0.5,
        0.95
      );

      if (hen.state === 'laying') {
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('✨', henX, henY - 75);
      } else if (hen.state === 'happy') {
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('❤️', henX, henY - 75);
      }
    });
  }

  private renderBasket(ctx: CanvasRenderingContext2D) {
    const b = this.basket;
    ctx.save();

    const shakeOffset = b.shakeTimer > 0 ? (Math.random() - 0.5) * 12 : 0;
    const bx = b.x + shakeOffset;
    const by = b.y;

    // Wooden sign above basket showing count (e.g. 7 / 25)
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(bx + 20, by - 48, b.width - 40, 40, 12);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '800 23px Lilita One, Fredoka, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`🥚 ${b.eggCount} / ${b.capacity}`, bx + b.width / 2, by - 20);

    // Draw official Cesta.png
    assetManager.drawSprite(
      ctx,
      'basket',
      bx + b.width / 2,
      by + b.height / 2 + 10,
      b.width * 1.12,
      b.height * 1.12,
      0.5,
      0.5
    );

    // Draw egg sprites inside basket
    const eggCountToDraw = Math.min(b.eggCount, 12);
    const eggFrame = assetManager.getEggFrame();
    if (eggFrame) {
      for (let i = 0; i < eggCountToDraw; i++) {
        const ex = bx + 55 + (i % 5) * 36 + Math.floor(i / 5) * 12;
        const ey = by + 50 + Math.floor(i / 5) * 22;
        assetManager.drawFrame(ctx, 'egg', eggFrame, ex, ey, 36, 44, 0.5, 0.5);
      }
    }

    if (b.celebrating) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(bx + b.width / 2, by + b.height / 2, 130, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderPots(ctx: CanvasRenderingContext2D) {
    this.pots.forEach((pot, idx) => {
      ctx.save();
      const px = pot.x;
      const py = pot.y;

      if (pot.state === 'cooldown') {
        ctx.globalAlpha = 0.3;
        this.drawPotSprite(ctx, px, py, pot, idx);
        ctx.globalAlpha = 1.0;

        const progress = 1 - pot.cooldownTimer / POT_COOLDOWN_DEFAULT;
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(px, py + 10, 22, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ctx.stroke();
      } else {
        this.drawPotSprite(ctx, px, py, pot, idx);

        if (pot.state === 'ready') {
          ctx.font = 'bold 16px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 4;
          ctx.fillText('▼', px, py - 32);
        }
      }
      ctx.restore();
    });
  }

  private drawPotSprite(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    pot: FlowerPot,
    idx: number
  ) {
    if (pot.state === 'falling') {
      const frameIdx = Math.min(4, Math.floor((pot.vy / 600) * 5));
      const frame = assetManager.getPotFrame('falling', frameIdx);
      if (frame) {
        assetManager.drawFrame(ctx, 'pots', frame, x, y, 94, 94, 0.5, 0.5);
      }
    } else {
      const frame = assetManager.getPotFrame('intact', idx % 4);
      if (frame) {
        assetManager.drawFrame(ctx, 'pots', frame, x, y, 88, 84, 0.5, 0.5);
      }
    }
  }

  private renderSmashedPots(ctx: CanvasRenderingContext2D) {
    this.smashedPots.forEach((sp) => {
      ctx.save();
      ctx.globalAlpha = sp.alpha;
      const frame = assetManager.getPotFrame('smashed', sp.frameIndex);
      if (frame) {
        assetManager.drawFrame(ctx, 'pots', frame, sp.x, sp.y, 92, 82, 0.5, 0.5);
      }
      ctx.restore();
    });
  }

  private renderFox(ctx: CanvasRenderingContext2D) {
    if (!this.fox) return;
    const fox = this.fox;
    ctx.save();

    // Alert indicator when fox enters
    if (fox.x > 480 && fox.state === 'walking') {
      ctx.fillStyle = fox.isFast ? '#facc15' : '#ef4444';
      ctx.beginPath();
      ctx.arc(fox.x - 30, fox.y - 50, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#000000';
      ctx.font = '900 20px Lilita One, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fox.isFast ? '⚡' : '!', fox.x - 30, fox.y - 43);
    }

    const isBigState =
      fox.state === 'taunting' || fox.state === 'stealing' || fox.state === 'bonked';
    const renderHeight = isBigState ? 200 : 135;

    const timer = fox.state === 'walking' ? fox.animTimer : fox.stateTimer;
    const frame = assetManager.getFoxFrameByState(fox.state, timer);
    if (frame) {
      const renderWidth = Math.round((frame.sWidth / frame.sHeight) * renderHeight);
      assetManager.drawFrame(
        ctx,
        'fox',
        frame,
        fox.x,
        fox.y,
        renderWidth,
        renderHeight,
        0.5,
        0.9,
        fox.facing === 'right'
      );
    }

    // Dizzy Stars if bonked
    if (fox.state === 'bonked') {
      fox.dizzyStars.forEach((star) => {
        const sx = fox.x + Math.cos(star.angle) * (star.dist * 1.4);
        const sy = fox.y - 75 + Math.sin(star.angle) * (star.dist * 0.7);
        ctx.fillStyle = '#facc15';
        ctx.font = '30px sans-serif';
        ctx.fillText('⭐', sx - 10, sy + 8);
      });
    }

    // Speech bubble above fox
    if (fox.state === 'taunting' && fox.tauntMessage) {
      const bubbleWidth = Math.max(195, fox.tauntMessage.length * 13 + 36);
      const bx = Math.min(GAME_WIDTH - bubbleWidth / 2 - 15, Math.max(bubbleWidth / 2 + 15, fox.x));
      const by = fox.y - 235;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3.5;

      ctx.beginPath();
      ctx.roundRect(bx - bubbleWidth / 2, by - 26, bubbleWidth, 52, 16);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(fox.x - 14, by + 26);
      ctx.lineTo(fox.x, fox.y - 130);
      ctx.lineTo(fox.x + 14, by + 26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#dc2626';
      ctx.font = '800 22px Lilita One, Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fox.tauntMessage, bx, by + 8);
      ctx.restore();
    }

    ctx.restore();
  }

  private renderEggs(ctx: CanvasRenderingContext2D) {
    const eggFrame = assetManager.getEggFrame();
    if (!eggFrame) return;

    this.eggs.forEach((egg) => {
      if (egg.state === 'nest' || egg.state === 'rolling') {
        const glowScale = 1 + Math.sin(egg.glowPhase) * 0.18;
        ctx.save();

        if (egg.isSuper) {
          // Super Egg: Brilliant pulsating golden aura and sparkles
          const radGrad = ctx.createRadialGradient(egg.x, egg.y, 10, egg.x, egg.y, 55 * glowScale);
          radGrad.addColorStop(0, 'rgba(250, 204, 21, 0.85)');
          radGrad.addColorStop(0.6, 'rgba(234, 179, 8, 0.45)');
          radGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.arc(egg.x, egg.y, 55 * glowScale, 0, Math.PI * 2);
          ctx.fill();

          // Super Egg sprite (larger size: 66 x 80 px)
          assetManager.drawFrame(
            ctx,
            'egg',
            eggFrame,
            egg.x,
            egg.y,
            66,
            80,
            0.5,
            0.5
          );

          // Golden crown or sparkle marker
          ctx.font = '22px sans-serif';
          ctx.fillText('✨', egg.x + 16, egg.y - 24);
        } else {
          // Normal Egg: Clean soft aura
          ctx.fillStyle = 'rgba(253, 224, 71, 0.4)';
          ctx.beginPath();
          ctx.ellipse(egg.x, egg.y, 30 * glowScale, 36 * glowScale, 0, 0, Math.PI * 2);
          ctx.fill();

          assetManager.drawFrame(
            ctx,
            'egg',
            eggFrame,
            egg.x,
            egg.y,
            48,
            58,
            0.5,
            0.5
          );
        }
        ctx.restore();
      }
    });
  }

  private renderDraggingEgg(ctx: CanvasRenderingContext2D, egg: Egg) {
    const eggFrame = assetManager.getEggFrame();
    if (!eggFrame) return;

    ctx.save();
    // Shadow under dragged egg
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(egg.x, egg.y + 50, 28, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    if (egg.isSuper) {
      // Super Egg dragged
      const glowScale = 1 + Math.sin(egg.glowPhase) * 0.18;
      const radGrad = ctx.createRadialGradient(egg.x, egg.y, 10, egg.x, egg.y, 65 * glowScale);
      radGrad.addColorStop(0, 'rgba(250, 204, 21, 0.9)');
      radGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(egg.x, egg.y, 65 * glowScale, 0, Math.PI * 2);
      ctx.fill();

      assetManager.drawFrame(
        ctx,
        'egg',
        eggFrame,
        egg.x,
        egg.y,
        76,
        92,
        0.5,
        0.5
      );
    } else {
      assetManager.drawFrame(
        ctx,
        'egg',
        eggFrame,
        egg.x,
        egg.y,
        58,
        70,
        0.5,
        0.5
      );
    }

    // Finger pointer cue
    ctx.font = '40px sans-serif';
    ctx.fillText('👆', egg.x + 14, egg.y + 45);

    ctx.restore();
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'coin') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('$', p.x, p.y + 3);
      } else if (p.type === 'confetti') {
        ctx.translate(p.x, p.y);
        if (p.rotation !== undefined) {
          ctx.rotate(p.rotation);
        }
        ctx.fillRect(-p.radius, -p.radius * 0.4, p.radius * 2, p.radius * 0.8);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D) {
    this.floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = `800 ${ft.size}px Lilita One, Fredoka, sans-serif`;
      ctx.textAlign = 'center';

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(ft.text, ft.x, ft.y);

      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }
}
