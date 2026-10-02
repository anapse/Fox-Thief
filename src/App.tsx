/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { PauseModal } from './components/modals/PauseModal';
import { HowToPlayModal } from './components/modals/HowToPlayModal';
import { ShopModal } from './components/modals/ShopModal';
import { LeaderboardModal } from './components/modals/LeaderboardModal';
import { StatsModal } from './components/modals/StatsModal';
import { ContactModal } from './components/modals/ContactModal';
import { GameOverModal } from './components/modals/GameOverModal';
import { AdminPortal } from './components/admin/AdminPortal';
import { GameEngine } from './game/GameEngine';
import { sounds } from './audio/soundManager';
import { getSavedStats } from './utils/storage';
import { GameStats } from './types/game';
import { loadAllSavedAssets, saveAssetBlob, mapFilenameToAssetId } from './game/SpriteStorage';
import { logSessionEvent } from './utils/firebase';

function isCurrentRouteAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  return (
    path.endsWith('/admin') ||
    path.endsWith('/admin/') ||
    hash === '#admin' ||
    hash === '#/admin' ||
    search.includes('admin=true') ||
    search.includes('admin')
  );
}

export default function App() {
  const engineRef = useRef<GameEngine | null>(null);

  // Admin routing state (hidden from public game buttons)
  const [isAdminView, setIsAdminView] = useState<boolean>(() => isCurrentRouteAdmin());

  // High level UI states
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<
    'none' | 'howToPlay' | 'leaderboard' | 'stats' | 'contact' | 'shop'
  >('none');

  // Dynamic In-Game HUD states
  const [coins, setCoins] = useState<number>(() => getSavedStats().totalCoins);
  const [basketCount, setBasketCount] = useState<number>(0);
  const [basketCapacity, setBasketCapacity] = useState<number>(10);
  const [health, setHealth] = useState<number>(3.0);
  const [isMuted, setIsMuted] = useState<boolean>(() => sounds.getMuted());
  const [dropFeedback, setDropFeedback] = useState<string | null>(null);

  // Game Over state
  const [gameOverData, setGameOverData] = useState<{
    score: number;
    stats: GameStats;
  } | null>(null);

  // Check URL routes for /admin
  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminView(isCurrentRouteAdmin());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    // Initial session visit log
    logSessionEvent('visit');

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Load persistent assets on startup
  useEffect(() => {
    loadAllSavedAssets();
  }, []);

  // Drag and drop asset handler on the window
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      if (!e.dataTransfer || !e.dataTransfer.files.length) return;

      const files = Array.from(e.dataTransfer.files);
      let loadedCount = 0;

      for (const file of files) {
        const assetId = mapFilenameToAssetId(file.name);
        if (assetId) {
          await saveAssetBlob(assetId, file);
          loadedCount++;
        }
      }

      if (loadedCount > 0) {
        sounds.playBasketSold();
        setDropFeedback(`¡${loadedCount} Asset(s) oficial(es) integrado(s) con éxito!`);
        setTimeout(() => setDropFeedback(null), 3000);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Callback from Game Engine loop
  const handleEngineStateUpdate = useCallback(
    (data: {
      coins: number;
      basketCount: number;
      basketCapacity: number;
      health: number;
      maxHealth: number;
      foxActive: boolean;
    }) => {
      setCoins(data.coins);
      setBasketCount(data.basketCount);
      setBasketCapacity(data.basketCapacity);
      setHealth(data.health);
    },
    []
  );

  const handleGameOver = useCallback((data: { score: number; stats: GameStats }) => {
    setGameOverData(data);
  }, []);

  const handlePlay = () => {
    setGameOverData(null);
    setGameState('playing');
    setIsPaused(false);
    logSessionEvent('game_start');
    if (engineRef.current) {
      engineRef.current.restartGame();
      engineRef.current.resume();
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    if (engineRef.current) {
      engineRef.current.pause();
    }
  };

  const handleResume = () => {
    setIsPaused(false);
    if (engineRef.current) {
      engineRef.current.resume();
    }
  };

  const handleRestart = () => {
    setIsPaused(false);
    setGameOverData(null);
    setGameState('menu');
    if (engineRef.current) {
      engineRef.current.restartGame();
      engineRef.current.pause();
    }
  };

  const handleMainMenu = () => {
    setIsPaused(false);
    setGameOverData(null);
    setGameState('menu');
    if (engineRef.current) {
      engineRef.current.restartGame();
      engineRef.current.pause();
    }
  };

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleCloseShop = () => {
    setActiveModal('none');
    if (engineRef.current) {
      engineRef.current.reloadUpgrades();
      if (!isPaused && gameState === 'playing') {
        engineRef.current.resume();
      }
    }
  };

  const handleExitAdmin = () => {
    // Navigate back to public game route
    if (window.location.hash) {
      window.location.hash = '';
    } else {
      window.history.pushState({}, '', import.meta.env.BASE_URL || '/');
    }
    setIsAdminView(false);
  };

  // If in /admin route, render secure Admin Portal
  if (isAdminView) {
    return <AdminPortal onBackToGame={handleExitAdmin} />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 flex items-center justify-center p-0 sm:p-2 select-none">
      {/* Background vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/30 via-stone-950 to-stone-950 pointer-events-none" />

      {/* Drop notification banner */}
      {dropFeedback && (
        <div className="absolute top-4 z-50 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-game text-base shadow-2xl border-2 border-emerald-400 animate-bounce">
          {dropFeedback}
        </div>
      )}

      {/* 9:16 Responsive Container */}
      <div className="relative w-full h-full max-h-screen aspect-[9/16] max-w-[calc(100vh*9/16)] bg-amber-950 shadow-2xl overflow-hidden rounded-none sm:rounded-3xl border-0 sm:border-4 border-amber-900/60 flex flex-col">
        {/* Main Canvas Engine Area */}
        <div className="relative w-full h-full">
          <GameCanvas
            engineRef={engineRef}
            onStateUpdate={handleEngineStateUpdate}
            onGameOver={handleGameOver}
          />

          {/* In-Game HUD with Single Vertical Combined Panel */}
          {gameState === 'playing' && (
            <HUD
              coins={coins}
              basketCount={basketCount}
              basketCapacity={basketCapacity}
              health={health}
              onOpenPause={handlePause}
            />
          )}

          {/* Main Menu Overlay */}
          {gameState === 'menu' && (
            <MainMenu
              onPlay={handlePlay}
              onOpenHowToPlay={() => setActiveModal('howToPlay')}
              onOpenLeaderboard={() => setActiveModal('leaderboard')}
              onOpenStats={() => setActiveModal('stats')}
              onOpenContact={() => setActiveModal('contact')}
              isMuted={isMuted}
              onToggleSound={handleToggleSound}
            />
          )}

          {/* Modals */}
          <PauseModal
            isOpen={isPaused && gameOverData === null}
            onResume={handleResume}
            onRestart={handleRestart}
            onMainMenu={handleMainMenu}
            isMuted={isMuted}
            onToggleSound={handleToggleSound}
          />

          <HowToPlayModal
            isOpen={activeModal === 'howToPlay'}
            onClose={() => setActiveModal('none')}
          />

          <ShopModal
            isOpen={activeModal === 'shop'}
            onClose={handleCloseShop}
            coins={coins}
            onUpgradesChanged={() => {
              if (engineRef.current) {
                engineRef.current.reloadUpgrades();
              }
            }}
          />

          <LeaderboardModal
            isOpen={activeModal === 'leaderboard'}
            onClose={() => setActiveModal('none')}
            playerCoins={coins}
          />

          <StatsModal
            isOpen={activeModal === 'stats'}
            onClose={() => setActiveModal('none')}
          />

          <ContactModal
            isOpen={activeModal === 'contact'}
            onClose={() => setActiveModal('none')}
          />

          {/* Game Over Modal with Strict Top 50 Flow */}
          {gameOverData && (
            <GameOverModal
              isOpen={true}
              score={gameOverData.score}
              stats={gameOverData.stats}
              onContinueToMenu={handleMainMenu}
              onViewLeaderboard={() => {
                setGameOverData(null);
                setGameState('menu');
                setActiveModal('leaderboard');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
