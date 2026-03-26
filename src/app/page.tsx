import { Header, GamesGrid, RetroBackground, Footer } from '@/components/home';
import { GAMES } from '@/lib/games';

export default function Home() {
  return (
    <main className="min-h-screen relative">
      <RetroBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <section className="flex-1 container mx-auto px-4 py-16">
          {/* Hero */}
          <div className="text-center mb-16 animate-fade-in-up">
            <h1 className="font-arcade text-3xl md:text-4xl lg:text-5xl mb-4 text-retro-text tracking-wider">
              METRO MINUTE
            </h1>
            <p className="font-terminal text-lg md:text-xl text-retro-muted max-w-md mx-auto leading-relaxed">
              Your daily dose of arcade games.
              <br />
              Pick a game. Play. Beat your score.
            </p>
          </div>

          {/* Games Grid */}
          <GamesGrid games={GAMES} />

          {/* Coming Soon Teaser */}
          <div className="text-center mt-16">
            <p className="font-terminal text-sm text-retro-muted animate-pulse">
              More games coming soon...
            </p>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
