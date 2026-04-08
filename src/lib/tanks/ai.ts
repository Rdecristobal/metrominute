import { Tank, GameState, TerrainPoint, AIDifficulty, AIMemory } from './types';
import {
  MIN_ANGLE,
  MAX_ANGLE,
  MIN_POWER,
  MAX_POWER,
  PROJECTILE_SPEED_FACTOR,
  GRAVITY,
  WIND_FACTOR,
  TANK_BARREL_LENGTH,
  TANK_HEIGHT,
} from './constants';
import { getTerrainY } from './terrain';

// ─── AI Memory Store ───────────────────────────────────────────

const aiMemories: Map<number, AIMemory> = new Map();

export function resetAIMemories(): void {
  aiMemories.clear();
}

export function updateAIMemory(
  tankId: number,
  targetId: number,
  angle: number,
  power: number,
  impactX: number,
  impactY: number,
  targetX: number,
  targetY: number
): void {
  const dx = impactX - targetX;
  const dy = impactY - targetY;
  const missOffset = Math.sqrt(dx * dx + dy * dy);

  aiMemories.set(tankId, {
    lastTargetId: targetId,
    lastAngle: angle,
    lastPower: power,
    lastImpactX: impactX,
    lastImpactY: impactY,
    missOffset,
  });
}

// ─── Difficulty Parameters ─────────────────────────────────────

interface DifficultyParams {
  imprecisionAngle: number;
  imprecisionPower: number;
  memoryWeight: number;
  optimalShotProbability: number;
}

const DIFFICULTY_PARAMS: Record<AIDifficulty, DifficultyParams> = {
  easy:   { imprecisionAngle: 15, imprecisionPower: 20, memoryWeight: 0,   optimalShotProbability: 0.3 },
  normal: { imprecisionAngle: 6,  imprecisionPower: 10, memoryWeight: 0.5, optimalShotProbability: 0.7 },
  hard:   { imprecisionAngle: 2,  imprecisionPower: 4,  memoryWeight: 0.9, optimalShotProbability: 1.0 },
};

// ─── Trajectory Simulation ─────────────────────────────────────

/**
 * Simulates trajectory using the EXACT same physics as physics.ts.
 * Returns the impact point (terrain collision, boundary, or max steps).
 */
function simulateTrajectory(
  startX: number,
  startY: number,
  angle: number,
  power: number,
  wind: number,
  terrain: TerrainPoint[],
  worldWidth: number,
  worldHeight: number,
  maxSteps: number = 500
): { x: number; y: number; steps: number } {
  const angleRad = angle * (Math.PI / 180);
  const speed = power * PROJECTILE_SPEED_FACTOR;

  let x = startX;
  let y = startY;
  let vx = Math.cos(angleRad) * speed;
  let vy = Math.sin(angleRad) * speed;

  for (let i = 0; i < maxSteps; i++) {
    vx += wind * WIND_FACTOR;
    vy += GRAVITY;
    x += vx;
    y += vy;

    // Terrain collision
    if (x >= 0 && x <= worldWidth) {
      const terrainY = getTerrainY(terrain, x);
      if (y >= terrainY) {
        return { x, y: terrainY, steps: i };
      }
    }

    // Out of bounds
    if (x < -50 || x > worldWidth + 50 || y > worldHeight + 100) {
      return { x, y, steps: i };
    }
  }

  return { x, y, steps: maxSteps };
}

// ─── Optimal Shot Search ───────────────────────────────────────

function findOptimalShot(
  shooter: Tank,
  target: Tank,
  wind: number,
  terrain: TerrainPoint[],
  worldWidth: number,
  worldHeight: number
): { angle: number; power: number; distance: number } {
  const angleRad0 = shooter.angle * (Math.PI / 180);
  const startX = shooter.x + Math.cos(angleRad0) * TANK_BARREL_LENGTH;
  const startY = shooter.y - TANK_HEIGHT + Math.sin(angleRad0) * TANK_BARREL_LENGTH;

  let bestAngle = -60;
  let bestPower = 50;
  let bestDistance = Infinity;

  // Coarse grid search
  for (let angle = -170; angle <= -10; angle += 2) {
    for (let power = 20; power <= 100; power += 5) {
      const impact = simulateTrajectory(
        startX, startY, angle, power, wind, terrain, worldWidth, worldHeight
      );

      const dx = impact.x - target.x;
      const dy = impact.y - target.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < bestDistance) {
        bestDistance = dist;
        bestAngle = angle;
        bestPower = power;
      }
    }
  }

  // Fine refinement around the best point
  for (let angle = bestAngle - 4; angle <= bestAngle + 4; angle += 0.5) {
    for (let power = Math.max(MIN_POWER, bestPower - 10); power <= Math.min(MAX_POWER, bestPower + 10); power += 2) {
      if (angle < -175 || angle > -5) continue;

      const impact = simulateTrajectory(
        startX, startY, angle, power, wind, terrain, worldWidth, worldHeight
      );

      const dx = impact.x - target.x;
      const dy = impact.y - target.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < bestDistance) {
        bestDistance = dist;
        bestAngle = angle;
        bestPower = power;
      }
    }
  }

  return { angle: bestAngle, power: bestPower, distance: bestDistance };
}

// ─── Memory-based Adjustment ───────────────────────────────────

function adjustFromMemory(
  baseShot: { angle: number; power: number },
  tankId: number,
  targetX: number
): { angle: number; power: number } {
  const memory = aiMemories.get(tankId);
  if (!memory || memory.missOffset < 30) {
    return baseShot;
  }

  let { angle, power } = baseShot;
  const adjustFactor = Math.min(memory.missOffset / 100, 1);

  // If last impact was before target (short), increase power; otherwise decrease
  if (memory.lastImpactX < targetX) {
    power += 5 * adjustFactor;
  } else {
    power -= 5 * adjustFactor;
  }

  power = Math.max(MIN_POWER, Math.min(MAX_POWER, power));
  return { angle, power };
}

// ─── Target Selection ──────────────────────────────────────────

export function getAITarget(state: GameState, shooterTank: Tank): Tank | null {
  const aliveTanks = state.tanks.filter(t => t.alive && t.id !== shooterTank.id);
  if (aliveTanks.length === 0) return null;
  if (aliveTanks.length === 1) return aliveTanks[0];

  // Sort by distance (closest first)
  const sorted = [...aliveTanks].sort((a, b) => {
    const distA = Math.abs(a.x - shooterTank.x);
    const distB = Math.abs(b.x - shooterTank.x);
    return distA - distB;
  });

  // 60% chance to target closest, 40% random
  if (Math.random() < 0.6) {
    return sorted[0];
  }
  return aliveTanks[Math.floor(Math.random() * aliveTanks.length)];
}

// ─── Main AI Shot Calculation ──────────────────────────────────

export interface AIShotCalculation {
  angle: number;
  power: number;
}

export function calculateAIShot(
  shooter: Tank,
  target: Tank,
  wind: number,
  terrain: TerrainPoint[],
  worldWidth: number,
  worldHeight: number,
  difficulty: AIDifficulty = 'normal'
): AIShotCalculation {
  const params = DIFFICULTY_PARAMS[difficulty];

  let angle: number;
  let power: number;

  if (Math.random() < params.optimalShotProbability) {
    // Calculate optimal shot by inverting physics
    const optimal = findOptimalShot(shooter, target, wind, terrain, worldWidth, worldHeight);
    angle = optimal.angle;
    power = optimal.power;
  } else {
    // Fallback: heuristic shot
    angle = shooter.x < target.x ? -60 : -120;
    power = 50 + Math.random() * 30;
  }

  // Adjust from memory
  const memory = aiMemories.get(shooter.id);
  if (memory && memory.lastTargetId === target.id && params.memoryWeight > 0) {
    const adjusted = adjustFromMemory({ angle, power }, shooter.id, target.x);
    angle = angle * (1 - params.memoryWeight) + adjusted.angle * params.memoryWeight;
    power = power * (1 - params.memoryWeight) + adjusted.power * params.memoryWeight;
  }

  // Add imprecision based on difficulty
  angle += (Math.random() - 0.5) * 2 * params.imprecisionAngle;
  power += (Math.random() - 0.5) * 2 * params.imprecisionPower;

  // Clamp
  angle = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, angle));
  power = Math.max(MIN_POWER, Math.min(MAX_POWER, power));

  return { angle, power };
}

// ─── AI Thinking Delay ─────────────────────────────────────────

export function shouldAIFire(thinkingFrames: number): boolean {
  return thinkingFrames >= 75;
}
