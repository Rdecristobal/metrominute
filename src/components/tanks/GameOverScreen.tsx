'use client';

import { Tank } from '@/lib/tanks/types';
import { MENU_AI_COLOR } from '@/lib/tanks/constants';

interface GameOverScreenProps {
  winner: Tank | null;
  isDraw: boolean;
  onRematch: () => void;
  onMenu: () => void;
}

export default function GameOverScreen({
  winner,
  isDraw,
  onRematch,
  onMenu,
}: GameOverScreenProps) {
  const winnerColor = winner?.color || MENU_AI_COLOR;
  const winnerName = winner?.name || '';
  const title = isDraw ? 'DRAW!' : `${winnerName} WINS!`;

  return (
    <div
      className="flex flex-col items-center justify-center h-full p-4"
      style={{ background: '#0a0a0f' }}
    >
      {/* Radial glow effect with winner color */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl -z-10"
        style={{ background: `${winnerColor}26` }} // 15% opacity
      />

      {/* Winner text */}
      <h1
        className="text-5xl font-black font-mono mb-12"
        style={{ color: winnerColor }}
      >
        {title}
      </h1>

      {/* Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-[min(280px,80vw)]">
        <button
          onClick={onRematch}
          className="px-8 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105 active:scale-95"
          style={{
            background: winnerColor,
            color: 'black',
          }}
        >
          REMATCH
        </button>
        <button
          onClick={onMenu}
          className="px-8 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105 active:scale-95"
          style={{
            border: '2px solid #666',
            color: '#666',
            background: 'transparent',
          }}
        >
          MENU
        </button>
      </div>
    </div>
  );
}
