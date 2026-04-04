'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FootballEngine } from '@/lib/futbol/engine';
import {
  GameScreen,
  GameMode,
  MatchDuration,
  AIDifficulty,
  FootballGameState
} from '@/lib/futbol/types';
import { loadSoundEnabled } from '@/lib/futbol/engine';
import styles from './FootballGame.module.css';

type OutcomeType = 'goal' | 'penalty' | 'foul' | 'turnover' | 'penalty_fail' | 'foul_fail' | null;

export default function FootballGame() {
  const router = useRouter();
  const engineRef = useRef<FootballEngine | null>(null);
  const [gameState, setGameState] = useState<FootballGameState>({
    screen: GameScreen.HOME,
    isPlaying: false,
    isPaused: false,
    currentTurn: 'player1',
    matchTime: 120,
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
    mode: GameMode.VS_AI,
    matchDuration: 120,
    aiDifficulty: AIDifficulty.MEDIUM,
    soundEnabled: true,
    lastAIOutcome: null,
    lastPlayerOutcome: null,
  });

  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.VS_AI);
  const [selectedDuration, setSelectedDuration] = useState<MatchDuration>(120);
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>(AIDifficulty.MEDIUM);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Outcome overlay state
  const [outcomeOverlay, setOutcomeOverlay] = useState<{
    type: OutcomeType;
    value: number;
    scorer?: 'player' | 'ai';
    goalContext?: 'penalty' | 'foul';
  }>({ type: null, value: 0, scorer: undefined, goalContext: undefined });

  // Penalty prediction state
  const [penaltyPrediction, setPenaltyPrediction] = useState<'even' | 'odd' | null>(null);

  // Foul retry state
  const [isFoulRetry, setIsFoulRetry] = useState(false);

  // Refs to track previous outcomes for proper comparison
  const lastAIOutcomeRef = useRef<typeof gameState.lastAIOutcome>(null);
  const lastPlayerOutcomeRef = useRef<typeof gameState.lastPlayerOutcome>(null);

  // Outcome overlay display function
  const showOutcome = useCallback((type: OutcomeType, value: number, scorer?: 'player' | 'ai', goalContext?: 'penalty' | 'foul') => {
    setOutcomeOverlay({ type, value, scorer, goalContext });
    // Duration for each outcome type
    const duration = type === 'goal' ? 2500 : type === 'turnover' ? 1000 : (type === 'penalty_fail' || type === 'foul_fail') ? 1500 : 2000;
    setTimeout(() => setOutcomeOverlay({ type: null, value: 0, scorer: undefined, goalContext: undefined }), duration);
  }, []);

  useEffect(() => {
    engineRef.current = new FootballEngine(
      selectedMode,
      selectedDuration,
      selectedDifficulty,
      loadSoundEnabled()
    );

    const unsubscribe = engineRef.current.subscribe((state) => {
      // Check if AI outcome changed and show overlay
      if (state.lastAIOutcome && state.lastAIOutcome !== lastAIOutcomeRef.current) {
        showOutcome(state.lastAIOutcome.outcome, state.lastAIOutcome.value, 'ai', state.lastAIOutcome.goalContext);
        lastAIOutcomeRef.current = state.lastAIOutcome;
      }

      // Check if player outcome changed and show overlay
      if (state.lastPlayerOutcome && state.lastPlayerOutcome !== lastPlayerOutcomeRef.current) {
        showOutcome(state.lastPlayerOutcome.outcome, state.lastPlayerOutcome.value, 'player', state.lastPlayerOutcome.goalContext);
        // Set foul retry flag if outcome is foul
        if (state.lastPlayerOutcome.outcome === 'foul') {
          setIsFoulRetry(true);
        }
        lastPlayerOutcomeRef.current = state.lastPlayerOutcome;
      }

      setGameState({ ...state });
    });

    return () => {
      unsubscribe();
      engineRef.current?.resetGame();
      // Reset refs when cleaning up
      lastAIOutcomeRef.current = null;
      lastPlayerOutcomeRef.current = null;
    };
  }, [selectedMode, selectedDuration, selectedDifficulty, showOutcome]);

  const handleMainButton = useCallback(() => {
    if (!engineRef.current) return;

    if (!gameState.stopwatchRunning) {
      // START — begin stopwatch
      engineRef.current.playerStart();
    } else {
      // STOP — let the engine decide the outcome and notify via state
      if (isFoulRetry) {
        engineRef.current.foulRetryStop();
        setIsFoulRetry(false);
      } else {
        engineRef.current.playerStop();
      }
    }
  }, [gameState.stopwatchRunning, isFoulRetry]);

  const handlePenaltyAction = useCallback(() => {
    if (!engineRef.current) return;

    if (!gameState.stopwatchRunning) {
      // Start penalty stopwatch
      engineRef.current.penaltyStart();
    } else {
      // Must have prediction selected
      if (!penaltyPrediction) return;
      engineRef.current.penaltyStop(penaltyPrediction);
      setPenaltyPrediction(null);
    }
  }, [gameState.stopwatchRunning, penaltyPrediction]);

  const handleStartMatch = useCallback(() => {
    engineRef.current?.setMode(selectedMode);
    engineRef.current?.setDuration(selectedDuration);
    if (selectedMode === GameMode.VS_AI) {
      engineRef.current?.setAIDifficulty(selectedDifficulty);
    }

    // Reset outcome refs when starting a new match
    lastAIOutcomeRef.current = null;
    lastPlayerOutcomeRef.current = null;

    engineRef.current?.startMatch();

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

  const formatStopwatch = (val: number): string => {
    return val.toFixed(2).padStart(5, '0');
  };

  const isPlayerTurn = gameState.mode === GameMode.VS_AI
    ? gameState.currentTurn !== 'ai'
    : true;

  const turnLabel = gameState.mode === GameMode.VS_AI
    ? (gameState.currentTurn === 'ai' ? 'AI TURN' : 'YOUR TURN')
    : `PLAYER ${gameState.currentTurn === 'player1' ? '1' : '2'}`;

  return (
    <div className={styles.gameContainer}>
      {/* ===== OUTCOME OVERLAY ===== */}
      <AnimatePresence>
        {outcomeOverlay.type && (
          <motion.div
            className={`${styles.outcomeOverlay} ${styles[outcomeOverlay.type]}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {outcomeOverlay.type === 'goal' && (
              <>
                {outcomeOverlay.goalContext && outcomeOverlay.scorer === 'player' && (
                  <div className={styles.goalPlayer}>
                    {/* Pixel art player celebrating - 16-bit style, no anti-aliasing */}
                    <svg
                      width="200"
                      height="280"
                      viewBox="0 0 200 280"
                      fill="none"
                      className={styles.pixelPlayerSvg}
                    >
                      {/* Head */}
                      <rect x="75" y="15" width="50" height="50" fill="#FFD93D" />
                      {/* Hair */}
                      <rect x="70" y="10" width="60" height="15" fill="#4A3728" />
                      <rect x="65" y="20" width="10" height="10" fill="#4A3728" />
                      <rect x="125" y="20" width="10" height="10" fill="#4A3728" />
                      {/* Eyes - determined expression */}
                      <rect x="82" y="35" width="12" height="8" fill="#000" />
                      <rect x="106" y="35" width="12" height="8" fill="#000" />
                      {/* Mouth - shouting in celebration */}
                      <rect x="92" y="55" width="16" height="12" fill="#000" />
                      {/* Neck */}
                      <rect x="88" y="65" width="24" height="15" fill="#FFD93D" />
                      {/* Torso - pink neon shirt (player) */}
                      <rect x="55" y="80" width="90" height="80" fill="#FF2D78" />
                      <rect x="45" y="85" width="15" height="70" fill="#FF2D78" />
                      <rect x="140" y="85" width="15" height="70" fill="#FF2D78" />
                      {/* Arms up celebrating */}
                      <rect x="20" y="75" width="35" height="15" fill="#FFD93D" />
                      <rect x="10" y="65" width="15" height="25" fill="#FFD93D" />
                      <rect x="145" y="75" width="35" height="15" fill="#FFD93D" />
                      <rect x="175" y="65" width="15" height="25" fill="#FFD93D" />
                      {/* Hands - fists closed */}
                      <rect x="8" y="55" width="20" height="20" fill="#FFD93D" />
                      <rect x="172" y="55" width="20" height="20" fill="#FFD93D" />
                      {/* Shorts - white */}
                      <rect x="60" y="160" width="80" height="45" fill="#FFF" />
                      <rect x="55" y="165" width="10" height="40" fill="#FFF" />
                      <rect x="135" y="165" width="10" height="40" fill="#FFF" />
                      {/* Legs */}
                      <rect x="60" y="205" width="30" height="60" fill="#FFD93D" />
                      <rect x="110" y="205" width="30" height="60" fill="#FFD93D" />
                      {/* Boots - black */}
                      <rect x="55" y="255" width="40" height="25" fill="#1A1A1A" />
                      <rect x="105" y="255" width="40" height="25" fill="#1A1A1A" />
                    </svg>
                  </div>
                )}
                {!outcomeOverlay.goalContext && (
                  <div className={styles.goalPlayer}>
                    {/* Pixel art player celebrating - 16-bit style, no anti-aliasing */}
                    <svg
                      width="200"
                      height="280"
                      viewBox="0 0 200 280"
                      fill="none"
                      className={styles.pixelPlayerSvg}
                    >
                      {/* Head */}
                      <rect x="75" y="15" width="50" height="50" fill="#FFD93D" />
                      {/* Hair */}
                      <rect x="70" y="10" width="60" height="15" fill="#4A3728" />
                      <rect x="65" y="20" width="10" height="10" fill="#4A3728" />
                      <rect x="125" y="20" width="10" height="10" fill="#4A3728" />
                      {/* Eyes - determined expression */}
                      <rect x="82" y="35" width="12" height="8" fill="#000" />
                      <rect x="106" y="35" width="12" height="8" fill="#000" />
                      {/* Mouth - shouting in celebration */}
                      <rect x="92" y="55" width="16" height="12" fill="#000" />
                      {/* Neck */}
                      <rect x="88" y="65" width="24" height="15" fill="#FFD93D" />
                      {/* Torso - shirt color based on scorer */}
                      {outcomeOverlay.scorer === 'ai' ? (
                        // AI player - blue shirt
                        <>
                          <rect x="55" y="80" width="90" height="80" fill="#4488FF" />
                          <rect x="45" y="85" width="15" height="70" fill="#4488FF" />
                          <rect x="140" y="85" width="15" height="70" fill="#4488FF" />
                        </>
                      ) : (
                        // Player - pink neon shirt
                        <>
                          <rect x="55" y="80" width="90" height="80" fill="#FF2D78" />
                          <rect x="45" y="85" width="15" height="70" fill="#FF2D78" />
                          <rect x="140" y="85" width="15" height="70" fill="#FF2D78" />
                        </>
                      )}
                      {/* Arms up celebrating */}
                      <rect x="20" y="75" width="35" height="15" fill="#FFD93D" />
                      <rect x="10" y="65" width="15" height="25" fill="#FFD93D" />
                      <rect x="145" y="75" width="35" height="15" fill="#FFD93D" />
                      <rect x="175" y="65" width="15" height="25" fill="#FFD93D" />
                      {/* Hands - fists closed */}
                      <rect x="8" y="55" width="20" height="20" fill="#FFD93D" />
                      <rect x="172" y="55" width="20" height="20" fill="#FFD93D" />
                      {/* Shorts - white */}
                      <rect x="60" y="160" width="80" height="45" fill="#FFF" />
                      <rect x="55" y="165" width="10" height="40" fill="#FFF" />
                      <rect x="135" y="165" width="10" height="40" fill="#FFF" />
                      {/* Legs */}
                      <rect x="60" y="205" width="30" height="60" fill="#FFD93D" />
                      <rect x="110" y="205" width="30" height="60" fill="#FFD93D" />
                      {/* Boots - black */}
                      <rect x="55" y="255" width="40" height="25" fill="#1A1A1A" />
                      <rect x="105" y="255" width="40" height="25" fill="#1A1A1A" />
                    </svg>
                  </div>
                )}
                <div className={styles.goalText}>
                  {outcomeOverlay.goalContext === 'penalty' ? 'PENALTY GOAL!' :
                   outcomeOverlay.goalContext === 'foul' ? 'FOUL GOAL!' :
                   outcomeOverlay.scorer === 'ai' ? 'AI GOAL!' : 'GOAL!'}
                </div>
                <div className={styles.goalValue}>{formatStopwatch(outcomeOverlay.value)}</div>
                {/* Confetti particles */}
                <div className={styles.confettiContainer}>
                  <div className={styles.confetti} style={{ left: '10%', animationDelay: '0s' }}></div>
                  <div className={styles.confetti} style={{ left: '20%', animationDelay: '0.2s' }}></div>
                  <div className={styles.confetti} style={{ left: '30%', animationDelay: '0.4s' }}></div>
                  <div className={styles.confetti} style={{ left: '40%', animationDelay: '0.6s' }}></div>
                  <div className={styles.confetti} style={{ left: '50%', animationDelay: '0.1s' }}></div>
                  <div className={styles.confetti} style={{ left: '60%', animationDelay: '0.3s' }}></div>
                  <div className={styles.confetti} style={{ left: '70%', animationDelay: '0.5s' }}></div>
                  <div className={styles.confetti} style={{ left: '80%', animationDelay: '0.7s' }}></div>
                  <div className={styles.confetti} style={{ left: '90%', animationDelay: '0.9s' }}></div>
                </div>
              </>
            )}
            {outcomeOverlay.type === 'penalty' && (
              <>
                <div className={styles.refereePlayer}>
                  {/* Pixel art referee pointing penalty - 16-bit style */}
                  <svg
                    width="200"
                    height="280"
                    viewBox="0 0 200 280"
                    fill="none"
                    className={styles.pixelPlayerSvg}
                  >
                    {/* Head */}
                    <rect x="75" y="15" width="50" height="50" fill="#FFD93D" />
                    {/* Hair */}
                    <rect x="70" y="10" width="60" height="15" fill="#2C2C2C" />
                    <rect x="65" y="20" width="10" height="10" fill="#2C2C2C" />
                    <rect x="125" y="20" width="10" height="10" fill="#2C2C2C" />
                    {/* Eyes - serious expression */}
                    <rect x="82" y="35" width="12" height="8" fill="#000" />
                    <rect x="106" y="35" width="12" height="8" fill="#000" />
                    {/* Mouth - serious line */}
                    <rect x="92" y="55" width="16" height="4" fill="#000" />
                    {/* Neck */}
                    <rect x="88" y="65" width="24" height="15" fill="#FFD93D" />
                    {/* Torso - referee shirt black with white stripes */}
                    <rect x="55" y="80" width="90" height="80" fill="#1A1A1A" />
                    {/* White vertical stripes */}
                    <rect x="85" y="80" width="10" height="80" fill="#FFF" />
                    <rect x="105" y="80" width="10" height="80" fill="#FFF" />
                    {/* Arms */}
                    <rect x="45" y="85" width="15" height="70" fill="#1A1A1A" />
                    <rect x="140" y="85" width="15" height="70" fill="#1A1A1A" />
                    {/* Left arm pointing penalty (up) */}
                    <rect x="30" y="40" width="20" height="50" fill="#FFD93D" />
                    <rect x="25" y="25" width="30" height="20" fill="#FFD93D" />
                    <rect x="20" y="15" width="20" height="15" fill="#FFD93D" />
                    {/* Right arm holding whistle down */}
                    <rect x="145" y="150" width="35" height="15" fill="#FFD93D" />
                    <rect x="170" y="160" width="20" height="15" fill="#FFD93D" />
                    {/* Whistle */}
                    <rect x="175" y="175" width="15" height="15" fill="#888" />
                    <rect x="178" y="190" width="9" height="10" fill="#888" />
                    {/* Shorts - black */}
                    <rect x="60" y="160" width="80" height="45" fill="#1A1A1A" />
                    <rect x="55" y="165" width="10" height="40" fill="#1A1A1A" />
                    <rect x="135" y="165" width="10" height="40" fill="#1A1A1A" />
                    {/* Legs */}
                    <rect x="60" y="205" width="30" height="60" fill="#FFD93D" />
                    <rect x="110" y="205" width="30" height="60" fill="#FFD93D" />
                    {/* Boots - black */}
                    <rect x="55" y="255" width="40" height="25" fill="#1A1A1A" />
                    <rect x="105" y="255" width="40" height="25" fill="#1A1A1A" />
                  </svg>
                </div>
                <div className={styles.penaltyText}>PENALTI</div>
                <div className={styles.penaltySubtext}>{formatStopwatch(outcomeOverlay.value)}</div>
              </>
            )}
            {outcomeOverlay.type === 'foul' && (
              <>
                <div className={styles.refereePlayer}>
                  {/* Pixel art referee showing yellow card - 16-bit style */}
                  <svg
                    width="200"
                    height="280"
                    viewBox="0 0 200 280"
                    fill="none"
                    className={styles.pixelPlayerSvg}
                  >
                    {/* Head */}
                    <rect x="75" y="15" width="50" height="50" fill="#FFD93D" />
                    {/* Hair */}
                    <rect x="70" y="10" width="60" height="15" fill="#2C2C2C" />
                    <rect x="65" y="20" width="10" height="10" fill="#2C2C2C" />
                    <rect x="125" y="20" width="10" height="10" fill="#2C2C2C" />
                    {/* Eyes - stern expression */}
                    <rect x="82" y="35" width="12" height="8" fill="#000" />
                    <rect x="106" y="35" width="12" height="8" fill="#000" />
                    {/* Mouth - firm frown */}
                    <rect x="90" y="55" width="20" height="6" fill="#000" />
                    {/* Neck */}
                    <rect x="88" y="65" width="24" height="15" fill="#FFD93D" />
                    {/* Torso - referee shirt black with white stripes */}
                    <rect x="55" y="80" width="90" height="80" fill="#1A1A1A" />
                    {/* White vertical stripes */}
                    <rect x="85" y="80" width="10" height="80" fill="#FFF" />
                    <rect x="105" y="80" width="10" height="80" fill="#FFF" />
                    {/* Arms */}
                    <rect x="45" y="85" width="15" height="70" fill="#1A1A1A" />
                    <rect x="140" y="85" width="15" height="70" fill="#1A1A1A" />
                    {/* Left arm down */}
                    <rect x="25" y="150" width="25" height="15" fill="#FFD93D" />
                    <rect x="20" y="160" width="15" height="20" fill="#FFD93D" />
                    {/* Right arm up showing yellow card */}
                    <rect x="145" y="60" width="30" height="15" fill="#FFD93D" />
                    <rect x="165" y="45" width="15" height="20" fill="#FFD93D" />
                    {/* Yellow card */}
                    <rect x="158" y="25" width="25" height="25" fill="#FFD700" />
                    <rect x="160" y="27" width="21" height="21" fill="#FFD700" />
                    {/* Card inner detail */}
                    <rect x="162" y="32" width="17" height="3" fill="#FFF" />
                    <rect x="162" y="37" width="12" height="3" fill="#FFF" />
                    {/* Shorts - black */}
                    <rect x="60" y="160" width="80" height="45" fill="#1A1A1A" />
                    <rect x="55" y="165" width="10" height="40" fill="#1A1A1A" />
                    <rect x="135" y="165" width="10" height="40" fill="#1A1A1A" />
                    {/* Legs */}
                    <rect x="60" y="205" width="30" height="60" fill="#FFD93D" />
                    <rect x="110" y="205" width="30" height="60" fill="#FFD93D" />
                    {/* Boots - black */}
                    <rect x="55" y="255" width="40" height="25" fill="#1A1A1A" />
                    <rect x="105" y="255" width="40" height="25" fill="#1A1A1A" />
                  </svg>
                </div>
                <div className={styles.foulText}>FALTA</div>
                <div className={styles.foulSubtext}>Reintenta — ¡Párate en X5!</div>
              </>
            )}
            {outcomeOverlay.type === 'turnover' && (
              <>
                <div className={styles.turnoverText}>TURNOVER</div>
                <div className={styles.turnoverValue}>{formatStopwatch(outcomeOverlay.value)}</div>
              </>
            )}
            {outcomeOverlay.type === 'penalty_fail' && (
              <>
                <div className={styles.failText}>FAIL</div>
                <div className={styles.failValue}>{formatStopwatch(outcomeOverlay.value)}</div>
              </>
            )}
            {outcomeOverlay.type === 'foul_fail' && (
              <>
                <div className={styles.outText}>OUT</div>
                <div className={styles.outValue}>{formatStopwatch(outcomeOverlay.value)}</div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== HEADER ===== */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>FOOTBALL STOP</div>
        <button className={styles.backBtn} onClick={() => router.push('/')}>✕</button>
      </div>

      {/* ===== SCREENS ===== */}
      <div className={styles.content}>
        <AnimatePresence mode="wait">
          {/* HOME */}
          {gameState.screen === GameScreen.HOME && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.homeScreen}>
              <div className={styles.logo}>⚽</div>
              <div className={styles.title}>FOOTBALL STOP</div>
              <div className={styles.tagline}>Stop at 00.00 = GOAL</div>

              <div className={styles.optionGroup}>
                <div className={styles.optionLabel}>MODE</div>
                <div className={styles.optionRow}>
                  <button className={`${styles.optBtn} ${selectedMode === GameMode.VS_AI ? styles.optActive : ''}`}
                    onClick={() => setSelectedMode(GameMode.VS_AI)}>VS AI</button>
                  <button className={`${styles.optBtn} ${selectedMode === GameMode.VS_PLAYER ? styles.optActive : ''}`}
                    onClick={() => setSelectedMode(GameMode.VS_PLAYER)}>1 VS 1</button>
                </div>
              </div>

              {selectedMode === GameMode.VS_AI && (
                <div className={styles.optionGroup}>
                  <div className={styles.optionLabel}>DIFFICULTY</div>
                  <div className={styles.optionRow}>
                    <button className={`${styles.optBtn} ${selectedDifficulty === AIDifficulty.EASY ? styles.optActive : ''}`}
                      onClick={() => setSelectedDifficulty(AIDifficulty.EASY)}>EASY</button>
                    <button className={`${styles.optBtn} ${selectedDifficulty === AIDifficulty.MEDIUM ? styles.optActive : ''}`}
                      onClick={() => setSelectedDifficulty(AIDifficulty.MEDIUM)}>MED</button>
                    <button className={`${styles.optBtn} ${selectedDifficulty === AIDifficulty.HARD ? styles.optActive : ''}`}
                      onClick={() => setSelectedDifficulty(AIDifficulty.HARD)}>HARD</button>
                  </div>
                </div>
              )}

              <div className={styles.optionGroup}>
                <div className={styles.optionLabel}>DURATION</div>
                <div className={styles.optionRow}>
                  <button className={`${styles.optBtn} ${selectedDuration === 60 ? styles.optActive : ''}`}
                    onClick={() => setSelectedDuration(60)}>1 MIN</button>
                  <button className={`${styles.optBtn} ${selectedDuration === 120 ? styles.optActive : ''}`}
                    onClick={() => setSelectedDuration(120)}>2 MIN</button>
                  <button className={`${styles.optBtn} ${selectedDuration === 180 ? styles.optActive : ''}`}
                    onClick={() => setSelectedDuration(180)}>3 MIN</button>
                </div>
              </div>

              <button className={styles.playBtn} onClick={handleStartMatch}>PLAY</button>
            </motion.div>
          )}

          {/* COUNTDOWN */}
          {gameState.screen === GameScreen.COUNTDOWN && countdown !== null && (
            <motion.div key="countdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.countdownScreen}>
              <motion.div
                key={countdown}
                className={styles.countdownNum}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
              >
                {countdown === 0 ? 'GO!' : countdown}
              </motion.div>
            </motion.div>
          )}

          {/* GAME */}
          {gameState.screen === GameScreen.GAME && (
            <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.gameScreen}>
              {/* Scoreboard */}
              <div className={styles.scoreboard}>
                <div className={styles.scoreSide}>
                  <div className={styles.scoreName}>{gameState.mode === GameMode.VS_AI ? 'YOU' : 'P1'}</div>
                  <div className={styles.scoreNum}>{gameState.player1Score}</div>
                </div>
                <div className={styles.scoreTime}>{formatTime(gameState.matchTime)}</div>
                <div className={styles.scoreSide}>
                  <div className={styles.scoreName}>{gameState.mode === GameMode.VS_AI ? 'AI' : 'P2'}</div>
                  <div className={styles.scoreNum}>{gameState.player2Score}</div>
                </div>
              </div>

              {/* AI last action log (VS AI mode) */}
              {gameState.mode === GameMode.VS_AI && gameState.lastAIOutcome && (
                <div className={styles.aiLog}>
                  {gameState.lastAIOutcome.outcome === 'goal' && (
                    <span>AI stopped at {formatStopwatch(gameState.lastAIOutcome.value)} — ⚽ GOAL!</span>
                  )}
                  {gameState.lastAIOutcome.outcome === 'penalty' && (
                    <span>AI stopped at {formatStopwatch(gameState.lastAIOutcome.value)} — 🥅 PENALTY!</span>
                  )}
                  {gameState.lastAIOutcome.outcome === 'foul' && (
                    <span>AI stopped at {formatStopwatch(gameState.lastAIOutcome.value)} — ⚠️ FOUL!</span>
                  )}
                  {gameState.lastAIOutcome.outcome === 'turnover' && (
                    <span>AI stopped at {formatStopwatch(gameState.lastAIOutcome.value)} — 🔄 TURNOVER</span>
                  )}
                </div>
              )}

              {/* Turn indicator */}
              <div className={`${styles.turnIndicator} ${isPlayerTurn ? styles.turnPlayer : styles.turnAI}`}>
                {isFoulRetry ? '⚡ FOUL RETRY' : turnLabel}
              </div>

              {/* Stopwatch display */}
              <div className={`${styles.stopwatch} ${getStopwatchColor(gameState.stopwatchValue)}`}>
                <span className={styles.stopwatchDigits}>{formatStopwatch(gameState.stopwatchValue)}</span>
              </div>

              {/* Main action button */}
              {isPlayerTurn && (
                <button
                  className={`${styles.actionBtn} ${gameState.stopwatchRunning ? styles.actionStop : styles.actionStart}`}
                  onClick={handleMainButton}
                >
                  {isFoulRetry
                    ? (gameState.stopwatchRunning ? 'STOP' : 'RETRY')
                    : (gameState.stopwatchRunning ? 'STOP' : 'START')
                  }
                </button>
              )}

              {!isPlayerTurn && gameState.mode === GameMode.VS_AI && (
                <div className={styles.aiThinking}>AI is playing...</div>
              )}

              {gameState.mode === GameMode.VS_PLAYER && (
                <div className={styles.vsIndicator}>
                  <span className={gameState.currentTurn === 'player1' ? styles.activePlayer : styles.inactivePlayer}>P1</span>
                  <span className={styles.vsDivider}>VS</span>
                  <span className={gameState.currentTurn === 'player2' ? styles.activePlayer : styles.inactivePlayer}>P2</span>
                </div>
              )}
            </motion.div>
          )}

          {/* PENALTY RESULT — rival predicts and plays */}
          {gameState.screen === GameScreen.PENALTY_RESULT && (
            <motion.div key="penalty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.penaltyScreen}>
              <div className={styles.penaltyTitle}>🥅 PENALTY!</div>
              <div className={styles.penaltyInstructions}>
                The rival predicts EVEN or ODD, then launches the stopwatch.
              </div>

              <div className={styles.predictionRow}>
                <button
                  className={`${styles.predBtn} ${penaltyPrediction === 'even' ? styles.predActive : ''}`}
                  onClick={() => setPenaltyPrediction('even')}
                >EVEN</button>
                <button
                  className={`${styles.predBtn} ${penaltyPrediction === 'odd' ? styles.predActive : ''}`}
                  onClick={() => setPenaltyPrediction('odd')}
                >ODD</button>
              </div>

              <div className={`${styles.stopwatch} ${getStopwatchColor(gameState.stopwatchValue)}`}>
                <span className={styles.stopwatchDigits}>{formatStopwatch(gameState.stopwatchValue)}</span>
              </div>

              <button
                className={`${styles.actionBtn} ${gameState.stopwatchRunning ? styles.actionStop : styles.actionStart}`}
                onClick={handlePenaltyAction}
                disabled={!penaltyPrediction && !gameState.stopwatchRunning}
              >
                {!penaltyPrediction && !gameState.stopwatchRunning ? 'PICK PARITY' :
                  gameState.stopwatchRunning ? 'STOP' : 'LAUNCH'}
              </button>
            </motion.div>
          )}

          {/* EXTRA TIME */}
          {gameState.screen === GameScreen.EXTRA_TIME && (
            <motion.div key="extra" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.extraScreen}>
              <div className={styles.extraTitle}>⏱ OVERTIME</div>
              <div className={styles.extraScore}>{gameState.player1Score} — {gameState.player2Score}</div>
              <div className={styles.extraInfo}>30 seconds</div>
              <button className={styles.playBtn} onClick={handleStartMatch}>START OVERTIME</button>
            </motion.div>
          )}

          {/* PENALTY SHOOTOUT */}
          {gameState.screen === GameScreen.PENALTIES && (
            <motion.div key="penalties" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.shootoutScreen}>
              <div className={styles.shootoutTitle}>PENALTY SHOOTOUT</div>
              <div className={styles.shootoutRound}>Round {gameState.penaltyRound}/5</div>
              <div className={styles.shootoutScore}>
                <div className={styles.shootoutSide}>
                  <div className={styles.shootoutNum}>{gameState.player1PenaltyScore}</div>
                  <div className={styles.shootoutLabel}>YOU</div>
                </div>
                <div className={styles.shootoutDivider}>—</div>
                <div className={styles.shootoutSide}>
                  <div className={styles.shootoutNum}>{gameState.player2PenaltyScore}</div>
                  <div className={styles.shootoutLabel}>AI</div>
                </div>
              </div>
              <div className={`${styles.stopwatch} ${getStopwatchColor(gameState.stopwatchValue)}`}>
                <span className={styles.stopwatchDigits}>{formatStopwatch(gameState.stopwatchValue)}</span>
              </div>
              <button
                className={`${styles.actionBtn} ${gameState.stopwatchRunning ? styles.actionStop : styles.actionStart}`}
                onClick={() => {
                  if (!gameState.stopwatchRunning) {
                    engineRef.current?.playerStart();
                  } else {
                    engineRef.current?.takePenalty('player1', gameState.stopwatchValue);
                  }
                }}
              >
                {gameState.stopwatchRunning ? 'STOP' : 'START'}
              </button>
            </motion.div>
          )}

          {/* RESULT */}
          {gameState.screen === GameScreen.RESULT && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.resultScreen}>
              <div className={styles.resultOutcome}>
                {gameState.player1Score > gameState.player2Score ? '🏆 YOU WIN!' :
                  gameState.player1Score < gameState.player2Score ? 'DEFEAT' : 'DRAW'}
              </div>
              <div className={styles.resultScore}>
                {gameState.player1Score} — {gameState.player2Score}
              </div>
              {gameState.isNewRecord && <div className={styles.newRecord}>🏆 NEW RECORD!</div>}
              <div className={styles.resultActions}>
                <button className={styles.playBtn} onClick={() => { engineRef.current?.resetGame(); handleStartMatch(); }}>PLAY AGAIN</button>
                <button className={styles.secondaryBtn} onClick={() => { engineRef.current?.resetGame(); router.push('/'); }}>HOME</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getStopwatchColor(value: number): string {
  if (value === 0) return styles.swGreen;
  if (value <= 2) return styles.swYellow;
  if (value <= 5) return styles.swOrange;
  return styles.swRed;
}
