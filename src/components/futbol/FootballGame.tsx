'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FootballEngine } from '@/lib/futbol/engine';
import {
  GameScreen,
  GameMode,
  MatchDuration,
  AIDifficulty
} from '@/lib/futbol/types';
import { loadSoundEnabled } from '@/lib/futbol/engine';
import Stopwatch from './Stopwatch';
import ScoreBoard from './ScoreBoard';
import PlayerCard from './PlayerCard';
import ResultSummary from './ResultSummary';
import DifficultySelector from './DifficultySelector';
import PenaltyControl from './PenaltyControl';
import styles from './FootballGame.module.css';

export default function FootballGame() {
  const router = useRouter();
  const engineRef = useRef<FootballEngine | null>(null);

  const [gameState, setGameState] = useState({
    screen: GameScreen.HOME,
    isPlaying: false,
    isPaused: false,
    currentTurn: 'player1' as 'player1' | 'player2' | 'ai',
    matchTime: 120,
    stopwatchValue: 0,
    stopwatchRunning: false,
    player1Score: 0,
    player2Score: 0,
    player1Fouls: 0,
    player2Fouls: 0,
    player1Attempts: [] as Array<{ playerId: 'player1' | 'player2' | 'ai'; timestamp: number; stopwatchValue: number; outcome: 'goal' | 'penalty' | 'foul' | 'turnover' }>,
    player2Attempts: [] as Array<{ playerId: 'player1' | 'player2' | 'ai'; timestamp: number; stopwatchValue: number; outcome: 'goal' | 'penalty' | 'foul' | 'turnover' }>,
    penaltyRound: 1,
    player1PenaltyScore: 0,
    player2PenaltyScore: 0,
    totalAttempts: 0,
    perfectGoals: 0,
    penaltiesConceded: 0,
    foulsConceded: 0,
    bestStop: null as { playerId: 'player1' | 'player2' | 'ai'; timestamp: number; stopwatchValue: number; outcome: string } | null,
    isExtraTime: false,
    isPenalties: false,
    isNewRecord: false,
    mode: GameMode.VS_AI,
    matchDuration: 120 as MatchDuration,
    aiDifficulty: AIDifficulty.MEDIUM,
    soundEnabled: true
  });

  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.VS_AI);
  const [selectedDuration, setSelectedDuration] = useState<MatchDuration>(120);
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>(AIDifficulty.MEDIUM);
  const [lastOutcome, setLastOutcome] = useState<{ type: string; description: string } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    engineRef.current = new FootballEngine(
      selectedMode,
      selectedDuration,
      selectedDifficulty,
      loadSoundEnabled()
    );

    const unsubscribe = engineRef.current.subscribe((state) => {
      setGameState({
        screen: state.screen,
        isPlaying: state.isPlaying,
        isPaused: state.isPaused,
        currentTurn: state.currentTurn,
        matchTime: state.matchTime,
        stopwatchValue: state.stopwatchValue,
        stopwatchRunning: state.stopwatchRunning,
        player1Score: state.player1Score,
        player2Score: state.player2Score,
        player1Fouls: state.player1Fouls,
        player2Fouls: state.player2Fouls,
        player1Attempts: state.player1Attempts,
        player2Attempts: state.player2Attempts,
        penaltyRound: state.penaltyRound,
        player1PenaltyScore: state.player1PenaltyScore,
        player2PenaltyScore: state.player2PenaltyScore,
        totalAttempts: state.totalAttempts,
        perfectGoals: state.perfectGoals,
        penaltiesConceded: state.penaltiesConceded,
        foulsConceded: state.foulsConceded,
        bestStop: state.bestStop,
        isExtraTime: state.isExtraTime,
        isPenalties: state.isPenalties,
        isNewRecord: state.isNewRecord,
        mode: state.mode,
        matchDuration: state.matchDuration,
        aiDifficulty: state.aiDifficulty,
        soundEnabled: state.soundEnabled
      });

      // Si estamos en modo vs AI, sincronizar currentTurn con el estado
      if (state.mode === GameMode.VS_AI && state.currentTurn !== 'ai') {
        // El jugador actual es siempre player1 en modo vs AI
      }
    });

    return () => {
      unsubscribe();
      engineRef.current?.resetGame();
    };
  }, [selectedMode, selectedDuration, selectedDifficulty]);

  const handleStartMatch = useCallback(() => {
    engineRef.current?.setMode(selectedMode);
    engineRef.current?.setDuration(selectedDuration);
    if (selectedMode === GameMode.VS_AI) {
      engineRef.current?.setAIDifficulty(selectedDifficulty);
    }
    engineRef.current?.startMatch();

    // Countdown
    setCountdown(3);
    let current = 3;
    const interval = setInterval(() => {
      current--;
      if (current <= 0) {
        clearInterval(interval);
        setCountdown(0);
        setTimeout(() => {
          setCountdown(null);
          engineRef.current?.startGameplay();
        }, 500);
      } else {
        setCountdown(current);
      }
    }, 1000);
  }, [selectedMode, selectedDuration, selectedDifficulty]);

  const handleStop = useCallback((value: number) => {
    if (!engineRef.current) return;

    const currentPlayer = gameState.mode === GameMode.VS_AI ? 'player1' : gameState.currentTurn;
    engineRef.current.triggerStop(currentPlayer);

    // Determinar outcome para mostrar en la UI
    if (value === 0) {
      setLastOutcome({ type: 'goal', description: '⚽ GOL!' });
    } else if (value === 0.01 || value === 99.99) {
      setLastOutcome({ type: 'penalty', description: '🥅 PENALTY!' });
    } else if (Math.floor(value) > 0 && Math.floor(value) % 5 === 0) {
      setLastOutcome({ type: 'foul', description: '⚠️ FALTA!' });
    } else {
      setLastOutcome({ type: 'turnover', description: '🔄 Turno al rival' });
    }

    setTimeout(() => setLastOutcome(null), 2000);
  }, [gameState.mode, gameState.currentTurn]);

  const handlePenaltyStop = useCallback((value: number, prediction: 'even' | 'odd') => {
    const rivalPlayer = (gameState.mode === GameMode.VS_AI ? 'player2' : (gameState.currentTurn === 'player1' ? 'player2' : 'player1')) as 'player1' | 'player2';
    engineRef.current?.triggerPenaltyStop(rivalPlayer, value, prediction);
  }, [gameState.mode, gameState.currentTurn]);

  const handleRetry = useCallback(() => {
    setLastOutcome(null);
    engineRef.current?.resetGame();
    handleStartMatch();
  }, [handleStartMatch]);

  const handleHome = useCallback(() => {
    setLastOutcome(null);
    engineRef.current?.resetGame();
    router.push('/');
  }, [router]);

  const getWinner = (): 'player1' | 'player2' | 'draw' => {
    if (gameState.player1Score > gameState.player2Score) return 'player1';
    if (gameState.player2Score > gameState.player1Score) return 'player2';
    return 'draw';
  };

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameWrapper}>
        <div className={styles.gameHeader}>
          <div className={styles.gameTitle}>⚽ Fútbol Cronómetro</div>
          <button className={styles.backButton} onClick={() => router.push('/')}>
            Volver
          </button>
        </div>

        <div className={styles.gameContent}>
          <AnimatePresence mode="wait">
            {gameState.screen === GameScreen.HOME && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.homeScreen}
              >
                <div className={styles.logo}>⚽</div>

                <div className={styles.title}>Fútbol Cronómetro</div>
                <div className={styles.subtitle}>
                  Para en 00.00 = GOL. Precisión y tiempo lo es todo.
                </div>

                <div className={styles.modeSelector}>
                  <button
                    className={`${styles.modeButton} ${styles.vsAi} ${selectedMode === GameMode.VS_AI ? styles.selected : ''}`}
                    onClick={() => setSelectedMode(GameMode.VS_AI)}
                  >
                    <span>🤖 VS IA</span>
                    <span className={styles.subtitle}>Juega contra la IA</span>
                  </button>

                  <button
                    className={`${styles.modeButton} ${styles.vsPlayer} ${selectedMode === GameMode.VS_PLAYER ? styles.selected : ''}`}
                    onClick={() => setSelectedMode(GameMode.VS_PLAYER)}
                  >
                    <span>👥 VS JUGADOR</span>
                    <span className={styles.subtitle}>Mismo dispositivo</span>
                  </button>
                </div>

                {selectedMode === GameMode.VS_AI && (
                  <DifficultySelector
                    currentDifficulty={selectedDifficulty}
                    onSelectDifficulty={setSelectedDifficulty}
                  />
                )}

                <div className={styles.durationSelector}>
                  <button
                    className={`${styles.durationButton} ${selectedDuration === 60 ? styles.selected : ''}`}
                    onClick={() => setSelectedDuration(60)}
                  >
                    1 MIN
                  </button>
                  <button
                    className={`${styles.durationButton} ${selectedDuration === 120 ? styles.selected : ''}`}
                    onClick={() => setSelectedDuration(120)}
                  >
                    2 MIN
                  </button>
                  <button
                    className={`${styles.durationButton} ${selectedDuration === 180 ? styles.selected : ''}`}
                    onClick={() => setSelectedDuration(180)}
                  >
                    3 MIN
                  </button>
                </div>

                <button className={styles.playButton} onClick={handleStartMatch}>
                  ⚽ JUGAR
                </button>
              </motion.div>
            )}

            {gameState.screen === GameScreen.COUNTDOWN && (
              <motion.div
                key="countdown"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.countdown}
              >
                <motion.div
                  key={countdown}
                  className={styles.countdownNumber}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  {countdown === 0 ? 'GO' : countdown}
                </motion.div>
              </motion.div>
            )}

            {gameState.screen === GameScreen.GAME && (
              <motion.div
                key="game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.gameScreen}
              >
                <ScoreBoard
                  player1Score={gameState.player1Score}
                  player2Score={gameState.player2Score}
                  player1Fouls={gameState.player1Fouls}
                  player2Fouls={gameState.player2Fouls}
                  matchTime={gameState.matchTime}
                  isExtraTime={gameState.isExtraTime}
                  player1Name={gameState.mode === GameMode.VS_AI ? 'JUGADOR' : 'JUGADOR 1'}
                  player2Name={gameState.mode === GameMode.VS_AI ? 'IA' : 'JUGADOR 2'}
                />

                <Stopwatch
                  value={gameState.stopwatchValue}
                  isRunning={gameState.stopwatchRunning}
                  onStop={handleStop}
                  disabled={!gameState.isPlaying || gameState.isPaused || gameState.mode === GameMode.VS_AI}
                  playerId={gameState.mode === GameMode.VS_AI ? 'JUGADOR' : `JUGADOR ${gameState.currentTurn === 'player1' ? '1' : '2'}`}
                  outcome={lastOutcome?.description}
                  outcomeType={lastOutcome?.type as 'goal' | 'penalty' | 'foul' | 'turnover'}
                />

                {gameState.mode === GameMode.VS_PLAYER && (
                  <div className={styles.homeScreen}>
                    <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
                      <PlayerCard
                        playerId="player1"
                        score={gameState.player1Score}
                        fouls={gameState.player1Fouls}
                        attempts={gameState.player1Attempts}
                        isActive={gameState.currentTurn === 'player1'}
                      />
                      <PlayerCard
                        playerId="player2"
                        score={gameState.player2Score}
                        fouls={gameState.player2Fouls}
                        attempts={gameState.player2Attempts}
                        isActive={gameState.currentTurn === 'player2'}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {gameState.screen === GameScreen.PENALTY_RESULT && (
              <motion.div
                key="penalty-result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PenaltyControl
                  rivalPlayerId={(gameState.mode === GameMode.VS_AI ? 'player2' : (gameState.currentTurn === 'player1' ? 'player2' : 'player1')) as 'player1' | 'player2'}
                  rivalPlayerName={gameState.mode === GameMode.VS_AI ? 'IA' : `JUGADOR ${gameState.currentTurn === 'player1' ? '2' : '1'}`}
                  onStop={handlePenaltyStop}
                />
              </motion.div>
            )}

            {gameState.screen === GameScreen.EXTRA_TIME && (
              <motion.div
                key="extra-time"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.extraTime}
              >
                <div className={styles.extraTimeTitle}>⏱️ PRÓRROGA!</div>
                <div style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
                  Empate a {gameState.player1Score} - {gameState.player2Score}
                </div>
                <button
                  className={styles.playButton}
                  onClick={() => {
                    setCountdown(3);
                    let current = 3;
                    const interval = setInterval(() => {
                      current--;
                      if (current <= 0) {
                        clearInterval(interval);
                        setCountdown(0);
                        setTimeout(() => {
                          setCountdown(null);
                          engineRef.current?.startGameplay();
                        }, 500);
                      } else {
                        setCountdown(current);
                      }
                    }, 1000);
                  }}
                >
                  INICIAR PRÓRROGA (30 seg)
                </button>
              </motion.div>
            )}

            {gameState.screen === GameScreen.PENALTIES && (
              <motion.div
                key="penalties"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.penaltyShootout}
              >
                <div className={styles.penaltyHeader}>🥅 TANDA DE PENALES</div>
                <div className={styles.penaltyTurn}>
                  <div className={styles.penaltyTurnLabel}>Ronda</div>
                  <div className={styles.penaltyTurnPlayer}>{gameState.penaltyRound}/5</div>
                </div>

                <div className={styles.penaltyScore}>
                  <div className={styles.penaltyScoreItem}>
                    <div className={styles.penaltyScoreValue}>{gameState.player1PenaltyScore}</div>
                    <div className={styles.penaltyScoreLabel}>JUGADOR 1</div>
                  </div>
                  <div className={styles.penaltyScoreItem}>
                    <div className={styles.penaltyScoreValue}>{gameState.player2PenaltyScore}</div>
                    <div className={styles.penaltyScoreLabel}>{gameState.mode === GameMode.VS_AI ? 'IA' : 'JUGADOR 2'}</div>
                  </div>
                </div>

                <Stopwatch
                  value={gameState.stopwatchValue}
                  isRunning={gameState.stopwatchRunning}
                  onStop={(value) => {
                    const currentPlayer = (gameState.mode === GameMode.VS_AI ? 'player1' : (gameState.currentTurn === 'ai' ? 'player1' : gameState.currentTurn)) as 'player1' | 'player2';
                    engineRef.current?.takePenalty(currentPlayer, value);
                  }}
                  disabled={!gameState.isPlaying || gameState.isPaused}
                  playerId={gameState.mode === GameMode.VS_AI ? 'JUGADOR' : `JUGADOR ${gameState.currentTurn === 'player1' ? '1' : '2'}`}
                />
              </motion.div>
            )}

            {gameState.screen === GameScreen.RESULT && (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ResultSummary
                  winner={getWinner()}
                  player1Score={gameState.player1Score}
                  player2Score={gameState.player2Score}
                  stats={{
                    totalAttempts: gameState.totalAttempts,
                    perfectGoals: gameState.perfectGoals,
                    penaltiesConceded: gameState.penaltiesConceded,
                    foulsConceded: gameState.foulsConceded,
                    bestStop: gameState.bestStop?.stopwatchValue || null
                  }}
                  isNewRecord={gameState.isNewRecord}
                  onRetry={handleRetry}
                  onHome={handleHome}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
