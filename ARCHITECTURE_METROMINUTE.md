# ARCHITECTURE_METROMINUTE.md

## Resumen

Metro Minute es un juego arcade tipo "whack-a-mole" con dos modos: **Classic** (60s freeplay) y **Normal** (5 challenges secuenciales).

**Stack:** Next.js (App Router) + React 19 + TypeScript + Framer Motion + Tailwind CSS
**Repo:** https://github.com/Rdecristobal/metrominute
**Deploy:** https://metrominute.vercel.app
**Workspace:** `~/.openclaw/workspace-dyzink/metrominute/`

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── page.tsx              # Home (hub de juegos)
│   ├── bubble/page.tsx       # Página del juego (GameBoard con ?mode= param)
│   ├── leaderboard/page.tsx
│   └── api/ (stats, scores)
├── components/
│   ├── game/
│   │   ├── GameBoard.tsx     # Componente principal del juego (~500 líneas)
│   │   ├── Target.tsx        # Burbuja individual
│   │   ├── Timer.tsx, ScoreBoard.tsx, BackToHub.tsx
│   │   └── GameModes.tsx     # Placeholder (no usado)
│   └── home/ (Header, Footer, GamesGrid, GameCard, RetroBackground)
├── lib/
│   └── game/
│       ├── engine.ts         # Game engine (GameEngine class, PHASES, CHALLENGES)
│       ├── types.ts          # Tipos (GameState, Target, Phase, Challenge, etc.)
│       ├── audio.ts          # Sonidos (Web Audio API)
│       └── utils.ts
└── types/
    └── game.ts               # Tipo Game para el hub
```

---

## Game Engine (engine.ts)

### Clase GameEngine

Clase con estado interno (GameState) + patrón observer (subscribe/notify).

**Estado clave:**
- `mode`: 'classic' | 'normal'
- `isPlaying`, `isGameOver`: flags de estado del juego
- `currentPhase` (classic) / `currentChallenge` (normal): fase actual
- `targets`: Map<string, Target> — burbujas activas

**Métodos principales:**
- `startGame()` → dispatcha a `startClassicMode()` o `startNormalMode()`
- `spawnTarget(width, height, isGolden)` → crea burbuja y notifica
- `spawnDecoy(width, height)` → crea señuelo verde
- `clickTarget(id)` → procesa click, devuelve resultado
- `tick()` → game loop (1s interval): decrementa tiempo, check fases/challenges
- `moveAllTargets()` → reposiciona todas las burbujas

### Modo Classic — PHASES

| Fase | Tiempo | Movimiento | Señuelos |
|------|--------|------------|----------|
| Warm Up | 60→50s | No | 0 |
| Movement | 50→35s | Sí (3s) | 0 |
| Beware of Greens | 35→20s | Sí (2s) | 3 |
| CLIMAX | 20→0s | Sí (1s) | 5 |

**Lógica:** `getCurrentPhase()` calcula fase por `timeLeft`. Al cambiar fase → clear targets + spawn nuevo target.

### Modo Normal — CHALLENGES

| Challenge | Duración | Movimiento | Señuelos | Score Req | Golden | Survival |
|-----------|----------|------------|----------|-----------|--------|----------|
| 1: Basic | 30s | No | 0 | 500 | No | - |
| 2: Movement | 30s | Sí (2s) | 0 | 500 | No | - |
| 3: Decoys | 30s | Sí (2s) | 3 | 1000 | Sí | - |
| 4: CHIMAX | 30s | Sí (1s) | 5 | 1000 | Sí | - |
| 5: SURVIVAL | 30s | Sí (0.8s) | 5 | 0 | No | ✅ |

**Lógica:** Cada challenge tiene score objetivo. Si se alcanza → `challengeCompleted = true`. El tick detecta fin por tiempo o score y ejecuta `endChallenge()`.

---

## GameBoard.tsx — Flujo Principal

### refs y estado

- `engineRef`: referencia a GameEngine
- `gameAreaRef`: div del área de juego (para calcular dimensiones)
- `screenRef`: mirror de `screen` state (para evitar stale closures en subscribe)
- `isTransitioningRef`: bloquea actualizaciones durante transiciones

### Flujo Classic Mode

```
User selecciona Classic → setSelectedMode('classic')
  → useEffect recrea engine con mode='classic'
  → User pulsa PLAY
  → startGame() [rama classic]
    → engine.startGame() → startClassicMode()
    → setScreen('game')
    → useEffect([screen]) detecta screen='game'
    → requestAnimationFrame() × 2 (double rAF):
      → startGameLoop() → setInterval(tick, 1000)
      → setupMovementAndDecoys() → phase 0: sin movimiento, sin señuelos
      → spawnInitialTargets() → 1 target normal
```

### Flujo Normal Mode

```
User selecciona Normal → setSelectedMode('normal')
  → User pulsa PLAY
  → startGame() [rama normal]
    → showCountdown(0) → cuenta atrás 3-2-1-GO
    → startChallenge(0) → engine.startChallenge(0)
    → setScreen('game')
    → useEffect([screen]) detecta screen='game'
    → requestAnimationFrame() × 2 (double rAF):
      → startGameLoop()
      → setupMovementAndDecoys()
      → spawnInitialTargets()
```

### Spawn de targets

- **Inicial:** `spawnInitialTargets()` → 1 target normal + golden si aplica + señuelos si aplica
- **Al clickar:** `handleTargetClick()` → si `shouldSpawnMore` → nuevo target después de 300ms
- **Al cambiar fase (classic):** game loop detecta cambio → clear + spawn 1 target + setup movement/decoys

### Renderizado de targets

Targets se almacenan en estado React (`targets` array). Se renderizan via `AnimatePresence` + componente `Target`.

**Target.tsx:**
- Posicionado con `absolute` + `style.left/top` (set en useEffect)
- Animación de aparición: framer-motion `initial/animate/exit` (scale 0→1)
- Colores: normal=#00D4FF, golden=#FFD700, decoy=#10B981
- Movimiento suave: CSS transition `left 0.5s ease, top 0.5s ease`

---

## BUG: Modo Classic — No se ven burbujas

### Descripción
El modo clásico inicia correctamente (timer arranca, UI se muestra) pero no aparece ninguna burbuja. Confirmado en producción tras el commit 57b89a8 (doble rAF + guards de dimensiones).

### Causa raíz identificada (2026-03-31)

**`isTransitioningRef.current` se queda atascado en `true` después de jugar en modo Normal.**

El subscribe callback del engine tiene este guard:

```typescript
// GameBoard.tsx — dentro de useEffect([selectedMode])
const unsubscribe = engineRef.current.subscribe((state) => {
  setGameState({...});
  if (screenRef.current === 'game' && !isTransitioningRef.current) {  // ← ESTE GUARD
    setTargets(engineRef.current!.getTargets());
  }
});
```

Si `isTransitioningRef.current === true`, **los targets se crean en el engine pero NUNCA se pasan a React state** → nunca se renderizan.

### Rastreo completo del bug

#### Dónde se setea `isTransitioningRef.current = true`

| Ubicación | Cuándo |
|---|---|
| `startGameLoop()` → interval callback, `result.challengeEnded` | Al terminar un challenge en modo Normal |
| `startGameLoop()` → interval callback, cambio de fase Classic | Al cambiar de fase en Classic (temporal, se resetea en el mismo bloque) |

#### Dónde se resetea a `false`

| Ubicación | Cuándo |
|---|---|
| `startChallenge()` | Solo para modo Normal (al iniciar cada challenge) |
| Cambio de fase Classic | Dentro del mismo bloque síncrono (no problema) |

#### Dónde **NO** se resetea (el bug)

| Función | Problema |
|---|---|
| `startGame()` rama Classic | **No resetea** `isTransitioningRef` |
| `goHome()` | **No resetea** `isTransitioningRef` |
| `handleGameOver()` → `setScreen('gameover')` | **No resetea** `isTransitioningRef` |

#### Flujo de reproducción

1. Usuario juega modo Normal
2. Un challenge termina → `isTransitioningRef.current = true`
3. Se muestra pantalla de transición o game over
4. `isTransitioningRef.current` **permanece `true`** (nunca se resetea al salir)
5. Usuario selecciona Classic y pulsa PLAY
6. `startGame()` → `startClassicMode()` → `isPlaying=true` → `setScreen('game')`
7. `useEffect([screen])` → doble rAF → `spawnInitialTargets()`
8. `engine.spawnTarget()` **funciona** → target existe en el engine
9. `notify()` → subscribe callback → `isTransitioningRef.current === true` → **`setTargets` SKIPPEADO** ❌
10. React state `targets` sigue vacío → **no se renderiza nada**

#### Por qué el commit 57b89a8 no lo arregló

El commit añadió:
- Doble `requestAnimationFrame` para esperar layout → **no relevante**, el problema no es de layout
- Guards de dimensiones en `spawnTarget`/`spawnDecoy` → **no relevante**, el target SÍ se crea en el engine

El target se crea correctamente en el engine, pero **nunca llega al estado de React** porque el subscribe callback lo filtra.

### Bug secundario: `prevPhaseRef` no se resetea

Al hacer RETRY en Classic, `prevPhaseRef.current` mantiene el valor de la partida anterior (ej: `3`). `startClassicMode()` resetea `currentPhase` a `0`, pero en el primer tick del game loop:

```typescript
if (selectedMode === 'classic' && engineState.currentPhase !== prevPhaseRef.current) {
  // 0 !== 3 → TRUE → se dispara un cambio de fase falso
  isTransitioningRef.current = true;
  engineRef.current?.clearTargets();
  setTargets([]);
  // ...
  isTransitioningRef.current = false;
  engineRef.current?.spawnTarget(...);
  prevPhaseRef.current = 0;
}
```

Resultado: las burbujas desaparecen y reaparecen en el primer tick (flicker visual). No impide jugar, pero es un defecto.

### Solución exacta

**Archivo:** `src/components/game/GameBoard.tsx`

**Fix 1 — Resetear `isTransitioningRef` en `startGame()` (rama Classic):**

```typescript
const startGame = () => {
    if (selectedMode === 'normal') {
      showCountdown(0);
    } else {
      isTransitioningRef.current = false;  // ← AÑADIR
      prevPhaseRef.current = 0;             // ← AÑADIR
      engineRef.current?.startGame();
      setScreen('game');
    }
  };
```

**Fix 2 — Resetear refs en `goHome()`:**

```typescript
const goHome = () => {
    cleanup();
    isTransitioningRef.current = false;  // ← AÑADIR
    prevPhaseRef.current = 0;             // ← AÑADIR
    engineRef.current?.resetGame();
    setScreen('home');
  };
```

**Fix 3 — Resetear refs en `handleGameOver()` (prevención defensiva):**

```typescript
const handleGameOver = () => {
    isTransitioningRef.current = false;  // ← AÑADIR
    setScreen('gameover');
  };
```

### Por qué funciona

- `startGame()` es el punto de entrada para Classic. Resetear `isTransitioningRef` aquí garantiza que el subscribe callback no filtre los targets.
- `goHome()` es el punto de salida. Resetear aquí limpia el estado para cualquier modo futuro.
- `handleGameOver()` es prevención defensiva: si un game over deja la ref en `true`, se limpia antes de que el usuario elija otra acción.

### Análisis descartado

| Causa descartada | Razón |
|---|---|
| Dimensiones 0 del gameArea | Doble rAF (commit 57b89a8) garantiza layout. Además, el guard en `spawnTarget` devolvería `null` y se vería el `console.warn` en consola. |
| `screenRef.current` no sincronizado | El useEffect de sincronización (`screenRef.current = screen`) se declara ANTES del useEffect de spawn. React ejecuta efectos en orden de declaración. Siempre está sincronizado cuando el spawn ejecuta. |
| engineRef condición de carrera | El useEffect([selectedMode]) se ejecuta antes del useEffect([screen]) (declarado primero). Además, `selectedMode` cambia en un render distinto a `screen`. No hay solapamiento. |
| Target renderizado pero invisible | El componente Target usa `position: absolute` con `left/top` inline. No hay `display: none` condicional. Z-index solo diferencia decoys (100) de normales (1). Si existiera en DOM, sería visible. |

---

## Otros hallazgos

### Mejoras de código

1. **GameBoard.tsx es un God Component (~500 líneas):** Debería dividirse en hooks (`useGameEngine`, `useGameLoop`, `useTargetSpawning`) y componentes separados.

2. **Mixing refs y state para sync:** `screenRef` + `isTransitioningRef` son workarounds para stale closures. Un custom hook con `useRef` + `useCallback` sería más limpio.

3. **cleanup() parcial:** No limpia el `countdownIntervalRef`. Comentario dice que se maneja separadamente pero es propenso a leaks.

4. **No hay spawn periódico:** Los targets solo aparecen al inicio, al cambiar fase, o al clickar. Si un target desaparece sin click (no debería pasar), no se reemplaza. En normal mode, los señuelos usan `toggleDecoys` (show/hide) en vez de spawn/despawn.

5. **Clase GameEngine usa `this.targets` Map:** No hay límite de targets. Si algo sale mal, podría acumular targets zombies.
