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

  // ========== PATRÓN OBSERVER ==========
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

  // ========== CONTROL DEL JUEGO ==========
  startMatch(): void {
    this.state.screen = GameScreen.COUNTDOWN;
    this.state.isPlaying = false;
    this.state.stopwatchRunning = false;
    this.state.stopwatchValue = 0;
    this.state.matchTime = this.state.isExtraTime ? 30 : this.state.matchDuration;
    this.notify();
  }

  startGameplay(): void {
    this.state.screen = GameScreen.GAME;
    this.state.isPlaying = true;
    this.state.stopwatchRunning = true;
    this.startStopwatch();
    this.startMatchTimer();
    this.notify();

    // Si es modo vs AI, iniciar comportamiento de IA
    if (this.state.mode === GameMode.VS_AI) {
      this.scheduleAITurn();
    }
  }

  private startStopwatch(): void {
    if (this.stopwatchInterval) {
      clearInterval(this.stopwatchInterval);
    }

    this.stopwatchInterval = setInterval(() => {
      if (!this.state.stopwatchRunning || !this.state.isPlaying) return;

      // Incrementar stopwatch con centésimas
      this.state.stopwatchValue = (this.state.stopwatchValue + 0.01) % 100;
      this.notify();
    }, 10); // 10ms = 0.01 segundos
  }

  private startMatchTimer(): void {
    if (this.matchInterval) {
      clearInterval(this.matchInterval);
    }

    this.matchInterval = setInterval(() => {
      if (!this.state.isPlaying || this.state.isPaused) return;

      this.state.matchTime--;

      if (this.state.matchTime <= 0) {
        this.endMatch();
      }

      this.notify();
    }, 1000); // 1 segundo
  }

  stopStopwatch(): void {
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

  stopMatchTimer(): void {
    if (this.matchInterval) {
      clearInterval(this.matchInterval);
      this.matchInterval = null;
    }
  }

  pauseGame(): void {
    this.state.isPaused = true;
    this.stopStopwatch();
    this.notify();
  }

  resumeGame(): void {
    this.state.isPaused = false;
    this.state.stopwatchRunning = true;
    this.startStopwatch();

    if (this.state.mode === GameMode.VS_AI) {
      this.scheduleAITurn();
    }
    this.notify();
  }

  // ========== LÓGICA DE TURNO ==========
  triggerStop(playerId: 'player1' | 'player2' | 'ai'): void {
    if (!this.state.isPlaying || this.state.isPaused) return;

    this.stopStopwatch();

    const value = this.state.stopwatchValue;
    const scoring = calculateScore(value);

    // Registrar intento
    const attempt: Attempt = {
      playerId,
      timestamp: (this.state.isExtraTime ? 30 : this.state.matchDuration) - this.state.matchTime,
      stopwatchValue: value,
      outcome: scoring.outcome
    };

    // Actualizar estadísticas
    if (playerId === 'player1' || playerId === 'player2') {
      const attempts = playerId === 'player1' ? this.state.player1Attempts : this.state.player2Attempts;
      attempts.push(attempt);
      this.state.totalAttempts++;

      // Procesar outcome
      switch (scoring.outcome) {
        case 'goal':
          this.state.perfectGoals++;
          if (playerId === 'player1') this.state.player1Score++;
          else this.state.player2Score++;
          break;

        case 'penalty':
          this.state.penaltiesConceded++;
          if (playerId === 'player1') this.state.player1Fouls++;
          else this.state.player2Fouls++;
          // En penalty, el rival lanza el cronómetro
          this.state.screen = GameScreen.PENALTY_RESULT;
          this.state.stopwatchValue = 0;
          break;

        case 'foul':
          this.state.foulsConceded++;
          if (playerId === 'player1') this.state.player1Fouls++;
          else this.state.player2Fouls++;
          // Falta es reintento del jugador actual
          break;

        case 'turnover':
          // No hay gol, el turno cambia automáticamente
          break;
      }

      // Actualizar mejor parada
      if (!this.state.bestStop || Math.abs(value) < Math.abs(this.state.bestStop.stopwatchValue)) {
        this.state.bestStop = attempt;
      }
    }

    // Cambiar turno (excepto en caso de falta, que es un reintento del jugador actual)
    if (this.state.mode === GameMode.VS_PLAYER && scoring.outcome !== 'foul' && scoring.outcome !== 'penalty') {
      this.state.currentTurn = this.state.currentTurn === 'player1' ? 'player2' : 'player1';
    }

    this.notify();

    // Si no es penalty (que requiere acción del usuario), retomar cronómetro después de breve delay
    if (scoring.outcome !== 'penalty') {
      setTimeout(() => {
        if (this.state.isPlaying && !this.state.isPaused && this.state.screen === GameScreen.GAME) {
          this.state.stopwatchRunning = true;
          this.startStopwatch();

          if (this.state.mode === GameMode.VS_AI) {
            this.scheduleAITurn();
          }
        }
      }, 500);
    }
  }

  // Penalty lanzado por el rival
  triggerPenaltyStop(playerId: 'player1' | 'player2', value: number, prediction: 'even' | 'odd'): void {
    const parity = getParity(value);
    const isGoal = parity === prediction;

    if (isGoal) {
      // El rival anota
      if (playerId === 'player1') this.state.player2Score++;
      else this.state.player1Score++;
    }

    // Volver al juego normal
    this.state.screen = GameScreen.GAME;
    this.state.stopwatchValue = 0;
    this.notify();

    // Retomar cronómetro
    setTimeout(() => {
      if (this.state.isPlaying && !this.state.isPaused) {
        this.state.stopwatchRunning = true;
        this.startStopwatch();

        if (this.state.mode === GameMode.VS_AI) {
          this.scheduleAITurn();
        }
      }
    }, 500);
  }

  // FALTA: reintento del jugador actual
  triggerFoulStop(playerId: 'player1' | 'player2', value: number): void {
    const isGoal = isFoulGoal(value);

    if (isGoal) {
      if (playerId === 'player1') this.state.player1Score++;
      else this.state.player2Score++;
    }

    // Cambiar turno tras la falta
    if (this.state.mode === GameMode.VS_PLAYER) {
      this.state.currentTurn = this.state.currentTurn === 'player1' ? 'player2' : 'player1';
    }

    this.state.screen = GameScreen.GAME;
    this.state.stopwatchValue = 0;
    this.notify();

    // Retomar cronómetro
    setTimeout(() => {
      if (this.state.isPlaying && !this.state.isPaused) {
        this.state.stopwatchRunning = true;
        this.startStopwatch();

        if (this.state.mode === GameMode.VS_AI) {
          this.scheduleAITurn();
        }
      }
    }, 500);
  }

  // ========== IA BEHAVIOR ==========
  private scheduleAITurn(): void {
    if (this.state.mode !== GameMode.VS_AI) return;
    if (!this.state.stopwatchRunning) return;

    const behavior = generateAIBehavior(this.state.aiDifficulty);
    const delay = Math.random() * 2000 + 1000; // 1-3 segundos aleatorios

    this.aiTimeout = setTimeout(() => {
      if (!this.state.stopwatchRunning || this.state.isPaused) return;

      // La IA "simula" parar en un valor cercano a 0
      this.state.stopwatchValue = behavior.targetValue;
      this.triggerStop('ai');
    }, delay);
  }

  // ========== GESTIÓN DEL PARTIDO ==========
  private endMatch(): void {
    this.stopStopwatch();
    this.stopMatchTimer();
    this.state.isPlaying = false;

    // Verificar empate
    if (this.state.player1Score === this.state.player2Score) {
      if (!this.state.isExtraTime) {
        // Ir a prórroga
        this.state.isExtraTime = true;
        this.state.screen = GameScreen.EXTRA_TIME;
        this.notify();
        return;
      } else if (!this.state.isPenalties) {
        // Ir a penales
        this.state.isPenalties = true;
        this.state.screen = GameScreen.PENALTIES;
        this.startPenaltyShootout();
        this.notify();
        return;
      }
    }

    // Partido finalizado
    this.state.screen = GameScreen.RESULT;
    this.saveHighScore();
    this.notify();
  }

  // ========== TANDA DE PENALES ==========
  private startPenaltyShootout(): void {
    this.state.penaltyRound = 1;
    this.state.player1PenaltyScore = 0;
    this.state.player2PenaltyScore = 0;
    this.state.penaltyQueue = [];

    // Generar secuencia de penales (5 rondas por defecto)
    for (let i = 0; i < 5; i++) {
      this.state.penaltyQueue.push({ playerId: 'player1', target: 0, result: 'miss' });
      this.state.penaltyQueue.push({ playerId: 'player2', target: 0, result: 'miss' });
    }
  }

  takePenalty(playerId: 'player1' | 'player2', value: number): void {
    if (!this.state.isPenalties) return;

    // En penales, el objetivo es simple: valor < 50 = GOL, valor ≥ 50 = MISS
    const isGoal = value < 50;

    if (playerId === 'player1') {
      this.state.player1PenaltyScore += isGoal ? 1 : 0;
    } else {
      this.state.player2PenaltyScore += isGoal ? 1 : 0;
    }

    // Verificar si alguien ya ganó
    const remainingPenalties = this.state.penaltyQueue.length;
    const player1CanWin = this.state.player1PenaltyScore + Math.floor(remainingPenalties / 2) > this.state.player2PenaltyScore;
    const player2CanWin = this.state.player2PenaltyScore + Math.floor(remainingPenalties / 2) > this.state.player1PenaltyScore;

    if (!player1CanWin || !player2CanWin) {
      // Alguien ya no puede ganar, partido finalizado
      this.state.screen = GameScreen.RESULT;
      this.saveHighScore();
    }

    this.notify();
  }

  // ========== UTILIDADES ==========
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
