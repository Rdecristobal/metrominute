import { Projectile, Tank, TerrainPoint, CanvasDimensions } from './types';
import {
  PROJECTILE_SPEED_FACTOR,
  GRAVITY,
  WIND_FACTOR,
  PROJECTILE_TRAIL_LENGTH,
  EXPLOSION_RADIUS,
  TANK_BARREL_LENGTH,
  TANK_HEIGHT,
} from './constants';
import { getTerrainY } from './terrain';

// Create a projectile from a tank
export function createProjectile(
  tank: Tank,
  wind: number,
  dimensions: CanvasDimensions
): Projectile {
  // Convert angle from degrees to radians
  const angleRad = tank.angle * (Math.PI / 180);
  const speed = tank.power * PROJECTILE_SPEED_FACTOR;

  // Calculate muzzle position (tip of barrel)
  const barrelLength = TANK_BARREL_LENGTH;
  const muzzleX = tank.x + Math.cos(angleRad) * barrelLength;
  const muzzleY = tank.y - TANK_HEIGHT + Math.sin(angleRad) * barrelLength;

  return {
    x: muzzleX,
    y: muzzleY,
    vx: Math.cos(angleRad) * speed,
    vy: Math.sin(angleRad) * speed,
    trail: [],
    active: true,
  };
}

// Update projectile physics
export function updateProjectile(
  projectile: Projectile,
  wind: number,
  dimensions: CanvasDimensions
): boolean {
  if (!projectile.active) return false;

  // Add current position to trail
  projectile.trail.push({ x: projectile.x, y: projectile.y });
  if (projectile.trail.length > PROJECTILE_TRAIL_LENGTH) {
    projectile.trail.shift();
  }

  // Apply wind and gravity
  projectile.vx += wind * WIND_FACTOR;
  projectile.vy += GRAVITY;

  // Update position
  projectile.x += projectile.vx;
  projectile.y += projectile.vy;

  return true;
}

// Check collision with terrain or boundaries
export interface CollisionResult {
  collided: boolean;
  x: number;
  y: number;
  type: 'terrain' | 'boundary' | 'none';
}

export function checkCollision(
  projectile: Projectile,
  terrain: TerrainPoint[],
  dimensions: CanvasDimensions
): CollisionResult {
  if (!projectile.active) {
    return { collided: false, x: 0, y: 0, type: 'none' };
  }

  const terrainY = getTerrainY(terrain, projectile.x);

  // Check terrain collision
  if (projectile.y >= terrainY) {
    return {
      collided: true,
      x: projectile.x,
      y: terrainY,
      type: 'terrain',
    };
  }

  // Check boundary collision
  if (projectile.x < 0 || projectile.x > dimensions.width) {
    return {
      collided: true,
      x: Math.max(0, Math.min(dimensions.width, projectile.x)),
      y: projectile.y,
      type: 'boundary',
    };
  }

  // Check bottom boundary (below canvas)
  if (projectile.y > dimensions.height + 50) {
    return {
      collided: true,
      x: projectile.x,
      y: projectile.y,
      type: 'boundary',
    };
  }

  return { collided: false, x: 0, y: 0, type: 'none' };
}

// Check if a tank is within explosion radius
export function isTankInRange(
  tank: Tank,
  explosionX: number,
  explosionY: number,
  radius: number = EXPLOSION_RADIUS
): boolean {
  const dx = tank.x - explosionX;
  const dy = tank.y - explosionY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < radius;
}

// Calculate trajectory points for aim guide (human players only)
export function calculateTrajectory(
  startX: number,
  startY: number,
  angle: number,
  power: number,
  wind: number,
  dimensions: CanvasDimensions,
  steps: number = 40
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const angleRad = angle * (Math.PI / 180);
  const speed = power * PROJECTILE_SPEED_FACTOR;

  let x = startX;
  let y = startY;
  let vx = Math.cos(angleRad) * speed;
  let vy = Math.sin(angleRad) * speed;

  for (let i = 0; i < steps; i++) {
    points.push({ x, y });

    vx += wind * WIND_FACTOR;
    vy += GRAVITY;
    x += vx;
    y += vy;

    // Stop if out of bounds
    if (x < 0 || x > dimensions.width || y > dimensions.height + 100) {
      break;
    }
  }

  return points;
}
