import { AIDifficulty } from '@/lib/futbol/types';
import styles from './DifficultySelector.module.css';

interface DifficultySelectorProps {
  currentDifficulty: AIDifficulty;
  onSelectDifficulty: (difficulty: AIDifficulty) => void;
}

export default function DifficultySelector({
  currentDifficulty,
  onSelectDifficulty
}: DifficultySelectorProps) {
  return (
    <div className={styles.difficultySelector}>
      <div className={styles.label}>Dificultad</div>

      <div className={styles.options}>
        <button
          className={`${styles.option} ${styles.easy} ${currentDifficulty === AIDifficulty.EASY ? styles.selected : ''}`}
          onClick={() => onSelectDifficulty(AIDifficulty.EASY)}
        >
          <div className={styles.stars}>⭐</div>
          <div>Fácil</div>
          <div className={styles.description}>Error: 30¢</div>
        </button>

        <button
          className={`${styles.option} ${styles.medium} ${currentDifficulty === AIDifficulty.MEDIUM ? styles.selected : ''}`}
          onClick={() => onSelectDifficulty(AIDifficulty.MEDIUM)}
        >
          <div className={styles.stars}>⭐⭐</div>
          <div>Medio</div>
          <div className={styles.description}>Error: 15¢</div>
        </button>

        <button
          className={`${styles.option} ${styles.hard} ${currentDifficulty === AIDifficulty.HARD ? styles.selected : ''}`}
          onClick={() => onSelectDifficulty(AIDifficulty.HARD)}
        >
          <div className={styles.stars}>⭐⭐⭐</div>
          <div>Difícil</div>
          <div className={styles.description}>Error: 8¢</div>
        </button>
      </div>
    </div>
  );
}
