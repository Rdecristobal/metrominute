import styles from './ScoreBoard.module.css';

interface ScoreBoardProps {
  player1Score: number;
  player2Score: number;
  player1Fouls: number;
  player2Fouls: number;
  matchTime: number;
  isExtraTime: boolean;
  player1Name?: string;
  player2Name?: string;
}

export default function ScoreBoard({
  player1Score,
  player2Score,
  player1Fouls,
  player2Fouls,
  matchTime,
  isExtraTime,
  player1Name = 'JUGADOR 1',
  player2Name = 'JUGADOR 2'
}: ScoreBoardProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.scoreBoard}>
      <div className={styles.playerSection}>
        <div className={styles.playerName}>{player1Name}</div>
        <div className={styles.playerScore}>{player1Score}</div>
        <div className={styles.playerFouls}>⚠️ {player1Fouls}</div>
      </div>

      <div className={styles.vsSection}>
        <div className={styles.vsText}>VS</div>
        <div className={styles.matchTime}>{formatTime(matchTime)}</div>
        {isExtraTime && <div className={styles.extraTimeBadge}>PRÓRROGA</div>}
      </div>

      <div className={styles.playerSection}>
        <div className={styles.playerName}>{player2Name}</div>
        <div className={styles.playerScore}>{player2Score}</div>
        <div className={styles.playerFouls}>⚠️ {player2Fouls}</div>
      </div>
    </div>
  );
}
