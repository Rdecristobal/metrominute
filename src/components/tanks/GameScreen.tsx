'use client';

import { GameState } from '@/lib/tanks/types';

interface GameScreenProps {
  gameState: GameState;
  onCanvasPointerDown: (e: React.PointerEvent) => void;
  onCanvasPointerMove: (e: React.PointerEvent) => void;
  onFireStart: () => void;
  onFireEnd: () => void;
  children?: React.ReactNode;
}

export default function GameScreen({
  gameState,
  onCanvasPointerDown,
  onCanvasPointerMove,
  onFireStart,
  onFireEnd,
  children,
}: GameScreenProps) {
  const activeTank = gameState.tanks[gameState.activeTankIndex];
  const isPlayerTurn = activeTank && !activeTank.isAI && activeTank.alive;
  const canFire = isPlayerTurn && !gameState.projectile?.active;

  return (
    <div className="flex flex-col h-screen" style={{ background: '#0a0a0f' }}>
      {/* Top HUD — compact info */}
      <div
        className="flex items-center justify-between px-3 flex-shrink-0"
        style={{
          height: '36px',
          background: '#0f0f18',
          borderBottom: '1px solid #1a1a2e',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm" style={{ color: activeTank?.color || '#fff' }}>
            {activeTank?.name || '-'}
          </span>
          <span className="text-xs font-mono" style={{ color: '#777' }}>
            ANG {Math.round(Math.abs(activeTank?.angle || 0))}°
          </span>
          <span className="text-xs font-mono" style={{ color: '#777' }}>
            PWR {Math.round(activeTank?.power || 0)}%
          </span>
        </div>

        {/* Wind */}
        <div className="flex items-center gap-1">
          <span className="text-xs" style={{ color: '#555' }}>WIND</span>
          <span className="text-xs font-mono" style={{ color: gameState.wind > 0 ? '#00e5ff' : gameState.wind < 0 ? '#ff6b00' : '#555' }}>
            {gameState.wind > 0 ? '→' : gameState.wind < 0 ? '←' : '·'} {Math.abs(gameState.wind).toFixed(1)}
          </span>
        </div>
      </div>

      {/* Canvas — game area with touch handling */}
      <div
        className="flex-1 relative"
        id="tanks-canvas-container"
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        style={{ touchAction: 'none' }}
      >
        {children}
      </div>

      {/* Bottom controls */}
      <div
        className="flex items-center justify-between flex-shrink-0 px-2 py-2 gap-2"
        style={{
          background: '#0f0f18',
          borderTop: '1px solid #1a1a2e',
          minHeight: '72px',
        }}
      >
        {/* Left side: tank status */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {gameState.tanks.map(tank => (
            <div
              key={tank.id}
              className="flex items-center gap-1"
              style={{ opacity: tank.alive ? 1 : 0.25 }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: tank.color,
                  boxShadow: tank.id === gameState.activeTankIndex && tank.alive
                    ? `0 0 6px ${tank.color}` : 'none',
                }}
              />
              <span className="text-xs" style={{
                fontWeight: tank.id === gameState.activeTankIndex ? 700 : 400,
                color: tank.color,
              }}>
                {tank.name}
              </span>
            </div>
          ))}
        </div>

        {/* AI thinking */}
        {activeTank?.isAI && (
          <span className="text-xs italic px-4" style={{ color: '#555' }}>
            AI thinking…
          </span>
        )}

        {/* FIRE button with power oscillation — only for human turn */}
        {canFire && (
          <button
            onPointerDown={onFireStart}
            onPointerUp={onFireEnd}
            onPointerLeave={onFireEnd}
            className="px-6 py-3 font-black text-base rounded-lg transition-all hover:scale-105 active:scale-95 flex-shrink-0 select-none"
            style={{
              background: activeTank?.color || '#ff2d78',
              color: 'black',
              minWidth: '90px',
              letterSpacing: '0.1em',
              boxShadow: `0 0 20px ${activeTank?.color || '#ff2d78'}66`,
              touchAction: 'none',
            }}
          >
            🔥 FIRE
          </button>
        )}

        {/* Projectile flying — show waiting state */}
        {gameState.projectile?.active && (
          <span className="text-xs font-mono px-4" style={{ color: '#ffdd00' }}>
            ● ● ●
          </span>
        )}
      </div>
    </div>
  );
}
