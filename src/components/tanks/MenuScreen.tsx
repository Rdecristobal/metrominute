'use client';

import { GameMode } from '@/lib/tanks/types';
import { MENU_AI_COLOR, MENU_AI_BORDER, MENU_MULTIPLAYER_COLOR, MENU_MULTIPLAYER_BORDER, MENU_BACKGROUND, MENU_GLOW } from '@/lib/tanks/constants';

interface MenuScreenProps {
  onSelectMode: (mode: GameMode) => void;
}

export default function MenuScreen({ onSelectMode }: MenuScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4" style={{ background: MENU_BACKGROUND }}>
      {/* Radial glow effect */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl -z-10"
        style={{ background: MENU_GLOW }}
      />

      {/* Title */}
      <h1 className="text-7xl font-black font-mono mb-2 tracking-tight">
        <span
          className="bg-clip-text text-transparent"
          style={{
            background: `linear-gradient(to right, ${MENU_AI_COLOR}, #ff6b00, #ffdd00)`,
          }}
        >
          TANKS
        </span>
      </h1>
      <p className="text-sm tracking-widest mb-12" style={{ color: '#555' }}>
        ARTILLERY WARFARE
      </p>

      {/* Mode buttons */}
      <div className="flex flex-col gap-4 w-full max-w-[min(280px,80vw)]">
        <button
          onClick={() => onSelectMode('ai')}
          className="px-8 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105 active:scale-95"
          style={{
            border: `2px solid ${MENU_AI_BORDER}`,
            color: MENU_AI_COLOR,
            background: 'transparent',
          }}
        >
          ▶ VS AI
        </button>
        <button
          onClick={() => onSelectMode('local')}
          className="px-8 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105 active:scale-95"
          style={{
            border: `2px solid ${MENU_MULTIPLAYER_BORDER}`,
            color: MENU_MULTIPLAYER_COLOR,
            background: 'transparent',
          }}
        >
          ▶ LOCAL MULTIPLAYER
        </button>
      </div>

      {/* Help text */}
      <p className="text-xs mt-12 text-center" style={{ color: '#333' }}>
        Drag to aim · Swipe up/down for power · Tap FIRE to shoot
      </p>
    </div>
  );
}
