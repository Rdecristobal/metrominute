"use client";

import { Suspense } from "react";
import TanksGame from "@/components/tanks/TanksGame";

function GameContent() {
  return (
    <main className="tanks-full-viewport">
      <TanksGame />
    </main>
  );
}

export default function TanksPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center" style={{ height: '100dvh', background: '#0a0a0f' }}>
        <p className="font-mono text-gray-500">Loading...</p>
      </div>
    }>
      <GameContent />
    </Suspense>
  );
}
