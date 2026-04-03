// Types for Football Cronometer game

export enum GameScreen {
  HOME = 'home',
  COUNTDOWN = 'countdown',
  GAME = 'game',
  HALFTIME = 'halftime',
  EXTRA_TIME = 'extra_time',
  PENALTIES = 'penalties',
  RESULT = 'result',
  PENALTY_RESULT = 'penalty_result'
}

export enum GameMode {
  VS_AI = 'vs_ai',
  VS_PLAYER = 'vs_player'
}

export type MatchDuration = 60 | 120 | 180; // 1, 2, or 3 minutes in seconds

export enum AIDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export type Outcome = 'goal' | 'penalty' | 'foul' | 'turnover';

export interface Attempt {
  playerId: 'player1' | 'player2' | 'ai';
  timestamp: number;
  stopwatchValue: number;
  outcome: Outcome;
}

export interface PenaltyAttempt {
  playerId: 'player1' | 'player2' | 'ai';
  target: number;
  result: 'goal' | 'miss';
}

export interface FootballGameState {
  // Configuración
  mode: GameMode;
  matchDuration: MatchDuration;
  aiDifficulty: AIDifficulty;
  soundEnabled: boolean;

  // Estado del partido
  screen: GameScreen;
  isPlaying: boolean;
  isPaused: boolean;
  currentTurn: 'player1' | 'player2' | 'ai';
  matchTime: number;
  stopwatchValue: number;
  stopwatchRunning: boolean;

  // Scores
  player1Score: number;
  player2Score: number;
  player1Fouls: number;
  player2Fouls: number;

  // Historial de intentos
  player1Attempts: Attempt[];
  player2Attempts: Attempt[];

  // Penales
  penaltyRound: number;
  player1PenaltyScore: number;
  player2PenaltyScore: number;
  penaltyQueue: PenaltyAttempt[];

  // Estadísticas del partido
  bestStop: Attempt | null;
  totalAttempts: number;
  perfectGoals: number;
  penaltiesConceded: number;
  foulsConceded: number;

  // Flags de estado
  isExtraTime: boolean;
  isPenalties: boolean;
  isNewRecord: boolean;
}

export interface AIBehavior {
  targetValue: number;
  reactionTimeMs: number;
  consistency: number;
}

export interface ScoringResult {
  outcome: Outcome;
  description: string;
}
