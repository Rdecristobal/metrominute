'use client';

import { GameMode } from '@/lib/tanks/types';

interface MenuScreenProps {
  onSelectMode: (mode: GameMode) => void;
}

export default function MenuScreen({ onSelectMode }: MenuScreenProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 font-mono" style={{ background: '#000033' }}>
      {/* CRT scanline effect (subtle) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.1) 2px)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Title */}
      <h1
        className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-wider mb-2 z-10"
        style={{ color: '#00ff00', textShadow: '0 0 10px rgba(0,255,0,0.5), 0 0 20px rgba(0,255,0,0.3)' }}
      >
        TANKS
      </h1>
      <p
        className="text-sm sm:text-base tracking-widest mb-10 z-10"
        style={{ color: '#666', letterSpacing: '0.2em' }}
      >
        ARTILLERY WARFARE
      </p>

      {/* ASCII tank decoration */}
      <pre
        className="text-xs sm:text-sm mb-8 opacity-80 z-10"
        style={{ color: '#00aa00', lineHeight: '0.8', letterSpacing: '-0.1em' }}
      >
{`   __
  (oo)____
  (__)    )\\
     ||--|| *`}
      </pre>

      {/* Mode buttons */}
      <div className="flex flex-col gap-4 w-full max-w-[min(280px,80vw)] z-10">
        <button
          onClick={() => onSelectMode('ai')}
          className="px-8 py-4 font-bold text-lg transition-all active:scale-95 relative"
          style={{
            background: '#1a1a1a',
            border: '2px solid #00ff00',
            color: '#00ff00',
            boxShadow: 'inset 0 0 10px rgba(0,255,0,0.1)',
          }}
        >
          <span className="absolute -top-1 -left-1 text-xs opacity-50" style={{ color: '#00ff00' }}>
            [ ]
          </span>
          VS AI
        </button>
        <button
          onClick={() => onSelectMode('local')}
          className="px-8 py-4 font-bold text-lg transition-all active:scale-95 relative"
          style={{
            background: '#1a1a1a',
            border: '2px solid #ffaa00',
            color: '#ffaa00',
            boxShadow: 'inset 0 0 10px rgba(255,170,0,0.1)',
          }}
        >
          <span className="absolute -top-1 -left-1 text-xs opacity-50" style={{ color: '#ffaa00' }}>
            [ ]
          </span>
          LOCAL MULTIPLAYER
        </button>
      </div>

      {/* Help text */}
      <div className="mt-12 text-center z-10">
        <p className="text-xs mb-1" style={{ color: '#555' }}>
          CONTROLS
        </p>
        <p className="text-xs leading-relaxed" style={{ color: '#666' }}>
          Use ANGLE/POWER buttons · Tap FIRE to shoot
        </p>
      </div>

      {/* Footer version info */}
      <p className="absolute bottom-4 text-xs opacity-40 z-10" style={{ color: '#444' }}>
        v1.0 · DOS RETRO EDITION
      </p>
    </div>
  );
}
