"use client";

import { Suspense } from "react";
import FootballGame from "@/components/futbol/FootballGame";
import { RetroBackground } from "@/components/home";

function GameContent() {
  return (
    <main className="min-h-screen relative">
      <RetroBackground />
      <FootballGame />
    </main>
  );
}

export default function FutbolPage() {
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
