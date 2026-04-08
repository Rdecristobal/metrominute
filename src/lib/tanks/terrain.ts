import { TerrainPoint, CanvasDimensions } from './types';
import {
  TERRAIN_POINTS,
  TERRAIN_BASE_Y_RATIO,
  TERRAIN_MIN_Y_RATIO,
  TERRAIN_MAX_Y_RATIO,
  TERRAIN_FLAT_PROBABILITY,
  TERRAIN_FLAT_MIN_SEGMENT,
  TERRAIN_FLAT_MAX_SEGMENT,
  TERRAIN_WAVES,
  TERRAIN_AMP_SCALE_FACTOR,
  STAR_SEED,
  EXPLOSION_RADIUS,
  EXPLOSION_DEFORMATION_FACTOR,
} from './constants';

// Pseudo-random number generator with seed
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

// Generate terrain points
export function generateTerrain(dimensions: CanvasDimensions, seed?: number): TerrainPoint[] {
  const { width, height } = dimensions;
  const rng = seed ? new SeededRandom(seed) : { next: Math.random, nextInRange: (min: number, max: number) => min + Math.random() * (max - min) };

  const aspectRatio = width / height;

  // Adjust point count for landscape
  const pointCount = aspectRatio > 1.5
    ? Math.round(TERRAIN_POINTS * aspectRatio * 0.8)
    : TERRAIN_POINTS;

  // Scale amplitudes for landscape so hills aren't flattened
  const ampScale = Math.max(1, aspectRatio * TERRAIN_AMP_SCALE_FACTOR);

  const points: TerrainPoint[] = [];
  const baseY = height * TERRAIN_BASE_Y_RATIO;
  const minY = height * TERRAIN_MIN_Y_RATIO;
  const maxY = height * TERRAIN_MAX_Y_RATIO;
  const phase = rng.nextInRange(0, Math.PI * 2);

  const segmentWidth = width / (pointCount - 1);

  // Adjust flat segment bounds for dynamic point count
  const flatMin = Math.max(3, Math.floor(pointCount * 0.05));
  const flatMax = Math.min(pointCount - 4, Math.floor(pointCount * 0.95));

  for (let i = 0; i < pointCount; i++) {
    const x = i * segmentWidth;
    let y = baseY;

    // Add wave layers with amplitude scaling
    for (const wave of TERRAIN_WAVES) {
      y += Math.sin(x * (wave.freq * 2 * Math.PI / width) + phase) * height * wave.amp * ampScale;
    }

    // 15% chance of flat area (except at edges)
    if (i >= flatMin && i <= flatMax) {
      if (rng.next() < TERRAIN_FLAT_PROBABILITY && i > 0) {
        y = points[i - 1].y;
      }
    }

    // Clamp Y values
    y = Math.max(minY, Math.min(maxY, y));

    points.push({ x, y });
  }

  return points;
}

// Get terrain Y at any X (linear interpolation)
export function getTerrainY(terrain: TerrainPoint[], x: number): number {
  const segmentWidth = terrain[1].x - terrain[0].x;
  const index = Math.floor(x / segmentWidth);

  if (index < 0) return terrain[0].y;
  if (index >= terrain.length - 1) return terrain[terrain.length - 1].y;

  const p1 = terrain[index];
  const p2 = terrain[index + 1];
  const t = (x - p1.x) / (p2.x - p1.x);

  return p1.y + t * (p2.y - p1.y);
}

// Get terrain angle at X (for tank placement and physics)
export function getTerrainAngle(terrain: TerrainPoint[], x: number): number {
  const offset = 3;
  const y1 = getTerrainY(terrain, x - offset);
  const y2 = getTerrainY(terrain, x + offset);
  return Math.atan2(y2 - y1, offset * 2);
}

// Deform terrain at explosion point
export function deformTerrain(
  terrain: TerrainPoint[],
  explosionX: number,
  explosionY: number,
  radius: number = EXPLOSION_RADIUS
): TerrainPoint[] {
  const newTerrain = terrain.map(point => {
    const dx = point.x - explosionX;
    const dy = point.y - explosionY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < radius) {
      const factor = 1 - distance / radius;
      const displacement = factor * radius * EXPLOSION_DEFORMATION_FACTOR;
      return {
        x: point.x,
        y: point.y + displacement,
      };
    }

    return point;
  });

  return newTerrain;
}

// Generate pseudo-random stars (for sky rendering)
export function generateStars(dimensions: CanvasDimensions, seed: number = STAR_SEED) {
  const rng = new SeededRandom(seed);
  const stars: Array<{ x: number; y: number; radius: number; opacity: number }> = [];

  for (let i = 0; i < 60; i++) {
    stars.push({
      x: rng.nextInRange(0, dimensions.width),
      y: rng.nextInRange(0, dimensions.height * 0.6), // Only in upper half
      radius: rng.nextInRange(0.3, 1.8),
      opacity: rng.nextInRange(0.3, 0.8),
    });
  }

  return stars;
}

// Find valid Y position for a tank at given X
export function getTankPosition(terrain: TerrainPoint[], x: number) {
  const y = getTerrainY(terrain, x);
  const angle = getTerrainAngle(terrain, x);
  return { y, angle };
}
