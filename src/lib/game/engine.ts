// Game engine logic will be implemented here
import { GameState, GameConfig, GameMode } from './types';

export class GameEngine {
  private state: GameState;
  private config: GameConfig;

  constructor(mode: GameMode, config: GameConfig) {
    this.state = {
      mode,
      score: 0,
      timeLeft: config.duration,
      targets: [],
    };
    this.config = config;
  }

  getState(): GameState {
    return this.state;
  }

  start(): void {
    // Game start logic
  }

  stop(): void {
    // Game stop logic
  }

  clickTarget(_targetId: string): void {
    // Target click logic - _targetId will be used when game logic is implemented
  }
}
