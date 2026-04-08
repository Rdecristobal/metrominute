# Tanks — Documentación de Arquitectura

> **Última actualización:** 2026-04-08  
> **Baseline:** Código fuente real de `src/lib/tanks/` y `src/components/tanks/`

---

## 1. Visión General

Tanks es un minijuego de artillería tipo *Artillery / Scorched Earth* dentro de MetroMinute. Cada jugador controla un tanque en un terreno generado proceduralmente. El objetivo: destruir a los tanques rivales ajustando ángulo y potencia del disparo.

**Tecnologías:** React (Next.js), Canvas 2D nativo, `requestAnimationFrame`.

---

## 2. Arquitectura de Módulos

```
┌─────────────────────────────────────────────────────┐
│                  React Components                    │
│  TanksGame.tsx → MenuScreen / SetupScreen /         │
│  GameScreen / GameOverScreen                        │
└──────────────────────┬──────────────────────────────┘
                       │ subscribe / API pública
                       ▼
┌─────────────────────────────────────────────────────┐
│                 TanksEngine (engine.ts)              │
│  Orquestador: estado, turnos, IA, explosiones       │
└──┬──────────┬──────────┬──────────┬─────────────────┘
   │          │          │          │
   ▼          ▼          ▼          ▼
 terrain.ts  physics.ts   ai.ts   renderer.ts
 Genera     Proyectiles,  Calcula  Dibuja en
 deformación colisiones,  ángulo   Canvas 2D
 terreno     trayectoria  y poder
```

### Responsabilidades por módulo

| Módulo | Archivo | Responsabilidad |
|---|---|---|
| **Engine** | `engine.ts` | Orquesta todo: estado del juego, turnos, IA, explosiones. Clase `TanksEngine`. |
| **Types** | `types.ts` | Interfaces (`Tank`, `GameState`, `Projectile`, `Explosion`, etc.), tipos union, constantes de colores/nombres. |
| **Constants** | `constants.ts` | Todos los valores numéricos del juego (dimensiones, física, IA, colores visuales). |
| **Terrain** | `terrain.ts` | Generación procedural de terreno, interpolación, deformación por explosiones. |
| **Physics** | `physics.ts` | Movimiento de proyectiles (gravedad + viento), colisiones con terreno/límites, cálculo de trayectoria. |
| **AI** | `ai.ts` | Selección de objetivo aleatorio, cálculo de ángulo/poder con imprecisión, retardo de "pensamiento". |
| **Renderer** | `renderer.ts` | Dibujo completo del frame en Canvas 2D (cielo, estrellas, terreno, tanques, proyectil, explosiones, HUD). |

---

## 3. Flujo del Juego

### Estados (`GamePhase`)

```
menu ──→ setup ──→ playing ⇄ exploding ──→ gameover ──→ menu / rematch
                   (proyectil  (explosión   (1 tanque
                    volando)    animada)     vivo o 0)
```

| Fase | Descripción |
|---|---|
| `menu` | Pantalla principal. Dos botones: **VS AI** y **MULTIPLAYER**. |
| `setup` | Selección de número de tanques (2-6). Botón START BATTLE. |
| `playing` | Turno activo. Se apunta y dispara. Proyectil en vuelo. IA "piensa" si es su turno. |
| `exploding` | Animación de explosión (45 frames). Se deforma el terreno y se verifican muertes. Al terminar → siguiente turno o gameover. |
| `gameover` | Un ganador o empate. Botones REMATCH y MENU. |

### Transiciones (gestionadas por `TanksEngine`)

1. **menu → setup:** `TanksGame.setScreen('setup')` vía `handleSelectMode`.
2. **setup → playing:** `engine.startGame(config)` que setea `phase = 'playing'`.
3. **playing → exploding:** Colisión de proyectil → `handleExplosion()` → `phase = 'exploding'`.
4. **exploding → playing:** Todas las explosiones terminan → `nextTurn()` → siguiente tanque vivo.
5. **exploding → gameover:** `nextTurn()` detecta ≤1 tanque vivo → `phase = 'gameover'`.
6. **gameover → playing:** `engine.startGame()` (rematch con misma config).
7. **gameover → menu:** Reset completo vía `handleBackToMenu`.

---

## 4. Controles Táctiles

### Touch-to-Aim (apuntar tocando el canvas)

- El usuario toca/mueve el dedo sobre el canvas.
- El engine calcula el ángulo desde la posición del cañón (`tank.x`, `tank.y - TANK_HEIGHT`) hasta el punto táctil.
- Se convierte a grados y se clamp a `[-175°, -5°]` (solo ángulos hacia arriba).
- Solo funciona durante el turno del jugador humano, cuando no hay proyectil en vuelo.
- Se implementa vía `setAngleFromPosition()` en el engine, llamado desde `handleCanvasPointerDown/Move` en `TanksGame.tsx`.
- El contenedor canvas tiene `touchAction: 'none'` para evitar scroll nativo.

### Botón FIRE con potencia oscilante

- Botón **🔥 FIRE** visible solo cuando es turno del jugador humano y no hay proyectil activo.
- Al presionar (`onPointerDown`): se inicia oscilación de potencia.
  - Potencia empieza en `MIN_POWER` (10) y sube en pasos de 3 cada 30ms.
  - Al llegar a `MAX_POWER` (100) baja. Bucle continuo arriba/abajo.
  - La potencia oscilante se aplica al tanque activo vía `engine.setTankPower()`.
- Al soltar (`onPointerUp` / `onPointerLeave`): se detiene la oscilación y se ejecuta `engine.fire()`.
- El intervalo se limpia en cada cambio de turno (efecto `useEffect` dependiente de `activeTankIndex`).

---

## 5. Dimensiones de Tanques

Todas las dimensiones están en píxeles y definen tanques **compactos** (~65% del tamaño original):

| Constante | Valor | Descripción |
|---|---|---|
| `TANK_WIDTH` | 20 | Ancho del cuerpo |
| `TANK_HEIGHT` | 11 | Alto del cuerpo |
| `TANK_TRACKS_WIDTH` | 22 | Ancho de las orugas |
| `TANK_TRACKS_HEIGHT` | 5 | Alto de las orugas |
| `TANK_TURRET_RADIUS` | 6 | Radio de la torreta (semicírculo) |
| `TANK_BARREL_LENGTH` | 15 | Longitud del cañón |
| `TANK_BARREL_WIDTH` | 3 | Ancho del cañón |
| `TANK_BARREL_MOUTH_WIDTH` | 5 | Ancho de la boca del cañón |
| `TANK_BARREL_MOUTH_HEIGHT` | 3 | Alto de la boca del cañón |

### Paleta de colores de tanques

| Índice | Nombre | Color |
|---|---|---|
| 0 | Alpha | `#ff2d78` (magenta-rosa) |
| 1 | Bravo | `#00e5ff` (cyan) |
| 2 | Charlie | `#ffdd00` (amarillo) |
| 3 | Delta | `#7cff00` (verde lima) |
| 4 | Echo | `#ff6b00` (naranja) |
| 5 | Foxtrot | `#b44dff` (púrpura) |
| 6 | Golf | `#ff4444` (rojo) |
| 7 | Hotel | `#00ffa3` (turquesa) |

---

## 6. Distribución de Tanques

- **Márgenes:** `TANK_MARGIN_RATIO = 0.06` (6% del ancho del canvas a cada lado).
- **Espaciado:** Los tanques se distribuyen uniformemente dentro del ancho jugable (`playableWidth = width - 2 * margin`).
- **Fórmula de posición X:** `margin + spacing * (i + 1)` donde `spacing = playableWidth / (tankCount + 1)`.
- **Posición Y:** Se calcula desde el terreno mediante `getTankPosition(terrain, x)`.
- **Ángulo inicial:** Tanques en la mitad izquierda apuntan a `-60°`; los de la derecha a `-120°`.
- **Potencia inicial:** `TANK_DEFAULT_POWER = 50`.
- **Máximo:** 2-6 tanques (hasta 8 definidos en colores/nombres).

### IA

- En modo `ai`: solo el tanque 0 es humano, el resto son IA.
- En modo `local`: todos son humanos (pasa dispositivo).

---

## 7. Canvas y Orientación

### Sin forced landscape

- El canvas se adapta al tamaño del contenedor `#tanks-canvas-container` mediante `ResizeObserver`.
- Funciona en **portrait y landscape** sin rotación forzada.
- El engine escala el terreno proporcionalmente cuando cambian las dimensiones (`updateDimensions`).
- Dimensiones iniciales: `window.innerWidth` × `window.innerHeight`.

### Layout de pantalla durante el juego

```
┌─────────────────────────────┐
│ HUD (36px)                  │ ← Nombre, ángulo, potencia, viento
├─────────────────────────────┤
│                             │
│     Canvas (flex-1)         │ ← Área de juego con touch handling
│     #tanks-canvas-container │   touchAction: none
│                             │
├─────────────────────────────┤
│ Controles (72px min)        │ ← Estado tanques + botón FIRE
└─────────────────────────────┘
```

### Resize handling

- `ResizeObserver` observa el contenedor y actualiza canvas y engine.
- En el primer render, si las dimensiones son 0×0 (SSR/mount timing), se reintentan hasta 5 veces vía `requestAnimationFrame`.
- El engine preserva deformaciones del terreno escalando proporcionalmente.
- Stars cache se limpia en cada resize.

---

## 8. Engine API (`TanksEngine`)

### Constructor

```ts
new TanksEngine(config: GameConfig, dimensions?: CanvasDimensions)
```

### Métodos públicos

| Método | Descripción |
|---|---|
| `getState(): Readonly<GameState>` | Retorna copia del estado actual. |
| `subscribe(cb): () => void` | Suscribe a cambios de estado. Retorna función de unsuscribe. |
| `startGame(config: GameConfig)` | Inicia nueva partida. Genera terreno y tanques. Setea phase = 'playing'. |
| `reset()` | Reset a estado inicial con config anterior. |
| `setPhase(phase: GamePhase)` | Cambia fase manualmente. |
| `setTankAngle(tankId, angle)` | Ajusta ángulo del cañón (clamp a [-175, -5]). |
| `setTankPower(tankId, power)` | Ajusta potencia (clamp a [10, 100]). |
| `fire()` | Dispara proyectil del tanque activo. No-op si no es momento. |
| `update()` | Avanza un frame (actualiza proyectil, IA, explosiones). |
| `setAngleFromPosition(tankId, touchX, touchY, canvasRect)` | Calcula ángulo desde coordenada táctil. |
| `getTerrainY(x): number` | Altura del terreno en coordenada X. |
| `getTerrainAngle(x): number` | Pendiente del terreno en X. |
| `isPositionValid(x, y): boolean` | True si `y < terrainY(x)` (por encima del terreno). |
| `updateDimensions(dimensions)` | Redimensiona canvas. Escala terreno proporcionalmente. |
| `isAnimating(): boolean` | True si phase es `playing` o `exploding`. |
| `getAITarget(): Tank \| null` | Objetivo actual de la IA (debug). |
| `executeAIShot()` | Dispara IA inmediatamente (testing). |

### Patrón observable

El engine usa un patrón pub/sub simple:

```ts
// Suscribir
const unsubscribe = engine.subscribe((state) => {
  // React setState aquí
});

// Desuscribir al desmontar
unsubscribe();
```

Cada mutación de estado llama `notify()` que emite una copia superficial del estado a todos los subscribers.

---

## 9. Sistema de Renderizado

La función principal `renderGame(ctx, state, dimensions, showTrajectory)` dibuja un frame completo en orden:

1. **Clear** — `ctx.clearRect(0, 0, width, height)`
2. **Cielo** — Gradiente vertical 3 stops (`#0a0a0f` → `#111122` → `#1a1a2e`)
3. **Estrellas** — 60 estrellas pseudo-aleatorias (seed=42), cacheadas, solo en 60% superior del canvas
4. **Terreno** — Polígono relleno con gradiente (4 colores), línea de superficie verde (`#5a8a2a`, 2px)
5. **Tanques** — Orugas (#222), cuerpo (color), torreta (semicírculo), cañón (con boca), nombre, indicador activo (glow + flecha)
6. **Trayectoria** — Línea punteada (3px/6px dash) con opacidad 27%, solo para jugador humano
7. **Proyectil** — Trail degradado (50 puntos, opacidad creciente) + bola blanca con glow naranja (blur 10px)
8. **Explosiones** — Gradiente radial (blanco → naranja → rojo → transparente), radio sinusoidal, 20 partículas con gravedad
9. **Indicador de viento** — Esquina superior derecha, flecha proporcional al viento
10. **Contador de tanques** — "N TANKS" en esquina superior derecha

### Indicador de tanque activo

- Glow de sombra del color del tanque (`shadowBlur: 15`).
- Flecha triangular apuntando hacia abajo sobre el nombre.
- Nombre más alto (separado 25px en vez de 15px).

---

## 10. Sistema de IA

### Flujo

1. Cuando es turno de IA: `updateAI()` se llama cada frame.
2. Contador `aiThinkingFrames` se incrementa hasta 75 frames (retardo).
3. Tras el retardo: `shouldAIFire()` retorna true.
4. Se calcula disparo: `getAITarget()` (aleatorio entre vivos) → `calculateAIShot()`.
5. Tras un `setTimeout(300ms)` adicional: se aplica ángulo/poder y se dispara.

### Cálculo del disparo (`calculateAIShot`)

1. Calcula distancia y ángulo directo al objetivo.
2. Aplica **lobbing** aleatorio: resta 20°-35° (para hacer arco).
3. Compensa **viento**: resta `wind * 8` grados.
4. Añade **imprecisión**: ±6° aleatorios en ángulo, ±5 en potencia.
5. **Potencia**: basada en distancia × 0.18 + ruido (±7).
6. Clamp final: ángulo [-170, -10], potencia [25, 95].

---

## 11. Física de Proyectiles

### Movimiento

- Velocidad inicial: `power * 0.12` en dirección del ángulo.
- Cada frame: `vx += wind * 0.002`, `vy += 0.15` (gravedad).
- Posición: `x += vx`, `y += vy`.

### Colisiones

- **Terreno:** `projectile.y >= terrainY(projectile.x)` → explosión en superficie.
- **Límites laterales:** `x < 0` o `x > width` → explosión en borde.
- **Límite inferior:** `y > height + 50` → explosión.

### Trail

- Últimos 50 puntos almacenados (FIFO).
- Se dibujan con opacidad creciente (`i / trail.length * 0.5`).

### Explosión

- Radio: 35px.
- Deformación del terreno: desplaza puntos dentro del radio hacia abajo (`factor * radius * 0.5`).
- Tanques dentro del radio son destruidos (explosión secundaria en su posición).
- Animación: 45 frames con gradiente radial sinusoidal.

---

## 12. Generación de Terreno

### Algoritmo

- 60 puntos distribuidos uniformemente en X.
- Base Y: 55% de la altura del canvas.
- 4 capas de ondas sinusoidales superpuestas (frecuencias: 0.4, 1.0, 2.3, 5.1).
- 15% de probabilidad de segmentos planos (excepto bordes).
- Clamp Y entre 20% y 85% de la altura.
- Generador pseudo-aleatorio con seed opcional.

### Deformación

- Cada explosión empuja los puntos del terreno hacia abajo.
- Factor de desplazamiento: `(1 - distance/radius) * radius * 0.5`.

---

## 13. Game Loop

```
requestAnimationFrame → engine.update() → renderGame()
       ↑                                        │
       └───── si isAnimating() ─────────────────┘
       └───── sino: se detiene el loop
```

- El loop arranca cuando `screen === 'playing' || screen === 'exploding'`.
- Se detiene automáticamente cuando la animación termina (fase cambia a `gameover`).
- Se reinicia en cada transición a fase activa.

---

## 14. Notas de Implementación

- **Tipado:** TypeScript estricto con interfaces en `types.ts`.
- **Estado:** Single source of truth en `TanksEngine`. React solo recibe snapshots vía suscripción.
- **Sin estado global externo:** No hay Context/Redux. El engine vive en un `useRef` de React.
- **Touch events:** Se usan Pointer Events (unifican mouse y touch). `touchAction: none` previene scroll.
- **Responsive:** ResizeObserver + escalado proporcional del terreno. Funciona en cualquier orientación.
- **Memoria:** El game loop se detiene cuando no es necesario. Cleanup completo en useEffect returns.
