import { Game } from '@/types/game';

export const GAMES: Game[] = [
  {
    id: 'bubble',
    title: 'Bubbles',
    icon: '🎯',
    description: 'Test your reflexes! Click the targets before time runs out.',
    href: '/bubble',
    available: true,
    accentColor: 'var(--neon-cyan)',
    tags: ['reflex', 'casual'],
  },
];

export function getGameById(id: string): Game | undefined {
  return GAMES.find(game => game.id === id);
}

export function getAvailableGames(): Game[] {
  return GAMES.filter(game => game.available);
}
