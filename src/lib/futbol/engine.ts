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
      isNewRecord: false,
      lastAIOutcome: null,
      lastPlayerOutcome: null
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
   * Player presses START — stopwatch begins counting up from 00.00 (VS_AI) or continues from previous value (VS_PLAYER)
   */
  playerStart(): void {
    if (this.state.stopwatchRunning) return;
    if (!this.state.isPlaying) return;
    // Don't allow start if it's AI's turn in VS_AI mode
    if (this.state.mode === GameMode.VS_AI && this.state.currentTurn === 'ai') return;

    // In VS_PLAYER mode, keep the stopwatch value (continue from where it left off)
    // In VS_AI mode, reset to 0 each turn
    if (this.state.mode === GameMode.VS_AI) {
      this.state.stopwatchValue = 0;
    }
    // In VS_PLAYER, stopwatchValue stays as is (accumulated)

    this.state.stopwatchRunning = true;
    this.runStopwatch();
    this.notify();
  }

  /**
   * Player presses STOP — stopwatch stops, evaluate result
   */
  playerStop(): void {
    if (!this.state.stopwatchRunning) return;

    // Compute exact value at stop time using timestamps
    this.state.stopwatchValue = this.computeExactStopwatchValue();
    this.stopStopwatch();
    const value = Math.round(this.state.stopwatchValue * 100) / 100;
    this.state.stopwatchValue = value;
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
    let scored = false;
    switch (scoring.outcome) {
      case 'goal':
        this.state.perfectGoals++;
        if (currentPlayer === 'player1') this.state.player1Score++;
        else this.state.player2Score++;
        scored = true;
        break;

      case 'penalty':
        this.state.penaltiesConceded++;
        if (currentPlayer === 'player1') this.state.player1Fouls++;
        else this.state.player2Fouls++;
        this.state.screen = GameScreen.PENALTY_RESULT;
        // In VS_PLAYER mode, keep stopwatch value (don't reset to 0)
        if (this.state.mode === GameMode.VS_PLAYER) {
          // Keep the value where it stopped
        } else {
          this.state.stopwatchValue = 0;
        }
        // Save player outcome for UI to display
        this.state.lastPlayerOutcome = {
          outcome: scoring.outcome,
          value,
          scored: false
        };
        this.notify();
        return; // Don't change turn — penalty screen takes over

      case 'foul':
        this.state.foulsConceded++;
        if (currentPlayer === 'player1') this.state.player1Fouls++;
        else this.state.player2Fouls++;
        // Foul = retry for same player, reset stopwatch but don't change turn
        this.state.stopwatchValue = 0;
        // Save player outcome for UI to display
        this.state.lastPlayerOutcome = {
          outcome: scoring.outcome,
          value,
          scored: false
        };
        this.notify();
        return; // Same player's turn again

      case 'turnover':
        // Turn passes to rival
        break;
    }

    // Save player outcome for UI to display
    this.state.lastPlayerOutcome = {
      outcome: scoring.outcome,
      value,
      scored
    };

    // Switch turns
    this.switchTurn();
    this.notify();
  }

  /**
   * Foul retry: player pressed STOP during foul retry
   */
  foulRetryStop(): void {
    if (!this.state.stopwatchRunning) return;

    // Compute exact value at stop time
    this.state.stopwatchValue = this.computeExactStopwatchValue();
    this.stopStopwatch();
    const value = Math.round(this.state.stopwatchValue * 100) / 100;
    this.state.stopwatchValue = value;
    const isGoal = isFoulGoal(value);
    const currentPlayer = (this.state.mode === GameMode.VS_AI)
      ? 'player1' as const
      : this.state.currentTurn as 'player1' | 'player2';

    if (isGoal) {
      if (currentPlayer === 'player1') this.state.player1Score++;
      else this.state.player2Score++;
    }

    // Save player outcome for UI to display
    this.state.lastPlayerOutcome = {
      outcome: isGoal ? 'goal' : 'turnover',
      value,
      scored: isGoal
    };

    // In VS_PLAYER mode, keep stopwatch value (don't reset to 0)
    if (this.state.mode === GameMode.VS_PLAYER) {
      // Keep the value where it stopped
    } else {
      this.state.stopwatchValue = 0;
    }
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
    // Round to 2 decimals to avoid floating point issues
    const value = Math.round(this.state.stopwatchValue * 100) / 100;
    this.state.stopwatchValue = value;
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
    // In VS_PLAYER mode, keep stopwatch value (don't reset to 0)
    if (this.state.mode === GameMode.VS_PLAYER) {
      // Keep the value where it stopped
    } else {
      this.state.stopwatchValue = 0;
    }
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
      // In VS_PLAYER, keep stopwatch value between turns - do NOT reset to 0
      // Each player sees where the opponent left off
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

        // Round to 2 decimals to avoid floating point issues
        const roundedValue = Math.round(behavior.targetValue * 100) / 100;
        this.state.stopwatchValue = roundedValue;

        const scoring = calculateScore(roundedValue);
        const attempt: Attempt = {
          playerId: 'ai',
          timestamp: (this.state.isExtraTime ? 30 : this.state.matchDuration) - this.state.matchTime,
          stopwatchValue: roundedValue,
          outcome: scoring.outcome
        };
        this.state.player2Attempts.push(attempt);
        this.state.totalAttempts++;

        let scored = false;

        switch (scoring.outcome) {
          case 'goal':
            this.state.player2Score++;
            this.state.perfectGoals++;
            scored = true;
            break;
          case 'penalty':
            this.state.penaltiesConceded++;
            this.state.player2Fouls++;
            // AI concedes penalty to player1
            // Player will take the penalty in the UI
            this.state.screen = GameScreen.PENALTY_RESULT;
            this.state.lastAIOutcome = {
              outcome: 'penalty',
              value: roundedValue,
              scored: false
            };
            this.notify();
            return;
          case 'foul':
            this.state.foulsConceded++;
            this.state.player2Fouls++;
            // AI fouls — AI retries
            // Retry once
            this.state.stopwatchValue = 0;
            const retryValue = Math.round(Math.random() * 99.99 * 100) / 100;
            const foulGoal = isFoulGoal(retryValue);
            if (foulGoal) {
              this.state.player2Score++;
              scored = true;
            }
            break;
          case 'turnover':
            break;
        }

        // Save AI outcome for UI to display
        this.state.lastAIOutcome = {
          outcome: scoring.outcome,
          value: roundedValue,
          scored
        };

        this.state.currentTurn = 'player1';
        this.state.stopwatchValue = 0;
        this.notify();
      }, stopDelay);
    }, startDelay);
  }

  // ========== STOPWATCH ==========
  private stopwatchStartTime: number = 0;
  private stopwatchStartValue: number = 0;

  /**
   * Compute the exact stopwatch value at this instant using timestamps.
   * Avoids stale values from the interval-based notify.
   */
  private computeExactStopwatchValue(): number {
    const elapsed = (Date.now() - this.stopwatchStartTime) / 10; // centiseconds
    const rawValue = (this.stopwatchStartValue + elapsed / 100) % 100;
    return Math.round(rawValue * 100) / 100;
  }

  private runStopwatch(): void {
    if (this.stopwatchInterval) clearInterval(this.stopwatchInterval);
    this.stopwatchStartTime = Date.now();
    this.stopwatchStartValue = this.state.stopwatchValue;
    this.stopwatchInterval = setInterval(() => {
      if (!this.state.stopwatchRunning || !this.state.isPlaying) return;
      const elapsed = (Date.now() - this.stopwatchStartTime) / 10; // centiseconds
      const rawValue = (this.stopwatchStartValue + elapsed / 100) % 100;
      // Round to 2 decimals for clean display
      this.state.stopwatchValue = Math.round(rawValue * 100) / 100;
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
