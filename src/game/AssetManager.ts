/**
 * Sprite and Asset Manager for Fox Tiefo.
 * Loads and manages the official game assets with exact frame slicing.
 */

export interface SpriteAsset {
  id: string;
  image: HTMLImageElement;
  loaded: boolean;
  width: number;
  height: number;
}

export interface SpriteFrame {
  sx: number;
  sy: number;
  sWidth: number;
  sHeight: number;
}

// Exact pixel coordinates measured directly from zorro.png (1774 x 887)
export const FOX_SPRITE_FRAMES = {
  // Row 0: Sneaking walk cycle (5 clean frames col 0..4; frame 5 omitted as requested)
  walk: [
    { sx: 0, sy: 40, sWidth: 354, sHeight: 270 },
    { sx: 354, sy: 40, sWidth: 312, sHeight: 270 },
    { sx: 666, sy: 40, sWidth: 300, sHeight: 270 },
    { sx: 966, sy: 40, sWidth: 283, sHeight: 270 },
    { sx: 1250, sy: 40, sWidth: 333, sHeight: 270 },
  ],
  // Row 1: Stealing / reaching / grabbing egg (y = 321..595)
  steal: [
    { sx: 0, sy: 321, sWidth: 325, sHeight: 274 },
    { sx: 325, sy: 321, sWidth: 322, sHeight: 274 },
    { sx: 647, sy: 321, sWidth: 302, sHeight: 274 },
    { sx: 949, sy: 321, sWidth: 251, sHeight: 274 },
    { sx: 1200, sy: 321, sWidth: 277, sHeight: 274 },
    { sx: 1477, sy: 321, sWidth: 297, sHeight: 274 },
  ],
  // Row 2: Reactions & Taunts (y = 595..875)
  bonked: { sx: 12, sy: 595, sWidth: 326, sHeight: 280 },
  dizzy: { sx: 338, sy: 595, sWidth: 264, sHeight: 280 },
  panicRun: [
    { sx: 602, sy: 595, sWidth: 307, sHeight: 280 },
    { sx: 909, sy: 595, sWidth: 311, sHeight: 280 },
  ],
  taunt: [
    { sx: 1220, sy: 595, sWidth: 267, sHeight: 280 },
    { sx: 1487, sy: 595, sWidth: 287, sHeight: 280 },
  ],
};

// Exact frames for flower pots (1536 x 1024)
export const POT_SPRITE_FRAMES = {
  intact: [
    { sx: 15, sy: 20, sWidth: 410, sHeight: 310 },
    { sx: 435, sy: 20, sWidth: 340, sHeight: 310 },
    { sx: 780, sy: 20, sWidth: 450, sHeight: 310 },
    { sx: 1240, sy: 20, sWidth: 290, sHeight: 310 },
  ],
  falling: [
    { sx: 0, sy: 341, sWidth: 307, sHeight: 341 },
    { sx: 307, sy: 341, sWidth: 307, sHeight: 341 },
    { sx: 614, sy: 341, sWidth: 307, sHeight: 341 },
    { sx: 921, sy: 341, sWidth: 307, sHeight: 341 },
    { sx: 1228, sy: 341, sWidth: 308, sHeight: 341 },
  ],
  smashed: [
    { sx: 0, sy: 682, sWidth: 384, sHeight: 341 },
    { sx: 384, sy: 682, sWidth: 384, sHeight: 341 },
    { sx: 768, sy: 682, sWidth: 384, sHeight: 341 },
    { sx: 1152, sy: 682, sWidth: 384, sHeight: 341 },
  ],
};

const BASE_PREFIX = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : import.meta.env.BASE_URL + '/';

export const GAME_BUILD_VERSION = '2.2';

export function resolveAssetUrl(path: string): string {
  if (path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http')) {
    return path;
  }
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `${BASE_PREFIX}${clean}?v=${GAME_BUILD_VERSION}`;
}

class AssetManager {
  private assets: Map<string, SpriteAsset> = new Map();

  // Primary paths for official assets
  public readonly paths: Record<string, string> = {
    background: 'assets/sprites/fondo.png',
    hen: 'assets/sprites/Gallina en el nido.png',
    egg: 'assets/sprites/Huevo individual.png',
    basket: 'assets/sprites/Cesta.png',
    logo: 'assets/sprites/logo.png',
    pots: 'assets/sprites/macetas.png',
    fox: 'assets/sprites/zorro.png',
  };

  private readonly fallbackPaths: Record<string, string[]> = {
    background: ['assets/sprites/fondo.png', 'fondo.png'],
    hen: ['assets/sprites/Gallina en el nido.png', 'assets/sprites/Gallina.png'],
    egg: ['assets/sprites/Huevo individual.png', 'assets/sprites/Huevo.png'],
    basket: ['assets/sprites/Cesta.png'],
    logo: ['assets/sprites/logo.png'],
    pots: ['assets/sprites/macetas.png'],
    fox: ['assets/sprites/zorro.png'],
  };

  constructor() {
    this.initPreload();
  }

  public initPreload() {
    Object.entries(this.paths).forEach(([id, primaryPath]) => {
      this.loadAsset(id, primaryPath);
    });
  }

  public loadAsset(id: string, primaryPath: string) {
    const candidates = this.fallbackPaths[id] || [primaryPath];
    this.tryLoadCandidates(id, candidates, 0);
  }

  private tryLoadCandidates(id: string, candidates: string[], index: number) {
    if (index >= candidates.length) return;
    const rawPath = candidates[index];
    const resolvedPath = resolveAssetUrl(rawPath);

    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        this.assets.set(id, {
          id,
          image: img,
          loaded: true,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      }
    };

    img.onerror = () => {
      this.tryLoadCandidates(id, candidates, index + 1);
    };

    img.src = encodeURI(resolvedPath);
  }

  public loadSprite(id: string, src: string): Promise<SpriteAsset> {
    return new Promise((resolve) => {
      const img = new Image();
      const asset: SpriteAsset = {
        id,
        image: img,
        loaded: false,
        width: 0,
        height: 0,
      };

      img.onload = () => {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          asset.loaded = true;
          asset.width = img.naturalWidth;
          asset.height = img.naturalHeight;
          this.assets.set(id, asset);
        }
        resolve(asset);
      };

      img.onerror = () => {
        asset.loaded = false;
        resolve(asset);
      };

      img.src = src;
    });
  }

  public getSprite(id: string): SpriteAsset | undefined {
    return this.assets.get(id);
  }

  public isLoaded(id: string): boolean {
    const asset = this.assets.get(id);
    return !!asset && asset.loaded;
  }

  /**
   * Draw full sprite image with scaling and anchoring
   */
  public drawSprite(
    ctx: CanvasRenderingContext2D,
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    anchorX: number = 0.5,
    anchorY: number = 0.5,
    rotation: number = 0
  ): boolean {
    const asset = this.assets.get(id);
    if (!asset || !asset.loaded) return false;

    ctx.save();
    ctx.translate(x, y);
    if (rotation !== 0) {
      ctx.rotate(rotation);
    }
    ctx.drawImage(
      asset.image,
      -width * anchorX,
      -height * anchorY,
      width,
      height
    );
    ctx.restore();
    return true;
  }

  /**
   * Draw exact cropped frame from sprite sheet
   */
  public drawFrame(
    ctx: CanvasRenderingContext2D,
    id: string,
    frame: SpriteFrame,
    x: number,
    y: number,
    destWidth: number,
    destHeight: number,
    anchorX: number = 0.5,
    anchorY: number = 0.5,
    flipX: boolean = false
  ): boolean {
    const asset = this.assets.get(id);
    if (!asset || !asset.loaded) return false;

    ctx.save();
    ctx.translate(x, y);
    if (flipX) {
      ctx.scale(-1, 1);
    }
    ctx.drawImage(
      asset.image,
      frame.sx,
      frame.sy,
      frame.sWidth,
      frame.sHeight,
      -destWidth * anchorX,
      -destHeight * anchorY,
      destWidth,
      destHeight
    );
    ctx.restore();
    return true;
  }

  /**
   * Get exact Fox frame by state
   */
  public getFoxFrameByState(
    state: string,
    timer: number
  ): SpriteFrame | null {
    if (!this.isLoaded('fox')) return null;

    if (state === 'walking') {
      const idx = Math.floor(timer) % FOX_SPRITE_FRAMES.walk.length;
      return FOX_SPRITE_FRAMES.walk[idx];
    } else if (state === 'stealing') {
      const idx = Math.min(
        FOX_SPRITE_FRAMES.steal.length - 1,
        Math.floor(timer * 6)
      );
      return FOX_SPRITE_FRAMES.steal[idx];
    } else if (state === 'bonked') {
      return FOX_SPRITE_FRAMES.bonked;
    } else if (state === 'fleeing' || state === 'escaped') {
      const idx = Math.floor(timer * 4) % FOX_SPRITE_FRAMES.panicRun.length;
      return FOX_SPRITE_FRAMES.panicRun[idx];
    } else if (state === 'taunting') {
      const idx = Math.floor(timer * 3) % FOX_SPRITE_FRAMES.taunt.length;
      return FOX_SPRITE_FRAMES.taunt[idx];
    }

    return FOX_SPRITE_FRAMES.walk[0];
  }

  /**
   * Get exact flower pot frame
   */
  public getPotFrame(type: 'intact' | 'falling' | 'smashed', index: number): SpriteFrame | null {
    if (!this.isLoaded('pots')) return null;

    if (type === 'intact') {
      const col = Math.min(POT_SPRITE_FRAMES.intact.length - 1, Math.max(0, index));
      return POT_SPRITE_FRAMES.intact[col];
    } else if (type === 'falling') {
      const col = Math.min(POT_SPRITE_FRAMES.falling.length - 1, Math.max(0, index));
      return POT_SPRITE_FRAMES.falling[col];
    } else {
      const col = Math.min(POT_SPRITE_FRAMES.smashed.length - 1, Math.max(0, index));
      return POT_SPRITE_FRAMES.smashed[col];
    }
  }

  /**
   * Slice frame for Egg image to trim transparent padding (1536 x 1024)
   */
  public getEggFrame(): SpriteFrame | null {
    if (!this.isLoaded('egg')) return null;
    return {
      sx: 290,
      sy: 34,
      sWidth: 1053,
      sHeight: 960,
    };
  }
}

export const assetManager = new AssetManager();
