'use client';

import { GameState } from '@/lib/tanks/types';
import { HUD_HEIGHT, STATUS_BAR_HEIGHT } from '@/lib/tanks/constants';

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
      {/* HUD */}
      <div
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{
          height: `${HUD_HEIGHT}px`,
          background: '#0f0f18',
          borderBottom: '1px solid #1a1a2e',
        }}
      >
        {/* Left: Tank info */}
        <div className="flex items-center gap-4">
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

        {/* Right: FIRE button or AI thinking */}
        {activeTank?.isAI ? (
          <span className="text-xs italic" style={{ color: '#555' }}>
            AI thinking…
          </span>
        ) : (
          <button
            onClick={onFire}
            disabled={!isPlayerTurn}
            className="px-6 py-2 font-bold text-sm rounded transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: activeTank?.color || '#666',
              color: 'black',
            }}
          >
            FIRE
          </button>
        )}
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

      {/* Status bar */}
      <div
        className="flex items-center justify-center gap-4 flex-shrink-0"
        style={{
          height: `${STATUS_BAR_HEIGHT}px`,
          background: '#0f0f18',
          borderTop: '1px solid #1a1a2e',
        }}
      >
        {gameState.tanks.map(tank => (
          <div
            key={tank.id}
            className="flex items-center gap-2 transition-opacity"
            style={{
              opacity: tank.alive ? 1 : 0.25,
            }}
          >
            <div
              className="w-2 h-2"
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
    </div>
  );
}
