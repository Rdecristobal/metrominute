# TANKS_IMPROVEMENTS_v2 — Soluciones Arquitectónicas

> **Fecha:** 2026-04-08  
> **Estado:** Pendiente de implementación  
> **Pre-requisito:** Leer `ARCHITECTURE.md` para contexto completo

---

## Problema 1: Escenario no se adapta a landscape

### 1.1 Análisis del problema

**Archivos afectados:** `GameScreen.tsx`, `renderer.ts`, `terrain.ts`, `constants.ts`

**Raíz del problema:** El layout actual usa alturas fijas para HUD (36px) y controles (56px min) sin diferenciar orientación. En landscape (ej. 800×360), esos 92px representan el **25% del alto total**, estrangulando el canvas.

Además, la generación de terreno (`terrain.ts`) distribuye siempre 60 puntos (`TERRAIN_POINTS = 60`) a lo ancho del canvas con amplitudes basadas en el alto. En landscape, esto produce colinas **aplastadas** porque las frecuencias sinusoidales se calculan como `freq * 2π / width`, haciendo que las ondas sean demasiado anchas para el aspect ratio.

```
// terrain.ts — problema:
y += Math.sin(x * (wave.freq * 2 * Math.PI / width) + phase) * height * wave.amp;
//                                                          ^^^^^^    ^^^^^^
//  En landscape: freq baja (ondas anchas) × amp normal → colinas planas
```

### 1.2 Solución propuesta

#### A. Layout responsive por orientación (`GameScreen.tsx`)

Detectar orientación y compactar la UI:

```typescript
// Nuevo hook utilitario en GameScreen.tsx o en un archivo helpers.ts
function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(false);
  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isLandscape;
}
```

**Cambios en `GameScreen.tsx`:**

- En landscape: HUD altura → `24px` (vs 36px), controles → `40px` (vs 56px)
- Los indicadores de tanques pasan de `flex-wrap` a una fila horizontal compacta
- El botón FIRE reduce padding y se pone inline con el HUD (lado derecho) en vez de barra inferior
- Fuentes de los labels reducen de `text-sm`/`text-xs` a `text-xs`/`10px`

```tsx
// Pseudocódigo GameScreen.tsx
const isLandscape = useOrientation();

const hudHeight = isLandscape ? 24 : 36;
const controlsHeight = isLandscape ? 40 : 56;
const fontSize = isLandscape ? '10px' : 'text-xs';

// En landscape: mover FIRE al HUD
// En portrait: mantener FIRE en barra inferior
```

#### B. Terreno adaptado a aspect ratio (`terrain.ts`)

Modificar la generación para que en landscape las colinas mantengan proporciones visuales:

```typescript
// terrain.ts — generateTerrain()
// Nuevo parámetro opcional: aspectRatio
export function generateTerrain(
  dimensions: CanvasDimensions,
  seed?: number
): TerrainPoint[] {
  const { width, height } = dimensions;
  const aspectRatio = width / height;
  
  // Ajustar amplitudes según aspect ratio
  // En portrait (aspect < 1): amplitudes normales
  // En landscape (aspect > 1.5): aumentar amplitudes para colinas más marcadas
  const ampScale = Math.max(1, aspectRatio * 0.7);
  
  // Para landscape: más puntos para mantener resolución
  const pointCount = aspectRatio > 1.5 
    ? Math.round(TERRAIN_POINTS * aspectRatio * 0.8)
    : TERRAIN_POINTS;
  
  for (const wave of TERRAIN_WAVES) {
    y += Math.sin(x * (wave.freq * 2 * Math.PI / width) + phase) 
         * height * wave.amp * ampScale;
  }
}
```

#### C. Constantes nuevas (`constants.ts`)

```typescript
// Landscape adjustments
export const LANDSCAPE_HUD_HEIGHT = 24;
export const LANDSCAPE_CONTROLS_HEIGHT = 40;
export const TERRAIN_POINTS_LANDSCAPE_FACTOR = 0.8; // multiplied by aspectRatio
export const TERRAIN_AMP_SCALE_FACTOR = 0.7;
```

### 1.3 Impacto en renderer

El renderer no necesita cambios significativos — ya dibuja al tamaño del canvas. Solo hay que asegurar que las estrellas se regeneren al cambiar orientación (ya ocurre vía `clearStarsCache()` en `updateDimensions`).

---

## Problema 2: Escenario muy pequeño en vertical

### 2.1 Análisis del problema

**Archivos afectados:** `engine.ts`, `terrain.ts`, `renderer.ts`, `types.ts`

**Raíz del problema:** El terreno tiene exactamente 60 puntos distribuidos en el ancho del canvas. En un teléfono vertical (~375px), la distancia entre tanques con 4 jugadores es:

```
margin = 375 * 0.06 = 22.5px
playableWidth = 375 - 45 = 330px
spacing = 330 / 5 = 66px  ← ¡66px entre tanques!
```

Con un radio de explosión de 35px, casi cualquier disparo que se acerque destruye un tanque. No hay sensación de distancia ni estrategia.

El terrain se genera siempre a 1:1 con el canvas — no existe concepto de "mundo" más grande que la pantalla.

### 2.2 Solución propuesta: Viewport + cámara con scroll

Introducir un **mundo virtual** más grande que el canvas, con una cámara que sigue la acción.

#### A. Nuevo tipo: Viewport (`types.ts`)

```typescript
// types.ts — añadir
export interface Viewport {
  x: number;       // offset X de la cámara (mundo)
  y: number;       // offset Y (normalmente 0)
  width: number;   // ancho visible (= canvas width)
  height: number;  // alto visible (= canvas height)
  worldWidth: number;  // ancho total del mundo
  worldHeight: number; // alto total del mundo
}

export interface GameState {
  // ... campos existentes ...
  viewport?: Viewport;  // nuevo campo opcional
}
```

#### B. Cálculo del tamaño del mundo (`engine.ts`)

```typescript
// engine.ts — createInitialState()
private createInitialState(config: GameConfig): GameState {
  const dimensions = this.dimensions;
  
  // Calcular tamaño del mundo según orientación
  const aspectRatio = dimensions.width / dimensions.height;
  
  let worldWidth: number;
  if (aspectRatio < 1) {
    // Portrait: el mundo es 2.5× más ancho que el canvas
    worldWidth = dimensions.width * 2.5;
  } else {
    // Landscape: el mundo es 1.5× más ancho
    worldWidth = dimensions.width * 1.5;
  }
  const worldHeight = dimensions.height;
  
  // Generar terreno con worldWidth (no canvas width)
  const terrain = generateTerrain({ width: worldWidth, height: worldHeight }, seed);
  
  // ... tanks se distribuyen en worldWidth ...
  
  // Viewport inicial: centrado en el primer tanque
  const viewport: Viewport = {
    x: 0,
    y: 0,
    width: dimensions.width,
    height: dimensions.height,
    worldWidth,
    worldHeight,
  };
  
  return { ...existingState, viewport };
}
```

#### C. Posicionamiento de tanques en mundo amplio (`engine.ts`)

```typescript
// engine.ts — createTanks()
// Usar worldWidth en vez de dimensions.width para distribución
const margin = worldWidth * TANK_MARGIN_RATIO;
const playableWidth = worldWidth - (margin * 2);
const spacing = playableWidth / (config.tankCount + 1);

for (let i = 0; i < config.tankCount; i++) {
  const x = margin + spacing * (i + 1);
  // ...
}
```

#### D. Movimiento de cámara (`engine.ts`)

La cámara sigue al tanque activo suavemente:

```typescript
// engine.ts — nuevo método
private updateCamera(): void {
  if (!this.state.viewport) return;
  const { viewport } = this.state;
  const activeTank = this.state.tanks[this.state.activeTankIndex];
  if (!activeTank) return;
  
  // Target: centrar en el tanque activo
  const targetX = activeTank.x - viewport.width / 2;
  
  // Smooth follow (interpolación lineal)
  const smoothing = 0.08;
  viewport.x += (targetX - viewport.x) * smoothing;
  
  // Clamp al mundo
  viewport.x = Math.max(0, Math.min(viewport.worldWidth - viewport.width, viewport.x));
}

// Llamar en updatePlaying() y updateExploding()
private updatePlaying(): void {
  this.updateCamera();
  // ... resto de lógica existente ...
}
```

Cuando el proyectil está en vuelo, la cámara podría seguir el proyectil en vez del tanque (o hacer split-focus entre ambos). Estrategia recomendada:

```typescript
// Si hay proyectil activo, la cámara hace split-focus
if (this.state.projectile?.active) {
  // Centrar entre tanque activo y proyectil
  const midX = (activeTank.x + this.state.projectile.x) / 2;
  const targetX = midX - viewport.width / 2;
  viewport.x += (targetX - viewport.x) * 0.06; // más lento para efecto cinemático
} else {
  // Seguir tanque activo
  const targetX = activeTank.x - viewport.width / 2;
  viewport.x += (targetX - viewport.x) * 0.08;
}
```

#### E. Renderer con viewport (`renderer.ts`)

Aplicar offset de cámara al dibujar todo:

```typescript
// renderer.ts — renderGame()
export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  dimensions: CanvasDimensions,
  showTrajectory: boolean = false
): void {
  const { width, height } = dimensions;
  const viewport = state.viewport;
  const camX = viewport ? viewport.x : 0;
  
  ctx.clearRect(0, 0, width, height);
  
  ctx.save();
  ctx.translate(-camX, 0); // ← APlicar offset de cámara
  
  // Render sky (debe cubrir todo el viewport)
  renderSky(ctx, { width: viewport?.worldWidth ?? width, height });
  
  // ... resto de renders (terrain, tanks, projectile, explosions) ...
  // Todos usan coordenadas de mundo, el translate(-camX) los desplaza
  
  ctx.restore();
  
  // HUD elements (wind, tank count) se dibujan SIN offset (overlay fijo)
  if (viewport) {
    renderWindIndicator(ctx, state.wind, dimensions);
    renderTankCount(ctx, state, dimensions);
  }
}
```

**Importante:** El cielo debe renderizarse cubriendo todo el ancho del viewport visible, no del mundo completo. Usar `camX` para calcular el gradiente:

```typescript
function renderSky(ctx, dimensions, camX = 0) {
  // Gradiente siempre cubre la pantalla visible
  ctx.fillRect(0, 0, dimensions.width, dimensions.height);
}
```

#### F. Colisiones sin cambios (`physics.ts`)

La física trabaja en coordenadas de mundo — no necesita saber del viewport. Las colisiones se comprueban contra `worldWidth` en vez de `canvas.width`:

```typescript
// engine.ts — pasar worldWidth a checkCollision
const worldWidth = this.state.viewport?.worldWidth ?? this.dimensions.width;
const collision = checkCollision(this.state.projectile, this.state.terrain, 
  { width: worldWidth, height: this.dimensions.height });
```

#### G. Touch-to-aim con viewport (`TanksGame.tsx`)

Al convertir coordenadas táctiles, hay que sumar el offset de cámara:

```typescript
// engine.ts — setAngleFromPosition()
// Añadir viewport offset
const camX = this.state.viewport?.x ?? 0;
const canvasX = (touchX - canvasRect.left) + camX; // ← coordenada de mundo
const canvasY = touchY - canvasRect.top;
```

#### H. Mini-mapa (bonus UX)

Añadir un mini-mapa en la esquina inferior que muestre posiciones de todos los tanques y el área visible:

```typescript
// renderer.ts — nuevo método
function renderMinimap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  viewport: Viewport,
  canvasDimensions: CanvasDimensions
): void {
  const mmWidth = 120;
  const mmHeight = 20;
  const mmX = canvasDimensions.width - mmWidth - 8;
  const mmY = canvasDimensions.height - mmHeight - 8;
  const scaleX = mmWidth / viewport.worldWidth;
  
  // Fondo semi-transparente
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(mmX, mmY, mmWidth, mmHeight);
  
  // Área visible
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.strokeRect(
    mmX + viewport.x * scaleX,
    mmY,
    viewport.width * scaleX,
    mmHeight
  );
  
  // Tanques
  state.tanks.forEach(tank => {
    if (!tank.alive) return;
    ctx.fillStyle = tank.color;
    ctx.fillRect(mmX + tank.x * scaleX - 1, mmY + mmHeight / 2 - 2, 3, 4);
  });
}
```

### 2.3 Constantes nuevas (`constants.ts`)

```typescript
// World / Viewport
export const WORLD_SCALE_PORTRAIT = 2.5;   // mundo = 2.5× canvas width
export const WORLD_SCALE_LANDSCAPE = 1.5;  // mundo = 1.5× canvas width
export const CAMERA_SMOOTHING = 0.08;
export const CAMERA_PROJECTILE_SMOOTHING = 0.06;
export const MINIMAP_WIDTH = 120;
export const MINIMAP_HEIGHT = 20;
```

---

## Problema 3: IA es demasiado tonta

### 3.1 Análisis del problema

**Archivos afectados:** `ai.ts`, `engine.ts`, `physics.ts`, `types.ts`

**Raíz del problema — fallas específicas:**

1. **No usa la física real.** `calculateAIShot` usa heurísticas ad-hoc (`distance * 0.18 + noise`) en vez de invertir las ecuaciones de movimiento del proyectil. La física real es:
   ```
   vx += wind * 0.002  (por frame)
   vy += 0.15          (gravedad, por frame)
   x += vx
   y += vy
   ```
   La IA ignora completamente este modelo.

2. **El ángulo base es `atan2(dy, dx)` directo al target**, luego resta 20-35° de "lobbing". Esto no calcula realmente una trayectoria balística — es un guess grosero que no considera la parábola real.

3. **Compensación de viento lineal:** `angle -= wind * 8`. El viento afecta `vx` acumulativamente cada frame (no es un offset constante), así que una compensación lineal de ángulo es incorrecta para distancias medias/largas.

4. **Cero memoria.** La IA no registra dónde cayó su disparo anterior ni ajusta. Cada turno calcula desde cero con la misma aleatoriedad.

5. **`getAITarget` es aleatorio puro.** Podría apuntar a un tanque lejano con la misma probabilidad que a uno cercano, disparando a ciegas.

### 3.2 Solución propuesta: IA balística con retroalimentación

#### A. Calcular tiro invirtiendo la física (`ai.ts`)

La clave: simular la trayectoria y ajustar iterativamente (búsqueda binaria en ángulo y potencia) hasta encontrar una combinación que impacte cerca del target.

```typescript
// ai.ts — nueva función principal

/**
 * Simula la trayectoria completa de un proyectil y retorna el punto de impacto.
 * Usa las MISMAS ecuaciones que physics.ts.
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
    // Misma física que updateProjectile en physics.ts
    vx += wind * WIND_FACTOR;
    vy += GRAVITY;
    x += vx;
    y += vy;
    
    // Colisión con terreno
    if (x >= 0 && x <= worldWidth) {
      const terrainY = getTerrainY(terrain, x);
      if (y >= terrainY) {
        return { x, y: terrainY, steps: i };
      }
    }
    
    // Fuera de límites
    if (x < -50 || x > worldWidth + 50 || y > worldHeight + 100) {
      return { x, y, steps: i };
    }
  }
  
  return { x, y, steps: maxSteps };
}

/**
 * Busca ángulo y potencia óptimos usando búsqueda binaria.
 * Retorna la combinación que más se acerca al target.
 */
function findOptimalShot(
  shooter: Tank,
  target: Tank,
  wind: number,
  terrain: TerrainPoint[],
  worldWidth: number,
  worldHeight: number
): { angle: number; power: number; distance: number } {
  const startX = shooter.x + Math.cos(shooter.angle * Math.PI / 180) * TANK_BARREL_LENGTH;
  const startY = shooter.y - TANK_HEIGHT + Math.sin(shooter.angle * Math.PI / 180) * TANK_BARREL_LENGTH;
  
  let bestAngle = -60;
  let bestPower = 50;
  let bestDistance = Infinity;
  
  // Búsqueda en grilla: probar combinaciones de ángulo y potencia
  // Ángulo: [-170, -10] en pasos de 2°
  // Potencia: [20, 100] en pasos de 5
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
  
  // Refinamiento: búsqueda fina alrededor del mejor punto (±4°, ±10 power)
  for (let angle = bestAngle - 4; angle <= bestAngle + 4; angle += 0.5) {
    for (let power = bestPower - 10; power <= bestPower + 10; power += 2) {
      if (power < 10 || power > 100 || angle < -175 || angle > -5) continue;
      
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
```

**Complejidad:** La grilla gruesa son ~80 ángulos × 17 potencias = 1,360 simulaciones. Cada simulación recorre ~200 frames máximo. Total: ~272,000 iteraciones simples — negligible para JavaScript moderno (< 5ms).

#### B. Sistema de memoria por tanque IA (`ai.ts` + `types.ts`)

```typescript
// types.ts — nuevo interfaz
export interface AIMemory {
  lastTargetId: number;
  lastAngle: number;
  lastPower: number;
  lastImpactX: number;
  lastImpactY: number;
  missOffset: number;  // distancia al target del último disparo
}
```

```typescript
// ai.ts — estado de memoria por tanque
const aiMemories: Map<number, AIMemory> = new Map();

/**
 * Actualiza la memoria después de que un proyectil de IA impacta.
 * Se llama desde engine.ts en handleExplosion().
 */
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

/**
 * Ajusta el tiro basándose en la memoria del disparo anterior.
 * Si el último disparo cayó cortos, aumenta potencia.
 * Si cayó largo, reduce potencia. Si se desvió a la derecha, ajusta ángulo.
 */
function adjustFromMemory(
  baseShot: { angle: number; power: number },
  tankId: number,
  targetId: number
): { angle: number; power: number } {
  const memory = aiMemories.get(tankId);
  if (!memory || memory.lastTargetId !== targetId) {
    return baseShot; // No hay memoria relevante
  }
  
  let { angle, power } = baseShot;
  
  // Factor de ajuste: cuanto mayor el error, mayor el ajuste
  const adjustFactor = Math.min(memory.missOffset / 100, 1);
  
  // Calcular dirección del error respecto al target
  // missOffset > 0 = falló (no impactó directamente)
  if (memory.missOffset < 30) {
    // Casi acertó — ajuste fino
    return { angle, power };
  }
  
  // Si impactó antes del target (x < target.x): aumentar potencia
  if (memory.lastImpactX < targetId /*necesitamos targetX*/) {
    power += 5 * adjustFactor;
  } else {
    power -= 5 * adjustFactor;
  }
  
  // Clamp
  power = Math.max(MIN_POWER, Math.min(MAX_POWER, power));
  
  return { angle, power };
}
```

#### C. Target selection inteligente (`ai.ts`)

En vez de aleatorio puro, priorizar objetivos cercanos y con salud (si se añade HP en el futuro):

```typescript
export function getAITarget(state: GameState, shooterTank: Tank): Tank | null {
  const aliveTanks = state.tanks.filter(t => t.alive && t.id !== shooterTank.id);
  if (aliveTanks.length === 0) return null;
  
  if (aliveTanks.length === 1) return aliveTanks[0];
  
  // Ordenar por distancia al shooter (más cerca = más fácil = prioridad)
  aliveTanks.sort((a, b) => {
    const distA = Math.abs(a.x - shooterTank.x);
    const distB = Math.abs(b.x - shooterTank.x);
    return distA - distB;
  });
  
  // 60% probabilidad de apuntar al más cercano, 40% aleatorio
  if (Math.random() < 0.6) {
    return aliveTanks[0];
  }
  return aliveTanks[Math.floor(Math.random() * aliveTanks.length)];
}
```

#### D. Nivel de dificultad configurable (`types.ts` + `ai.ts`)

```typescript
// types.ts
export type AIDifficulty = 'easy' | 'normal' | 'hard';

export interface GameConfig {
  mode: GameMode;
  tankCount: number;
  aiDifficulty?: AIDifficulty;  // nuevo campo
}
```

```typescript
// ai.ts — parámetros por dificultad
interface DifficultyParams {
  imprecisionAngle: number;    // grados de error añadidos
  imprecisionPower: number;    // error en potencia
  memoryWeight: number;        // cuánto influye la memoria (0-1)
  optimalShotProbability: number; // prob de usar tiro óptimo vs aleatorio
}

const DIFFICULTY_PARAMS: Record<AIDifficulty, DifficultyParams> = {
  easy:   { imprecisionAngle: 15, imprecisionPower: 20, memoryWeight: 0,    optimalShotProbability: 0.3 },
  normal: { imprecisionAngle: 6,  imprecisionPower: 10, memoryWeight: 0.5,  optimalShotProbability: 0.7 },
  hard:   { imprecisionAngle: 2,  imprecisionPower: 4,  memoryWeight: 0.9,  optimalShotProbability: 1.0 },
};
```

#### E. Flujo completo de la nueva IA (`ai.ts`)

```typescript
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
  
  // 1. Decidir si usar tiro óptimo o aleatorio (basado en dificultad)
  let angle: number;
  let power: number;
  
  if (Math.random() < params.optimalShotProbability) {
    // Calcular tiro óptimo invirtiendo la física
    const optimal = findOptimalShot(shooter, target, wind, terrain, worldWidth, worldHeight);
    angle = optimal.angle;
    power = optimal.power;
  } else {
    // Tiro aleatorio (fallback)
    angle = shooter.x < target.x ? -60 : -120;
    power = 50 + Math.random() * 30;
  }
  
  // 2. Ajustar basándose en memoria
  const memory = aiMemories.get(shooter.id);
  if (memory && memory.lastTargetId === target.id && params.memoryWeight > 0) {
    const adjusted = adjustFromMemory({ angle, power }, shooter.id, target.id);
    angle = angle * (1 - params.memoryWeight) + adjusted.angle * params.memoryWeight;
    power = power * (1 - params.memoryWeight) + adjusted.power * params.memoryWeight;
  }
  
  // 3. Añadir imprecisión según dificultad
  angle += (Math.random() - 0.5) * 2 * params.imprecisionAngle;
  power += (Math.random() - 0.5) * 2 * params.imprecisionPower;
  
  // 4. Clamp
  angle = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, angle));
  power = Math.max(MIN_POWER, Math.min(MAX_POWER, power));
  
  return { angle, power };
}
```

#### F. Hook de memoria en el engine (`engine.ts`)

```typescript
// engine.ts — handleExplosion()
// Después de determinar que el disparo fue de IA:
private handleExplosion(x: number, y: number): void {
  const shooterTank = this.state.tanks[this.state.activeTankIndex];
  
  // ... lógica existente de explosión ...
  
  // Actualizar memoria de IA si el shooter era IA
  if (shooterTank.isAI) {
    const target = /* obtener target de la memoria del disparo */;
    if (target) {
      updateAIMemory(
        shooterTank.id,
        target.id,
        shooterTank.angle,
        shooterTank.power,
        x, y,          // punto de impacto
        target.x, target.y
      );
    }
  }
}
```

Para saber el target del disparo, guardar la referencia cuando la IA dispara:

```typescript
// engine.ts — campos nuevos en la clase
private lastAITargetId: number | null = null;

// En updateAI(), cuando se calcula el disparo:
const target = getAITarget(this.state, shooterTank);
if (target) {
  this.lastAITargetId = target.id;
  // ... calcular y disparar ...
}

// En handleExplosion():
if (shooterTank.isAI && this.lastAITargetId !== null) {
  const target = this.state.tanks.find(t => t.id === this.lastAITargetId);
  if (target) {
    updateAIMemory(shooterTank.id, target.id, shooterTank.angle, shooterTank.power,
                   x, y, target.x, target.y);
  }
  this.lastAITargetId = null;
}
```

### 3.3 Resumen de cambios por archivo

| Archivo | Cambios |
|---|---|
| `types.ts` | Añadir `AIMemory`, `AIDifficulty`, campo `aiDifficulty?` en `GameConfig` |
| `ai.ts` | Reescribir completamente: `simulateTrajectory()`, `findOptimalShot()`, `adjustFromMemory()`, `getAITarget()` mejorada, `calculateAIShot()` con dificultad, `updateAIMemory()`, eliminar constantes importadas de `constants.ts` (mover a DifficultyParams) |
| `engine.ts` | Guardar `lastAITargetId`, llamar `updateAIMemory()` en `handleExplosion()`, pasar `terrain` y `worldWidth/worldHeight` a `calculateAIShot()` |
| `constants.ts` | Marcar como obsoletas las constantes `AI_*` (o eliminarlas si se eliminan las importaciones) |
| `SetupScreen.tsx` | (Opcional) Añadir selector de dificultad de IA |

### 3.4 Notas de rendimiento

- La grilla de búsqueda se ejecuta una vez por turno de IA, no por frame.
- Con 1,360 simulaciones × ~200 iteraciones = ~272K operaciones simples → **< 10ms** en cualquier móvil moderno.
- El refinamiento fino añade ~200 simulaciones extra → negligible.
- Se puede cachear el resultado si el viento no cambia y es el mismo target (optimización futura).
