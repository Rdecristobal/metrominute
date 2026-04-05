'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GameMode, GamePhase, GameState, CanvasDimensions } from '@/lib/tanks/types';
import { TanksEngine } from '@/lib/tanks/engine';
import { renderGame } from '@/lib/tanks/renderer';
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

  // Setup canvas resize observer - ONCE on mount, not on screen change
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const container = entries[0].contentRect;

      // Only update if container has valid dimensions
      if (container.width > 0 && container.height > 0) {
        canvas.width = container.width;
        canvas.height = container.height;

        const dimensions: CanvasDimensions = {
          width: container.width,
          height: container.height,
        };
        engineRef.current?.updateDimensions(dimensions);
      }
    });

    const container = document.getElementById('tanks-canvas-container');
    if (container) {
      resizeObserver.observe(container);
    }

    // Also force initial resize when canvas mounts
    const forceInitialResize = () => {
      const canvas = canvasRef.current;
      const container = document.getElementById('tanks-canvas-container');
      if (canvas && container) {
        const rect = container.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          canvas.width = rect.width;
          canvas.height = rect.height;

          const dimensions: CanvasDimensions = {
            width: rect.width,
            height: rect.height,
          };
          engineRef.current?.updateDimensions(dimensions);
        }
      }
    };

    // Force resize after a small delay to ensure container is fully laid out
    const timeoutId = setTimeout(forceInitialResize, 100);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

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

      // Skip render if canvas has invalid dimensions (0x0)
      if (canvasRef.current.width === 0 || canvasRef.current.height === 0) {
        // Try to resize again on next frame
        if (engineRef.current.isAnimating()) {
          gameLoopRef.current = requestAnimationFrame(loop);
        } else {
          gameLoopRef.current = null;
        }
        return;
      }

      engineRef.current.update();

      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const state = engineRef.current.getState();
        const dimensions: CanvasDimensions = {
          width: canvasRef.current.width,
          height: canvasRef.current.height,
        };
        renderGame(ctx, state, dimensions, true);
      }

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

  // Angle change handler (from buttons)
  const handleAngleChange = useCallback((delta: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    const state = engine.getState();
    const activeTank = state.tanks[state.activeTankIndex];
    if (!activeTank || activeTank.isAI || !activeTank.alive) return;
    if (state.projectile?.active) return;
    const newAngle = activeTank.angle + delta;
    engine.setTankAngle(activeTank.id, Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, newAngle)));
  }, []);

  // Power change handler (from buttons)
  const handlePowerChange = useCallback((delta: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    const state = engine.getState();
    const activeTank = state.tanks[state.activeTankIndex];
    if (!activeTank || activeTank.isAI || !activeTank.alive) return;
    if (state.projectile?.active) return;
    const newPower = activeTank.power + delta;
    engine.setTankPower(activeTank.id, Math.max(MIN_POWER, Math.min(MAX_POWER, newPower)));
  }, []);

  // Rematch handler
  const handleRematch = useCallback(() => {
    if (!mode) return;
    engineRef.current?.startGame({ mode, tankCount });
    setScreen('playing');
  }, [mode, tankCount]);

  // Show rotate overlay for portrait — only DURING gameplay, not menu/setup
  if (isPortrait && (screen === 'playing' || screen === 'exploding')) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50">
        <div className="text-4xl mb-4">🔄</div>
        <h2 className="text-2xl font-bold mb-2 text-[#ff2d78]">Rotate your device</h2>
        <p className="text-gray-400">Tanks requires landscape mode to play</p>
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
        <GameScreen
          gameState={gameState}
          onFire={handleFire}
          onAngleChange={handleAngleChange}
          onPowerChange={handlePowerChange}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
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
