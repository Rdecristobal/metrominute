"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GameBoard from "@/components/game/GameBoard";

function GameContent() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const mode = (modeParam as 'classic' | 'normal' | null);

  return <GameBoard mode={mode || undefined} />;
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <GameContent />
    </Suspense>
  );
}
