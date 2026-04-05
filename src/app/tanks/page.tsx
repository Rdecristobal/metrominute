"use client";

import { Suspense } from "react";
import TanksGame from "@/components/tanks/TanksGame";
import { RetroBackground } from "@/components/home/RetroBackground";
import { BackToHub } from "@/components/game/BackToHub";

function GameContent() {
  return (
    <main className="min-h-screen relative">
      <RetroBackground />
      <div className="relative z-10 min-h-screen flex flex-col">
        <BackToHub />
        <TanksGame />
      </div>
    </main>
  );
}

export default function TanksPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0a0a0f' }}>
        <p className="font-mono text-gray-500">Loading...</p>
      </div>
    }>
      <GameContent />
    </Suspense>
  );
}
