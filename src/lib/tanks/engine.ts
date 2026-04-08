import { GameState, GameConfig, Tank, GamePhase, Particle, Explosion, CanvasDimensions, Viewport, AIDifficulty } from './types';
import { TANK_COLORS, TANK_NAMES } from './types';
import {
  TANK_LEFT_ANGLE,
  TANK_RIGHT_ANGLE,
  TANK_MARGIN_RATIO,
  TANK_HEIGHT,
  TANK_DEFAULT_POWER,
  TANK_BARREL_LENGTH,
  MIN_ANGLE,
  MAX_ANGLE,
  MIN_POWER,
  MAX_POWER,
  WIND_MIN,
  WIND_MAX,
  WIND_CHANGE_MIN,
  WIND_CHANGE_MAX,
  EXPLOSION_RADIUS,
  EXPLOSION_DURATION_FRAMES,
  EXPLOSION_PARTICLE_COUNT,
  EXPLOSION_PARTICLE_MIN_SIZE,
  EXPLOSION_PARTICLE_MAX_SIZE,
  EXPLOSION_PARTICLE_MIN_R,
  EXPLOSION_PARTICLE_MAX_R,
  EXPLOSION_PARTICLE_MIN_G,
  EXPLOSION_PARTICLE_MAX_G,
  EXPLOSION_PARTICLE_B,
  WORLD_SCALE_PORTRAIT,
  WORLD_SCALE_LANDSCAPE,
  CAMERA_SMOOTHING,
  CAMERA_PROJECTILE_SMOOTHING,
} from './constants';
import { generateTerrain, deformTerrain, getTerrainY, getTankPosition } from './terrain';
import { createProjectile, updateProjectile, checkCollision, isTankInRange } from './physics';
import { getAITarget, calculateAIShot, shouldAIFire, updateAIMemory, resetAIMemories } from './ai';
import { clearStarsCache } from './renderer';

export class TanksEngine {
  private state: GameState;
  private subscribers: Array<(state: GameState) => void> = [];
  private dimensions: CanvasDimensions = { width: 800, height: 600 };
  private aiThinkingFrames: number = 0;
  private aiShotDelayTimer: number | null = null;
  private aiHasProgrammedShot: boolean = false;
  private previousDimensions: CanvasDimensions | null = null;
  private lastAITargetId: number | null = null;
  private cameraOverride: boolean = false;
  private config: GameConfig;

  constructor(config: GameConfig, dimensions: CanvasDimensions = { width: 800, height: 600 }) {
    this.dimensions = dimensions;
    this.config = config;
    this.state = this.createInitialState(config);
  }

  // ─── World & Viewport helpers ──────────────────────────────────

  private calcWorldSize(dimensions: CanvasDimensions): { worldWidth: number; worldHeight: number } {
    const aspectRatio = dimensions.width / dimensions.height;
    const isLandscape = aspectRatio >= 1;
    const worldWidth = isLandscape
      ? dimensions.width * WORLD_SCALE_LANDSCAPE
      : dimensions.width * WORLD_SCALE_PORTRAIT;
    // In landscape, give terrain more vertical room for interesting hills
    const worldHeight = isLandscape
      ? dimensions.height * 1.5
      : dimensions.height;
    return { worldWidth, worldHeight };
  }

  // ─── Camera ────────────────────────────────────────────────────

  private updateCamera(): void {
    if (this.cameraOverride) return;
    const viewport = this.state.viewport;
    if (!viewport) return;
    const activeTank = this.state.tanks[this.state.activeTankIndex];
    if (!activeTank) return;

    let targetX: number;

    if (this.state.projectile?.active) {
      // Follow projectile directly (centered)
      targetX = this.state.projectile.x - viewport.width / 2;
      viewport.x += (targetX - viewport.x) * CAMERA_PROJECTILE_SMOOTHING;
    } else {
      // Follow active tank
      targetX = activeTank.x - viewport.width / 2;
      viewport.x += (targetX - viewport.x) * CAMERA_SMOOTHING;
    }

    // Clamp
    viewport.x = Math.max(0, Math.min(viewport.worldWidth - viewport.width, viewport.x));
  }

  // ─── State Creation ────────────────────────────────────────────

  private createInitialState(config: GameConfig): GameState {
    const { worldWidth, worldHeight } = this.calcWorldSize(this.dimensions);

    // Generate terrain for the full world
    const terrain = generateTerrain({ width: worldWidth, height: worldHeight });

    // Create tanks distributed across world width
    const tanks = this.createTanks(config, terrain, worldWidth);

    // Initial wind
    const wind = WIND_MIN + Math.random() * (WIND_MAX - WIND_MIN);

    // Viewport: initially center on first tank
    const viewport: Viewport = {
      x: 0,
      y: 0,
      width: this.dimensions.width,
      height: this.dimensions.height,
      worldWidth,
      worldHeight,
    };

    // Center viewport on first tank
    if (tanks.length > 0) {
      viewport.x = Math.max(0, Math.min(
        worldWidth - viewport.width,
        tanks[0].x - viewport.width / 2
      ));
    }

    return {
      phase: 'menu',
      mode: config.mode,
      tankCount: config.tankCount,
      tanks,
      activeTankIndex: 0,
      terrain,
      projectile: null,
      explosions: [],
      wind,
      winner: null,
      isDraw: false,
      viewport,
    };
  }

  private createTanks(config: GameConfig, terrain: Array<{ x: number; y: number }>, worldWidth: number): Tank[] {
    const tanks: Tank[] = [];
    const margin = worldWidth * TANK_MARGIN_RATIO;
    const playableWidth = worldWidth - (margin * 2);
    const spacing = playableWidth / (config.tankCount + 1);

    for (let i = 0; i < config.tankCount; i++) {
      const x = margin + spacing * (i + 1);

      // Get Y position from terrain
      const { y } = getTankPosition(terrain, x);

      // Determine if AI (mode 'ai': only tank 0 is human, rest are AI)
      const isAI = config.mode === 'ai' && i > 0;

      // Initial angle: left-facing tanks aim left, right-facing aim right
      const angle = x < worldWidth / 2 ? TANK_LEFT_ANGLE : TANK_RIGHT_ANGLE;

      tanks.push({
        id: i,
        name: TANK_NAMES[i],
        color: TANK_COLORS[i],
        x,
        y,
        angle,
        power: TANK_DEFAULT_POWER,
        alive: true,
        isAI,
      });
    }

    return tanks;
  }

  // ─── Public API ────────────────────────────────────────────────

  getState(): Readonly<GameState> {
    return { ...this.state };
  }

  subscribe(callback: (state: GameState) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notify(): void {
    this.subscribers.forEach(cb => cb({ ...this.state }));
  }

  reset(): void {
    this.state = this.createInitialState({
      mode: this.state.mode,
      tankCount: this.state.tankCount,
    });
    this.aiThinkingFrames = 0;
    this.aiHasProgrammedShot = false;
    this.lastAITargetId = null;
    if (this.aiShotDelayTimer) {
      clearTimeout(this.aiShotDelayTimer);
      this.aiShotDelayTimer = null;
    }
    clearStarsCache();
    this.notify();
  }

  setPhase(phase: GamePhase): void {
    this.state.phase = phase;
    this.notify();
  }

  startGame(config: GameConfig): void {
    this.config = config;
    this.state = this.createInitialState(config);
    this.state.phase = 'playing';
    this.aiThinkingFrames = 0;
    this.aiHasProgrammedShot = false;
    this.lastAITargetId = null;
    resetAIMemories();
    clearStarsCache();
    this.notify();

    // If first tank is AI, start AI thinking
    const firstTank = this.state.tanks[0];
    if (firstTank.isAI) {
      this.startAIThinking();
    }
  }

  setTankAngle(tankId: number, angle: number): void {
    const tank = this.state.tanks.find(t => t.id === tankId);
    if (!tank) return;
    tank.angle = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, angle));
    this.notify();
  }

  setTankPower(tankId: number, power: number): void {
    const tank = this.state.tanks.find(t => t.id === tankId);
    if (!tank) return;
    tank.power = Math.max(MIN_POWER, Math.min(MAX_POWER, power));
    this.notify();
  }

  fire(): void {
    if (this.state.phase !== 'playing' || this.state.projectile?.active) return;

    const activeTank = this.state.tanks[this.state.activeTankIndex];
    if (!activeTank || !activeTank.alive) return;

    this.state.projectile = createProjectile(activeTank, this.state.wind, this.dimensions);
    this.notify();
  }

  update(): void {
    if (this.state.phase === 'playing') {
      this.updatePlaying();
    } else if (this.state.phase === 'exploding') {
      this.updateExploding();
    }
  }

  // ─── Update Loop ───────────────────────────────────────────────

  private updatePlaying(): void {
    // Update camera
    this.updateCamera();

    // Check AI turn
    const activeTank = this.state.tanks[this.state.activeTankIndex];
    if (activeTank && activeTank.isAI && !this.state.projectile?.active) {
      this.updateAI();
    }

    // Update projectile
    if (this.state.projectile?.active) {
      updateProjectile(this.state.projectile, this.state.wind, this.dimensions);

      // Check collision using world dimensions
      const worldWidth = this.state.viewport?.worldWidth ?? this.dimensions.width;
      const worldHeight = this.state.viewport?.worldHeight ?? this.dimensions.height;
      const collision = checkCollision(
        this.state.projectile,
        this.state.terrain,
        { width: worldWidth, height: worldHeight }
      );
      if (collision.collided) {
        this.handleExplosion(collision.x, collision.y);
      }
    }
  }

  // ─── AI Logic ──────────────────────────────────────────────────

  private updateAI(): void {
    this.aiThinkingFrames++;

    if (shouldAIFire(this.aiThinkingFrames) && !this.aiHasProgrammedShot) {
      const shooterTank = this.state.tanks[this.state.activeTankIndex];
      const target = getAITarget(this.state, shooterTank);
      if (target) {
        const difficulty: AIDifficulty = this.config.aiDifficulty ?? 'normal';
        const worldWidth = this.state.viewport?.worldWidth ?? this.dimensions.width;
        const worldHeight = this.state.viewport?.worldHeight ?? this.dimensions.height;

        const shot = calculateAIShot(
          shooterTank, target, this.state.wind,
          this.state.terrain, worldWidth, worldHeight, difficulty
        );

        this.lastAITargetId = target.id;
        this.aiHasProgrammedShot = true;

        if (this.aiShotDelayTimer) {
          clearTimeout(this.aiShotDelayTimer);
        }
        this.aiShotDelayTimer = window.setTimeout(() => {
          this.state.tanks[this.state.activeTankIndex].angle = shot.angle;
          this.state.tanks[this.state.activeTankIndex].power = shot.power;
          this.fire();
          this.aiThinkingFrames = 0;
          this.aiShotDelayTimer = null;
          this.aiHasProgrammedShot = false;
        }, 300);
      }
    }
  }

  private startAIThinking(): void {
    this.aiThinkingFrames = 0;
    this.aiHasProgrammedShot = false;
  }

  // ─── Explosions ────────────────────────────────────────────────

  private handleExplosion(x: number, y: number): void {
    const shooterTank = this.state.tanks[this.state.activeTankIndex];

    // Deactivate projectile
    if (this.state.projectile) {
      this.state.projectile.active = false;
    }

    // Create explosion
    const explosion = this.createExplosion(x, y);
    this.state.explosions.push(explosion);

    // Deform terrain
    this.state.terrain = deformTerrain(this.state.terrain, x, y, EXPLOSION_RADIUS);

    // Check for tank deaths
    this.state.tanks.forEach(tank => {
      if (tank.alive && isTankInRange(tank, x, y, EXPLOSION_RADIUS)) {
        tank.alive = false;
        const tankExplosion = this.createExplosion(tank.x, tank.y);
        this.state.explosions.push(tankExplosion);
      }
    });

    // Recalculate Y positions for alive tanks
    this.state.tanks.forEach(tank => {
      if (tank.alive) {
        const { y: newY } = getTankPosition(this.state.terrain, tank.x);
        tank.y = newY;
      }
    });

    // Update AI memory
    if (shooterTank.isAI && this.lastAITargetId !== null) {
      const target = this.state.tanks.find(t => t.id === this.lastAITargetId);
      if (target) {
        updateAIMemory(
          shooterTank.id,
          target.id,
          shooterTank.angle,
          shooterTank.power,
          x, y,
          target.x, target.y
        );
      }
      this.lastAITargetId = null;
    }

    // Change phase
    this.state.phase = 'exploding';
    this.notify();
  }

  private createExplosion(x: number, y: number): Explosion {
    const particles: Particle[] = [];

    for (let i = 0; i < EXPLOSION_PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      const r = EXPLOSION_PARTICLE_MIN_R + Math.random() * (EXPLOSION_PARTICLE_MAX_R - EXPLOSION_PARTICLE_MIN_R);
      const g = EXPLOSION_PARTICLE_MIN_G + Math.random() * (EXPLOSION_PARTICLE_MAX_G - EXPLOSION_PARTICLE_MIN_G);

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: EXPLOSION_PARTICLE_MIN_SIZE + Math.random() * (EXPLOSION_PARTICLE_MAX_SIZE - EXPLOSION_PARTICLE_MIN_SIZE),
        color: `rgb(${r}, ${g}, ${EXPLOSION_PARTICLE_B})`,
        life: 0.5 + Math.random() * 0.5,
      });
    }

    return {
      x,
      y,
      frame: 0,
      particles,
    };
  }

  private updateExploding(): void {
    let allFinished = true;

    this.state.explosions.forEach(explosion => {
      explosion.frame++;

      explosion.particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.15;
        particle.life -= 0.02;
      });

      if (explosion.frame < EXPLOSION_DURATION_FRAMES) {
        allFinished = false;
      }
    });

    if (allFinished) {
      this.state.explosions = [];
      this.nextTurn();
    }

    this.notify();
  }

  private nextTurn(): void {
    // Update wind
    this.state.wind += WIND_CHANGE_MIN + Math.random() * (WIND_CHANGE_MAX - WIND_CHANGE_MIN);
    this.state.wind = Math.max(WIND_MIN, Math.min(WIND_MAX, this.state.wind));

    // Check win condition
    const aliveTanks = this.state.tanks.filter(t => t.alive);
    if (aliveTanks.length <= 1) {
      this.state.phase = 'gameover';
      if (aliveTanks.length === 1) {
        this.state.winner = aliveTanks[0];
        this.state.isDraw = false;
      } else {
        this.state.winner = null;
        this.state.isDraw = true;
      }
      this.notify();
      return;
    }

    // Find next alive tank
    let nextIndex = this.state.activeTankIndex;
    do {
      nextIndex = (nextIndex + 1) % this.state.tanks.length;
    } while (!this.state.tanks[nextIndex].alive);

    this.state.activeTankIndex = nextIndex;
    this.state.phase = 'playing';

    if (this.state.tanks[nextIndex].isAI) {
      this.startAIThinking();
    }

    this.notify();
  }

  // ─── Queries ───────────────────────────────────────────────────

  getTerrainY(x: number): number {
    return getTerrainY(this.state.terrain, x);
  }

  getTerrainAngle(x: number): number {
    const offset = 3;
    const y1 = getTerrainY(this.state.terrain, x - offset);
    const y2 = getTerrainY(this.state.terrain, x + offset);
    return Math.atan2(y2 - y1, offset * 2);
  }

  isPositionValid(x: number, y: number): boolean {
    return y < this.getTerrainY(x);
  }

  isAnimating(): boolean {
    return this.state.phase === 'playing' || this.state.phase === 'exploding';
  }

  getAITarget(): Tank | null {
    const activeTank = this.state.tanks[this.state.activeTankIndex];
    if (!activeTank || !activeTank.isAI) return null;
    return getAITarget(this.state, activeTank);
  }

  // ─── Dimensions / Resize ───────────────────────────────────────

  updateDimensions(dimensions: CanvasDimensions): void {
    this.dimensions = dimensions;

    const viewport = this.state.viewport;
    if (viewport) {
      // Update viewport canvas dimensions (world stays the same)
      viewport.width = dimensions.width;
      viewport.height = dimensions.height;

      // Clamp camera position
      viewport.x = Math.max(0, Math.min(viewport.worldWidth - viewport.width, viewport.x));
    }

    // Scale terrain points proportionally to preserve deformations
    if (!this.previousDimensions || this.previousDimensions.width === 0 || this.previousDimensions.height === 0) {
      // Full regeneration needed (we can't because we'd lose world scale)
      // Instead, recalculate world and regenerate terrain
      const { worldWidth, worldHeight } = this.calcWorldSize(dimensions);
      this.state.terrain = generateTerrain({ width: worldWidth, height: worldHeight });

      // Update viewport world size
      if (viewport) {
        viewport.worldWidth = worldWidth;
        viewport.worldHeight = worldHeight;
        viewport.x = Math.max(0, Math.min(worldWidth - viewport.width, viewport.x));
      }

      // Redistribute tanks across new world
      const margin = worldWidth * TANK_MARGIN_RATIO;
      const playableWidth = worldWidth - (margin * 2);
      const spacing = playableWidth / (this.state.tankCount + 1);
      this.state.tanks.forEach((tank, i) => {
        tank.x = margin + spacing * (i + 1);
      });
    } else {
      // Proportional scaling
      const scaleX = dimensions.width / this.previousDimensions.width;
      const scaleY = dimensions.height / this.previousDimensions.height;

      this.state.terrain = this.state.terrain.map(point => ({
        x: point.x * scaleX,
        y: point.y * scaleY,
      }));

      // Scale tank X positions
      this.state.tanks.forEach(tank => {
        tank.x *= scaleX;
      });

      // Update viewport
      if (viewport) {
        viewport.worldWidth *= scaleX;
        viewport.worldHeight *= scaleY;
        viewport.x = Math.max(0, Math.min(viewport.worldWidth - viewport.width, viewport.x));
      }
    }

    this.previousDimensions = { ...dimensions };

    // Recalculate tank Y positions
    this.state.tanks.forEach(tank => {
      const { y } = getTankPosition(this.state.terrain, tank.x);
      tank.y = y;
    });

    clearStarsCache();
    this.notify();
  }

  // ─── Touch / Aim ───────────────────────────────────────────────

  setAngleFromPosition(tankId: number, touchX: number, touchY: number, canvasRect: DOMRect): void {
    const tank = this.state.tanks.find(t => t.id === tankId);
    if (!tank || tank.isAI || !tank.alive) return;
    if (this.state.projectile?.active) return;

    // Convert touch position to canvas coordinates + camera offset
    const camX = this.state.viewport?.x ?? 0;
    const canvasX = (touchX - canvasRect.left) + camX;
    const canvasY = touchY - canvasRect.top;

    // Calculate angle from tank to touch point
    const aimOriginX = tank.x;
    const aimOriginY = tank.y - TANK_HEIGHT;

    const angleRad = Math.atan2(canvasY - aimOriginY, canvasX - aimOriginX);
    let angleDeg = angleRad * (180 / Math.PI);

    angleDeg = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, angleDeg));

    tank.angle = angleDeg;
    this.notify();
  }

  // ─── Camera: Minimap click/drag ────────────────────────────────

  setCameraPosition(worldX: number): void {
    const viewport = this.state.viewport;
    if (!viewport) return;
    if (this.state.projectile?.active) return;

    this.cameraOverride = true;
    viewport.x = worldX - viewport.width / 2;
    // Clamp
    viewport.x = Math.max(0, Math.min(viewport.worldWidth - viewport.width, viewport.x));
  }

  clearCameraOverride(): void {
    this.cameraOverride = false;
  }

  // ─── Camera Pan (swipe exploration) ────────────────────────────

  panCamera(worldDeltaX: number): void {
    const viewport = this.state.viewport;
    if (!viewport) return;
    viewport.x += worldDeltaX;
    // Clamp
    viewport.x = Math.max(0, Math.min(viewport.worldWidth - viewport.width, viewport.x));
  }

  // ─── Testing ───────────────────────────────────────────────────

  isProjectileActive(): boolean {
    return !!this.state.projectile?.active;
  }

  executeAIShot(): void {
    const activeTank = this.state.tanks[this.state.activeTankIndex];
    if (!activeTank || !activeTank.isAI) return;

    const target = getAITarget(this.state, activeTank);
    if (!target) return;

    const difficulty: AIDifficulty = this.config.aiDifficulty ?? 'normal';
    const worldWidth = this.state.viewport?.worldWidth ?? this.dimensions.width;
    const worldHeight = this.state.viewport?.worldHeight ?? this.dimensions.height;

    const shot = calculateAIShot(
      activeTank, target, this.state.wind,
      this.state.terrain, worldWidth, worldHeight, difficulty
    );
    activeTank.angle = shot.angle;
    activeTank.power = shot.power;
    this.fire();
  }
}
