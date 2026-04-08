'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GameMode, GamePhase, GameState, CanvasDimensions } from '@/lib/tanks/types';
import { TanksEngine } from '@/lib/tanks/engine';
import { renderGame } from '@/lib/tanks/renderer';
import { MIN_POWER, MAX_POWER } from '@/lib/tanks/constants';
import MenuScreen from './MenuScreen';
import SetupScreen from './SetupScreen';
import GameScreen from './GameScreen';
import GameOverScreen from './GameOverScreen';

export default function TanksGame() {
  const [screen, setScreen] = useState<GamePhase>('menu');
  const [mode, setMode] = useState<GameMode | null>(null);
  const [tankCount, setTankCount] = useState(2);
  const [gameState, setGameState] = useState<GameState | null>(null);

  const engineRef = useRef<TanksEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Power oscillation refs
  const powerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const powerDirectionRef = useRef<'up' | 'down'>('up');

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
      if (powerIntervalRef.current) {
        clearInterval(powerIntervalRef.current);
      }
    };
  }, []);

  // Cleanup power interval when turn changes (activeTankIndex changes)
  useEffect(() => {
    if (powerIntervalRef.current) {
      clearInterval(powerIntervalRef.current);
      powerIntervalRef.current = null;
    }
  }, [gameState?.activeTankIndex]);

  // Setup canvas resize with ref callback - fires when canvas mounts/unmounts
  const handleCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;

    if (!canvas) {
      // Canvas unmounted - clean up observer
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      return;
    }

    // Canvas mounted - observe container and set initial dimensions
    const container = document.getElementById('tanks-canvas-container');
    if (!container) return;

    // Function to set canvas dimensions from container
    const updateCanvasDimensions = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width;
        canvas.height = rect.height;

        const dimensions: CanvasDimensions = {
          width: rect.width,
          height: rect.height,
        };
        engineRef.current?.updateDimensions(dimensions);
        return true;
      }
      return false;
    };

    // Set initial dimensions immediately
    updateCanvasDimensions();

    // Retry with RAF if dimensions were 0
    let attempts = 0;
    const maxAttempts = 5;

    const retryWithRAF = () => {
      if (attempts >= maxAttempts) return;
      attempts++;

      if (!updateCanvasDimensions()) {
        requestAnimationFrame(retryWithRAF);
      }
    };

    requestAnimationFrame(retryWithRAF);

    // Create and attach ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        canvas.width = width;
        canvas.height = height;

        const dimensions: CanvasDimensions = {
          width,
          height,
        };
        engineRef.current?.updateDimensions(dimensions);
      }
    });

    resizeObserver.observe(container);
    resizeObserverRef.current = resizeObserver;
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

  // Start game handler — do NOT setScreen('playing'), the subscription handles it
  const handleStartGame = useCallback(() => {
    if (!mode) return;
    if (powerIntervalRef.current) {
      clearInterval(powerIntervalRef.current);
      powerIntervalRef.current = null;
    }
    engineRef.current?.startGame({ mode, tankCount });
  }, [mode, tankCount]);

  // Back to menu handler
  const handleBackToMenu = useCallback(() => {
    if (powerIntervalRef.current) {
      clearInterval(powerIntervalRef.current);
      powerIntervalRef.current = null;
    }
    setMode(null);
    setTankCount(2);
    setScreen('menu');
  }, []);

  // Pointer handlers for aiming (touch on canvas)
  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    const engine = engineRef.current;
    if (!engine) return;
    const state = engine.getState();
    const activeTank = state.tanks[state.activeTankIndex];
    if (!activeTank || activeTank.isAI || !activeTank.alive) return;
    if (state.projectile?.active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    engine.setAngleFromPosition(activeTank.id, e.clientX, e.clientY, rect);
  }, []);

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    const engine = engineRef.current;
    if (!engine) return;
    const state = engine.getState();
    const activeTank = state.tanks[state.activeTankIndex];
    if (!activeTank || activeTank.isAI || !activeTank.alive) return;
    if (state.projectile?.active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    engine.setAngleFromPosition(activeTank.id, e.clientX, e.clientY, rect);
  }, []);

  // FIRE with power oscillation
  const handleFireStart = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const state = engine.getState();
    const activeTank = state.tanks[state.activeTankIndex];
    if (!activeTank || activeTank.isAI || !activeTank.alive) return;
    if (state.projectile?.active) return;

    // Start power oscillation
    powerDirectionRef.current = 'up';
    engine.setTankPower(activeTank.id, MIN_POWER);

    powerIntervalRef.current = setInterval(() => {
      const currentState = engineRef.current?.getState();
      if (!currentState) return;
      const tank = currentState.tanks[currentState.activeTankIndex];
      if (!tank) return;

      let newPower = tank.power;
      const step = 3;

      if (powerDirectionRef.current === 'up') {
        newPower += step;
        if (newPower >= MAX_POWER) {
          newPower = MAX_POWER;
          powerDirectionRef.current = 'down';
        }
      } else {
        newPower -= step;
        if (newPower <= MIN_POWER) {
          newPower = MIN_POWER;
          powerDirectionRef.current = 'up';
        }
      }

      engineRef.current?.setTankPower(tank.id, newPower);
    }, 30);
  }, []);

  const handleFireEnd = useCallback(() => {
    // Stop oscillation and fire
    if (powerIntervalRef.current) {
      clearInterval(powerIntervalRef.current);
      powerIntervalRef.current = null;
    }
    engineRef.current?.fire();
  }, []);

  // Rematch handler
  const handleRematch = useCallback(() => {
    if (!mode) return;
    if (powerIntervalRef.current) {
      clearInterval(powerIntervalRef.current);
      powerIntervalRef.current = null;
    }
    engineRef.current?.startGame({ mode, tankCount });
  }, [mode, tankCount]);

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
          onCanvasPointerDown={handleCanvasPointerDown}
          onCanvasPointerMove={handleCanvasPointerMove}
          onFireStart={handleFireStart}
          onFireEnd={handleFireEnd}
        >
          <canvas
            ref={handleCanvasRef}
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
