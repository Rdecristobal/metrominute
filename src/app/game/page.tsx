"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import GameBoard from "@/components/game/GameBoard";
import Timer from "@/components/game/Timer";
import ScoreBoard from "@/components/game/ScoreBoard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function GamePage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "classic";

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <Button variant="ghost" asChild>
          <a href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </a>
        </Button>
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
