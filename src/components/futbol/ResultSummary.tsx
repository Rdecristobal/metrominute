import styles from './ResultSummary.module.css';

interface ResultSummaryProps {
  winner: 'player1' | 'player2' | 'draw';
  player1Score: number;
  player2Score: number;
  stats: {
    totalAttempts: number;
    perfectGoals: number;
    penaltiesConceded: number;
    foulsConceded: number;
    bestStop: number | null;
  };
  isNewRecord: boolean;
  onRetry: () => void;
  onHome: () => void;
}

export default function ResultSummary({
  winner,
  player1Score,
  player2Score,
  stats,
  isNewRecord,
  onRetry,
  onHome
}: ResultSummaryProps) {
  const getWinnerText = (): string => {
    if (winner === 'draw') return '¡EMPATE!';
    return winner === 'player1' ? '¡VICTORIA!' : '¡DERROTA!';
  };

  const getWinnerClass = (): string => {
    if (winner === 'draw') return styles.draw;
    return winner === 'player1' ? styles.victory : styles.defeat;
  };

  const formatBestStop = (): string => {
    if (stats.bestStop === null) return '--';
    return stats.bestStop.toFixed(2);
  };

  const averageAccuracy = stats.totalAttempts > 0
    ? Math.round((stats.perfectGoals / stats.totalAttempts) * 100)
    : 0;

  return (
    <div className={styles.resultSummary}>
      {isNewRecord && (
        <div className={styles.newRecordBadge}>
          🎉 NUEVO RÉCORD PERSONAL 🎉
        </div>
      )}

      <div className={`${styles.winnerText} ${getWinnerClass()}`}>
        {getWinnerText()}
      </div>

      <div className={styles.scoreDisplay}>
        <div className={styles.scoreItem}>
          <div className={styles.scoreValue}>{player1Score}</div>
        </div>
        <div className={styles.scoreDivider}>-</div>
        <div className={styles.scoreItem}>
          <div className={styles.scoreValue}>{player2Score}</div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>⚽ Goles Perfectos</div>
          <div className={styles.statValue}>{stats.perfectGoals}</div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statLabel}>🎯 Intentos</div>
          <div className={styles.statValue}>{stats.totalAttempts}</div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statLabel}>🥅 Penales</div>
          <div className={styles.statValue}>{stats.penaltiesConceded}</div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statLabel}>⚠️ Faltas</div>
          <div className={styles.statValue}>{stats.foulsConceded}</div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statLabel}>🎯 Mejor Parada</div>
          <div className={styles.statValue}>{formatBestStop()}</div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statLabel}>📊 Precisión</div>
          <div className={styles.statValue}>{averageAccuracy}%</div>
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={onRetry}>
          JUGAR DE NUEVO
        </button>
        <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={onHome}>
          VOLVER AL INICIO
        </button>
      </div>
    </div>
  );
}
