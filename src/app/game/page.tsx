"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import GameBoard from "@/components/game/GameBoard";
import ScoreBoard from "@/components/game/ScoreBoard";
import Timer from "@/components/game/Timer";

export default function GamePage() {
  const searchParams = useSearchParams();
  const _mode = searchParams.get("mode") || "classic";

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <Link 
          href="/"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 h-10 px-4 py-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
        <div className="flex items-center gap-4">
          <Timer />
          <ScoreBoard />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <GameBoard />
      </main>
    </div>
  );
}
