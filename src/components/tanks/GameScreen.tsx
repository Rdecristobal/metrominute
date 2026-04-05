'use client';

import { GameState } from '@/lib/tanks/types';
import { HUD_HEIGHT } from '@/lib/tanks/constants';

interface GameScreenProps {
  gameState: GameState;
  onFire: () => void;
  children?: React.ReactNode;
}

export default function GameScreen({ gameState, onFire, children }: GameScreenProps) {
  const activeTank = gameState.tanks[gameState.activeTankIndex];
  const isPlayerTurn = activeTank && !activeTank.isAI && activeTank.alive;

  return (
    <div className="flex flex-col h-screen" style={{ background: '#0a0a0f' }}>
      {/* HUD — top info bar */}
      <div
        className="flex items-center justify-between px-3 flex-shrink-0"
        style={{
          height: `${HUD_HEIGHT}px`,
          background: '#0f0f18',
          borderBottom: '1px solid #1a1a2e',
        }}
      >
        {/* Left: Tank info */}
        <div className="flex items-center gap-3">
          <span
            className="font-bold text-sm"
            style={{ color: activeTank?.color || '#fff' }}
          >
            {activeTank?.name || '-'}
          </span>
          <span className="text-xs" style={{ color: '#555' }}>
            ANG {Math.round(activeTank?.angle || 0)}°
          </span>
          <span className="text-xs" style={{ color: '#555' }}>
            PWR {Math.round(activeTank?.power || 0)}%
          </span>
        </div>

        {/* Wind indicator */}
        <div className="flex items-center gap-1">
          <span className="text-xs" style={{ color: '#555' }}>WIND</span>
          <span className="text-xs font-mono" style={{ color: gameState.wind > 0 ? '#00e5ff' : gameState.wind < 0 ? '#ff6b00' : '#555' }}>
            {gameState.wind > 0 ? '→' : gameState.wind < 0 ? '←' : '·'} {Math.abs(gameState.wind).toFixed(1)}
          </span>
        </div>
      </div>

      {/* Canvas container */}
      <div className="flex-1 relative" id="tanks-canvas-container">
        {children}
        {/* Touch hint */}
        {isPlayerTurn && !gameState.projectile?.active && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-xs text-center z-10"
            style={{ color: '#333' }}
          >
            Drag ← → to aim · Drag ↑ ↓ for power
          </div>
        )}
      </div>

      {/* Bottom bar: tank status + FIRE button */}
      <div
        className="flex items-center justify-between flex-shrink-0 px-4 py-2 gap-4"
        style={{
          background: '#0f0f18',
          borderTop: '1px solid #1a1a2e',
          minHeight: '64px',
        }}
      >
        {/* Tank status dots */}
        <div className="flex items-center gap-3 flex-wrap">
          {gameState.tanks.map(tank => (
            <div
              key={tank.id}
              className="flex items-center gap-1 transition-opacity"
              style={{ opacity: tank.alive ? 1 : 0.25 }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: tank.color,
                  boxShadow:
                    tank.id === gameState.activeTankIndex && tank.alive
                      ? `0 0 6px ${tank.color}`
                      : 'none',
                }}
              />
              <span
                className="text-xs"
                style={{
                  fontWeight: tank.id === gameState.activeTankIndex ? 700 : 400,
                  color: tank.color,
                }}
              >
                {tank.name}
              </span>
            </div>
          ))}
        </div>

        {/* FIRE button — big, tappable on mobile */}
        {!activeTank?.isAI ? (
          <button
            onClick={onFire}
            disabled={!isPlayerTurn || !!gameState.projectile?.active}
            className="px-8 py-3 font-black text-base rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            style={{
              background: activeTank?.color || '#ff2d78',
              color: 'black',
              minWidth: '100px',
              letterSpacing: '0.1em',
            }}
          >
            🔥 FIRE
          </button>
        ) : (
          <span className="text-xs italic px-4" style={{ color: '#555' }}>
            AI thinking…
          </span>
        )}
      </div>
    </div>
  );
}
