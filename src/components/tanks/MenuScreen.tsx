'use client';

import { GameMode } from '@/lib/tanks/types';

interface MenuScreenProps {
  onSelectMode: (mode: GameMode) => void;
}

export default function MenuScreen({ onSelectMode }: MenuScreenProps) {
  return (
    <div className="relative flex flex-col items-center justify-center h-full p-4 font-mono bg-black overflow-hidden">
      {/* Star grid background (Tron-like) */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle, #ffffff 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '3px 3px, 40px 40px, 40px 40px',
          backgroundPosition: '0 0, 0 0, 0 0',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        {/* Title with neon glow animation */}
        <h1
          className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tight mb-2"
          style={{
            color: '#FFD700',
            textShadow: `
              -4px -4px 0 #000,
              4px -4px 0 #000,
              -4px 4px 0 #000,
              4px 4px 0 #000,
              0 0 20px rgba(255, 215, 0, 0.6),
              0 0 40px rgba(255, 215, 0, 0.4),
              0 0 60px rgba(255, 215, 0, 0.2)
            `,
            animation: 'neonPulse 3s ease-in-out infinite',
          }}
        >
          TANKS
        </h1>

        {/* Subtitle */}
        <p
          className="text-xs sm:text-sm tracking-[0.3em] mb-12 text-gray-400"
          style={{ letterSpacing: '0.4em' }}
        >
          ARTILLERY WARFARE
        </p>

        {/* Mode buttons */}
        <div className="flex flex-col gap-5 w-full max-w-[min(300px,85vw)]">
          {/* VS AI button - Red arcade */}
          <button
            onClick={() => onSelectMode('ai')}
            className="relative px-8 py-5 font-bold text-lg sm:text-xl transition-all active:scale-95 active:translate-y-1"
            style={{
              background: '#1a0a0a',
              color: '#ff3333',
              border: '3px solid #ff3333',
              borderRadius: '12px',
              boxShadow: `
                0 6px 0 #990000,
                0 8px 16px rgba(255, 51, 51, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
              textShadow: '0 0 10px rgba(255, 51, 51, 0.5)',
              letterSpacing: '0.1em',
            }}
          >
            VS AI
          </button>

          {/* Multiplayer button - Cyan arcade */}
          <button
            onClick={() => onSelectMode('local')}
            className="relative px-8 py-5 font-bold text-base sm:text-lg transition-all active:scale-95 active:translate-y-1"
            style={{
              background: '#0a1a1a',
              color: '#00d4ff',
              border: '3px solid #00d4ff',
              borderRadius: '12px',
              boxShadow: `
                0 6px 0 #007799,
                0 8px 16px rgba(0, 212, 255, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
              textShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
              letterSpacing: '0.1em',
            }}
          >
            MULTIPLAYER
          </button>
        </div>

        {/* Help text */}
        <div className="mt-14 text-center">
          <p className="text-xs text-gray-500 tracking-widest mb-2">
            HOW TO PLAY
          </p>
          <p className="text-sm text-gray-400 tracking-[0.2em] font-bold">
            ANGLE · POWER · FIRE
          </p>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-6 left-6 w-8 h-8 border-l-2 border-t-2 border-gray-700 opacity-50" />
      <div className="absolute top-6 right-6 w-8 h-8 border-r-2 border-t-2 border-gray-700 opacity-50" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-l-2 border-b-2 border-gray-700 opacity-50" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-r-2 border-b-2 border-gray-700 opacity-50" />

      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes neonPulse {
          0%, 100% {
            text-shadow: -4px -4px 0 #000,
                         4px -4px 0 #000,
                         -4px 4px 0 #000,
                         4px 4px 0 #000,
                         0 0 20px rgba(255, 215, 0, 0.6),
                         0 0 40px rgba(255, 215, 0, 0.4),
                         0 0 60px rgba(255, 215, 0, 0.2);
          }
          50% {
            text-shadow: -4px -4px 0 #000,
                         4px -4px 0 #000,
                         -4px 4px 0 #000,
                         4px 4px 0 #000,
                         0 0 30px rgba(255, 215, 0, 0.8),
                         0 0 50px rgba(255, 215, 0, 0.6),
                         0 0 80px rgba(255, 215, 0, 0.3);
          }
        }
      `}</style>
    </div>
  );
}
