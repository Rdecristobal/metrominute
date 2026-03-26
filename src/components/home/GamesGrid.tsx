import { Game } from '@/types/game';
import { GameCard } from './GameCard';

interface GamesGridProps {
  games: Game[];
  className?: string;
}

export function GamesGrid({ games, className }: GamesGridProps) {
  return (
    <div className={`grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${className || ''}`}>
      {games.map((game, index) => (
        <div
          key={game.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <GameCard {...game} />
        </div>
      ))}
    </div>
  );
}
