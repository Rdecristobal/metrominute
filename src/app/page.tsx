"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const savedSound = localStorage.getItem('metroMinuteSoundEnabled');
    return savedSound === null ? true : savedSound === 'true';
  });

  const [highScore, setHighScore] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const savedScore = localStorage.getItem('metroMinuteHighScore');
    return savedScore ? parseInt(savedScore) : 0;
  });

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('metroMinuteSoundEnabled', newState.toString());
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center overflow-hidden relative">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.03)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#1A1A2E_0%,#0D0D1A_100%)]" />

      {/* Sound toggle button */}
      <button
        className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded-full text-sm transition-colors z-20"
        onClick={toggleSound}
      >
        {soundEnabled ? '🔊 ON' : '🔇 OFF'}
      </button>

      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-12 text-center">
        {/* Logo/Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-[#00D4FF] mb-2 tracking-tight">
          Metro Minute
        </h1>
        <p className="text-lg text-white/60 mb-12">
          Test your reflexes! Click the targets as fast as you can.
        </p>

        {/* Play buttons */}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Link
            href="/game?mode=normal"
            className="bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#1A1A2E] font-bold py-4 px-8 rounded-xl text-lg shadow-[0_4px_15px_rgba(0,212,255,0.3)] hover:shadow-[0_6px_20px_rgba(0,212,255,0.4)] hover:-translate-y-0.5 transition-all duration-200"
          >
            🎮 Normal Mode
          </Link>

          <Link
            href="/game?mode=classic"
            className="bg-white/10 text-white font-bold py-4 px-8 rounded-xl text-lg hover:bg-white/20 transition-all duration-200"
          >
            ⏱️ Classic Mode
          </Link>
        </div>

        {/* High Score Display */}
        <div className="mt-6 text-sm text-gray-400">
          High Score: {highScore}
        </div>

        {/* Leaderboard link */}
        <Link
          href="/leaderboard"
          className="mt-8 text-white/40 hover:text-[#00D4FF] transition-colors text-sm"
        >
          🏆 View Leaderboard
        </Link>
      </div>
    </div>
  );
}
