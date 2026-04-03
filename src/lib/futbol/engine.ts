import {
  FootballGameState,
  GameScreen,
  GameMode,
  MatchDuration,
  AIDifficulty,
  Attempt
} from './types';
import { calculateScore, isFoulGoal, getParity } from './scoring';
import { generateAIBehavior } from './ai';

export class FootballEngine {
  private state: FootballGameState;
  private listeners: Set<(state: FootballGameState) => void> = new Set();
  private stopwatchInterval: NodeJS.Timeout | null = null;
  private matchInterval: NodeJS.Timeout | null = null;
  private aiTimeout: NodeJS.Timeout | null = null;

  constructor(
    mode: GameMode = GameMode.VS_AI,
    duration: MatchDuration = 120,
    aiDifficulty: AIDifficulty = AIDifficulty.MEDIUM,
    soundEnabled: boolean = true
  ) {
    this.state = this.getInitialState(mode, duration, aiDifficulty, soundEnabled);
  }

  private getInitialState(
    mode: GameMode,
    duration: MatchDuration,
    aiDifficulty: AIDifficulty,
    soundEnabled: boolean
  ): FootballGameState {
    return {
      mode,
      matchDuration: duration,
      aiDifficulty,
      soundEnabled,
      screen: GameScreen.HOME,
      isPlaying: false,
      isPaused: false,
      currentTurn: 'player1',
      matchTime: duration,
      stopwatchValue: 0,
      stopwatchRunning: false,
      player1Score: 0,
      player2Score: 0,
      player1Fouls: 0,
      player2Fouls: 0,
      player1Attempts: [],
      player2Attempts: [],
      penaltyRound: 1,
      player1PenaltyScore: 0,
      player2PenaltyScore: 0,
      penaltyQueue: [],
      bestStop: null,
      totalAttempts: 0,
      perfectGoals: 0,
      penaltiesConceded: 0,
      foulsConceded: 0,
      isExtraTime: false,
      isPenalties: false,
      isNewRecord: false
    };
  }

  // ========== OBSERVER ==========
  getState(): FootballGameState {
    return { ...this.state };
  }

  subscribe(listener: (state: FootballGameState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  // ========== MATCH CONTROL ==========
  startMatch(): void {
    this.state.screen = GameScreen.COUNTDOWN;
    this.state.isPlaying = false;
    this.state.stopwatchRunning = false;
    this.state.stopwatchValue = 0;
    this.state.matchTime = this.state.isExtraTime ? 30 : this.state.matchDuration;
    this.state.currentTurn = 'player1';
    this.notify();
  }

  /**
   * Called after countdown. Sets up the game screen but does NOT start the stopwatch.
   * The player must press START to begin their turn.
   */
  startGameplay(): void {
    this.state.screen = GameScreen.GAME;
    this.state.isPlaying = true;
    this.state.stopwatchRunning = false;
    this.state.stopwatchValue = 0;
    // Start the match timer (counts down game time)
    this.startMatchTimer();
    this.notify();
    // Do NOT start stopwatch or schedule AI — player must press START first
  }

  /**
   * Player presses START — stopwatch begins counting up from 00.00
   */
  playerStart(): void {
    if (this.state.stopwatchRunning) return;
    if (!this.state.isPlaying) return;
    // Don't allow start if it's AI's turn in VS_AI mode
    if (this.state.mode === GameMode.VS_AI && this.state.currentTurn === 'ai') return;

    this.state.stopwatchValue = 0;
    this.state.stopwatchRunning = true;
    this.runStopwatch();
    this.notify();
  }

  /**
   * Player presses STOP — stopwatch stops, evaluate result
   */
  playerStop(): void {
    if (!this.state.stopwatchRunning) return;

    this.stopStopwatch();
    const value = this.state.stopwatchValue;
    const scoring = calculateScore(value);
    const currentPlayer = (this.state.mode === GameMode.VS_AI)
      ? 'player1' as const
      : this.state.currentTurn as 'player1' | 'player2';

    // Register attempt
    const attempt: Attempt = {
      playerId: currentPlayer,
      timestamp: (this.state.isExtraTime ? 30 : this.state.matchDuration) - this.state.matchTime,
      stopwatchValue: value,
      outcome: scoring.outcome
    };

    const attempts = currentPlayer === 'player1' ? this.state.player1Attempts : this.state.player2Attempts;
    attempts.push(attempt);
    this.state.totalAttempts++;

    // Update best stop
    if (!this.state.bestStop || Math.abs(value) < Math.abs(this.state.bestStop.stopwatchValue)) {
      this.state.bestStop = attempt;
    }

    // Process outcome
    switch (scoring.outcome) {
      case 'goal':
        this.state.perfectGoals++;
        if (currentPlayer === 'player1') this.state.player1Score++;
        else this.state.player2Score++;
        break;

      case 'penalty':
        this.state.penaltiesConceded++;
        if (currentPlayer === 'player1') this.state.player1Fouls++;
        else this.state.player2Fouls++;
        this.state.screen = GameScreen.PENALTY_RESULT;
        this.state.stopwatchValue = 0;
        this.notify();
        return; // Don't change turn — penalty screen takes over

      case 'foul':
        this.state.foulsConceded++;
        if (currentPlayer === 'player1') this.state.player1Fouls++;
        else this.state.player2Fouls++;
        // Foul = retry for same player, reset stopwatch but don't change turn
        this.state.stopwatchValue = 0;
        this.notify();
        return; // Same player's turn again

      case 'turnover':
        // Turn passes to rival
        break;
    }

    // Switch turns
    this.switchTurn();
    this.notify();
  }

  /**
   * Foul retry: player pressed STOP during foul retry
   */
  foulRetryStop(): void {
    if (!this.state.stopwatchRunning) return;

    this.stopStopwatch();
    const value = this.state.stopwatchValue;
    const isGoal = isFoulGoal(value);
    const currentPlayer = (this.state.mode === GameMode.VS_AI)
      ? 'player1' as const
      : this.state.currentTurn as 'player1' | 'player2';

    if (isGoal) {
      if (currentPlayer === 'player1') this.state.player1Score++;
      else this.state.player2Score++;
    }

    this.state.stopwatchValue = 0;
    this.switchTurn();
    this.notify();
  }

  /**
   * Penalty: rival presses START, then STOP with their prediction
   */
  penaltyStart(): void {
    this.state.stopwatchValue = 0;
    this.state.stopwatchRunning = true;
    this.runStopwatch();
    this.notify();
  }

  penaltyStop(prediction: 'even' | 'odd'): void {
    if (!this.state.stopwatchRunning) return;

    this.stopStopwatch();
    const value = this.state.stopwatchValue;
    const parity = getParity(value);
    const isGoal = parity === prediction;

    // The rival who takes the penalty scores if prediction is correct
    // The penalty was conceded by currentTurn, so rival is the other
    const rival = (this.state.mode === GameMode.VS_AI) ? 'player2' as const
      : (this.state.currentTurn === 'player1' ? 'player2' : 'player1') as 'player1' | 'player2';

    if (isGoal) {
      if (rival === 'player1') this.state.player1Score++;
      else this.state.player2Score++;
    }

    this.state.screen = GameScreen.GAME;
    this.state.stopwatchValue = 0;
    this.switchTurn();
    this.notify();
  }

  // ========== TURN MANAGEMENT ==========
  private switchTurn(): void {
    if (this.state.mode === GameMode.VS_AI) {
      // In VS_AI, after player1 goes, it's AI's turn
      if (this.state.currentTurn === 'player1') {
        this.state.currentTurn = 'ai';
        // Schedule AI action
        this.scheduleAIAction();
      } else {
        this.state.currentTurn = 'player1';
      }
    } else {
      this.state.currentTurn = this.state.currentTurn === 'player1' ? 'player2' : 'player1';
    }
  }

  // ========== AI ==========
  private scheduleAIAction(): void {
    if (this.state.mode !== GameMode.VS_AI) return;

    // AI starts after a brief delay
    const startDelay = 800 + Math.random() * 600;
    this.aiTimeout = setTimeout(() => {
      if (!this.state.isPlaying || this.state.screen !== GameScreen.GAME) return;

      // AI starts stopwatch
      this.state.stopwatchValue = 0;
      this.state.stopwatchRunning = true;
      this.runStopwatch();
      this.notify();

      // AI stops after some time
      const behavior = generateAIBehavior(this.state.aiDifficulty);
      const stopDelay = 1000 + Math.random() * 2000;
      this.aiTimeout = setTimeout(() => {
        if (!this.state.stopwatchRunning) return;
        this.stopStopwatch();
        this.state.stopwatchValue = behavior.targetValue;

        const scoring = calculateScore(behavior.targetValue);
        const attempt: Attempt = {
          playerId: 'ai',
          timestamp: (this.state.isExtraTime ? 30 : this.state.matchDuration) - this.state.matchTime,
          stopwatchValue: behavior.targetValue,
          outcome: scoring.outcome
        };
        this.state.player2Attempts.push(attempt);
        this.state.totalAttempts++;

        switch (scoring.outcome) {
          case 'goal':
            this.state.player2Score++;
            this.state.perfectGoals++;
            break;
          case 'penalty':
            this.state.penaltiesConceded++;
            this.state.player2Fouls++;
            // AI penalty: simplified — AI predicts and we resolve
            const aiPrediction = Math.random() > 0.5 ? 'even' as const : 'odd' as const;
            // Player 1 takes the penalty against AI
            // For simplicity: resolve immediately
            this.state.screen = GameScreen.PENALTY_RESULT;
            this.notify();
            // Auto-resolve: AI concedes penalty to player1
            // Player1 "launches" and AI "predicts"
            // We'll let the player take this penalty in the UI
            return;
          case 'foul':
            this.state.foulsConceded++;
            this.state.player2Fouls++;
            // AI fouls — AI retries
            // Simplified: AI retries once
            this.state.stopwatchValue = 0;
            const retryValue = Math.random() * 99.99;
            const foulGoal = isFoulGoal(retryValue);
            if (foulGoal) {
              this.state.player2Score++;
            }
            break;
          case 'turnover':
            break;
        }

        this.state.currentTurn = 'player1';
        this.state.stopwatchValue = 0;
        this.notify();
      }, stopDelay);
    }, startDelay);
  }

  // ========== STOPWATCH ==========
  private runStopwatch(): void {
    if (this.stopwatchInterval) clearInterval(this.stopwatchInterval);
    this.stopwatchInterval = setInterval(() => {
      if (!this.state.stopwatchRunning || !this.state.isPlaying) return;
      this.state.stopwatchValue = (this.state.stopwatchValue + 0.01) % 100;
      this.notify();
    }, 10);
  }

  private stopStopwatch(): void {
    this.state.stopwatchRunning = false;
    if (this.stopwatchInterval) {
      clearInterval(this.stopwatchInterval);
      this.stopwatchInterval = null;
    }
    if (this.aiTimeout) {
      clearTimeout(this.aiTimeout);
      this.aiTimeout = null;
    }
  }

  private startMatchTimer(): void {
    if (this.matchInterval) clearInterval(this.matchInterval);
    this.matchInterval = setInterval(() => {
      if (!this.state.isPlaying || this.state.isPaused) return;
      this.state.matchTime--;
      if (this.state.matchTime <= 0) {
        this.endMatch();
      }
      this.notify();
    }, 1000);
  }

  private stopMatchTimer(): void {
    if (this.matchInterval) {
      clearInterval(this.matchInterval);
      this.matchInterval = null;
    }
  }

  // ========== MATCH END ==========
  private endMatch(): void {
    this.stopStopwatch();
    this.stopMatchTimer();
    this.state.isPlaying = false;

    if (this.state.player1Score === this.state.player2Score) {
      if (!this.state.isExtraTime) {
        this.state.isExtraTime = true;
        this.state.screen = GameScreen.EXTRA_TIME;
        this.notify();
        return;
      } else if (!this.state.isPenalties) {
        this.state.isPenalties = true;
        this.state.screen = GameScreen.PENALTIES;
        this.startPenaltyShootout();
        this.notify();
        return;
      }
    }

    this.state.screen = GameScreen.RESULT;
    this.saveHighScore();
    this.notify();
  }

  // ========== PENALTY SHOOTOUT ==========
  private startPenaltyShootout(): void {
    this.state.penaltyRound = 1;
    this.state.player1PenaltyScore = 0;
    this.state.player2PenaltyScore = 0;
    this.state.penaltyQueue = [];
    for (let i = 0; i < 5; i++) {
      this.state.penaltyQueue.push({ playerId: 'player1', target: 0, result: 'miss' });
      this.state.penaltyQueue.push({ playerId: 'player2', target: 0, result: 'miss' });
    }
  }

  takePenalty(playerId: 'player1' | 'player2', value: number): void {
    if (!this.state.isPenalties) return;
    const isGoal = value < 50;
    if (playerId === 'player1') this.state.player1PenaltyScore += isGoal ? 1 : 0;
    else this.state.player2PenaltyScore += isGoal ? 1 : 0;

    const remaining = this.state.penaltyQueue.length;
    const p1CanWin = this.state.player1PenaltyScore + Math.floor(remaining / 2) > this.state.player2PenaltyScore;
    const p2CanWin = this.state.player2PenaltyScore + Math.floor(remaining / 2) > this.state.player1PenaltyScore;

    if (!p1CanWin || !p2CanWin) {
      this.state.screen = GameScreen.RESULT;
      this.saveHighScore();
    }
    this.notify();
  }

  // ========== UTILITIES ==========
  resetGame(): void {
    this.stopStopwatch();
    this.stopMatchTimer();
    this.state = this.getInitialState(
      this.state.mode,
      this.state.matchDuration,
      this.state.aiDifficulty,
      this.state.soundEnabled
    );
    this.notify();
  }

  setMode(mode: GameMode): void {
    this.state = this.getInitialState(mode, this.state.matchDuration, this.state.aiDifficulty, this.state.soundEnabled);
    this.notify();
  }

  setDuration(duration: MatchDuration): void {
    this.state.matchDuration = duration;
    this.notify();
  }

  setAIDifficulty(difficulty: AIDifficulty): void {
    this.state.aiDifficulty = difficulty;
    this.notify();
  }

  toggleSound(enabled?: boolean): void {
    this.state.soundEnabled = enabled !== undefined ? enabled : !this.state.soundEnabled;
    this.notify();
  }

  private saveHighScore(): boolean {
    const key = `futbolHighScore_${this.state.mode}_${this.state.matchDuration}`;
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    const currentHighScore = saved ? parseInt(saved) : 0;
    const playerScore = Math.max(this.state.player1Score, this.state.player2Score);

    if (playerScore > currentHighScore) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, playerScore.toString());
      }
      this.state.isNewRecord = true;
      this.notify();
      return true;
    }
    return false;
  }
}

export function loadHighScore(mode: GameMode, duration: MatchDuration): number {
  if (typeof localStorage === 'undefined') return 0;
  const key = `futbolHighScore_${mode}_${duration}`;
  const saved = localStorage.getItem(key);
  return saved ? parseInt(saved) : 0;
}

export function loadSoundEnabled(): boolean {
  if (typeof localStorage === 'undefined') return true;
  const saved = localStorage.getItem('metroMinuteSoundEnabled');
  return saved === null ? true : saved === 'true';
}
