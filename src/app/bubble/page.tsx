"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GameBoard from "@/components/game/GameBoard";
import { BackToHub } from "@/components/game/BackToHub";
import { RetroBackground } from "@/components/home";

function GameContent() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const mode = (modeParam as 'classic' | 'normal' | null);

  return (
    <main className="min-h-screen relative">
      <RetroBackground />

      <div className="relative z-10 min-h-screen flex flex-col">
        <BackToHub />
        <GameBoard mode={mode || undefined} />
      </div>
    </main>
  );
}

export default function BubblePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-retro-dark">
        <p className="font-terminal text-retro-muted">Loading...</p>
      </div>
    }>
      <GameContent />
    </Suspense>
  );
}
