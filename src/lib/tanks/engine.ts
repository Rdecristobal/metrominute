import { GameState, GameConfig, Tank, GamePhase, Particle, Explosion, CanvasDimensions } from './types';
import { TANK_COLORS, TANK_NAMES } from './types';
import {
  TANK_LEFT_ANGLE,
  TANK_RIGHT_ANGLE,
  TANK_MARGIN_RATIO,
  TANK_HEIGHT,
  TANK_DEFAULT_POWER,
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
} from './constants';
import { generateTerrain, deformTerrain, getTerrainY, getTankPosition, generateStars } from './terrain';
import { createProjectile, updateProjectile, checkCollision, isTankInRange } from './physics';
import { getAITarget, calculateAIShot, shouldAIFire } from './ai';
import { clearStarsCache } from './renderer';

export class TanksEngine {
  private state: GameState;
  private subscribers: Array<(state: GameState) => void> = [];
  private dimensions: CanvasDimensions = { width: 800, height: 600 };
  private aiThinkingFrames: number = 0;
  private aiShotDelayTimer: number | null = null;
  private aiHasProgrammedShot: boolean = false;
  private previousDimensions: CanvasDimensions | null = null;

  constructor(config: GameConfig, dimensions: CanvasDimensions = { width: 800, height: 600 }) {
    this.dimensions = dimensions;
    this.state = this.createInitialState(config);
  }

  // Create initial game state
  private createInitialState(config: GameConfig): GameState {
    // Generate terrain
    const terrain = generateTerrain(this.dimensions);

    // Create tanks
    const tanks = this.createTanks(config, terrain);

    // Initial wind
    const wind = WIND_MIN + Math.random() * (WIND_MAX - WIND_MIN);

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
    };
  }

  // Create tanks for the game
  private createTanks(config: GameConfig, terrain: Array<{ x: number; y: number }>): Tank[] {
    const tanks: Tank[] = [];
    const margin = this.dimensions.width * TANK_MARGIN_RATIO;
    const playableWidth = this.dimensions.width - (margin * 2);
    const spacing = playableWidth / (config.tankCount + 1);

    for (let i = 0; i < config.tankCount; i++) {
      const x = margin + spacing * (i + 1);

      // Get Y position from terrain
      const { y } = getTankPosition(terrain, x);

      // Determine if AI (mode 'ai': only tank 0 is human, rest are AI)
      const isAI = config.mode === 'ai' && i > 0;

      // Initial angle: left-facing tanks aim left, right-facing aim right
      const angle = x < this.dimensions.width / 2 ? TANK_LEFT_ANGLE : TANK_RIGHT_ANGLE;

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

  // Get current game state (read-only)
  getState(): Readonly<GameState> {
    return { ...this.state };
  }

  // Subscribe to state changes
  subscribe(callback: (state: GameState) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  // Notify all subscribers of state change
  private notify(): void {
    this.subscribers.forEach(cb => cb({ ...this.state }));
  }

  // Reset the game
  reset(): void {
    this.state = this.createInitialState({
      mode: this.state.mode,
      tankCount: this.state.tankCount,
    });
    this.aiThinkingFrames = 0;
    this.aiHasProgrammedShot = false;
    if (this.aiShotDelayTimer) {
      clearTimeout(this.aiShotDelayTimer);
      this.aiShotDelayTimer = null;
    }
    clearStarsCache();
    this.notify();
  }

  // Set game phase
  setPhase(phase: GamePhase): void {
    this.state.phase = phase;
    this.notify();
  }

  // Start game with given config
  startGame(config: GameConfig): void {
    this.state = this.createInitialState(config);
    this.state.phase = 'playing';
    this.aiThinkingFrames = 0;
    this.aiHasProgrammedShot = false;
    clearStarsCache();
    this.notify();

    // If first tank is AI, start AI thinking
    const firstTank = this.state.tanks[0];
    if (firstTank.isAI) {
      this.startAIThinking();
    }
  }

  // Set tank angle
  setTankAngle(tankId: number, angle: number): void {
    const tank = this.state.tanks.find(t => t.id === tankId);
    if (!tank) return;

    // Clamp angle
    tank.angle = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, angle));
    this.notify();
  }

  // Set tank power
  setTankPower(tankId: number, power: number): void {
    const tank = this.state.tanks.find(t => t.id === tankId);
    if (!tank) return;

    // Clamp power
    tank.power = Math.max(MIN_POWER, Math.min(MAX_POWER, power));
    this.notify();
  }

  // Fire projectile
  fire(): void {
    if (this.state.phase !== 'playing' || this.state.projectile?.active) return;

    const activeTank = this.state.tanks[this.state.activeTankIndex];
    if (!activeTank || !activeTank.alive) return;

    this.state.projectile = createProjectile(activeTank, this.state.wind, this.dimensions);
    this.notify();
  }

  // Update game state (called each frame)
  update(): void {
    if (this.state.phase === 'playing') {
      this.updatePlaying();
    } else if (this.state.phase === 'exploding') {
      this.updateExploding();
    }
  }

  // Update playing phase
  private updatePlaying(): void {
    // Check AI turn
    const activeTank = this.state.tanks[this.state.activeTankIndex];
    if (activeTank && activeTank.isAI && !this.state.projectile?.active) {
      this.updateAI();
    }

    // Update projectile
    if (this.state.projectile?.active) {
      updateProjectile(this.state.projectile, this.state.wind, this.dimensions);

      // Check collision
      const collision = checkCollision(this.state.projectile, this.state.terrain, this.dimensions);
      if (collision.collided) {
        this.handleExplosion(collision.x, collision.y);
      }
    }
  }

  // Update AI logic
  private updateAI(): void {
    this.aiThinkingFrames++;

    if (shouldAIFire(this.aiThinkingFrames) && !this.aiHasProgrammedShot) {
      // Calculate shot after thinking delay
      const target = getAITarget(this.state, this.state.tanks[this.state.activeTankIndex]);
      if (target) {
        const shot = calculateAIShot(this.state.tanks[this.state.activeTankIndex], target, this.state.wind);

        // Mark that we've programmed a shot to prevent multiple setTimeout calls
        this.aiHasProgrammedShot = true;

        // Apply AI shot after additional delay
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

  // Start AI thinking
  private startAIThinking(): void {
    this.aiThinkingFrames = 0;
    this.aiHasProgrammedShot = false;
  }

  // Handle explosion
  private handleExplosion(x: number, y: number): void {
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
        // Create secondary explosion at tank position
        const tankExplosion = this.createExplosion(tank.x, tank.y);
        this.state.explosions.push(tankExplosion);
      }
    });

    // Recalculate Y positions for alive tanks
    this.state.tanks.forEach(tank => {
      if (tank.alive) {
        const { y } = getTankPosition(this.state.terrain, tank.x);
        tank.y = y;
      }
    });

    // Change phase to exploding
    this.state.phase = 'exploding';
    this.notify();
  }

  // Create explosion
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

  // Update exploding phase
  private updateExploding(): void {
    let allFinished = true;

    this.state.explosions.forEach(explosion => {
      explosion.frame++;

      // Update particles
      explosion.particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.15; // Gravity
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

  // Move to next turn
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

    // Reset AI thinking if next tank is AI
    if (this.state.tanks[nextIndex].isAI) {
      this.startAIThinking();
    }

    this.notify();
  }

  // Get terrain Y at X
  getTerrainY(x: number): number {
    return getTerrainY(this.state.terrain, x);
  }

  // Get terrain angle at X
  getTerrainAngle(x: number): number {
    const offset = 3;
    const y1 = getTerrainY(this.state.terrain, x - offset);
    const y2 = getTerrainY(this.state.terrain, x + offset);
    return Math.atan2(y2 - y1, offset * 2);
  }

  // Check if position is valid (for collision detection)
  isPositionValid(x: number, y: number): boolean {
    return y < this.getTerrainY(x);
  }

  // Update canvas dimensions
  updateDimensions(dimensions: CanvasDimensions): void {
    this.dimensions = dimensions;

    // Only regenerate terrain if previous dimensions were invalid (0x0)
    // Otherwise, scale terrain points proportionally to preserve deformations
    if (!this.previousDimensions || this.previousDimensions.width === 0 || this.previousDimensions.height === 0) {
      // Initial terrain generation or previous dimensions were invalid
      this.state.terrain = generateTerrain(dimensions);
    } else {
      // Scale terrain points proportionally to preserve deformations
      const scaleX = dimensions.width / this.previousDimensions.width;
      const scaleY = dimensions.height / this.previousDimensions.height;

      this.state.terrain = this.state.terrain.map(point => ({
        x: point.x * scaleX,
        y: point.y * scaleY,
      }));
    }

    // Store current dimensions for next update
    this.previousDimensions = { ...dimensions };

    // Recalculate tank positions
    this.state.tanks.forEach(tank => {
      const { y } = getTankPosition(this.state.terrain, tank.x);
      tank.y = y;
    });

    clearStarsCache();
    this.notify();
  }

  // Check if currently animating
  isAnimating(): boolean {
    return this.state.phase === 'playing' || this.state.phase === 'exploding';
  }

  // Set angle from touch/pointer position
  setAngleFromPosition(tankId: number, touchX: number, touchY: number, canvasRect: DOMRect): void {
    const tank = this.state.tanks.find(t => t.id === tankId);
    if (!tank || tank.isAI || !tank.alive) return;
    if (this.state.projectile?.active) return;

    // Convert touch position to canvas coordinates
    const canvasX = touchX - canvasRect.left;
    const canvasY = touchY - canvasRect.top;

    // Calculate angle from tank to touch point
    // Tank center for aim: (tank.x, tank.y - TANK_HEIGHT)
    const aimOriginX = tank.x;
    const aimOriginY = tank.y - TANK_HEIGHT;

    const angleRad = Math.atan2(canvasY - aimOriginY, canvasX - aimOriginX);
    let angleDeg = angleRad * (180 / Math.PI);

    // Clamp to valid range (-175 to -5, only upward angles)
    angleDeg = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, angleDeg));

    tank.angle = angleDeg;
    this.notify();
  }

  // Get AI target (for debugging/testing)
  getAITarget(): Tank | null {
    const activeTank = this.state.tanks[this.state.activeTankIndex];
    if (!activeTank || !activeTank.isAI) return null;
    return getAITarget(this.state, activeTank);
  }

  // Execute AI shot immediately (for testing)
  executeAIShot(): void {
    const activeTank = this.state.tanks[this.state.activeTankIndex];
    if (!activeTank || !activeTank.isAI) return;

    const target = getAITarget(this.state, activeTank);
    if (!target) return;

    const shot = calculateAIShot(activeTank, target, this.state.wind);
    activeTank.angle = shot.angle;
    activeTank.power = shot.power;
    this.fire();
  }
}
