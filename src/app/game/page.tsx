"use client";

import { useSearchParams } from "next/navigation";
import GameBoard from "@/components/game/GameBoard";

export default function GamePage() {
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") as 'classic' | 'normal') || 'normal';

  return <GameBoard mode={mode} />;
}
