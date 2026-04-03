import { Attempt } from '@/lib/futbol/types';
import styles from './PlayerCard.module.css';

interface PlayerCardProps {
  playerId: 'player1' | 'player2';
  score: number;
  fouls: number;
  attempts: Attempt[];
  isActive?: boolean;
  name?: string;
}

export default function PlayerCard({
  playerId,
  score,
  fouls,
  attempts,
  isActive = false,
  name = `JUGADOR ${playerId === 'player1' ? '1' : '2'}`
}: PlayerCardProps) {
  const perfectGoals = attempts.filter(a => a.outcome === 'goal').length;
  const bestStop = attempts.length > 0
    ? attempts.reduce((best, current) =>
        Math.abs(current.stopwatchValue) < Math.abs(best.stopwatchValue) ? current : best
      ).stopwatchValue.toFixed(2)
    : '--';

  const averageAccuracy = attempts.length > 0
    ? Math.round((perfectGoals / attempts.length) * 100)
    : 0;

  return (
    <div className={`${styles.playerCard} ${isActive ? styles.active : ''}`}>
      <div className={styles.playerCardHeader}>
        <div className={styles.playerName}>{name}</div>
        <div className={styles.playerScore}>{score}</div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>⚽ GOALS</div>
          <div className={`${styles.statValue} ${styles.goals}`}>{perfectGoals}</div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statLabel}>⚠️ FOULS</div>
          <div className={`${styles.statValue} ${styles.fouls}`}>{fouls}</div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statLabel}>🎯 Mejor</div>
          <div className={styles.statValue}>{bestStop}</div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statLabel}>📊 Precisión</div>
          <div className={`${styles.statValue} ${styles.accuracy}`}>{averageAccuracy}%</div>
        </div>
      </div>
    </div>
  );
}
