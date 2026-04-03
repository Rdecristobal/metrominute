import { ScoringResult } from './types';

/**
 * Redondea un valor a 2 decimales para evitar problemas de floating point
 * @param value - Valor a redondear
 * @returns Valor redondeado a 2 decimales
 */
function roundTo2Decimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calcula el resultado de una parada de cronómetro
 * @param value - Valor del cronómetro (00.00 - 99.99)
 * @returns ScoringResult
 *
 * REGLAS (definidas por Raúl):
 * - Cualquier valor que termine en .00 = GOL (00.00, 01.00, 47.00, 99.00...)
 * - Cualquier valor que termine en .01 o .99 = PENALTY (00.01, 47.01, 00.99, 47.99...)
 * - Cualquier valor que termine en .95 = FALTA (00.95, 47.95, 99.95...)
 * - Todo lo demás = TURNOVER
 */
export function calculateScore(value: number): ScoringResult {
  const rounded = roundTo2Decimals(value);
  // Get the hundredths (last 2 decimal digits)
  const hundredths = Math.round((rounded - Math.floor(rounded)) * 100);

  // GOL: cualquier .00
  if (hundredths === 0) {
    return {
      outcome: 'goal',
      description: '⚽ GOL!'
    };
  }

  // PENALTY: cualquier .01 o .99
  if (hundredths === 1 || hundredths === 99) {
    return {
      outcome: 'penalty',
      description: '🥅 PENALTY! Rival lanza y dice par/impar'
    };
  }

  // FALTA: cualquier .95
  if (hundredths === 95) {
    return {
      outcome: 'foul',
      description: '⚠️ FALTA! Reintento — para en .00 = gol'
    };
  }

  // TURNOVER: todo lo demás
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
  const rounded = roundTo2Decimals(value);
  const wholeValue = Math.floor(rounded);
  return wholeValue % 2 === 0 ? 'even' : 'odd';
}

/**
 * Determina si una parada en FALTA resulta en gol
 * En la regla actual: .00 = gol (igual que calculateScore)
 * @param value - Valor del cronómetro al parar
 * @returns true si acaba en .00
 */
export function isFoulGoal(value: number): boolean {
  const rounded = roundTo2Decimals(value);
  const hundredths = Math.round((rounded - Math.floor(rounded)) * 100);
  return hundredths === 0;
}
