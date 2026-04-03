import { useState } from 'react';
import styles from './PenaltyControl.module.css';

interface PenaltyControlProps {
  rivalPlayerId: 'player1' | 'player2';
  rivalPlayerName: string;
  onStop: (value: number, prediction: 'even' | 'odd') => void;
}

export default function PenaltyControl({
  rivalPlayerName,
  onStop
}: PenaltyControlProps) {
  const [stopwatchValue, setStopwatchValue] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [prediction, setPrediction] = useState<'even' | 'odd' | null>(null);
  const [hasStopped, setHasStopped] = useState(false);
  const [result, setResult] = useState<'goal' | 'miss' | null>(null);

  let interval: NodeJS.Timeout | null = null;

  const startStopwatch = () => {
    if (isRunning || hasStopped) return;

    setIsRunning(true);
    setStopwatchValue(0);

    interval = setInterval(() => {
      setStopwatchValue(prev => (prev + 0.01) % 100);
    }, 10);
  };

  const stopStopwatch = () => {
    if (!isRunning || !interval || hasStopped) return;

    clearInterval(interval);
    interval = null;
    setIsRunning(false);
    setHasStopped(true);
  };

  const handlePrediction = (pred: 'even' | 'odd') => {
    if (!hasStopped) return;

    setPrediction(pred);

    // Verificar si acertó
    const wholeValue = Math.floor(stopwatchValue);
    const actualParity = wholeValue % 2 === 0 ? 'even' : 'odd';

    if (pred === actualParity) {
      setResult('goal');
    } else {
      setResult('miss');
    }

    // Notificar al engine
    onStop(stopwatchValue, pred);
  };

  const formatValue = (val: number): string => {
    return val.toFixed(2).padStart(5, '0');
  };

  return (
    <div className={styles.penaltyControl}>
      <div className={styles.title}>🥅 PENALTY!</div>

      <div className={styles.description}>
        {rivalPlayerName} lanzó el cronómetro y dice:
      </div>

      <div className={styles.stoppedValue}>
        {formatValue(stopwatchValue)}
      </div>

      {!hasStopped ? (
        <button
          className={`${styles.stopwatchButton} ${isRunning ? styles.running : ''}`}
          onClick={isRunning ? stopStopwatch : startStopwatch}
        >
          {isRunning ? '⚽ DETENER' : '🚀 LANZAR CRONÓMETRO'}
        </button>
      ) : (
        <div className={styles.predictions}>
          <div className={styles.predictionLabel}>
            ¿El número es PAR o IMPAR?
          </div>

          <div className={styles.predictionButtons}>
            <button
              className={`${styles.predictionButton} ${styles.even}`}
              onClick={() => handlePrediction('even')}
              disabled={prediction !== null}
            >
              PAR
            </button>

            <button
              className={`${styles.predictionButton} ${styles.odd}`}
              onClick={() => handlePrediction('odd')}
              disabled={prediction !== null}
            >
              IMPAR
            </button>
          </div>

          {result && (
            <div className={`${styles.resultMessage} ${styles[result]}`}>
              {result === 'goal' ? '⚽ ¡GOL!' : '❌ ¡FALTA!'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
