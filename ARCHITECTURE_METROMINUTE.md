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
    → setTimeout(100ms):
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
    → setTimeout(50ms):
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
El modo clásico inicia correctamente (timer arranca, UI se muestra) pero no aparece ninguna burbuja.

### Análisis

Tras revisar todo el código fuente, el flujo de classic mode debería funcionar:
1. `startClassicMode()` → isPlaying=true, targets.clear(), notify()
2. `setScreen('game')` → re-render con gameAreaRef disponible
3. `spawnInitialTargets()` → llama `engine.spawnTarget(w, h)` → crea target → notify()
4. Subscribe callback → `setTargets(engine.getTargets())` → React re-renderiza targets

**Posibles causas (por orden de probabilidad):**

#### 1. `gameAreaRef.current` con dimensiones 0 (ALTA probabilidad)
`spawnInitialTargets()` usa `gameArea.offsetWidth` y `gameArea.offsetHeight`. Si el gameArea no tiene layout completo en el momento del setTimeout(100ms), las dimensiones podrían ser 0.
- `spawnTarget` calcularía `maxX = 0 - 45 = -45`, `maxY = 0 - 45 = -45`
- `x = Math.random() * -45` → valor negativo
- `y = 140 + Math.random() * (-45 - 140)` → valor NaN o negativo
- El target se renderizaría fuera de la pantalla

**Verificación:** FullStack debe añadir `console.log('Game area:', gameArea.offsetWidth, gameArea.offsetHeight)` en `spawnInitialTargets()`.

#### 2. `screenRef.current` no sincronizado (MEDIA probabilidad)
Si el subscribe callback se ejecuta antes de que el useEffect de sincronización actualice `screenRef` a 'game', entonces `setTargets` no se llama y los targets no se actualizan en React.

**Verificación:** Console.log `screenRef.current` en el subscribe callback y en `spawnInitialTargets`.

#### 3. React Strict Mode double-mount (solo development)
En desarrollo, React monta→desmonta→monta. El primer setTimeout puede interferir con el segundo engine.

**Verificación:** Probar en producción (build + start).

#### 4. Target renderizado pero invisible (BAJA probabilidad)
CSS z-index, overflow hidden, o conflicto con el header overlay.

**Verificación:** Inspeccionar DOM en DevTools para ver si el target existe pero está oculto.

### Solución propuesta

1. **FullStack:** Añadir console.logs diagnósticos en `spawnInitialTargets()`:
   - `gameAreaRef.current` existe?
   - `gameArea.offsetWidth`, `gameArea.offsetHeight`
   - Resultado de `engine.spawnTarget()`
   - `screenRef.current` valor
   - `engine.getTargets()` después del spawn

2. **FullStack:** Si las dimensiones son 0, aumentar el timeout de 100ms a 200-300ms o usar `requestAnimationFrame` para asegurar que el layout está completo.

3. **FullStack:** Alternativa más robusta: usar `useEffect` con dependencia en `screen` para spawnear targets cuando la pantalla cambia a 'game', en vez de setTimeout.

4. **FullStack:** Añadir guard en `spawnTarget`: si `gameWidth < TARGET_SIZE * 2` o `gameHeight < HEADER_HEIGHT + TARGET_SIZE`, no spawnear y loggear warning.

---

## Otros hallazgos

### Mejoras de código

1. **GameBoard.tsx es un God Component (~500 líneas):** Debería dividirse en hooks (`useGameEngine`, `useGameLoop`, `useTargetSpawning`) y componentes separados.

2. **Mixing refs y state para sync:** `screenRef` + `isTransitioningRef` son workarounds para stale closures. Un custom hook con `useRef` + `useCallback` sería más limpio.

3. **cleanup() parcial:** No limpia el `countdownIntervalRef`. Comentario dice que se maneja separadamente pero es propenso a leaks.

4. **No hay spawn periódico:** Los targets solo aparecen al inicio, al cambiar fase, o al clickar. Si un target desaparece sin click (no debería pasar), no se reemplaza. En normal mode, los señuelos usan `toggleDecoys` (show/hide) en vez de spawn/despawn.

5. **Clase GameEngine usa `this.targets` Map:** No hay límite de targets. Si algo sale mal, podría acumular targets zombies.
