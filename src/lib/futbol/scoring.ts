import { ScoringResult } from './types';

/**
 * Calcula el resultado de una parada de cronómetro
 * @param value - Valor del cronómetro (00.00 - 99.99)
 * @returns ScoringResult
 *
 * REGLAS (definidas por Raúl):
 * - 00.00 = GOL directo
 * - 00.01 / 99.99 = PENALTY (rival lanza y dice par/impar ANTES de parar)
 * - Múltiplo de 5 (05, 10, 15, 20, 25...) = FALTA (reintento del jugador actual)
 * - Todo lo demás = TURNO pasa al rival
 *
 * IMPORTANTE:
 * - NO hay puntos numéricos. Es fútbol real: o es gol o no es gol.
 * - FALTA: el jugador actual vuelve a lanzar, si para en X5 → gol, sino → pierde turno
 */
export function calculateScore(value: number): ScoringResult {
  // GOL: 00.00
  if (value === 0) {
    return {
      outcome: 'goal',
      description: '⚽ GOL!'
    };
  }

  // PENALTY: 00.01 o 99.99
  if (value === 0.01 || value === 99.99) {
    return {
      outcome: 'penalty',
      description: '🥅 PENALTY! Rival lanza y dice par/impar'
    };
  }

  // FALTA: Múltiplo de 5 (05, 10, 15, 20, 25...)
  const wholeValue = Math.floor(value);
  if (wholeValue > 0 && wholeValue % 5 === 0) {
    return {
      outcome: 'foul',
      description: '⚠️ FALTA! Reintento — para en X5 = gol'
    };
  }

  // TURNO AL RIVAL: Todo lo demás
  return {
    outcome: 'turnover',
    description: '🔄 Turno al rival'
  };
}

/**
 * Verifica si un valor es par o impar para el sistema de penalties
 * @param value - Valor a verificar
 * @returns 'even' si es par, 'odd' si es impar
 */
export function getParity(value: number): 'even' | 'odd' {
  const wholeValue = Math.floor(value);
  return wholeValue % 2 === 0 ? 'even' : 'odd';
}

/**
 * Determina si una parada en FALTA resulta en gol
 * @param value - Valor del cronómetro al parar
 * @returns true si acaba en 5 (05, 15, 25...), false en otro caso
 */
export function isFoulGoal(value: number): boolean {
  const lastDigit = Math.floor(value) % 10;
  return lastDigit === 5;
}
