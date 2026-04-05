import { Tank, GameState } from './types';
import {
  AI_LOBBING_ANGLE_MIN,
  AI_LOBBING_ANGLE_MAX,
  AI_POWER_DISTANCE_FACTOR,
  AI_POWER_RANDOM_RANGE,
  AI_WIND_COMPENSATION_FACTOR,
  AI_IMPRECISION_ANGLE,
  AI_IMPRECISION_POWER,
  AI_POWER_MIN,
  AI_POWER_MAX,
  AI_ANGLE_MIN,
  AI_ANGLE_MAX,
} from './constants';

// Get a random alive target tank (not the shooter)
export function getAITarget(state: GameState, shooterTank: Tank): Tank | null {
  const aliveTanks = state.tanks.filter(t => t.alive && t.id !== shooterTank.id);
  if (aliveTanks.length === 0) return null;

  // Random target
  const randomIndex = Math.floor(Math.random() * aliveTanks.length);
  return aliveTanks[randomIndex];
}

// Calculate AI shot parameters (angle and power)
export interface AIShotCalculation {
  angle: number;
  power: number;
}

export function calculateAIShot(
  shooter: Tank,
  target: Tank,
  wind: number
): AIShotCalculation {
  // Calculate distance and angle to target
  const dx = target.x - shooter.x;
  const dy = target.y - shooter.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Base angle towards target (in degrees, negative for upward)
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Add lobbing (make the shot arc higher)
  const lobbingAngle = AI_LOBBING_ANGLE_MIN + Math.random() * (AI_LOBBING_ANGLE_MAX - AI_LOBBING_ANGLE_MIN);
  angle -= lobbingAngle;

  // Compensate for wind
  angle -= wind * AI_WIND_COMPENSATION_FACTOR;

  // Add imprecision
  angle += (Math.random() - 0.5) * 2 * AI_IMPRECISION_ANGLE;

  // Calculate power based on distance
  let power = distance * AI_POWER_DISTANCE_FACTOR + (Math.random() - 0.5) * 2 * AI_POWER_RANDOM_RANGE;

  // Add power imprecision
  power += (Math.random() - 0.5) * 2 * AI_IMPRECISION_POWER;

  // Clamp values
  angle = Math.max(AI_ANGLE_MIN, Math.min(AI_ANGLE_MAX, angle));
  power = Math.max(AI_POWER_MIN, Math.min(AI_POWER_MAX, power));

  return { angle, power };
}

// Check if AI should fire now (after thinking delay)
export function shouldAIFire(thinkingFrames: number): boolean {
  return thinkingFrames >= 75;
}
