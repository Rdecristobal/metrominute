'use client';

import { GameMode } from '@/lib/tanks/types';
import { MENU_AI_COLOR, MENU_MULTIPLAYER_COLOR } from '@/lib/tanks/constants';

interface SetupScreenProps {
  mode: GameMode;
  tankCount: number;
  onTankCountChange: (count: number) => void;
  onStart: () => void;
  onBack: () => void;
}

export default function SetupScreen({
  mode,
  tankCount,
  onTankCountChange,
  onStart,
  onBack,
}: SetupScreenProps) {
  const modeColor = mode === 'ai' ? MENU_AI_COLOR : MENU_MULTIPLAYER_COLOR;
  const modeTitle = mode === 'ai' ? 'VS AI' : 'LOCAL MULTIPLAYER';

  return (
    <div className="flex flex-col items-center justify-center h-full p-4" style={{ background: '#0a0a0f' }}>
      {/* Mode title */}
      <h2
        className="text-3xl font-bold font-mono mb-8"
        style={{ color: modeColor }}
      >
        {modeTitle}
      </h2>

      {/* Tank count question */}
      <p className="text-sm mb-6" style={{ color: '#666' }}>
        How many tanks?
      </p>

      {/* Tank count buttons */}
      <div className="flex gap-3 mb-8">
        {[2, 3, 4, 5, 6].map(count => (
          <button
            key={count}
            onClick={() => onTankCountChange(count)}
            className={`w-12 h-12 rounded-lg font-bold text-lg transition-all hover:scale-110 active:scale-95 ${
              tankCount === count ? 'text-black' : ''
            }`}
            style={{
              background: tankCount === count ? modeColor : '#1a1a2e',
              color: tankCount === count ? 'black' : '#666',
            }}
          >
            {count}
          </button>
        ))}
      </div>

      {/* Start battle button */}
      <button
        onClick={onStart}
        className="px-12 py-3 rounded-lg font-bold text-lg mb-6 transition-all hover:scale-105 active:scale-95"
        style={{
          background: modeColor,
          color: 'black',
        }}
      >
        START BATTLE
      </button>

      {/* Back button */}
      <button
        onClick={onBack}
        className="text-sm transition-colors hover:opacity-70"
        style={{ color: '#444' }}
      >
        ← BACK
      </button>
    </div>
  );
}
