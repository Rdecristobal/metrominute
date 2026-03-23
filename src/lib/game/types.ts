// Game types for Metro Minute
export type GameMode = 'classic' | 'normal';

export interface Target {
  id: string;
  x: number;
  y: number;
  type: 'normal' | 'golden' | 'decoy';
  size: number;
  opacity?: number;
}

export interface GameState {
  mode: GameMode;
  score: number;
  highScore: number;
  combo: number;
  multiplier: number;
  maxMultiplier: number;
  timeLeft: number;
  isPlaying: boolean;
  isGameOver: boolean;
  soundEnabled: boolean;
  currentPhase: number;
  currentChallenge: number;
  challengesCompleted: number;
  currentChallengeScoreRequired: number;
  challengeTimeLimit: number;
  currentChallengeGolden: boolean;
  survivalTime: number;
  // Statistics
  totalClicks: number;
  correctClicks: number;
  currentStreak: number;
  maxStreak: number;
  totalAccuracySum: number;
  maxComboSum: number;
  maxStreakMax: number;
}

export interface Phase {
  name: string;
  startTime: number;
  endTime: number;
  targetMovement: boolean;
  movementInterval?: number;
  decoys: number;
}

export interface Challenge {
  name: string;
  startTime: number;
  endTime: number;
  targetMovement: boolean;
  movementInterval?: number;
  decoys: number;
  scoreRequired: number;
  golden: boolean;
  isSurvival?: boolean;
  survivalTime?: number;
  scoreDecrement?: number;
}

export interface GameConfig {
  duration: number;
  targetSize: number;
  spawnRate: number;
}

export interface GameStats {
  accuracy: number;
  maxCombo: number;
  maxStreak: number;
}

export interface ResultStats {
  score: number;
  highScore: number;
  accuracy: number;
  maxCombo: number;
  maxStreak: number;
  isNewRecord: boolean;
  delta: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  size: number;
  tx: number;
  ty: number;
}

export interface FloatingScore {
  id: string;
  x: number;
  y: number;
  score: number;
  isGolden: boolean;
  isDecoy?: boolean;
}

export interface Ripple {
  id: string;
  x: number;
  y: number;
  color: string;
}
