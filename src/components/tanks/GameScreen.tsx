'use client';

import { useState, useEffect } from 'react';
import { GameState } from '@/lib/tanks/types';

// ─── Orientation hook ───────────────────────────────────────────

function useOrientation(): boolean {
  const [isLandscape, setIsLandscape] = useState(false);
  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isLandscape;
}

// ─── Props ──────────────────────────────────────────────────────

interface GameScreenProps {
  gameState: GameState;
  onCanvasPointerDown: (e: React.PointerEvent) => void;
  onCanvasPointerMove: (e: React.PointerEvent) => void;
  onCanvasPointerUp: () => void;
  onFireStart: () => void;
  onFireEnd: () => void;
  children?: React.ReactNode;
}

// ─── Component ──────────────────────────────────────────────────

export default function GameScreen({
  gameState,
  onCanvasPointerDown,
  onCanvasPointerMove,
  onCanvasPointerUp,
  onFireStart,
  onFireEnd,
  children,
}: GameScreenProps) {
  const isLandscape = useOrientation();
  const activeTank = gameState.tanks[gameState.activeTankIndex];
  const isPlayerTurn = activeTank && !activeTank.isAI && activeTank.alive;
  const canFire = isPlayerTurn && !gameState.projectile?.active;

  const hudHeight = isLandscape ? 24 : 36;
  const controlsHeight = isLandscape ? 40 : 56;
  const fontSize = isLandscape ? '10px' : undefined;
  const fontClass = isLandscape ? undefined : 'text-xs';

  // ─── FIRE button (reused in both layouts) ────────────────────
  const fireButton = canFire ? (
    <button
      onPointerDown={onFireStart}
      onPointerUp={onFireEnd}
      onPointerLeave={onFireEnd}
      className="font-black rounded-md transition-all hover:scale-105 active:scale-95 flex-shrink-0 select-none"
      style={{
        background: activeTank?.color || '#ff2d78',
        color: 'black',
        fontSize: isLandscape ? '10px' : '14px',
        padding: isLandscape ? '2px 10px' : '8px 20px',
        minWidth: isLandscape ? '60px' : '90px',
        letterSpacing: '0.1em',
        boxShadow: `0 0 20px ${activeTank?.color || '#ff2d78'}66`,
        touchAction: 'none',
      }}
    >
      🔥 FIRE
    </button>
  ) : null;

  // ─── Tank status dots ────────────────────────────────────────
  const tankStatusDots = (
    <div className={`flex items-center gap-1 ${isLandscape ? '' : 'gap-2 flex-wrap flex-1'}`}>
      {gameState.tanks.map(tank => (
        <div
          key={tank.id}
          className="flex items-center gap-0.5"
          style={{ opacity: tank.alive ? 1 : 0.25 }}
        >
          <div
            className="rounded-full"
            style={{
              width: isLandscape ? '6px' : '8px',
              height: isLandscape ? '6px' : '8px',
              background: tank.color,
              boxShadow: tank.id === gameState.activeTankIndex && tank.alive
                ? `0 0 6px ${tank.color}` : 'none',
            }}
          />
          {!isLandscape && (
            <span className="text-xs" style={{
              fontWeight: tank.id === gameState.activeTankIndex ? 700 : 400,
              color: tank.color,
            }}>
              {tank.name}
            </span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#0a0a0f' }}>
      {/* ─── Top HUD ──────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-3 flex-shrink-0"
        style={{
          height: `${hudHeight}px`,
          background: '#0f0f18',
          borderBottom: '1px solid #1a1a2e',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="font-bold"
            style={{
              color: activeTank?.color || '#fff',
              fontSize: fontSize ?? undefined,
            }}
          >
            {activeTank?.name || '-'}
          </span>
          <span
            className={fontClass}
            style={{
              fontFamily: 'monospace',
              color: '#777',
              fontSize: isLandscape ? '10px' : undefined,
            }}
          >
            ANG {Math.round(Math.abs(activeTank?.angle || 0))}°
          </span>
          <span
            className={fontClass}
            style={{
              fontFamily: 'monospace',
              color: '#777',
              fontSize: isLandscape ? '10px' : undefined,
            }}
          >
            PWR {Math.round(activeTank?.power || 0)}%
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Wind */}
          <span style={{ color: '#555', fontSize: isLandscape ? '10px' : undefined }}>WIND</span>
          <span
            style={{
              fontFamily: 'monospace',
              color: gameState.wind > 0 ? '#00e5ff' : gameState.wind < 0 ? '#ff6b00' : '#555',
              fontSize: isLandscape ? '10px' : undefined,
            }}
          >
            {gameState.wind > 0 ? '→' : gameState.wind < 0 ? '←' : '·'} {Math.abs(gameState.wind).toFixed(1)}
          </span>

          {/* In landscape: FIRE button in HUD */}
          {isLandscape && fireButton}
        </div>
      </div>

      {/* ─── Canvas ───────────────────────────────────────────── */}
      <div
        className="flex-1 relative"
        id="tanks-canvas-container"
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
        onPointerLeave={onCanvasPointerUp}
        style={{ touchAction: 'none' }}
      >
        {children}
      </div>

      {/* ─── Bottom controls ──────────────────────────────────── */}
      <div
        className="flex items-center justify-between flex-shrink-0 px-2"
        style={{
          background: '#0f0f18',
          borderTop: '1px solid #1a1a2e',
          height: `${controlsHeight}px`,
          padding: isLandscape ? '0 8px' : '8px 8px',
        }}
      >
        {/* Tank status */}
        {tankStatusDots}

        {/* AI thinking */}
        {activeTank?.isAI && (
          <span className="italic px-4" style={{ color: '#555', fontSize: isLandscape ? '10px' : '12px' }}>
            AI thinking…
          </span>
        )}

        {/* In portrait: FIRE button at bottom */}
        {!isLandscape && fireButton}

        {/* Projectile flying */}
        {gameState.projectile?.active && (
          <span className="font-mono px-4" style={{ color: '#ffdd00', fontSize: isLandscape ? '10px' : '12px' }}>
            ● ● ●
          </span>
        )}
      </div>
    </div>
  );
}
