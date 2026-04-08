import { GameState, Tank, CanvasDimensions, Viewport } from './types';
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
  MINIMAP_WIDTH,
  MINIMAP_HEIGHT,
} from './constants';
import { calculateTrajectory } from './physics';

// Stars cache
let starsCache: Array<{ x: number; y: number; radius: number; opacity: number }> | null = null;

// ─── Main Render ────────────────────────────────────────────────

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  dimensions: CanvasDimensions,
  showTrajectory: boolean = false
): void {
  const { width, height } = dimensions;
  const viewport = state.viewport;
  const camX = viewport ? viewport.x : 0;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Render sky (full screen, no offset)
  renderSky(ctx, dimensions);

  // Render stars (full screen, no offset — they're a backdrop)
  renderStars(ctx, dimensions);

  // Apply camera offset for world-space rendering
  ctx.save();
  ctx.translate(-camX, 0);

  // Render terrain (world coordinates)
  renderTerrain(ctx, state.terrain, viewport);

  // Render tanks (world coordinates)
  state.tanks.forEach(tank => {
    renderTank(ctx, tank, state.activeTankIndex === tank.id, state.phase, viewport);
  });

  // Render trajectory (human player, world coordinates)
  if (showTrajectory && state.phase === 'playing' && !state.projectile?.active) {
    const activeTank = state.tanks[state.activeTankIndex];
    if (activeTank && !activeTank.isAI && activeTank.alive) {
      renderTrajectory(ctx, activeTank, state.wind, viewport, dimensions);
    }
  }

  // Render projectile (world coordinates)
  if (state.projectile && state.projectile.active) {
    renderProjectile(ctx, state.projectile);
  }

  // Render explosions (world coordinates)
  state.explosions.forEach(explosion => {
    renderExplosion(ctx, explosion, dimensions);
  });

  ctx.restore();

  // ─── HUD overlay (screen coordinates, no camera offset) ───

  renderWindIndicator(ctx, state.wind, dimensions);
  renderTankCount(ctx, state, dimensions);

  // Minimap
  if (viewport) {
    renderMinimap(ctx, state, viewport, dimensions);
  }
}

// ─── Sky ────────────────────────────────────────────────────────

function renderSky(ctx: CanvasRenderingContext2D, dimensions: CanvasDimensions): void {
  const { width, height } = dimensions;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, SKY_TOP);
  gradient.addColorStop(0.5, SKY_MID);
  gradient.addColorStop(1, SKY_BOTTOM);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

// ─── Stars ──────────────────────────────────────────────────────

function renderStars(ctx: CanvasRenderingContext2D, dimensions: CanvasDimensions): void {
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

// ─── Terrain ────────────────────────────────────────────────────

function renderTerrain(
  ctx: CanvasRenderingContext2D,
  terrain: Array<{ x: number; y: number }>,
  viewport?: Viewport
): void {
  if (terrain.length === 0) return;

  const worldHeight = viewport?.worldHeight ?? 600;
  const worldWidth = viewport?.worldWidth ?? terrain[terrain.length - 1].x;

  // Create gradient for terrain fill
  const gradient = ctx.createLinearGradient(0, 0, 0, worldHeight);
  TERRAIN_COLORS.forEach((color, i) => {
    gradient.addColorStop(i / (TERRAIN_COLORS.length - 1), color);
  });

  // Fill terrain
  ctx.beginPath();
  ctx.moveTo(terrain[0].x, terrain[0].y);
  for (let i = 1; i < terrain.length; i++) {
    ctx.lineTo(terrain[i].x, terrain[i].y);
  }
  ctx.lineTo(worldWidth, worldHeight);
  ctx.lineTo(0, worldHeight);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Surface line
  ctx.beginPath();
  ctx.moveTo(terrain[0].x, terrain[0].y);
  for (let i = 1; i < terrain.length; i++) {
    ctx.lineTo(terrain[i].x, terrain[i].y);
  }
  ctx.strokeStyle = TERRAIN_SURFACE;
  ctx.lineWidth = TERRAIN_SURFACE_WIDTH;
  ctx.stroke();
}

// ─── Tank ───────────────────────────────────────────────────────

function renderTank(
  ctx: CanvasRenderingContext2D,
  tank: Tank,
  isActive: boolean,
  phase: string,
  _viewport?: Viewport
): void {
  if (!tank.alive && phase !== 'menu') return;

  const { x, y, angle, color } = tank;
  const angleRad = angle * (Math.PI / 180);

  ctx.save();
  ctx.translate(x, y);

  // Active indicator glow
  if (isActive) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
  }

  // Tracks
  ctx.fillStyle = '#222';
  roundRect(ctx, -TANK_TRACKS_WIDTH / 2, 0, TANK_TRACKS_WIDTH, TANK_TRACKS_HEIGHT, 3);
  ctx.fill();

  // Body
  ctx.fillStyle = color;
  roundRect(ctx, -TANK_WIDTH / 2, -TANK_HEIGHT, TANK_WIDTH, TANK_HEIGHT, [4, 4, 0, 0]);
  ctx.fill();

  // Turret
  ctx.beginPath();
  ctx.arc(0, -TANK_HEIGHT, TANK_TURRET_RADIUS, Math.PI, 0);
  ctx.fillStyle = color;
  ctx.fill();

  // Barrel
  ctx.save();
  ctx.translate(0, -TANK_HEIGHT);
  ctx.rotate(angleRad);
  ctx.fillStyle = color;
  ctx.fillRect(0, -TANK_BARREL_WIDTH / 2, TANK_BARREL_LENGTH, TANK_BARREL_WIDTH);
  ctx.fillStyle = '#333';
  ctx.fillRect(TANK_BARREL_LENGTH, -TANK_BARREL_MOUTH_WIDTH / 2, TANK_BARREL_MOUTH_WIDTH, TANK_BARREL_MOUTH_HEIGHT);
  ctx.restore();

  ctx.shadowBlur = 0;

  // Name
  ctx.fillStyle = color;
  ctx.font = 'bold 8px "Courier New", monospace';
  ctx.textAlign = 'center';
  const nameY = isActive ? -TANK_HEIGHT - 25 : -TANK_HEIGHT - 15;
  ctx.fillText(tank.name, 0, nameY);

  // Active arrow
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

// ─── Helpers ────────────────────────────────────────────────────

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

// ─── Trajectory ─────────────────────────────────────────────────

function renderTrajectory(
  ctx: CanvasRenderingContext2D,
  tank: Tank,
  wind: number,
  viewport: Viewport | undefined,
  dimensions: CanvasDimensions
): void {
  const angleRad = tank.angle * (Math.PI / 180);
  const startX = tank.x + Math.cos(angleRad) * TANK_BARREL_LENGTH;
  const startY = tank.y - TANK_HEIGHT + Math.sin(angleRad) * TANK_BARREL_LENGTH;

  // Use world dimensions for trajectory calculation
  const worldDims: CanvasDimensions = viewport
    ? { width: viewport.worldWidth, height: viewport.worldHeight }
    : dimensions;

  const points = calculateTrajectory(startX, startY, tank.angle, tank.power, wind, worldDims);

  if (points.length < 2) return;

  ctx.save();
  ctx.setLineDash([3, 6]);
  ctx.strokeStyle = `${tank.color}44`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

// ─── Projectile ─────────────────────────────────────────────────

function renderProjectile(ctx: CanvasRenderingContext2D, projectile: { x: number; y: number; trail: Array<{ x: number; y: number }> }): void {
  // Trail
  projectile.trail.forEach((point, i) => {
    const alpha = (i / projectile.trail.length) * 0.5;
    ctx.fillStyle = `rgba(${TRAIL_COLOR}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Projectile ball
  ctx.save();
  ctx.shadowColor = PROJECTILE_SHADOW_COLOR;
  ctx.shadowBlur = PROJECTILE_SHADOW_BLUR;
  ctx.fillStyle = PROJECTILE_COLOR;
  ctx.beginPath();
  ctx.arc(projectile.x, projectile.y, PROJECTILE_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ─── Explosion ──────────────────────────────────────────────────

function renderExplosion(
  ctx: CanvasRenderingContext2D,
  explosion: { x: number; y: number; frame: number; particles: Array<{ x: number; y: number; size: number; color: string; life: number }> },
  _dimensions: CanvasDimensions
): void {
  const { x, y, frame, particles } = explosion;
  const progress = frame / EXPLOSION_DURATION_FRAMES;

  const maxRadius = EXPLOSION_RADIUS * 1.5;
  const radius = maxRadius * Math.sin(progress * Math.PI);
  const opacity = 1 - progress;

  ctx.save();
  ctx.globalAlpha = opacity;

  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, 'white');
  gradient.addColorStop(0.3, 'orange');
  gradient.addColorStop(0.6, 'red');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  particles.forEach(p => {
    ctx.globalAlpha = p.life * opacity;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

// ─── HUD: Wind Indicator (screen space) ─────────────────────────

function renderWindIndicator(ctx: CanvasRenderingContext2D, wind: number, dimensions: CanvasDimensions): void {
  const x = dimensions.width - 80;
  const y = 30;

  ctx.save();
  ctx.fillStyle = '#888';
  ctx.font = '8px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('WIND', x, y);

  const arrowLength = Math.abs(wind) * 25;
  const arrowX = wind >= 0 ? x - arrowLength : x + arrowLength;

  ctx.strokeStyle = '#88aaff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 8);
  ctx.lineTo(arrowX, y + 8);
  ctx.stroke();

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

// ─── HUD: Tank Count (screen space) ─────────────────────────────

function renderTankCount(ctx: CanvasRenderingContext2D, state: GameState, dimensions: CanvasDimensions): void {
  const aliveCount = state.tanks.filter(t => t.alive).length;

  ctx.save();
  ctx.fillStyle = '#666';
  ctx.font = '8px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${aliveCount} TANK${aliveCount !== 1 ? 'S' : ''}`, dimensions.width - 10, 15);
  ctx.restore();
}

// ─── Minimap ────────────────────────────────────────────────────

function renderMinimap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  viewport: Viewport,
  canvasDimensions: CanvasDimensions
): void {
  const mmWidth = MINIMAP_WIDTH;
  const mmHeight = MINIMAP_HEIGHT;
  const mmX = canvasDimensions.width - mmWidth - 8;
  const mmY = canvasDimensions.height - mmHeight - 8;
  const scaleX = mmWidth / viewport.worldWidth;

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(mmX, mmY, mmWidth, mmHeight);

  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(mmX, mmY, mmWidth, mmHeight);

  // Visible area indicator
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.strokeRect(
    mmX + viewport.x * scaleX,
    mmY,
    viewport.width * scaleX,
    mmHeight
  );

  // Tank dots
  state.tanks.forEach(tank => {
    if (!tank.alive) return;
    ctx.fillStyle = tank.color;
    ctx.fillRect(
      mmX + tank.x * scaleX - 1,
      mmY + mmHeight / 2 - 2,
      3,
      4
    );
  });
}

// ─── Cache Control ──────────────────────────────────────────────

export function clearStarsCache(): void {
  starsCache = null;
}
