// Terrain
export const TERRAIN_POINTS = 60;
export const TERRAIN_BASE_Y_RATIO = 0.55;
export const TERRAIN_MIN_Y_RATIO = 0.2;
export const TERRAIN_MAX_Y_RATIO = 0.85;
export const TERRAIN_FLAT_PROBABILITY = 0.15;
export const TERRAIN_FLAT_MIN_SEGMENT = 3;
export const TERRAIN_FLAT_MAX_SEGMENT = 57;

// Terrain waves (frequency, amplitude)
export const TERRAIN_WAVES = [
  { freq: 1.0, amp: 0.12 },  // Large hills
  { freq: 2.3, amp: 0.07 },  // Medium hills
  { freq: 5.1, amp: 0.03 },  // Fine roughness
  { freq: 0.4, amp: 0.08 },  // Slow undulation
] as const;

// Tanks
export const TANK_WIDTH = 20;
export const TANK_HEIGHT = 11;
export const TANK_TRACKS_WIDTH = 22;
export const TANK_TRACKS_HEIGHT = 5;
export const TANK_TURRET_RADIUS = 6;
export const TANK_BARREL_LENGTH = 15;
export const TANK_BARREL_WIDTH = 3;
export const TANK_BARREL_MOUTH_WIDTH = 5;
export const TANK_BARREL_MOUTH_HEIGHT = 3;
export const TANK_MARGIN_RATIO = 0.06;
export const TANK_JITTER_RATIO = 0.15;
export const TANK_LEFT_ANGLE = -60;
export const TANK_RIGHT_ANGLE = -120;
export const TANK_DEFAULT_POWER = 50;

// Projectile
export const PROJECTILE_SPEED_FACTOR = 0.12;
export const PROJECTILE_RADIUS = 3;
export const PROJECTILE_TRAIL_LENGTH = 50;
export const GRAVITY = 0.15;
export const WIND_FACTOR = 0.002;

// Explosion
export const EXPLOSION_RADIUS = 35;
export const EXPLOSION_DURATION_FRAMES = 45;
export const EXPLOSION_PARTICLE_COUNT = 20;
export const EXPLOSION_DEFORMATION_FACTOR = 0.5;

// Physics
export const MAX_ANGLE = -5;
export const MIN_ANGLE = -175;
export const MAX_POWER = 100;
export const MIN_POWER = 10;

// AI
export const AI_THINKING_DELAY_FRAMES = 75;
export const AI_ADDITIONAL_DELAY_MS = 300;
export const AI_LOBBING_ANGLE_MIN = 20;
export const AI_LOBBING_ANGLE_MAX = 35;
export const AI_POWER_DISTANCE_FACTOR = 0.18;
export const AI_POWER_RANDOM_RANGE = 7;
export const AI_WIND_COMPENSATION_FACTOR = 8;
export const AI_IMPRECISION_ANGLE = 6;
export const AI_IMPRECISION_POWER = 5;
export const AI_POWER_MIN = 25;
export const AI_POWER_MAX = 95;
export const AI_ANGLE_MIN = -170;
export const AI_ANGLE_MAX = -10;

// Wind
export const WIND_MIN = -2.0;
export const WIND_MAX = 2.0;
export const WIND_CHANGE_MIN = -0.25;
export const WIND_CHANGE_MAX = 0.25;

// Colors
export const SKY_TOP = '#0a0a0f';
export const SKY_MID = '#111122';
export const SKY_BOTTOM = '#1a1a2e';
export const STARS_COUNT = 60;
export const STARS_MIN_RADIUS = 0.3;
export const STARS_MAX_RADIUS = 1.8;
export const STARS_MIN_OPACITY = 0.3;
export const STARS_MAX_OPACITY = 0.8;
export const STAR_SEED = 42;

export const TERRAIN_COLORS = ['#2d5016', '#3a6b1e', '#4a3520', '#2a1a0a'];
export const TERRAIN_SURFACE = '#5a8a2a';
export const TERRAIN_SURFACE_WIDTH = 2;

// Projectile
export const PROJECTILE_COLOR = '#ffffff';
export const PROJECTILE_SHADOW_COLOR = '#ff8800';
export const PROJECTILE_SHADOW_BLUR = 10;
export const TRAIL_COLOR = '255, 200, 50'; // RGB for rgba

// Explosion
export const EXPLOSION_PARTICLE_MIN_SIZE = 1;
export const EXPLOSION_PARTICLE_MAX_SIZE = 4;
export const EXPLOSION_PARTICLE_MIN_R = 200;
export const EXPLOSION_PARTICLE_MAX_R = 255;
export const EXPLOSION_PARTICLE_MIN_G = 0;
export const EXPLOSION_PARTICLE_MAX_G = 150;
export const EXPLOSION_PARTICLE_B = 0;

// UI
export const HUD_HEIGHT = 44;
export const STATUS_BAR_HEIGHT = 32;

// Menu colors
export const MENU_AI_COLOR = '#ff2d78';
export const MENU_AI_BORDER = '#ff2d7844';
export const MENU_MULTIPLAYER_COLOR = '#00e5ff';
export const MENU_MULTIPLAYER_BORDER = '#00e5ff44';
export const MENU_BACKGROUND = '#0a0a0f';
export const MENU_GLOW = 'rgba(255,45,120,0.08)';

// Text colors
export const TEXT_TITLE = 'text-white';
export const TEXT_MUTED = '#555';
export const TEXT_MUTED_DARK = '#333';
export const TEXT_MUTED_LIGHTER = '#666';
export const TEXT_MUTED_LIGHTER_DARK = '#444';
