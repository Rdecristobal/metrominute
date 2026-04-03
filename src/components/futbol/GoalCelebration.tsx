import styles from './GoalCelebration.module.css';

interface GoalCelebrationProps {
  show: boolean;
}

export default function GoalCelebration({ show }: GoalCelebrationProps) {
  if (!show) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* Pixel art football player celebrating */}
        <div className={styles.pixelPlayer}>
          <svg width="80" height="120" viewBox="0 0 16 24" className={styles.playerSvg}>
            {/* Head */}
            <rect x="5" y="0" width="6" height="6" fill="#FFD700" />
            {/* Eyes */}
            <rect x="6" y="2" width="1" height="1" fill="#000" />
            <rect x="9" y="2" width="1" height="1" fill="#000" />
            {/* Smile */}
            <rect x="7" y="4" width="2" height="1" fill="#000" />
            {/* Body (jersey) */}
            <rect x="4" y="6" width="8" height="6" fill="#00FF7F" />
            {/* Number on jersey */}
            <rect x="6" y="7" width="1" height="1" fill="#FFF" />
            <rect x="7" y="7" width="2" height="1" fill="#FFF" />
            <rect x="9" y="7" width="1" height="1" fill="#FFF" />
            <rect x="6" y="8" width="1" height="1" fill="#FFF" />
            <rect x="8" y="8" width="2" height="1" fill="#FFF" />
            <rect x="6" y="9" width="1" height="1" fill="#FFF" />
            <rect x="7" y="9" width="2" height="1" fill="#FFF" />
            <rect x="9" y="9" width="1" height="1" fill="#FFF" />
            {/* Arms raised */}
            <rect x="1" y="6" width="3" height="2" fill="#FFD700" />
            <rect x="0" y="4" width="2" height="2" fill="#FFD700" />
            <rect x="12" y="6" width="3" height="2" fill="#FFD700" />
            <rect x="14" y="4" width="2" height="2" fill="#FFD700" />
            {/* Shorts */}
            <rect x="4" y="12" width="3" height="3" fill="#1A1A1A" />
            <rect x="9" y="12" width="3" height="3" fill="#1A1A1A" />
            {/* Legs */}
            <rect x="4" y="15" width="2" height="4" fill="#FFD700" />
            <rect x="10" y="15" width="2" height="4" fill="#FFD700" />
            {/* Socks */}
            <rect x="4" y="19" width="2" height="2" fill="#FFF" />
            <rect x="10" y="19" width="2" height="2" fill="#FFF" />
            {/* Boots */}
            <rect x="3" y="21" width="3" height="2" fill="#333" />
            <rect x="10" y="21" width="3" height="2" fill="#333" />
          </svg>
        </div>

        <div className={styles.goalText}>GOAL!</div>
        <div className={styles.goalSubtext}>⚽</div>

        {/* Pixel particles */}
        <div className={styles.particles}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={styles.particle}
              style={{
                left: `${10 + i * 12}%`,
                animationDelay: `${i * 0.1}s`,
                backgroundColor: i % 2 === 0 ? '#00FF7F' : '#FFD700'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
