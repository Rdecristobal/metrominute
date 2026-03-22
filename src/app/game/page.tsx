"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GameBoard from "@/components/game/GameBoard";

function GameContent() {
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") as 'classic' | 'normal') || 'normal';

  return <GameBoard mode={mode} />;
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <GameContent />
    </Suspense>
  );
}
