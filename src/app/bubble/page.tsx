"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GameBoard from "@/components/game/GameBoard";
import { BackToHub } from "@/components/game/BackToHub";

function GameContent() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const mode = (modeParam as 'classic' | 'normal' | null);

  return (
    <>
      <BackToHub />
      <GameBoard mode={mode || undefined} />
    </>
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
