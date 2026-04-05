// Mode of game
export type GameMode = 'ai' | 'local';

// Phase of game
export type GamePhase = 'menu' | 'setup' | 'playing' | 'exploding' | 'gameover';

// Tank colors
export const TANK_COLORS = [
  '#ff2d78', // Alpha (magenta-rosa)
  '#00e5ff', // Bravo (cyan)
  '#ffdd00', // Charlie (amarillo)
  '#7cff00', // Delta (verde lima)
  '#ff6b00', // Echo (naranja)
  '#b44dff', // Foxtrot (púrpura)
  '#ff4444', // Golf (rojo)
  '#00ffa3', // Hotel (turquesa)
] as const;

export type TankColor = typeof TANK_COLORS[number];

// Tank names
export const TANK_NAMES = [
  'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'
] as const;

export type TankName = typeof TANK_NAMES[number];

// Tank
export interface Tank {
  id: number;
  name: TankName;
  color: TankColor;
  x: number;          // Position X on terrain
  y: number;          // Position Y (calculated from terrain)
  angle: number;      // Cannon angle (-175° to -5°)
  power: number;      // Power (10-100)
  alive: boolean;     // Life state
  isAI: boolean;      // If controlled by AI
}

// Terrain point
export interface TerrainPoint {
  x: number;
  y: number;
}

// Projectile
export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];  // Last 50 positions
  active: boolean;
}

// Explosion particle
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;        // 0.0 to 1.0
}

// Explosion
export interface Explosion {
  x: number;
  y: number;
  frame: number;      // 0 to 45
  particles: Particle[];
}

// Game state
export interface GameState {
  phase: GamePhase;
  mode: GameMode;
  tankCount: number;
  tanks: Tank[];
  activeTankIndex: number;
  terrain: TerrainPoint[];
  projectile: Projectile | null;
  explosions: Explosion[];
  wind: number;       // -2.0 to +2.0
  winner: Tank | null;
  isDraw: boolean;
}

// Initial configuration
export interface GameConfig {
  mode: GameMode;
  tankCount: number;  // 2-6 tanks
}

// Canvas dimensions
export interface CanvasDimensions {
  width: number;
  height: number;
}
