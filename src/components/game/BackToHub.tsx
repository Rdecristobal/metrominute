'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function BackToHub() {
  return (
    <Link
      href="/"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2
                 bg-retro-surface/90 backdrop-blur-sm border border-gray-800
                 rounded-lg font-terminal text-sm text-retro-muted
                 hover:text-retro-text hover:border-neon-cyan transition-all"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>BACK TO HUB</span>
    </Link>
  );
}
