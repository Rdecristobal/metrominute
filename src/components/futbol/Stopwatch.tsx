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
  isPlayerTurn?: boolean;
  stopwatchStarted?: boolean;
}

export default function Stopwatch({
  value,
  isRunning,
  onStop,
  disabled = false,
  playerId,
  outcome,
  outcomeType,
  isPlayerTurn = true,
  stopwatchStarted = false
}: StopwatchProps) {
  const formatValue = (val: number): string => {
    return val.toFixed(2).padStart(5, '0');
  };

  const getColorClass = (val: number): string => {
    if (val <= 4.99) return styles.green;
    if (val <= 9.99) return styles.yellow;
    return styles.red;
  };

  const handleAction = () => {
    if (disabled || !isPlayerTurn) return;

    // Call onStop which will be handled by parent to toggle START/STOP
    onStop(value);
  };

  // Determine if button should show START or STOP
  // If stopwatch is running but not yet "started" by player, show START
  // Otherwise show STOP when running
  const showStopButton = isRunning && stopwatchStarted;

  return (
    <div className={styles.stopwatchContainer}>
      {playerId && (
        <div className={styles.playerLabel}>
          {playerId}&apos;S TURN
        </div>
      )}

      <motion.div
        className={`${styles.stopwatchDisplay} ${getColorClass(value)}`}
        animate={{
          scale: stopwatchStarted ? [1, 1.01, 1] : 1,
        }}
        transition={{
          duration: 0.5,
          repeat: stopwatchStarted ? Infinity : 0,
        }}
      >
        {formatValue(value)}
      </motion.div>

      <button
        className={`${styles.stopButton} ${showStopButton ? styles.running : ''}`}
        onClick={handleAction}
        disabled={disabled || !isPlayerTurn}
      >
        {showStopButton ? 'STOP' : 'START'}
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
