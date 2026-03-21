// Game types will be defined here
export type GameMode = 'classic' | 'timed' | 'endless';

export interface GameState {
  mode: GameMode;
  score: number;
  timeLeft: number;
  targets: Array<{
    id: string;
    x: number;
    y: number;
    size: number;
  }>;
}

export interface GameConfig {
  duration: number;
  targetSize: number;
  spawnRate: number;
}
