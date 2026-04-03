import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RetroBackground } from "@/components/home";

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen relative">
      <RetroBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-gray-800 bg-retro-dark/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 h-16 flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-retro-surface h-10 px-4 py-2 font-terminal text-retro-muted hover:text-retro-text"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              BACK
            </Link>
            <h1 className="font-arcade text-xl tracking-wider text-retro-text">
              LEADERBOARD
            </h1>
          </div>
        </header>

        {/* Main Content */}
        <section className="flex-1 container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="font-arcade text-2xl md:text-3xl mb-4 text-retro-text tracking-wider">
                TOP SCORES
              </h2>
              <p className="font-terminal text-lg text-retro-muted max-w-md mx-auto leading-relaxed">
                Best players across all modes.
                <br />
                Can you make it to the top?
              </p>
            </div>

            {/* Coming Soon Card */}
            <div className="text-center py-16 border border-gray-800 bg-retro-surface/50 rounded-lg">
              <p className="font-terminal text-xl text-retro-muted animate-pulse">
                Leaderboard coming soon...
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
