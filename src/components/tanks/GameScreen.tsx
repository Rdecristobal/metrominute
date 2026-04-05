'use client';

import { GameState } from '@/lib/tanks/types';
import { useState, useEffect, useCallback } from 'react';
import { MIN_ANGLE, MAX_ANGLE, MIN_POWER, MAX_POWER } from '@/lib/tanks/constants';

interface GameScreenProps {
  gameState: GameState;
  onFire: () => void;
  onAngleChange: (delta: number) => void;
  onPowerChange: (delta: number) => void;
  children?: React.ReactNode;
}

export default function GameScreen({ gameState, onFire, onAngleChange, onPowerChange, children }: GameScreenProps) {
  const activeTank = gameState.tanks[gameState.activeTankIndex];
  const isPlayerTurn = activeTank && !activeTank.isAI && activeTank.alive;
  const canFire = isPlayerTurn && !gameState.projectile?.active;

  // Auto-repeat when holding buttons
  const [angleDir, setAngleDir] = useState<'left' | 'right' | null>(null);
  const [powerDir, setPowerDir] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (!angleDir) return;
    const interval = setInterval(() => {
      onAngleChange(angleDir === 'left' ? -1 : 1);
    }, 80);
    return () => clearInterval(interval);
  }, [angleDir, onAngleChange]);

  useEffect(() => {
    if (!powerDir) return;
    const interval = setInterval(() => {
      onPowerChange(powerDir === 'up' ? 2 : -2);
    }, 80);
    return () => clearInterval(interval);
  }, [powerDir, onPowerChange]);

  const handleAngleStart = useCallback((dir: 'left' | 'right') => {
    setAngleDir(dir);
    onAngleChange(dir === 'left' ? -1 : 1);
  }, [onAngleChange]);

  const handlePowerStart = useCallback((dir: 'up' | 'down') => {
    setPowerDir(dir);
    onPowerChange(dir === 'up' ? 2 : -2);
  }, [onPowerChange]);

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

      {/* Canvas — game area */}
      <div className="flex-1 relative" id="tanks-canvas-container">
        {children}
      </div>

      {/* Bottom controls — ALWAYS VISIBLE */}
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

        {/* Center: angle + power controls (only for human turn, no projectile active) */}
        {canFire && (
          <div className="flex items-center gap-2">
            {/* Angle buttons */}
            <div className="flex items-center gap-1" style={{ background: '#1a1a2e', borderRadius: '8px', padding: '4px' }}>
              <button
                onPointerDown={() => handleAngleStart('left')}
                onPointerUp={() => setAngleDir(null)}
                onPointerLeave={() => setAngleDir(null)}
                className="w-10 h-10 rounded flex items-center justify-center text-lg font-bold active:scale-90"
                style={{ background: '#252540', color: '#aaa' }}
              >
                ↶
              </button>
              <button
                onPointerDown={() => handleAngleStart('right')}
                onPointerUp={() => setAngleDir(null)}
                onPointerLeave={() => setAngleDir(null)}
                className="w-10 h-10 rounded flex items-center justify-center text-lg font-bold active:scale-90"
                style={{ background: '#252540', color: '#aaa' }}
              >
                ↷
              </button>
            </div>

            {/* Power buttons */}
            <div className="flex items-center gap-1" style={{ background: '#1a1a2e', borderRadius: '8px', padding: '4px' }}>
              <button
                onPointerDown={() => handlePowerStart('up')}
                onPointerUp={() => setPowerDir(null)}
                onPointerLeave={() => setPowerDir(null)}
                className="w-10 h-10 rounded flex items-center justify-center text-lg font-bold active:scale-90"
                style={{ background: '#252540', color: '#aaa' }}
              >
                ↑
              </button>
              <button
                onPointerDown={() => handlePowerStart('down')}
                onPointerUp={() => setPowerDir(null)}
                onPointerLeave={() => setPowerDir(null)}
                className="w-10 h-10 rounded flex items-center justify-center text-lg font-bold active:scale-90"
                style={{ background: '#252540', color: '#aaa' }}
              >
                ↓
              </button>
            </div>
          </div>
        )}

        {/* AI thinking */}
        {activeTank?.isAI && (
          <span className="text-xs italic px-4" style={{ color: '#555' }}>
            AI thinking…
          </span>
        )}

        {/* FIRE button — big, always visible when human turn */}
        {canFire && (
          <button
            onClick={onFire}
            className="px-6 py-3 font-black text-base rounded-lg transition-all hover:scale-105 active:scale-95 flex-shrink-0"
            style={{
              background: activeTank?.color || '#ff2d78',
              color: 'black',
              minWidth: '90px',
              letterSpacing: '0.1em',
              boxShadow: `0 0 20px ${activeTank?.color || '#ff2d78'}66`,
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
