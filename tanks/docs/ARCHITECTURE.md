# Tanks — Arquitectura del Juego

**Proyecto:** MetroMinute Hub  
**Juego:** Tanks (Artillery Warfare)  
**Fecha:** 2026-04-05  
**Versión:** 1.0

---

## 1. Resumen Ejecutivo

Tanks es un juego de artillería por turnos en 2D que se integra como tercer minijuego en MetroMinute Hub. El juego utiliza Canvas API para el rendering del gameplay y React + Tailwind para las pantallas UI. La arquitectura sigue los patrones establecidos por los juegos existentes (Bubbles, Football Stop) para mantener consistencia en el código.

**Stack Tecnológico:**
- Next.js 14+ (App Router)
- TypeScript
- Canvas API (gameplay)
- Tailwind CSS (UI chrome)
- React Hooks (useState, useEffect, useRef, useCallback)

---

## 2. Estructura de Archivos

```
src/app/tanks/
├── page.tsx                          # Ruta principal /tanks
├── layout.tsx                        # Layout opcional del juego
└── components/                       # Subdirectorio de componentes

src/components/tanks/
├── TanksGame.tsx                     # Componente principal del juego
├── MenuScreen.tsx                    # Pantalla de menú principal
├── SetupScreen.tsx                   # Pantalla de configuración (nº tanques)
├── GameScreen.tsx                    # Pantalla de partida (canvas + HUD + barra estado)
├── GameOverScreen.tsx                # Pantalla de resultado final
└── ui/                              # Componentes UI reutilizables
    ├── TankIndicator.tsx             # Indicador de tanque en barra estado
    └── WindIndicator.tsx             # Indicador de viento

src/lib/tanks/
├── engine.ts                        # Motor del juego (lógica pura)
├── types.ts                         # Tipos TypeScript específicos
├── physics.ts                       # Sistema de física (proyectiles, colisiones)
├── terrain.ts                       # Generación y deformación de terreno
├── ai.ts                            # Lógica de inteligencia artificial
├── renderer.ts                      # Canvas rendering
├── audio.ts                         # Sistema de sonido (opcional)
└── constants.ts                     # Constantes (colores, dimensiones, etc.)

src/types/game.ts                    # (EXISTENTE) Tipo Game base
src/lib/games.ts                     # (EXISTENTE) Registro de juegos
```

---

## 3. Tipos TypeScript

### 3.1 Tipos del Juego (`src/lib/tanks/types.ts`)

```typescript
// Modo de juego
export type GameMode = 'ai' | 'local';

// Fase del juego
export type GamePhase = 'menu' | 'setup' | 'playing' | 'exploding' | 'gameover';

// Colores de tanques
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

// Nombres de tanques
export const TANK_NAMES = [
  'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'
] as const;

export type TankName = typeof TANK_NAMES[number];

// Tanque
export interface Tank {
  id: number;
  name: TankName;
  color: TankColor;
  x: number;          // Posición X en el terreno
  y: number;          // Posición Y (calculada desde terreno)
  angle: number;      // Ángulo del cañón (-175° a -5°)
  power: number;      // Potencia (10-100)
  alive: boolean;     // Estado de vida
  isAI: boolean;      // Si es controlado por IA
}

// Punto del terreno
export interface TerrainPoint {
  x: number;
  y: number;
}

// Proyectil
export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];  // Últimas 50 posiciones
  active: boolean;
}

// Partícula de explosión
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;        // 0.0 a 1.0
}

// Explosión
export interface Explosion {
  x: number;
  y: number;
  frame: number;      // 0 a 45
  particles: Particle[];
}

// Estado del juego
export interface GameState {
  phase: GamePhase;
  mode: GameMode;
  tankCount: number;
  tanks: Tank[];
  activeTankIndex: number;
  terrain: TerrainPoint[];
  projectile: Projectile | null;
  explosions: Explosion[];
  wind: number;       // -2.0 a +2.0
  winner: Tank | null;
  isDraw: boolean;
}

// Configuración inicial
export interface GameConfig {
  mode: GameMode;
  tankCount: number;  // 2-6 tanques
}
```

### 3.2 Contrato del Engine (`src/lib/tanks/engine.ts`)

```typescript
export class TanksEngine {
  constructor(config: GameConfig);
  
  // Estado y control
  getState(): Readonly<GameState>;
  subscribe(callback: (state: GameState) => void): () => void;
  reset(): void;
  
  // Controles
  setTankAngle(tankId: number, angle: number): void;
  setTankPower(tankId: number, power: number): void;
  fire(): void;
  
  // Game loop
  update(): void;           // Llamado por requestAnimationFrame
  isAnimating(): boolean;
  
  // Consultas
  getTerrainY(x: number): number;
  getTerrainAngle(x: number): number;
  isPositionValid(x: number, y: number): boolean;
  
  // IA
  getAITarget(): Tank | null;
  executeAIShot(): void;
}
```

---

## 4. Contrato de Componentes React

### 4.1 Página Principal (`src/app/tanks/page.tsx`)

**Responsabilidades:**
- Suspense wrapper para el componente del juego
- Renderizar fondo retro compartido
- Configurar meta tags específicos (opcionalmente en layout)

**Props:** Ninguno

```typescript
"use client";

import { Suspense } from "react";
import TanksGame from "@/components/tanks/TanksGame";
import { RetroBackground } from "@/components/home";

export default function TanksPage() {
  return (
    <main className="min-h-screen relative">
      <RetroBackground />
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-retro-dark">
          <p className="font-terminal text-retro-muted">Loading...</p>
        </div>
      }>
        <TanksGame />
      </Suspense>
    </main>
  );
}
```

---

### 4.2 Componente Principal (`src/components/tanks/TanksGame.tsx`)

**Responsabilidades:**
- Gestionar el estado del engine (ref + subscribe)
- Renderizar la pantalla activa (menu, setup, playing, gameover)
- Manejar transiciones entre pantallas
- Gestionar eventos táctiles/mouse

**Props:** Ninguno

**Estado local:**
```typescript
{
  screen: GamePhase;  // 'menu' | 'setup' | 'playing' | 'gameover'
  mode: GameMode | null;
  tankCount: number;
  gameState: GameState | null;
  canvasRef: RefObject<HTMLCanvasElement>;
  engineRef: RefObject<TanksEngine | null>;
}
```

**Métodos clave:**
- `startGame(mode: GameMode, count: number)` - Inicia el juego
- `handleCanvasInteraction()` - Gestiona drag para ángulo/potencia
- `handleFire()` - Dispara el proyectil
- `requestAnimationFrame loop` - Actualiza el engine y renderiza
- `rematch()` - Reinicia con misma configuración
- `goToMenu()` - Vuelve al menú principal

---

### 4.3 Pantalla de Menú (`src/components/tanks/MenuScreen.tsx`)

**Responsabilidades:**
- Renderizar título y botones de selección de modo
- Navegar a pantalla de setup

**Props:**
```typescript
interface MenuScreenProps {
  onSelectMode: (mode: GameMode) => void;
}
```

**UI:**
- Fondo: `#0a0a0f` con gradiente radial rosa
- Título: "TANKS" gradiente #ff2d78 → #ff6b00 → #ffdd00
- Botones: "VS AI" (#ff2d78) y "LOCAL MULTIPLAYER" (#00e5ff)
- Texto de ayuda: "Drag to aim · Swipe up/down for power · Tap FIRE to shoot"

---

### 4.4 Pantalla de Setup (`src/components/tanks/SetupScreen.tsx`)

**Responsabilidades:**
- Permitir seleccionar número de tanques (2-6)
- Iniciar la partida

**Props:**
```typescript
interface SetupScreenProps {
  mode: GameMode;
  onStart: (tankCount: number) => void;
  onBack: () => void;
}
```

**UI:**
- Título del modo seleccionado (color correspondiente)
- Botones numéricos: 2, 3, 4, 5, 6
- Botón "START BATTLE"
- Link "← BACK"

---

### 4.5 Pantalla de Partida (`src/components/tanks/GameScreen.tsx`)

**Responsabilidades:**
- Renderizar canvas del juego
- Renderizar HUD superior (tanque activo, ángulo, potencia, FIRE)
- Renderizar barra de estado inferior (indicadores de todos los tanques)
- Renderizar indicador de viento
- Renderizar hint táctil

**Props:**
```typescript
interface GameScreenProps {
  gameState: GameState;
  onAngleChange: (angle: number) => void;
  onPowerChange: (power: number) => void;
  onFire: () => void;
}
```

**Layout vertical (44px + flex + 32px):**

| Zona | Altura | Contenido |
|------|--------|-----------|
| HUD superior | 44px fija | Nombre, ángulo, potencia, FIRE/AI thinking |
| Canvas | Flex (restante) | Terreno, tanques, proyectiles, explosiones |
| Barra estado | 32px fija | Indicadores de tanques |

---

### 4.6 Pantalla de Game Over (`src/components/tanks/GameOverScreen.tsx`)

**Responsabilidades:**
- Mostrar ganador o DRAW
- Permitir rematch o volver al menú

**Props:**
```typescript
interface GameOverScreenProps {
  winner: Tank | null;
  isDraw: boolean;
  onRematch: () => void;
  onMenu: () => void;
}
```

**UI:**
- Texto "{NOMBRE} WINS!" en color del ganador
- Botones: "REMATCH" (color del ganador) y "MENU" (#666)

---

## 5. Game Loop

### 5.1 Flujo de Animación

```typescript
// En TanksGame.tsx
const gameLoopRef = useRef<number | null>(null);

const startGameLoop = () => {
  const loop = () => {
    if (!engineRef.current) return;
    
    // 1. Actualizar lógica del juego
    engineRef.current.update();
    
    // 2. Obtener estado actualizado
    const state = engineRef.current.getState();
    setGameState(state);
    
    // 3. Renderizar canvas
    if (canvasRef.current) {
      renderCanvas(canvasRef.current, state);
    }
    
    // 4. Continuar loop si estamos en fase playing/exploding
    if (state.phase === 'playing' || state.phase === 'exploding') {
      gameLoopRef.current = requestAnimationFrame(loop);
    }
  };
  
  gameLoopRef.current = requestAnimationFrame(loop);
};

// Cleanup al desmontar
useEffect(() => {
  return () => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
  };
}, []);
```

### 5.2 Fases del Game Loop

1. **Menu**: Sin game loop, solo React state
2. **Setup**: Sin game loop, solo React state
3. **Playing**: Game loop activo, actualiza proyectil y renderiza
4. **Exploding**: Game loop activo, anima explosiones, luego transición de turno
5. **GameOver**: Sin game loop, solo React state

### 5.3 Update Cycle del Engine

```typescript
// En TanksEngine
update(): void {
  if (this.phase === 'playing' && this.projectile?.active) {
    // Actualizar física del proyectil
    this.updateProjectile();
    
    // Detectar colisión
    if (this.checkCollision()) {
      this.handleExplosion();
      this.phase = 'exploding';
      this.explosions.push(this.createExplosion(...));
    }
  }
  
  if (this.phase === 'exploding') {
    // Actualizar explosiones
    this.updateExplosions();
    
    // Cuando terminan todas, transición de turno
    if (this.explosions.every(e => e.frame >= 45)) {
      this.nextTurn();
    }
  }
}
```

---

## 6. Integración en MetroMinute

### 6.1 Registro del Juego (`src/lib/games.ts`)

Añadir el entry de Tanks al array `GAMES`:

```typescript
import { Game } from '@/types/game';

export const GAMES: Game[] = [
  {
    id: 'bubble',
    title: 'Bubbles',
    icon: '🎯',
    description: 'Test your reflexes! Click the targets before time runs out.',
    href: '/bubble',
    available: true,
    accentColor: 'var(--neon-cyan)',
    tags: ['reflex', 'casual'],
  },
  {
    id: 'futbol',
    title: 'Football Stop',
    icon: '⚽',
    description: 'Stop at 00.00 = GOAL. Precision timing game.',
    href: '/futbol',
    available: true,
    accentColor: 'var(--neon-green)',
    tags: ['precision', 'sports'],
  },
  {
    id: 'tanks',
    title: 'Tanks',
    icon: '🎖️',  // O '🪖' si se prefiere
    description: 'Artillery warfare. Angle, power, fire! Destroy all enemies.',
    href: '/tanks',
    available: true,
    accentColor: 'var(--neon-magenta)', // O custom #ff2d78
    tags: ['strategy', 'turn-based'],
  },
];
```

### 6.2 Ruta Next.js

La ruta ya se crea automáticamente con la estructura `src/app/tanks/page.tsx`.

### 6.3 Navegación desde Home

El componente home de MetroMinute ya itera sobre `GAMES` y renderiza tarjetas con enlaces a `href`, por lo que Tanks aparecerá automáticamente tras el registro.

---

## 7. Estrategia para Landscape en Móvil

### 7.1 Orientación Requerida

Tanks **requiere** landscape en móvil porque:
- El ángulo de disparo horizontal es crítico
- Más espacio horizontal para precisión de ángulo
- Mejor visualización del terreno y proyectiles

### 7.2 Implementación

#### Opción A: Forzar rotación con CSS (recomendado)

```typescript
// En TanksGame.tsx
const [isPortrait, setIsPortrait] = useState(false);

useEffect(() => {
  const checkOrientation = () => {
    setIsPortrait(window.innerHeight > window.innerWidth);
  };
  
  checkOrientation();
  window.addEventListener('resize', checkOrientation);
  return () => window.removeEventListener('resize', checkOrientation);
}, []);

// Renderizar mensaje si está en portrait
if (isPortrait) {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white z-50">
      <div className="text-4xl mb-4">🔄</div>
      <h2 className="text-2xl font-bold mb-2">Rotate your device</h2>
      <p className="text-gray-400">Tanks requires landscape mode</p>
    </div>
  );
}
```

#### Opción B: Sugerencia visual (más amigable)

```typescript
// Overlay de sugerencia con botón "Continue anyway"
{isPortrait && (
  <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
    <div className="text-4xl mb-4">🔄</div>
    <h2 className="text-2xl font-bold mb-2 text-[#ff2d78]">Rotate for best experience</h2>
    <p className="text-gray-400 mb-6">Tanks is optimized for landscape</p>
    <button
      className="bg-[#ff2d78] text-white px-6 py-2 rounded-lg"
      onClick={() => setIsPortrait(false)}
    >
      Continue in portrait
    </button>
  </div>
)}
```

**Recomendación:** Implementar Opción A (forzar rotación) porque la experiencia en portrait es muy pobre y puede confundir a los usuarios.

### 7.3 Viewport y Tailwind

Asegurar que el viewport sea responsive:

```typescript
// Canvas container con aspect ratio
<div className="relative w-full h-full">
  <canvas
    ref={canvasRef}
    className="w-full h-full block"
  />
</div>
```

---

## 8. Separación entre Lógica de Juego y Rendering

### 8.1 Principio de Diseño

**Lógica pura (Engine)**:
- Sin dependencias de React
- Funciones puras cuando sea posible
- Estado inmutable (returns new state)
- Testeable unitariamente

**Rendering (Canvas)**:
- Solo lee el estado del engine
- No modifica el estado
- Efectos visuales (particles, explosions)

### 8.2 Módulos del Engine

| Módulo | Responsabilidad | Funciones clave |
|--------|-----------------|----------------|
| `engine.ts` | Orquestador | `update()`, `fire()`, `nextTurn()` |
| `physics.ts` | Física de proyectiles | `updateProjectile()`, `checkCollision()` |
| `terrain.ts` | Terreno | `generateTerrain()`, `deformTerrain()`, `getTerrainY()` |
| `ai.ts` | Inteligencia artificial | `calculateAIShot()`, `getAITarget()` |
| `renderer.ts` | Canvas rendering | `renderSky()`, `renderTerrain()`, `renderTanks()`, `renderProjectile()` |

### 8.3 Flujo de Datos

```
User Input (React) → Engine.update() → Physics → GameState → Canvas.render()
```

```typescript
// Ejemplo: Disparo
// 1. Usuario toca botón FIRE
handleFire() {
  engineRef.current.fire();
}

// 2. Engine actualiza estado
fire() {
  this.projectile = createProjectile(...);
  this.phase = 'playing';
}

// 3. Game loop actualiza y renderiza
loop() {
  engine.update();  // → physics.ts calcula nueva posición
  const state = engine.getState();
  renderCanvas(canvasRef.current, state);  // → renderer.ts dibuja
}
```

---

## 9. Responsividad del Canvas

### 9.1 ResizeObserver

```typescript
// En TanksGame.tsx
useEffect(() => {
  if (!canvasRef.current || !engineRef.current) return;
  
  const resizeObserver = new ResizeObserver((entries) => {
    const canvas = canvasRef.current;
    const container = entries[0].contentRect;
    
    // Actualizar dimensiones del canvas
    canvas.width = container.width;
    canvas.height = container.height;
    
    // Recalcular terreno si cambió el tamaño significativamente
    engineRef.current.rescaleTerrain(container.width, container.height);
  });
  
  resizeObserver.observe(canvasRef.current.parentElement!);
  
  return () => resizeObserver.disconnect();
}, []);
```

### 9.2 Coordenadas Normalizadas

Para evitar problemas de escala:
- Guardar posiciones relativas (0.0 a 1.0) en el engine
- Convertir a pixels en render time

```typescript
// Engine
interface Tank {
  x: number;  // 0.0 a 1.0 (relativo al ancho)
  y: number;  // 0.0 a 1.0 (relativo al alto)
}

// Renderer
function renderTanks(ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number) {
  state.tanks.forEach(tank => {
    const screenX = tank.x * width;
    const screenY = tank.y * height;
    ctx.fillRect(screenX - 15, screenY - 16, 30, 16);
  });
}
```

---

## 10. Interacción Táctil y Mouse

### 10.1 Eventos del Canvas

```typescript
const handlePointerDown = (e: React.PointerEvent) => {
  isDraggingRef.current = true;
  lastPointerRef.current = { x: e.clientX, y: e.clientY };
};

const handlePointerMove = (e: React.PointerEvent) => {
  if (!isDraggingRef.current || !engineRef.current) return;
  
  const dx = e.clientX - lastPointerRef.current.x;
  const dy = e.clientY - lastPointerRef.current.y;
  
  // Ajustar ángulo (drag horizontal)
  const activeTank = engineRef.current.getState().tanks[engineRef.current.getState().activeTankIndex];
  const newAngle = activeTank.angle + dx * 0.5;
  engineRef.current.setTankAngle(activeTank.id, clamp(newAngle, -175, -5));
  
  // Ajustar potencia (drag vertical)
  const newPower = activeTank.power - dy * 0.3;
  engineRef.current.setTankPower(activeTank.id, clamp(newPower, 10, 100));
  
  lastPointerRef.current = { x: e.clientX, y: e.clientY };
};

const handlePointerUp = () => {
  isDraggingRef.current = false;
};

// En JSX
<canvas
  ref={canvasRef}
  onPointerDown={handlePointerDown}
  onPointerMove={handlePointerMove}
  onPointerUp={handlePointerUp}
  onPointerLeave={handlePointerUp}
/>
```

### 10.2 Soporte Multi-touch

- Solo soportar un touch activo (drag)
- Otros toques ignorados para evitar conflictos
- Prevenir scroll en el canvas con `touch-action: none`

```css
canvas {
  touch-action: none;
}
```

---

## 11. Sistema de Audio (Opcional)

### 11.1 Estructura

```typescript
// src/lib/tanks/audio.ts
type SoundType = 'fire' | 'explosion' | 'turn' | 'win' | 'draw';

const playSound = (type: SoundType, enabled: boolean) => {
  if (!enabled) return;
  
  const audio = new Audio(`/sounds/tanks/${type}.mp3`);
  audio.play().catch(() => {});  // Silenciar error si autoplay bloqueado
};

export { playSound };
```

### 11.2 Integración

```typescript
// En TanksGame.tsx
const [soundEnabled, setSoundEnabled] = useState(true);

const handleFire = () => {
  playSound('fire', soundEnabled);
  engineRef.current.fire();
};
```

---

## 12. Constantes del Juego

```typescript
// src/lib/tanks/constants.ts
export const CONSTANTS = {
  // Terreno
  TERRAIN_POINTS: 60,
  TERRAIN_BASE_Y_RATIO: 0.55,
  TERRAIN_MIN_Y_RATIO: 0.2,
  TERRAIN_MAX_Y_RATIO: 0.85,
  
  // Tanques
  TANK_WIDTH: 30,
  TANK_HEIGHT: 16,
  TANK_TURRET_RADIUS: 9,
  TANK_BARREL_LENGTH: 22,
  TANK_BARREL_WIDTH: 5,
  
  // Proyectil
  PROJECTILE_SPEED_FACTOR: 0.12,
  PROJECTILE_RADIUS: 3,
  PROJECTILE_TRAIL_LENGTH: 50,
  GRAVITY: 0.15,
  WIND_FACTOR: 0.002,
  
  // Explosión
  EXPLOSION_RADIUS: 35,
  EXPLOSION_DURATION_FRAMES: 45,
  EXPLOSION_PARTICLE_COUNT: 20,
  EXPLOSION_DEFORMATION_FACTOR: 0.5,
  
  // Física
  MAX_ANGLE: -5,
  MIN_ANGLE: -175,
  MAX_POWER: 100,
  MIN_POWER: 10,
  
  // IA
  AI_THINKING_DELAY_FRAMES: 75,
  AI_ADDITIONAL_DELAY_MS: 300,
  AI_LOBBING_ANGLE_MIN: 20,
  AI_LOBBING_ANGLE_MAX: 35,
  AI_POWER_DISTANCE_FACTOR: 0.18,
  AI_WIND_COMPENSATION_FACTOR: 8,
  AI_IMPRECISION_ANGLE: 6,
  AI_IMPRECISION_POWER: 5,
  
  // Viento
  WIND_MIN: -2.0,
  WIND_MAX: 2.0,
  WIND_CHANGE_MIN: -0.25,
  WIND_CHANGE_MAX: 0.25,
  
  // Colores
  SKY_TOP: '#0a0a0f',
  SKY_MID: '#111122',
  SKY_BOTTOM: '#1a1a2e',
  STARS_COUNT: 60,
  TERRAIN_COLORS: ['#2d5016', '#3a6b1e', '#4a3520', '#2a1a0a'],
  TERRAIN_SURFACE: '#5a8a2a',
  
  // Estrellas
  STAR_SEED: 42,
} as const;
```

---

## 13. Consideraciones de Performance

### 13.1 Optimizaciones

1. **Evitar re-renders innecesarios:**
   - Usar `useCallback` para handlers
   - Memoizar componentes pesados con `React.memo`
   - Evitar pasar objetos inline como props

2. **Canvas rendering:**
   - Solo renderizar en fase `playing` o `exploding`
   - Usar `requestAnimationFrame` para sincronizar con vsync
   - Limpiar canvas con `clearRect` antes de cada frame

3. **Subscripciones al engine:**
   - Usar `useRef` para la referencia del engine
   - Desuscribirse en cleanup de `useEffect`

4. **Terrain deformation:**
   - Calcular deformación solo cuando hay explosión
   - No regenerar terreno completo cada frame

### 13.2 Monitoreo

```typescript
// Opcional: Monitorear FPS
let lastTime = performance.now();
let frameCount = 0;

const loop = () => {
  const now = performance.now();
  frameCount++;
  
  if (now - lastTime >= 1000) {
    console.log(`FPS: ${frameCount}`);
    frameCount = 0;
    lastTime = now;
  }
  
  // ... resto del loop
};
```

---

## 14. Testing (Guía)

### 14.1 Unit Tests (Engine)

```typescript
// engine.test.ts
describe('TanksEngine', () => {
  it('should generate terrain with correct number of points', () => {
    const engine = new TanksEngine({ mode: 'local', tankCount: 2 });
    expect(engine.getState().terrain.length).toBe(60);
  });
  
  it('should detect projectile collision', () => {
    const engine = new TanksEngine({ mode: 'local', tankCount: 2 });
    engine.fire();
    // Simular movimiento hasta colisión
    for (let i = 0; i < 1000; i++) engine.update();
    expect(engine.getState().phase).toBe('exploding');
  });
});
```

### 14.2 Integration Tests (React)

```typescript
// TanksGame.test.tsx
describe('TanksGame', () => {
  it('should render menu screen initially', () => {
    render(<TanksGame />);
    expect(screen.getByText('TANKS')).toBeInTheDocument();
  });
  
  it('should transition to setup when mode selected', () => {
    render(<TanksGame />);
    fireEvent.click(screen.getByText('VS AI'));
    expect(screen.getByText('How many tanks?')).toBeInTheDocument();
  });
});
```

---

## 15. Roadmap de Implementación

### Fase 1: Foundation (Sprint 1)
- [ ] Crear estructura de archivos
- [ ] Definir tipos TypeScript (`types.ts`)
- [ ] Implementar módulo `terrain.ts` (generación)
- [ ] Crear página `/tanks` y componente `TanksGame`
- [ ] Implementar pantalla de menú

### Fase 2: Core Gameplay (Sprint 2)
- [ ] Implementar módulo `physics.ts` (proyectiles)
- [ ] Implementar módulo `engine.ts` (orquestador)
- [ ] Canvas rendering básico (`renderer.ts`)
- [ ] Implementar pantalla de setup
- [ ] Implementar pantalla de partida (canvas + HUD)

### Fase 3: Game Logic (Sprint 3)
- [ ] Sistema de turnos
- [ ] Explosiones y deformación de terreno
- [ ] Interacción táctil (ángulo, potencia, fire)
- [ ] Detección de victoria/draw
- [ ] Pantalla de game over

### Fase 4: IA y Modos (Sprint 4)
- [ ] Implementar módulo `ai.ts`
- [ ] Modo VS AI
- [ ] Modo Local Multiplayer
- [ ] Lógica de viento

### Fase 5: Polish (Sprint 5)
- [ ] Partículas y efectos visuales
- [ ] Línea de trayectoria estimada
- [ ] Indicador de viento visual
- [ ] Sistema de audio (opcional)
- [ ] Optimización de performance
- [ ] Testing y bug fixes

### Fase 6: Integración (Sprint 6)
- [ ] Registro en `games.ts`
- [ ] Navegación desde home
- [ ] Landscape enforcement en móvil
- [ ] Documentación de usuario
- [ ] Deploy y pruebas en dispositivo

---

## 16. Referencias

- **Spec funcional completa:** `tanks/docs/tanks-spec-extracted.md`
- **Código de referencia:** `tanks/docs/tanks-code-reference.pdf`
- **Juegos existentes:**
  - `src/app/bubble/page.tsx` → Patrón de página
  - `src/components/game/GameBoard.tsx` → Patrón de game loop
  - `src/lib/games.ts` → Registro de juegos
  - `src/types/game.ts` → Tipos base

---

## 17. Notas para Desarrolladores

### 17.1 Patrones a Seguir

1. **Usar refs para el engine** → Evitar re-renders del engine en el estado React
2. **Subscribe pattern** → El engine notifica cambios via callbacks
3. **Separación lógica/rendering** → Engine = pure functions, React = state & UI
4. **Canvas responsivo** → ResizeObserver + dimensiones normalizadas
5. **Tailwind para UI chrome** → Canvas solo para gameplay

### 17.2 Comunes Anti-Patterns

❌ **NO hacer:**
- Guardar canvas dimensions en React state (usar ref)
- Renderizar canvas en cada React render (solo en game loop)
- Mezclar lógica del juego con UI React
- Recalcular terreno en cada frame
- Usar `setInterval` para el game loop (usar `requestAnimationFrame`)

✅ **SÍ hacer:**
- Usar `useRef` para el engine y canvas
- Actualizar canvas solo cuando hay cambios (`phase` changed)
- Separar modules por responsabilidad (physics, terrain, ai, renderer)
- Memoizar handlers con `useCallback`
- Limpiar observers y animation frames en cleanup

### 17.3 Debugging

```typescript
// Habilitar modo debug en development
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('GameState:', state);
  console.log('Active Tank:', state.tanks[state.activeTankIndex]);
}
```

---

**Fin del documento de arquitectura.**

Este documento es la fuente de verdad para el desarrollo del juego Tanks. Cualquier cambio arquitectónico debe actualizarse aquí antes de implementarse.
