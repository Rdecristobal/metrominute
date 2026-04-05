'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GameMode, GamePhase, GameState, CanvasDimensions } from '@/lib/tanks/types';
import { TanksEngine } from '@/lib/tanks/engine';
import { renderGame, clearStarsCache } from '@/lib/tanks/renderer';
import { MIN_ANGLE, MAX_ANGLE, MIN_POWER, MAX_POWER } from '@/lib/tanks/constants';
import MenuScreen from './MenuScreen';
import SetupScreen from './SetupScreen';
import GameScreen from './GameScreen';
import GameOverScreen from './GameOverScreen';

export default function TanksGame() {
  const [screen, setScreen] = useState<GamePhase>('menu');
  const [mode, setMode] = useState<GameMode | null>(null);
  const [tankCount, setTankCount] = useState(2);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isPortrait, setIsPortrait] = useState(false);

  const engineRef = useRef<TanksEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  // Check orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Initialize engine
  useEffect(() => {
    const dimensions: CanvasDimensions = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    engineRef.current = new TanksEngine({ mode: 'local', tankCount: 2 }, dimensions);

    const unsubscribe = engineRef.current.subscribe((state) => {
      setGameState({ ...state });
      setScreen(state.phase);
    });

    return () => {
      unsubscribe();
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  // Setup canvas resize observer
  useEffect(() => {
    if (!canvasRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const canvas = canvasRef.current;
      const container = entries[0].contentRect;

      if (!canvas) return;
      canvas.width = container.width;
      canvas.height = container.height;

      const dimensions: CanvasDimensions = {
        width: container.width,
        height: container.height,
      };

      engineRef.current?.updateDimensions(dimensions);
    });

    const container = document.getElementById('tanks-canvas-container');
    if (container) {
      resizeObserver.observe(container);
    }

    return () => resizeObserver.disconnect();
  }, [screen]);

  // Game loop
  useEffect(() => {
    if (screen !== 'playing' && screen !== 'exploding') {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const loop = () => {
      if (!engineRef.current || !canvasRef.current) return;

      // Update engine
      engineRef.current.update();

      // Render canvas
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const state = engineRef.current.getState();
        const dimensions: CanvasDimensions = {
          width: canvasRef.current.width,
          height: canvasRef.current.height,
        };
        renderGame(ctx, state, dimensions, true);
      }

      // Continue loop
      if (engineRef.current.isAnimating()) {
        gameLoopRef.current = requestAnimationFrame(loop);
      } else {
        gameLoopRef.current = null;
      }
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [screen]);

  // Mode selection handler
  const handleSelectMode = useCallback((selectedMode: GameMode) => {
    setMode(selectedMode);
    setScreen('setup');
  }, []);

  // Tank count change handler
  const handleTankCountChange = useCallback((count: number) => {
    setTankCount(count);
  }, []);

  // Start game handler
  const handleStartGame = useCallback(() => {
    if (!mode) return;

    engineRef.current?.startGame({ mode, tankCount });
    setScreen('playing');
  }, [mode, tankCount]);

  // Back to menu handler
  const handleBackToMenu = useCallback(() => {
    setMode(null);
    setTankCount(2);
    setScreen('menu');
  }, []);

  // Fire handler
  const handleFire = useCallback(() => {
    engineRef.current?.fire();
  }, []);

  // Rematch handler
  const handleRematch = useCallback(() => {
    if (!mode) return;
    engineRef.current?.startGame({ mode, tankCount });
    setScreen('playing');
  }, [mode, tankCount]);

  // Canvas pointer handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || !lastPointerRef.current || !engineRef.current) return;

    const state = engineRef.current.getState();
    const activeTank = state.tanks[state.activeTankIndex];
    if (!activeTank || activeTank.isAI || !activeTank.alive) return;

    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;

    // Adjust angle (horizontal drag)
    const newAngle = activeTank.angle + dx * 0.5;
    engineRef.current.setTankAngle(activeTank.id, Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, newAngle)));

    // Adjust power (vertical drag)
    const newPower = activeTank.power - dy * 0.3;
    engineRef.current.setTankPower(activeTank.id, Math.max(MIN_POWER, Math.min(MAX_POWER, newPower)));

    lastPointerRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    lastPointerRef.current = null;
  }, []);

  // Show rotate overlay for portrait
  if (isPortrait) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50">
        <div className="text-4xl mb-4">🔄</div>
        <h2 className="text-2xl font-bold mb-2 text-[#ff2d78]">Rotate your device</h2>
        <p className="text-gray-400">Tanks requires landscape mode</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Menu screen */}
      {screen === 'menu' && <MenuScreen onSelectMode={handleSelectMode} />}

      {/* Setup screen */}
      {screen === 'setup' && mode && (
        <SetupScreen
          mode={mode}
          tankCount={tankCount}
          onTankCountChange={handleTankCountChange}
          onStart={handleStartGame}
          onBack={handleBackToMenu}
        />
      )}

      {/* Game screen */}
      {(screen === 'playing' || screen === 'exploding') && gameState && (
        <GameScreen gameState={gameState} onFire={handleFire}>
          <canvas
            ref={canvasRef}
            className="w-full h-full block touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </GameScreen>
      )}

      {/* Game over screen */}
      {screen === 'gameover' && gameState && (
        <GameOverScreen
          winner={gameState.winner}
          isDraw={gameState.isDraw}
          onRematch={handleRematch}
          onMenu={handleBackToMenu}
        />
      )}
    </div>
  );
}
