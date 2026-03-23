// Game engine logic
import { GameState, GameMode, Phase, Challenge, Target, Particle, FloatingScore, Ripple } from './types';

export const PHASES: Phase[] = [
  { name: 'Warm Up', startTime: 60, endTime: 50, targetMovement: false, decoys: 0 },
  { name: 'Movement', startTime: 50, endTime: 35, targetMovement: true, movementInterval: 3000, decoys: 0 },
  { name: 'Beware of Greens', startTime: 35, endTime: 20, targetMovement: true, movementInterval: 2000, decoys: 3 },
  { name: 'CLIMAX', startTime: 20, endTime: 0, targetMovement: true, movementInterval: 1000, decoys: 5 }
];

export const CHALLENGES: Challenge[] = [
  { name: '1: Basic', startTime: 30, endTime: 0, targetMovement: false, decoys: 0, scoreRequired: 500, golden: false },
  { name: '2: Movement', startTime: 30, endTime: 0, targetMovement: true, movementInterval: 2000, decoys: 0, scoreRequired: 500, golden: false },
  { name: '3: Decoys', startTime: 30, endTime: 0, targetMovement: true, movementInterval: 2000, decoys: 3, scoreRequired: 1000, golden: true },
  { name: '4: CHIMAX', startTime: 30, endTime: 0, targetMovement: true, movementInterval: 1000, decoys: 5, scoreRequired: 1000, golden: true },
  { name: '5: SURVIVAL', startTime: 30, endTime: 0, targetMovement: true, movementInterval: 800, decoys: 5, scoreRequired: 0, golden: false, isSurvival: true, survivalTime: 30, scoreDecrement: 10 }
];

const TARGET_SIZE = 45;
const HEADER_HEIGHT = 140;

export class GameEngine {
  private state: GameState;
  private targets: Map<string, Target> = new Map();
  private listeners: Set<(state: GameState) => void> = new Set();

  constructor(mode: GameMode = 'normal', highScore: number = 0, soundEnabled: boolean = true) {
    this.state = this.getInitialState(mode, highScore, soundEnabled);
  }

  private getInitialState(mode: GameMode, highScore: number, soundEnabled: boolean): GameState {
    return {
      mode,
      score: 0,
      highScore,
      combo: 0,
      multiplier: 1,
      maxMultiplier: 1,
      timeLeft: mode === 'classic' ? 60 : 30,
      isPlaying: false,
      isGameOver: false,
      soundEnabled,
      currentPhase: 0,
      currentChallenge: 0,
      challengesCompleted: 0,
      currentChallengeScoreRequired: 500,
      challengeTimeLimit: 30,
      currentChallengeGolden: false,
      survivalTime: 0,
      totalClicks: 0,
      correctClicks: 0,
      currentStreak: 0,
      maxStreak: 0,
      totalAccuracySum: 0,
      maxComboSum: 0,
      maxStreakMax: 0
    };
  }

  getState(): GameState {
    return { ...this.state };
  }

  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  startGame(): void {
    if (this.state.mode === 'classic') {
      this.startClassicMode();
    } else {
      this.startNormalMode();
    }
  }

  private startClassicMode(): void {
    this.state.score = 0;
    this.state.combo = 0;
    this.state.multiplier = 1;
    this.state.timeLeft = 60;
    this.state.isPlaying = true;
    this.state.isGameOver = false;
    this.state.currentPhase = 0;
    this.state.totalClicks = 0;
    this.state.correctClicks = 0;
    this.state.currentStreak = 0;
    this.state.maxStreak = 0;
    this.state.maxMultiplier = 1;

    this.targets.clear();
    this.notify();
  }

  private startNormalMode(): void {
    this.state.score = 0;
    this.state.currentChallenge = 0;
    this.state.challengesCompleted = 0;
    this.state.totalAccuracySum = 0;
    this.state.maxComboSum = 0;
    this.state.maxStreakMax = 0;

    this.startChallenge(0);
  }

  startChallenge(challengeIndex: number): void {
    const challenge = CHALLENGES[challengeIndex];
    this.state.currentChallenge = challengeIndex;
    this.state.currentChallengeScoreRequired = challenge.scoreRequired;
    this.state.currentChallengeGolden = challenge.golden;

    if (challenge.isSurvival) {
      this.state.score = 100;
      this.state.survivalTime = challenge.survivalTime || 30;
    } else {
      this.state.score = 0;
    }

    this.state.combo = 0;
    this.state.multiplier = 1;
    this.state.timeLeft = this.state.challengeTimeLimit;
    this.state.isPlaying = true;
    this.state.isGameOver = false;
    this.state.currentPhase = challengeIndex;
    this.state.totalClicks = 0;
    this.state.correctClicks = 0;
    this.state.currentStreak = 0;
    this.state.maxStreak = 0;
    this.state.maxMultiplier = 1;

    this.targets.clear();
    this.notify();
  }

  spawnTarget(gameWidth: number, gameHeight: number, isGolden: boolean = false): Target | null {
    if (!this.state.isPlaying || this.state.isGameOver) return null;

    const maxX = gameWidth - TARGET_SIZE;
    const maxY = gameHeight - TARGET_SIZE;

    const x = Math.random() * maxX;
    const y = HEADER_HEIGHT + Math.random() * (maxY - HEADER_HEIGHT);

    const target: Target = {
      id: `target-${Date.now()}-${Math.random()}`,
      x,
      y,
      type: isGolden ? 'golden' : 'normal',
      size: TARGET_SIZE
    };

    this.targets.set(target.id, target);
    this.notify();

    return target;
  }

  spawnDecoy(gameWidth: number, gameHeight: number): Target | null {
    if (!this.state.isPlaying || this.state.isGameOver) return null;

    const maxX = gameWidth - TARGET_SIZE;
    const maxY = gameHeight - TARGET_SIZE;

    const x = Math.random() * maxX;
    const y = HEADER_HEIGHT + Math.random() * (maxY - HEADER_HEIGHT);

    const target: Target = {
      id: `decoy-${Date.now()}-${Math.random()}`,
      x,
      y,
      type: 'decoy',
      size: TARGET_SIZE
    };

    this.targets.set(target.id, target);
    this.notify();

    return target;
  }

  removeTarget(targetId: string): void {
    this.targets.delete(targetId);
    this.notify();
  }

  recordMiss(): void {
    if (!this.state.isPlaying || this.state.isGameOver) return;
    this.state.totalClicks++;
    this.notify();
  }

  clickTarget(targetId: string, clientX: number, clientY: number): { success: boolean; points: number; shouldSpawnMore: boolean; newChallenge?: number } {
    if (!this.state.isPlaying || this.state.isGameOver) {
      return { success: false, points: 0, shouldSpawnMore: false };
    }

    const target = this.targets.get(targetId);
    if (!target) {
      return { success: false, points: 0, shouldSpawnMore: false };
    }

    this.targets.delete(targetId);

    if (target.type === 'decoy') {
      return this.handleDecoyClick(clientX, clientY);
    }

    return this.handleNormalTargetClick(target.type === 'golden', clientX, clientY);
  }

  private handleNormalTargetClick(isGolden: boolean, x: number, y: number): { success: boolean; points: number; shouldSpawnMore: boolean; newChallenge?: number } {
    const points = isGolden ? 50 * this.state.multiplier : 10 * this.state.multiplier;
    this.state.score += points;

    this.state.combo++;
    this.state.multiplier = Math.min(Math.floor(this.state.combo / 5) + 1, 5);

    // Check if challenge is complete
    const challenge = CHALLENGES[this.state.currentChallenge];
    const isSurvival = challenge?.isSurvival || false;
    let newChallenge: number | undefined;

    if (!isSurvival && this.state.mode === 'normal' && this.state.score >= this.state.currentChallengeScoreRequired) {
      newChallenge = this.state.currentChallenge + 1;
    }

    if (this.state.multiplier > this.state.maxMultiplier) {
      this.state.maxMultiplier = this.state.multiplier;
    }

    this.state.correctClicks++;
    this.state.currentStreak++;
    if (this.state.currentStreak > this.state.maxStreak) {
      this.state.maxStreak = this.state.currentStreak;
    }
    this.state.totalClicks++;

    this.notify();
    return { success: true, points, shouldSpawnMore: true, newChallenge };
  }

  private handleDecoyClick(x: number, y: number): { success: boolean; points: number; shouldSpawnMore: boolean } {
    this.state.score = Math.max(0, this.state.score - 15);
    this.state.combo = 0;
    this.state.multiplier = 1;
    this.state.currentStreak = 0;
    this.state.totalClicks++;

    this.notify();
    return { success: true, points: -15, shouldSpawnMore: false };
  }

  tick(): { gameEnded?: boolean; challengeEnded?: boolean; victory?: boolean; gameOver?: boolean } {
    if (!this.state.isPlaying || this.state.isGameOver) {
      return {};
    }

    if (this.state.mode === 'classic') {
      return this.classicTick();
    } else {
      return this.normalTick();
    }
  }

  private classicTick(): { gameEnded?: boolean } {
    this.state.timeLeft--;
    this.handlePhaseChange();
    this.notify();

    if (this.state.timeLeft <= 0) {
      this.endGame();
      return { gameEnded: true };
    }

    return {};
  }

  private normalTick(): { challengeEnded?: boolean; victory?: boolean; gameOver?: boolean } {
    const challenge = CHALLENGES[this.state.currentChallenge];

    if (challenge?.isSurvival) {
      this.state.survivalTime--;
      this.state.score -= (challenge.scoreDecrement || 10);

      if (this.state.score <= 0 || this.state.survivalTime <= 0) {
        this.endChallenge();
        if (this.state.survivalTime <= 0 && this.state.score > 0) {
          return { challengeEnded: true, victory: this.checkVictory() };
        }
        return { challengeEnded: true, gameOver: true };
      }
    } else {
      this.state.timeLeft--;

      if (this.state.timeLeft <= 0) {
        this.endChallenge();
        const victory = this.checkVictory();
        const gameOver = !victory;
        return { challengeEnded: true, victory, gameOver };
      }
    }

    this.notify();
    return {};
  }

  private handlePhaseChange(): void {
    const newPhase = this.getCurrentPhase();

    if (newPhase !== this.state.currentPhase) {
      this.state.currentPhase = newPhase;
      this.notify();
    }
  }

  private getCurrentPhase(): number {
    if (this.state.mode === 'normal') {
      return this.state.currentChallenge;
    }

    for (let i = 0; i < PHASES.length; i++) {
      if (this.state.timeLeft <= PHASES[i].startTime && this.state.timeLeft > PHASES[i].endTime) {
        return i;
      }
    }
    return PHASES.length - 1;
  }

  private endChallenge(): void {
    this.state.isPlaying = false;
    this.state.isGameOver = true;

    const accuracy = this.state.totalClicks > 0 ? Math.round((this.state.correctClicks / this.state.totalClicks) * 100) : 0;

    this.state.totalAccuracySum += accuracy;
    this.state.maxComboSum += this.state.maxMultiplier;
    if (this.state.maxStreak > this.state.maxStreakMax) {
      this.state.maxStreakMax = this.state.maxStreak;
    }

    this.notify();
  }

  private endGame(): void {
    this.state.isPlaying = false;
    this.state.isGameOver = true;
    this.notify();
  }

  private checkVictory(): boolean {
    const challenge = CHALLENGES[this.state.currentChallenge];
    if (challenge?.isSurvival) {
      return this.state.survivalTime <= 0 && this.state.score > 0;
    }
    return this.state.score >= this.state.currentChallengeScoreRequired;
  }

  nextChallenge(): void {
    this.state.challengesCompleted++;
    if (this.state.challengesCompleted < CHALLENGES.length) {
      this.startChallenge(this.state.challengesCompleted);
    }
  }

  saveHighScore(): boolean {
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('metroMinuteHighScore', this.state.highScore.toString());
      }
      this.notify();
      return true;
    }
    return false;
  }

  resetGame(): void {
    this.state = this.getInitialState(this.state.mode, this.state.highScore, this.state.soundEnabled);
    this.targets.clear();
    this.notify();
  }

  toggleSound(enabled?: boolean): void {
    this.state.soundEnabled = enabled !== undefined ? enabled : !this.state.soundEnabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('metroMinuteSoundEnabled', this.state.soundEnabled.toString());
    }
    this.notify();
  }

  setMode(mode: GameMode): void {
    this.state = this.getInitialState(mode, this.state.highScore, this.state.soundEnabled);
    this.targets.clear();
    this.notify();
  }

  getTargets(): Target[] {
    return Array.from(this.targets.values());
  }

  getPhaseConfig(): Phase | Challenge | null {
    if (this.state.mode === 'normal') {
      return CHALLENGES[this.state.currentChallenge] || null;
    }
    return PHASES[this.state.currentPhase] || null;
  }

  getStats() {
    const accuracy = this.state.totalClicks > 0 ? Math.round((this.state.correctClicks / this.state.totalClicks) * 100) : 0;
    return {
      accuracy,
      maxCombo: this.state.maxMultiplier,
      maxStreak: this.state.maxStreak
    };
  }
}

export function loadHighScore(): number {
  if (typeof localStorage === 'undefined') return 0;
  const saved = localStorage.getItem('metroMinuteHighScore');
  return saved ? parseInt(saved) : 0;
}

export function loadSoundEnabled(): boolean {
  if (typeof localStorage === 'undefined') return true;
  const saved = localStorage.getItem('metroMinuteSoundEnabled');
  return saved === null ? true : saved === 'true';
}
