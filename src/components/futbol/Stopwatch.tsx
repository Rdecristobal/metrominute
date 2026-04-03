import { motion } from 'framer-motion';
import styles from './Stopwatch.module.css';

interface StopwatchProps {
  value: number;
  isRunning: boolean;
  onStop: (value: number) => void;
  disabled?: boolean;
  playerId?: string;
  outcome?: string;
  outcomeType?: 'goal' | 'penalty' | 'foul' | 'turnover';
}

export default function Stopwatch({
  value,
  isRunning,
  onStop,
  disabled = false,
  playerId,
  outcome,
  outcomeType
}: StopwatchProps) {
  const formatValue = (val: number): string => {
    return val.toFixed(2).padStart(5, '0');
  };

  const getColorClass = (val: number): string => {
    if (val <= 4.99) return styles.green;
    if (val <= 9.99) return styles.yellow;
    return styles.red;
  };

  const handleStop = () => {
    if (!disabled && isRunning) {
      onStop(value);
    }
  };

  return (
    <div className={styles.stopwatchContainer}>
      {playerId && (
        <div className={styles.playerLabel}>
          ⚽ TURNO DE {playerId}
        </div>
      )}

      <motion.div
        className={`${styles.stopwatchDisplay} ${getColorClass(value)}`}
        animate={{
          scale: isRunning ? [1, 1.02, 1] : 1,
        }}
        transition={{
          duration: 0.5,
          repeat: isRunning ? Infinity : 0,
        }}
      >
        {formatValue(value)}
      </motion.div>

      <button
        className={`${styles.stopButton} ${isRunning ? styles.running : ''}`}
        onClick={handleStop}
        disabled={disabled || !isRunning}
      >
        {isRunning ? '⚽ DETENER' : '⏳ ESPERANDO'}
      </button>

      {outcome && outcomeType && (
        <motion.div
          className={`${styles.outcomeMessage} ${styles[outcomeType]}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {outcome}
        </motion.div>
      )}
    </div>
  );
}
