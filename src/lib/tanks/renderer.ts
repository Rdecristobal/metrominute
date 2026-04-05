import { GameState, Tank, CanvasDimensions } from './types';
import {
  SKY_TOP,
  SKY_MID,
  SKY_BOTTOM,
  TERRAIN_COLORS,
  TERRAIN_SURFACE,
  TERRAIN_SURFACE_WIDTH,
  TANK_WIDTH,
  TANK_HEIGHT,
  TANK_TRACKS_WIDTH,
  TANK_TRACKS_HEIGHT,
  TANK_TURRET_RADIUS,
  TANK_BARREL_LENGTH,
  TANK_BARREL_WIDTH,
  TANK_BARREL_MOUTH_WIDTH,
  TANK_BARREL_MOUTH_HEIGHT,
  PROJECTILE_COLOR,
  PROJECTILE_SHADOW_COLOR,
  PROJECTILE_SHADOW_BLUR,
  PROJECTILE_RADIUS,
  TRAIL_COLOR,
  EXPLOSION_DURATION_FRAMES,
  EXPLOSION_RADIUS,
  EXPLOSION_PARTICLE_COUNT,
  EXPLOSION_PARTICLE_MIN_SIZE,
  EXPLOSION_PARTICLE_MAX_SIZE,
  EXPLOSION_PARTICLE_MIN_R,
  EXPLOSION_PARTICLE_MAX_R,
  EXPLOSION_PARTICLE_MIN_G,
  EXPLOSION_PARTICLE_MAX_G,
  EXPLOSION_PARTICLE_B,
} from './constants';
import { calculateTrajectory } from './physics';

// Stars cache
let starsCache: Array<{ x: number; y: number; radius: number; opacity: number }> | null = null;

// Render the complete game frame
export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  dimensions: CanvasDimensions,
  showTrajectory: boolean = false
): void {
  const { width, height } = dimensions;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Render sky with gradient
  renderSky(ctx, dimensions);

  // Render stars
  renderStars(ctx, dimensions);

  // Render terrain
  renderTerrain(ctx, state.terrain, dimensions);

  // Render tanks
  state.tanks.forEach(tank => {
    renderTank(ctx, tank, state.activeTankIndex === tank.id, state.phase);
  });

  // Render trajectory (human player turn only)
  if (showTrajectory && state.phase === 'playing' && !state.projectile?.active) {
    const activeTank = state.tanks[state.activeTankIndex];
    if (activeTank && !activeTank.isAI && activeTank.alive) {
      renderTrajectory(ctx, activeTank, state.wind, dimensions);
    }
  }

  // Render projectile
  if (state.projectile && state.projectile.active) {
    renderProjectile(ctx, state.projectile);
  }

  // Render explosions
  state.explosions.forEach(explosion => {
    renderExplosion(ctx, explosion, dimensions);
  });

  // Render wind indicator
  renderWindIndicator(ctx, state.wind, dimensions);

  // Render tank count
  renderTankCount(ctx, state, dimensions);
}

// Render sky gradient
function renderSky(ctx: CanvasRenderingContext2D, dimensions: CanvasDimensions): void {
  const { width, height } = dimensions;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, SKY_TOP);
  gradient.addColorStop(0.5, SKY_MID);
  gradient.addColorStop(1, SKY_BOTTOM);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

// Render stars
function renderStars(ctx: CanvasRenderingContext2D, dimensions: CanvasDimensions): void {
  // Generate stars once and cache
  if (!starsCache) {
    starsCache = generateStars(dimensions);
  }

  ctx.fillStyle = 'white';
  starsCache.forEach(star => {
    ctx.globalAlpha = star.opacity;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// Generate stars (pseudo-random)
function generateStars(dimensions: CanvasDimensions): Array<{ x: number; y: number; radius: number; opacity: number }> {
  const stars: Array<{ x: number; y: number; radius: number; opacity: number }> = [];
  let seed = 42;

  for (let i = 0; i < 60; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    const x = (seed / 233280) * dimensions.width;

    seed = (seed * 9301 + 49297) % 233280;
    const y = (seed / 233280) * dimensions.height * 0.6;

    seed = (seed * 9301 + 49297) % 233280;
    const radius = 0.3 + (seed / 233280) * 1.5;

    seed = (seed * 9301 + 49297) % 233280;
    const opacity = 0.3 + (seed / 233280) * 0.5;

    stars.push({ x, y, radius, opacity });
  }

  return stars;
}

// Render terrain
function renderTerrain(ctx: CanvasRenderingContext2D, terrain: Array<{ x: number; y: number }>, dimensions: CanvasDimensions): void {
  const { width, height } = dimensions;

  if (terrain.length === 0) return;

  // Create gradient for terrain fill
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  TERRAIN_COLORS.forEach((color, i) => {
    gradient.addColorStop(i / (TERRAIN_COLORS.length - 1), color);
  });

  // Fill terrain
  ctx.beginPath();
  ctx.moveTo(terrain[0].x, terrain[0].y);
  for (let i = 1; i < terrain.length; i++) {
    ctx.lineTo(terrain[i].x, terrain[i].y);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw terrain surface line
  ctx.beginPath();
  ctx.moveTo(terrain[0].x, terrain[0].y);
  for (let i = 1; i < terrain.length; i++) {
    ctx.lineTo(terrain[i].x, terrain[i].y);
  }
  ctx.strokeStyle = TERRAIN_SURFACE;
  ctx.lineWidth = TERRAIN_SURFACE_WIDTH;
  ctx.stroke();
}

// Render a tank
function renderTank(ctx: CanvasRenderingContext2D, tank: Tank, isActive: boolean, phase: string): void {
  if (!tank.alive && phase !== 'menu') return;

  const { x, y, angle, color } = tank;
  const angleRad = angle * (Math.PI / 180);

  ctx.save();
  ctx.translate(x, y);

  // Draw active indicator (glow)
  if (isActive) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
  }

  // Draw tracks
  ctx.fillStyle = '#222';
  roundRect(ctx, -TANK_TRACKS_WIDTH / 2, 0, TANK_TRACKS_WIDTH, TANK_TRACKS_HEIGHT, 3);
  ctx.fill();

  // Draw body
  ctx.fillStyle = color;
  roundRect(ctx, -TANK_WIDTH / 2, -TANK_HEIGHT, TANK_WIDTH, TANK_HEIGHT, [4, 4, 0, 0]);
  ctx.fill();

  // Draw turret (semicircle)
  ctx.beginPath();
  ctx.arc(0, -TANK_HEIGHT, TANK_TURRET_RADIUS, Math.PI, 0);
  ctx.fillStyle = color;
  ctx.fill();

  // Draw barrel
  ctx.save();
  ctx.translate(0, -TANK_HEIGHT);
  ctx.rotate(angleRad);

  // Barrel body
  ctx.fillStyle = color;
  ctx.fillRect(0, -TANK_BARREL_WIDTH / 2, TANK_BARREL_LENGTH, TANK_BARREL_WIDTH);

  // Barrel mouth
  ctx.fillStyle = '#333';
  ctx.fillRect(TANK_BARREL_LENGTH, -TANK_BARREL_MOUTH_WIDTH / 2, TANK_BARREL_MOUTH_WIDTH, TANK_BARREL_MOUTH_HEIGHT);

  ctx.restore();

  // Reset shadow
  ctx.shadowBlur = 0;

  // Draw tank name
  ctx.fillStyle = color;
  ctx.font = 'bold 10px "Courier New", monospace';
  ctx.textAlign = 'center';
  const nameY = isActive ? -TANK_HEIGHT - 25 : -TANK_HEIGHT - 15;
  ctx.fillText(tank.name, 0, nameY);

  // Draw active indicator arrow
  if (isActive) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, nameY - 8);
    ctx.lineTo(-5, nameY - 14);
    ctx.lineTo(5, nameY - 14);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

// Round rectangle helper
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radii: number | number[]
): void {
  const r = typeof radii === 'number' ? [radii, radii, radii, radii] : radii;

  ctx.beginPath();
  ctx.moveTo(x + r[0], y);
  ctx.lineTo(x + width - r[1], y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r[1]);
  ctx.lineTo(x + width, y + height - r[2]);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r[2], y + height);
  ctx.lineTo(x + r[3], y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r[3]);
  ctx.lineTo(x, y + r[0]);
  ctx.quadraticCurveTo(x, y, x + r[0], y);
  ctx.closePath();
}

// Render trajectory guide
function renderTrajectory(ctx: CanvasRenderingContext2D, tank: Tank, wind: number, dimensions: CanvasDimensions): void {
  const barrelLength = 22;
  const angleRad = tank.angle * (Math.PI / 180);
  const startX = tank.x + Math.cos(angleRad) * barrelLength;
  const startY = tank.y - 16 + Math.sin(angleRad) * barrelLength;

  const points = calculateTrajectory(startX, startY, tank.angle, tank.power, wind, dimensions);

  if (points.length < 2) return;

  ctx.save();
  ctx.setLineDash([3, 6]);
  ctx.strokeStyle = `${tank.color}44`; // 27% opacity
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

// Render projectile
function renderProjectile(ctx: CanvasRenderingContext2D, projectile: { x: number; y: number; trail: Array<{ x: number; y: number }> }): void {
  // Render trail
  projectile.trail.forEach((point, i) => {
    const alpha = (i / projectile.trail.length) * 0.5;
    ctx.fillStyle = `rgba(${TRAIL_COLOR}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Render projectile
  ctx.save();
  ctx.shadowColor = PROJECTILE_SHADOW_COLOR;
  ctx.shadowBlur = PROJECTILE_SHADOW_BLUR;
  ctx.fillStyle = PROJECTILE_COLOR;
  ctx.beginPath();
  ctx.arc(projectile.x, projectile.y, PROJECTILE_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Render explosion
function renderExplosion(ctx: CanvasRenderingContext2D, explosion: { x: number; y: number; frame: number; particles: Array<{ x: number; y: number; size: number; color: string; life: number }> }, dimensions: CanvasDimensions): void {
  const { x, y, frame, particles } = explosion;
  const progress = frame / EXPLOSION_DURATION_FRAMES;

  // Calculate radius (sinusoidal: grows then shrinks)
  const maxRadius = EXPLOSION_RADIUS * 1.5;
  const radius = maxRadius * Math.sin(progress * Math.PI);

  // Calculate opacity (fades out)
  const opacity = 1 - progress;

  ctx.save();
  ctx.globalAlpha = opacity;

  // Draw radial gradient for explosion
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, 'white');
  gradient.addColorStop(0.3, 'orange');
  gradient.addColorStop(0.6, 'red');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw particles
  particles.forEach(p => {
    ctx.globalAlpha = p.life * opacity;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

// Render wind indicator
function renderWindIndicator(ctx: CanvasRenderingContext2D, wind: number, dimensions: CanvasDimensions): void {
  const x = dimensions.width - 80;
  const y = 30;

  ctx.save();
  ctx.fillStyle = '#888';
  ctx.font = '10px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('WIND', x, y);

  // Draw arrow
  const arrowLength = Math.abs(wind) * 25;
  const arrowX = wind >= 0 ? x - arrowLength : x + arrowLength;

  ctx.strokeStyle = '#88aaff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 8);
  ctx.lineTo(arrowX, y + 8);
  ctx.stroke();

  // Draw arrowhead
  ctx.beginPath();
  if (wind > 0) {
    ctx.moveTo(arrowX, y + 8);
    ctx.lineTo(arrowX - 5, y + 5);
    ctx.lineTo(arrowX - 5, y + 11);
  } else if (wind < 0) {
    ctx.moveTo(arrowX, y + 8);
    ctx.lineTo(arrowX + 5, y + 5);
    ctx.lineTo(arrowX + 5, y + 11);
  }
  ctx.closePath();
  ctx.fillStyle = '#88aaff';
  ctx.fill();

  ctx.restore();
}

// Render tank count
function renderTankCount(ctx: CanvasRenderingContext2D, state: GameState, dimensions: CanvasDimensions): void {
  const aliveCount = state.tanks.filter(t => t.alive).length;

  ctx.save();
  ctx.fillStyle = '#666';
  ctx.font = '10px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${aliveCount} TANK${aliveCount !== 1 ? 'S' : ''}`, dimensions.width - 10, 15);
  ctx.restore();
}

// Clear stars cache (call when dimensions change)
export function clearStarsCache(): void {
  starsCache = null;
}
