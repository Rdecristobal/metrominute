import { AIDifficulty, AIBehavior } from './types';

/**
 * Genera el comportamiento de la IA según dificultad
 * @param difficulty - Nivel de dificultad
 * @returns AIBehavior
 */
export function generateAIBehavior(difficulty: AIDifficulty): AIBehavior {
  switch (difficulty) {
    case AIDifficulty.EASY:
      return {
        targetValue: gaussianRandom(0, 30),
        reactionTimeMs: 800 + Math.random() * 400,
        consistency: 0.5
      };
    case AIDifficulty.MEDIUM:
      return {
        targetValue: gaussianRandom(0, 15),
        reactionTimeMs: 600 + Math.random() * 300,
        consistency: 0.7
      };
    case AIDifficulty.HARD:
      return {
        targetValue: gaussianRandom(0, 8),
        reactionTimeMs: 400 + Math.random() * 200,
        consistency: 0.9
      };
    default:
      return {
        targetValue: gaussianRandom(0, 15),
        reactionTimeMs: 600 + Math.random() * 300,
        consistency: 0.7
      };
  }
}

/**
 * Genera un número aleatorio con distribución gaussiana (Box-Muller transform)
 * @param mean - Media
 * @param stdDev - Desviación estándar
 * @returns Número aleatorio no negativo
 */
function gaussianRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.abs(mean + z0 * stdDev);
}

/**
 * Genera una predicción par/impar para penalties
 * @returns 'even' o 'odd'
 */
export function generateParityPrediction(): 'even' | 'odd' {
  return Math.random() < 0.5 ? 'even' : 'odd';
}
