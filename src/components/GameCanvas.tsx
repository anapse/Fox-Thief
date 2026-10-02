import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/GameEngine';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/constants';
import { GameStats } from '../types/game';

interface GameCanvasProps {
  engineRef: React.MutableRefObject<GameEngine | null>;
  onStateUpdate: (data: {
    coins: number;
    basketCount: number;
    basketCapacity: number;
    health: number;
    maxHealth: number;
    foxActive: boolean;
  }) => void;
  onGameOver: (data: { score: number; stats: GameStats }) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engineRef,
  onStateUpdate,
  onGameOver,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    const engine = new GameEngine(canvas);
    engine.onStateUpdate = onStateUpdate;
    engine.onGameOver = onGameOver;
    engine.start();
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block cursor-pointer touch-none select-none object-contain"
      style={{
        imageRendering: 'auto',
      }}
    />
  );
};
