"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameEngine, PHASES, CHALLENGES, loadHighScore, loadSoundEnabled } from "@/lib/game/engine";
import Target from "@/components/game/Target";
import { Particle, FloatingScore, Ripple, Target as TargetType } from "@/lib/game/types";
import { playSound, vibrate } from "@/lib/game/audio";
import { useRouter } from "next/navigation";

interface GameBoardProps {
  mode: 'classic' | 'normal';
}

export default function GameBoard({ mode }: GameBoardProps) {
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const movementIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const decoyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevPhaseRef = useRef<number>(0);
  const screenRef = useRef<string>('countdown');
  const isTransitioningRef = useRef<boolean>(false);

  const [screen, setScreen] = useState<'game' | 'result' | 'victory' | 'gameover' | 'countdown'>('countdown');
  const [targets, setTargets] = useState<Array<{ id: string; x: number; y: number; type: 'normal' | 'golden' | 'decoy'; size: number }>>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [shake, setShake] = useState(false);
  const [comboDisplay, setComboDisplay] = useState(0);
  const [phaseIndicator, setPhaseIndicator] = useState('');
  const [showPhaseIndicator, setShowPhaseIndicator] = useState(false);
  const [flashColor, setFlashColor] = useState('');
  const [showFlash, setShowFlash] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownTitle, setCountdownTitle] = useState('');

  const [gameState, setGameState] = useState(() => ({
    score: 0,
    highScore: loadHighScore(),
    timeLeft: mode === 'classic' ? 60 : 30,
    combo: 0,
    multiplier: 1,
    soundEnabled: loadSoundEnabled(),
    currentChallenge: 0,
    currentChallengeScoreRequired: 500,
    survivalTime: 0,
    totalAccuracySum: 0,
    maxComboSum: 0,
    maxStreakMax: 0,
    challengesCompleted: 0
  }));

  const [resultStats, setResultStats] = useState({
    score: 0,
    accuracy: 0,
    maxCombo: 1,
    maxStreak: 0,
    isNewRecord: false,
    delta: 0
  });

  const router = useRouter();

  useEffect(() => {
    engineRef.current = new GameEngine(mode, loadHighScore(), loadSoundEnabled());

    const unsubscribe = engineRef.current.subscribe((state) => {
      setGameState({
        score: state.score,
        highScore: state.highScore,
        timeLeft: state.timeLeft,
        combo: state.combo,
        multiplier: state.multiplier,
        soundEnabled: state.soundEnabled,
        currentChallenge: state.currentChallenge,
        currentChallengeScoreRequired: state.currentChallengeScoreRequired,
        survivalTime: state.survivalTime,
        totalAccuracySum: state.totalAccuracySum,
        maxComboSum: state.maxComboSum,
        maxStreakMax: state.maxStreakMax,
        challengesCompleted: state.challengesCompleted
      });
      // Solo actualizar targets si estamos en pantalla de juego y NO en transición
      if (screenRef.current === 'game' && !isTransitioningRef.current) {
        setTargets(engineRef.current!.getTargets());
      }
    });

    return () => {
      unsubscribe();
      cleanup();
      // Limpiar también el intervalo del countdown al desmontar
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [mode]);

  // Sincronizar screenRef con screen
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  const cleanup = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (movementIntervalRef.current) clearInterval(movementIntervalRef.current);
    if (decoyIntervalRef.current) clearInterval(decoyIntervalRef.current);
    // NOTA: countdownIntervalRef se maneja separadamente en showCountdown()
    gameLoopRef.current = null;
    movementIntervalRef.current = null;
    decoyIntervalRef.current = null;
    // countdownIntervalRef NO se limpia aquí, se maneja en showCountdown()
  };

  const createExplosion = (x: number, y: number, color: string, count: number = 12) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const distance = Math.random() * 60 + 40;
      newParticles.push({
        id: `particle-${Date.now()}-${i}`,
        x,
        y,
        color,
        size: Math.random() * 8 + 4,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 600);
  };

  const showFloatingScore = (x: number, y: number, score: number, isGolden: boolean, isDecoy: boolean = false) => {
    const newScore: FloatingScore = {
      id: `float-${Date.now()}`,
      x,
      y,
      score,
      isGolden,
      isDecoy
    };
    setFloatingScores(prev => [...prev, newScore]);
    setTimeout(() => {
      setFloatingScores(prev => prev.filter(fs => fs.id !== newScore.id));
    }, 800);
  };

  const createRipple = (x: number, y: number, color: string) => {
    const newRipple: Ripple = {
      id: `ripple-${Date.now()}`,
      x: x - 30,
      y: y - 30,
      color
    };
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 500);
  };

  const handleTargetClick = useCallback((targetId: string, e: React.MouseEvent) => {
    if (!engineRef.current || !gameAreaRef.current) return;

    const clientX = e.clientX;
    const clientY = e.clientY;

    // Guardar referencia al target ANTES de eliminarlo
    const target = engineRef.current.getTargets().find(t => t.id === targetId);
    const result = engineRef.current.clickTarget(targetId, clientX, clientY);

    if (result.success && target) {
      const isGolden = target.type === 'golden';
      const isDecoy = target.type === 'decoy';
      const color = isGolden ? '#FFD700' : (isDecoy ? '#10B981' : '#00D4FF');

      createExplosion(clientX, clientY, color, isGolden ? 20 : 12);
      showFloatingScore(clientX, clientY, result.points, isGolden, isDecoy);
      createRipple(clientX, clientY, color);

      if (isGolden || target.type === 'decoy') {
        setShake(true);
        setTimeout(() => setShake(false), 300);
      }

      playSound(isGolden ? 'golden' : (target.type === 'decoy' ? 'error' : 'hit'), gameState.soundEnabled);
      vibrate(target.type === 'decoy' ? [100, 50, 100] : 50);

      if (gameState.combo % 5 === 0 && gameState.multiplier > 1) {
        setComboDisplay(gameState.multiplier);
        playSound('combo', gameState.soundEnabled);
        vibrate([100, 50, 100]);
      } else if (target.type !== 'decoy') {
        vibrate(50);
      }

      if (isGolden) {
        setShowFlash(true);
        setFlashColor('#FFD700');
        setTimeout(() => setShowFlash(false), 200);
      } else if (target.type === 'decoy') {
        setShowFlash(true);
        setFlashColor('#10B981');
        setTimeout(() => setShowFlash(false), 200);
      }

      // Respawn new target when shouldSpawnMore is true
      if (result.shouldSpawnMore && gameAreaRef.current) {
        const gameArea = gameAreaRef.current;

        // Spawn new normal target
        setTimeout(() => {
          engineRef.current?.spawnTarget(gameArea.offsetWidth, gameArea.offsetHeight, false);
        }, 300);

        // Spawn golden target with probability in normal mode
        const phaseConfig = engineRef.current?.getPhaseConfig();
        const hasGolden = phaseConfig && 'golden' in phaseConfig && phaseConfig.golden;
        if (mode === 'normal' && hasGolden && Math.random() < 0.25) {
          setTimeout(() => {
            engineRef.current?.spawnTarget(gameArea.offsetWidth, gameArea.offsetHeight, true);
          }, 500);
        }
      }
    }
  }, [gameState.soundEnabled, gameState.combo, gameState.multiplier, mode]);

  const handleChallengeComplete = (nextChallenge: number) => {
    playSound('challenge-success', gameState.soundEnabled);
    setTimeout(() => {
      if (nextChallenge < CHALLENGES.length) {
        showCountdown(nextChallenge);
      } else {
        handleVictory();
      }
    }, 2000);
  };

  const handleVictory = () => {
    playSound('newrecord', gameState.soundEnabled);
    setScreen('victory');
  };

  const handleGameOver = () => {
    playSound('gameover', gameState.soundEnabled);
    setScreen('gameover');
  };

  const handleGameEnd = () => {
    if (!engineRef.current) return;

    const isNewRecord = engineRef.current.saveHighScore();
    const stats = engineRef.current.getStats();

    setResultStats({
      score: gameState.score,
      accuracy: stats.accuracy,
      maxCombo: stats.maxCombo,
      maxStreak: stats.maxStreak,
      isNewRecord,
      delta: gameState.score - (isNewRecord ? 0 : gameState.highScore)
    });

    playSound('gameover', gameState.soundEnabled);
    setScreen('result');
  };

  const showCountdown = (challengeIndex: number) => {
    // Limpiar intervalo del countdown anterior primero
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Limpiar otros intervalos pero NO el del countdown que acabamos de limpiar
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    if (movementIntervalRef.current) {
      clearInterval(movementIntervalRef.current);
      movementIntervalRef.current = null;
    }
    if (decoyIntervalRef.current) {
      clearInterval(decoyIntervalRef.current);
      decoyIntervalRef.current = null;
    }

    engineRef.current?.clearTargets();
    setTargets([]);
    setParticles([]);
    setFloatingScores([]);
    setRipples([]);

    const challenge = CHALLENGES[challengeIndex];
    setCountdownTitle(challenge.name);
    setCountdown(3);
    setScreen('countdown');

    // Crear nuevo intervalo del countdown
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null) return null;
        if (prev > 1) {
          playSound('hit', gameState.soundEnabled);
          return prev - 1;
        } else if (prev === 1) {
          playSound('golden', gameState.soundEnabled);
          return 0;
        } else {
          clearInterval(countdownIntervalRef.current!);
          countdownIntervalRef.current = null;
          // Delay para que se vea el "GO" antes de empezar
          setTimeout(() => {
            startChallenge(challengeIndex);
          }, 500);
          return null;
        }
      });
    }, 1000);
  };

  const startChallenge = (challengeIndex: number) => {
    if (!engineRef.current) return;

    // Desbloquear actualizaciones del subscribe
    isTransitioningRef.current = false;

    // Limpiar targets del engine (la UI ya se limpió en showCountdown)
    engineRef.current.clearTargets();

    engineRef.current.startChallenge(challengeIndex);
    setScreen('game');

    // Pequeño delay para que el DOM se actualice
    setTimeout(() => {
      startGameLoop();
      setupMovementAndDecoys();
      spawnInitialTargets();
    }, 50);
  };

  const spawnInitialTargets = () => {
    if (!engineRef.current || !gameAreaRef.current) return;

    const phaseConfig = engineRef.current.getPhaseConfig();
    const gameArea = gameAreaRef.current;

    engineRef.current.spawnTarget(gameArea.offsetWidth, gameArea.offsetHeight, false);

    // Only spawn golden targets in 'normal' mode (Challenge mode)
    if (mode === 'normal' && 'golden' in phaseConfig! && phaseConfig?.golden && Math.random() < 0.25) {
      setTimeout(() => {
        engineRef.current?.spawnTarget(gameArea.offsetWidth, gameArea.offsetHeight, true);
      }, 400);
    }

    // NEVER spawn decoys in classic mode
    if (mode === 'normal' && phaseConfig?.decoys && phaseConfig.decoys > 0) {
      for (let i = 0; i < phaseConfig.decoys; i++) {
        engineRef.current.spawnDecoy(gameArea.offsetWidth, gameArea.offsetHeight);
      }
    }
  };

  const startGameLoop = () => {
    cleanup();

    gameLoopRef.current = setInterval(() => {
      if (!engineRef.current) return;

      const result = engineRef.current.tick();

      if (result.gameEnded) {
        handleGameEnd();
        return;
      }

      if (result.challengeEnded) {
        // Bloquear actualizaciones del subscribe durante la transición
        isTransitioningRef.current = true;
        
        // Limpiar TODO inmediatamente cuando termina el challenge
        cleanup();
        engineRef.current?.clearTargets();
        setTargets([]);
        setParticles([]);
        setFloatingScores([]);
        setRipples([]);
        
        // Obtener estado actualizado del engine, no de React
        const engineState = engineRef.current.getState();
        
        if (result.victory) {
          if (engineState.challengesCompleted >= CHALLENGES.length) {
            handleVictory();
          } else {
            // CORRECCIÓN: Usar currentChallenge + 1 como índice del siguiente challenge
            handleChallengeComplete(engineState.currentChallenge + 1);
          }
        } else if (result.gameOver) {
          handleGameOver();
        }
        return;
      }

      // Handle phase change in classic mode
      const engineState = engineRef.current.getState();
      if (mode === 'classic' && engineState.currentPhase !== prevPhaseRef.current) {
        // Bloquear actualizaciones durante la transición
        isTransitioningRef.current = true;
        
        // Limpiar targets de la fase anterior
        engineRef.current?.clearTargets();
        setTargets([]);
        
        const phaseIndex = engineState.currentPhase;
        const phase = PHASES[phaseIndex];
        setPhaseIndicator(phase.name);
        setShowPhaseIndicator(true);
        setTimeout(() => setShowPhaseIndicator(false), 2000);
        
        // Desbloquear y spawnear nuevos targets
        isTransitioningRef.current = false;
        setupMovementAndDecoys();
        if (gameAreaRef.current) {
          engineRef.current?.spawnTarget(gameAreaRef.current.offsetWidth, gameAreaRef.current.offsetHeight, false);
        }
        
        prevPhaseRef.current = engineState.currentPhase;
      }
    }, 1000);
  };

  const setupMovementAndDecoys = () => {
    if (!engineRef.current || !gameAreaRef.current) return;

    const phaseConfig = engineRef.current.getPhaseConfig();
    const gameArea = gameAreaRef.current;

    if (movementIntervalRef.current) clearInterval(movementIntervalRef.current);
    if (decoyIntervalRef.current) clearInterval(decoyIntervalRef.current);

    if (phaseConfig?.targetMovement && phaseConfig.movementInterval) {
      // Primer movimiento inmediato después de un breve delay para que aparezcan los targets
      setTimeout(() => {
        moveTargets(gameArea.offsetWidth, gameArea.offsetHeight);
      }, 500);

      // Luego el intervalo regular
      movementIntervalRef.current = setInterval(() => {
        moveTargets(gameArea.offsetWidth, gameArea.offsetHeight);
      }, phaseConfig.movementInterval);
    }

    // NEVER setup decoys in classic mode
    if (mode === 'normal' && phaseConfig?.decoys && phaseConfig.decoys > 0) {
      decoyIntervalRef.current = setInterval(() => {
        toggleDecoys();
      }, 2000);
    }
  };

  const moveTargets = useCallback((gameWidth: number, gameHeight: number) => {
    if (!engineRef.current) return;
    
    // Mover targets directamente en el engine
    engineRef.current.moveAllTargets(gameWidth, gameHeight);
    
    // Actualizar estado React con las nuevas posiciones
    setTargets(engineRef.current.getTargets());
  }, []);

  const toggleDecoys = () => {
    setTargets(prev => prev.map((t: TargetType) => 
      t.type === 'decoy' ? { ...t, opacity: (t.opacity ?? 1) === 0 ? 1 : 0 } : t
    ));
  };

  const startGame = () => {
    if (mode === 'normal') {
      showCountdown(0);
    } else {
      engineRef.current?.startGame();
      setScreen('game');
      setTimeout(() => {
        startGameLoop();
        setupMovementAndDecoys();
        spawnInitialTargets();
      }, 100);
    }
  };

  // Auto-start game on mount (skip redundant home screen)
  useEffect(() => {
    startGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goHome = () => {
    cleanup();
    engineRef.current?.resetGame();
    router.push('/');
  };

  const renderGameScreen = () => (
    <div className="relative w-full h-full">
      {/* Flash overlay */}
      {showFlash && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-200"
          style={{ backgroundColor: `${flashColor}25` }}
        />
      )}

      {/* Phase indicator */}
      {showPhaseIndicator && (
        <div className="absolute top-[140px] left-1/2 transform -translate-x-1/2 text-pink-500 font-bold text-sm uppercase tracking-widest z-20 animate-bounce"
             style={{ textShadow: '0 0 15px rgba(255, 20, 147, 0.8), 0 0 30px rgba(255, 20, 147, 0.4)' }}>
          {phaseIndicator}
        </div>
      )}

      {/* Game area */}
      <div
        ref={gameAreaRef}
        className={`absolute inset-0 ${shake ? 'animate-shake' : ''}`}
        onClick={(e) => {
          if (e.target === gameAreaRef.current) {
            engineRef.current?.recordMiss();
          }
        }}
      >
        <AnimatePresence>
          {targets.map(target => (
            <Target
              key={target.id}
              target={target}
              onClick={(e) => handleTargetClick(target.id, e)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Particles */}
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color
          }}
          animate={{
            x: particle.tx,
            y: particle.ty,
            scale: 0,
            opacity: 0
          }}
          transition={{ duration: 0.6 }}
        />
      ))}

      {/* Floating scores */}
      {floatingScores.map(fs => (
        <motion.div
          key={fs.id}
          className="absolute font-bold pointer-events-none text-lg"
          style={{
            left: fs.x,
            top: fs.y,
            color: fs.isDecoy ? '#FF4444' : (fs.isGolden ? '#FFD700' : '#00D4FF'),
            textShadow: fs.isDecoy ? '0 0 15px rgba(255, 68, 68, 0.8)' : (fs.isGolden ? '0 0 20px rgba(255, 215, 0, 0.8)' : '0 0 10px rgba(0, 212, 255, 0.6)'),
            fontSize: fs.isGolden ? '28px' : '20px'
          }}
          animate={{
            y: -60,
            scale: 0.8,
            opacity: 0
          }}
          initial={{ scale: 1.2, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {fs.score > 0 ? '+' : ''}{fs.score}
        </motion.div>
      ))}

      {/* Ripples */}
      {ripples.map(ripple => (
        <motion.div
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 60,
            height: 60,
            border: `3px solid ${ripple.color}`
          }}
          animate={{
            scale: 3,
            opacity: 0
          }}
          transition={{ duration: 0.5 }}
        />
      ))}

      {/* Combo display */}
      {comboDisplay > 0 && (
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-bold text-yellow-400 pointer-events-none z-30"
          style={{ textShadow: '0 0 30px rgba(255, 215, 0, 0.8)' }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1.3, opacity: 1 }}
          exit={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.6 }}
          onAnimationComplete={() => setComboDisplay(0)}
        >
          x{comboDisplay}
        </motion.div>
      )}
    </div>
  );

  const renderResultScreen = () => (
    <div className="flex flex-col items-center justify-center h-full p-4 overflow-y-auto text-center">
      <h2 className="text-4xl font-bold mb-4">⏰ Time!</h2>
      <div className="text-7xl font-bold text-cyan-400 mb-4">{resultStats.score}</div>

      <p className="text-xl mb-6 text-center">
        {resultStats.isNewRecord
          ? '🎉 ¡NUEVO RÉCORD PERSONAL! 🎉'
          : resultStats.delta === 0
            ? '¡Igualaste tu récord!'
            : `Te faltaron ${Math.abs(resultStats.delta)} pts para tu récord`
        }
      </p>

      <div className="w-full max-w-md bg-cyan-900/20 rounded-lg p-4 border border-cyan-500/30 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-cyan-300">Personal Best</span>
          <span className="text-2xl font-bold text-yellow-400">{gameState.highScore}</span>
        </div>
        <div className={`text-center font-bold p-2 rounded ${
          resultStats.isNewRecord
            ? 'bg-green-500/20 text-green-400'
            : resultStats.delta === 0
              ? 'bg-gray-500/20 text-gray-300'
              : 'bg-red-500/20 text-red-400'
        }`}>
          {resultStats.isNewRecord
            ? `🎉 +${resultStats.delta} pts (NUEVO RÉCORD)`
            : resultStats.delta === 0
              ? '⚪ Igualaste tu récord'
              : `Te faltaron ${Math.abs(resultStats.delta)} pts`
          }
        </div>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap justify-center">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10 min-w-[100px] text-center">
          <div className="text-2xl mb-2">🎯</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Accuracy</div>
          <div className="text-xl font-bold text-cyan-400">{resultStats.accuracy}%</div>
          <div className="w-full h-1 bg-white/10 rounded mt-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded" style={{ width: `${resultStats.accuracy}%` }} />
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10 min-w-[100px] text-center">
          <div className="text-2xl mb-2">⚡</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Max Combo</div>
          <div className="text-xl font-bold text-cyan-400">x{resultStats.maxCombo}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10 min-w-[100px] text-center">
          <div className="text-2xl mb-2">🔥</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Mejor Racha</div>
          <div className="text-xl font-bold text-cyan-400">{resultStats.maxStreak} hits</div>
        </div>
      </div>

      <button
        className="bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold py-4 px-16 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-xl border-2 border-white/30"
        onClick={startGame}
      >
        RETRY
      </button>
      <button
        className="mt-4 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-12 rounded-lg transition-colors"
        onClick={goHome}
      >
        INICIO
      </button>
    </div>
  );

  const renderVictoryScreen = () => {
    const avgAccuracy = Math.round(gameState.totalAccuracySum / CHALLENGES.length);
    const avgMaxCombo = (gameState.maxComboSum / CHALLENGES.length).toFixed(1);

    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <h1 className="text-5xl font-bold mb-2 text-yellow-400">🏆 ¡VICTORIA!</h1>
        <p className="text-lg text-yellow-400 mb-4">You completed all 5 challenges</p>
        <div className="text-5xl font-bold text-yellow-400 mb-8">¡COMPLETADO!</div>

        <div className="flex gap-4 mb-8 flex-wrap justify-center">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 min-w-[100px] text-center">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Accuracy</div>
            <div className="text-xl font-bold text-cyan-400">{avgAccuracy}%</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 min-w-[100px] text-center">
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Max Combo</div>
            <div className="text-xl font-bold text-cyan-400">x{avgMaxCombo}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 min-w-[100px] text-center">
            <div className="text-2xl mb-2">🔥</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Mejor Racha</div>
            <div className="text-xl font-bold text-cyan-400">{gameState.maxStreakMax}</div>
          </div>
        </div>

        <button
          className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold py-3 px-12 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          onClick={goHome}
        >
          INICIO
        </button>
      </div>
    );
  };

  const renderGameOverScreen = () => (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <h1 className="text-7xl font-black text-red-500 mb-4 animate-pulse" style={{ textShadow: '0 0 30px rgba(244, 67, 54, 0.8)' }}>
        GAME OVER
      </h1>
      <p className="text-2xl mb-2">No completaste el reto</p>
      <p className="text-xl text-gray-400 mb-8">
        Score: {gameState.score} / {gameState.currentChallengeScoreRequired}
      </p>

      <div className="flex gap-4 justify-center w-full">
        <button
          className="bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          onClick={startGame}
        >
          RETRY
        </button>
        <button
          className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-lg transition-colors"
          onClick={goHome}
        >
          INICIO
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style jsx global>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        .animate-shake {
          animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>

      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#1A1A2E] via-[#0D0D1A] to-[#0D0D1A] min-h-screen relative overflow-hidden">
        <div className={`relative w-full max-w-[420px] h-[calc(100vh-2rem)] overflow-hidden rounded-lg shadow-2xl bg-gradient-to-b from-zinc-900/50 to-black/50 border border-zinc-800 ${
          mode === 'classic' 
            ? 'max-h-[80vh] md:max-h-[700px]'
            : 'max-h-[95vh] md:h-[85vh] md:max-h-[850px]'
        }`}>
          {/* Header */}
          {(screen === 'game' || screen === 'countdown') && (
            <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex gap-5">
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Time</div>
                  <div className={`text-2xl font-bold ${gameState.timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {mode === 'normal' && gameState.survivalTime > 0 ? gameState.survivalTime : gameState.timeLeft}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Score</div>
                  <div className="text-2xl font-bold text-white">{gameState.score}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Combo</div>
                  <div className="text-2xl font-bold text-yellow-400">x{gameState.multiplier}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">High Score</div>
                  <div className="text-2xl font-bold text-white">{gameState.highScore}</div>
                </div>
                <button
                  className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded-full text-sm transition-colors"
                  onClick={() => {
                    const newState = !gameState.soundEnabled;
                    engineRef.current?.toggleSound(newState);
                  }}
                >
                  {gameState.soundEnabled ? '🔊' : '🔇'}
                </button>
              </div>
            </div>
          )}

          {/* Challenge progress bar (Normal mode) */}
          {mode === 'normal' && (screen === 'game' || screen === 'countdown') && (
            <div className="absolute top-[110px] left-1/2 transform -translate-x-1/2 w-[60%] h-[25px] bg-white/10 rounded-full overflow-hidden border-2 border-white/20 z-5">
              <div
                className={`h-full transition-all duration-300 ${
                  gameState.survivalTime > 0
                    ? // Survival mode - score decrements
                      gameState.score >= 70
                        ? 'bg-gradient-to-r from-green-400 to-green-600'
                        : gameState.score >= 40
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                          : 'bg-gradient-to-r from-red-400 to-red-600'
                    : // Normal challenges
                      gameState.score >= gameState.currentChallengeScoreRequired * 0.8
                        ? 'bg-gradient-to-r from-green-400 to-green-600'
                        : gameState.score >= gameState.currentChallengeScoreRequired * 0.5
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                          : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                }`}
                style={{ 
                  width: `${
                    gameState.survivalTime > 0
                      ? Math.min(gameState.score, 100) // Survival: 0-100%
                      : Math.min((gameState.score / gameState.currentChallengeScoreRequired) * 100, 100)
                  }%` 
                }}
              />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-white whitespace-nowrap" style={{ textShadow: '0 0 5px rgba(0,0,0,0.8)' }}>
                {gameState.survivalTime > 0 
                  ? `${gameState.score} (Survival: ${gameState.survivalTime}s)` 
                  : `${gameState.score} / ${gameState.currentChallengeScoreRequired}`
                }
              </div>
            </div>
          )}

          {/* Content */}
          <div className="absolute inset-0">
            {(screen === 'game' || screen === 'countdown') && renderGameScreen()}
            {screen === 'result' && renderResultScreen()}
            {screen === 'victory' && renderVictoryScreen()}
            {screen === 'gameover' && renderGameOverScreen()}
          </div>

          {/* Countdown overlay */}
          {screen === 'countdown' && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
              <h2 className="text-4xl font-bold text-pink-500 mb-8" style={{ textShadow: '0 0 20px rgba(255, 20, 147, 0.8)' }}>
                {countdownTitle}
              </h2>
              <div className={`text-9xl font-black ${countdown === 0 ? 'text-white' : 'text-white animate-pulse'}`} style={{ textShadow: '0 0 40px rgba(255, 255, 255, 0.8)' }}>
                {countdown === 0 ? 'GO' : countdown}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
