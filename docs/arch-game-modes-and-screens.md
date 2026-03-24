# Arquitectura: Modos de Juego y Flujo de Pantallas

**Fecha:** 2026-03-24  
**Autor:** Arquitecto  
**Propósito:** Documentar arquitectura actual antes de fixes de bugs  
**Estado:** PRE-FIX DOCUMENTATION

---

## 1. Arquitectura de Modos de Juego

### 1.1 Modo Normal (Challenge Mode)

**Descripción:** Sistema de 5 challenges progresivos con objetivos de score.

**Características:**
- **Duración:** 30 segundos por challenge
- **Progresión:** Lineal (no se puede saltar)
- **Objetivo:** Alcanzar score requerido antes de que se acabe el tiempo
- **Decoys:** Presentes en challenges 3, 4 y 5 (verdes, restan puntos)
- **Golden targets:** Presentes en challenges 3 y 4 (+50 puntos)
- **Survival:** Challenge 5 es especial (score decrementa con el tiempo)

**Flujo de challenges:**
```
1: Basic (500 pts) → 2: Movement (500 pts) → 3: Decoys (1000 pts) → 
4: CHIMAX (1000 pts) → 5: SURVIVAL (aguantar 30s) → Victory
```

### 1.2 Modo Classic

**Descripción:** Modo de 60 segundos con fases progresivas sin objetivos de score.

**Características:**
- **Duración:** 60 segundos total
- **Progresión:** Por tiempo (fases cambian automáticamente)
- **Objetivo:** Maximizar score (no hay score mínimo)
- **Decoys:** NUNCA deben aparecer (solo en Normal mode)
- **Golden targets:** No existen en Classic
- **Survival:** No aplica

**Fases:**
```
Warm Up (60-50s) → Movement (50-35s) → Beware of Greens (35-20s) → CLIMAX (20-0s)
```

**IMPORTANTE:** Classic mode NO usa el sistema de challenges. Es un flujo continuo de 60s.

---

## 2. Flujo de Pantallas y Estados

### 2.1 Estados del Juego (screen state)

```typescript
type ScreenState = 'countdown' | 'game' | 'result' | 'victory' | 'gameover'
```

### 2.2 Flujo Normal Mode

```
┌─────────────┐
│   COUNTDOWN │ ← Challenge 1 (3-2-1-GO)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│     GAME    │ ← Challenge activo (30s)
└──────┬──────┘
       │
       ├──── [Score alcanzado] ────┐
       │                            │
       ├──── [Tiempo agotado + Score OK] ──┐
       │                                     │
       ├──── [Tiempo agotado + Score FAIL] ──┤
       │                                     │
       │                                     ▼
       │                            ┌──────────────┐
       │                            │   GAMEOVER   │
       │                            └──────┬───────┘
       │                                   │
       │                                   ├─ [RETRY] ──→ COUNTDOWN (mismo challenge)
       │                                   │
       │                                   └─ [INICIO] ──→ Home (/)
       │
       ▼
┌──────────────┐
│  COUNTDOWN   │ ← Next Challenge (3-2-1-GO)
└──────┬───────┘
       │
       ▼
    (repite flujo)
       │
       │ [Challenge 5 completado]
       ▼
┌──────────────┐
│   VICTORY    │ ← Pantalla de victoria
└──────┬───────┘
       │
       └─ [INICIO] ──→ Home (/)
```

### 2.3 Flujo Classic Mode

```
┌─────────────┐
│     GAME    │ ← Inicio directo (sin countdown)
└──────┬──────┘
       │
       │ [60 segundos]
       ▼
┌──────────────┐
│    RESULT    │ ← Pantalla de resultados
└──────┬───────┘
       │
       ├─ [RETRY] ──→ GAME (nueva partida)
       │
       └─ [INICIO] ──→ Home (/)
```

**NOTA:** Classic mode NO tiene pantalla de Game Over, ni Victory, ni Countdown. Solo tiene GAME → RESULT.

### 2.4 Bug Identificado: Pantallas Duplicadas

**Problema actual:**
```typescript
// GameBoard.tsx - useEffect auto-start
useEffect(() => {
  startGame();  // ← Se ejecuta al montar el componente
}, []);
```

**Síntoma:**
1. Usuario entra a `/game?mode=normal`
2. Componente se monta → `startGame()` → muestra COUNTDOWN
3. Si hay Game Over → botón RETRY → `startGame()` → muestra COUNTDOWN otra vez

**Causa raíz:**
- No hay estado de "home screen" o "welcome screen"
- El auto-start en mount crea una pantalla de inicio implícita
- Cada vez que se llama `startGame()` en Normal mode, muestra countdown

**Comportamiento esperado:**
- **Primera vez:** Auto-start es correcto
- **Después de Game Over:** RETRY debería ir directo al countdown del mismo challenge (ya lo hace)
- **Problema:** Si hay un bug en el flujo de estados, puede haber duplicación

---

## 3. Diferencias Técnicas entre Modos

### 3.1 Engine: GameMode

```typescript
// engine.ts
export const PHASES: Phase[] = [...]  // Solo para Classic
export const CHALLENGES: Challenge[] = [...]  // Solo para Normal

// engine.ts - getInitialState
timeLeft: mode === 'classic' ? 60 : 30
```

### 3.2 Decoys

**Normal Mode:**
```typescript
// engine.ts - spawnDecoy
if (this.state.mode === 'classic') return null;  // ← PROTECCIÓN

// GameBoard.tsx - setupMovementAndDecoys
if (mode === 'normal' && phaseConfig?.decoys && phaseConfig.decoys > 0) {
  decoyIntervalRef.current = setInterval(() => {
    toggleDecoys();  // ← Togglea visibilidad de decoys
  }, 2000);
}
```

**Classic Mode:**
- `spawnDecoy()` retorna `null` (no spawnea)
- `setupMovementAndDecoys()` no configura intervalo de decoys
- **PROBLEMA POTENCIAL:** Si hay decoys en el estado inicial o residual, pueden ser visibles

**Bug identificado:** Decoys visibles en Classic Mode
- **Causa posible:** Estado residual de una partida anterior en Normal mode
- **Fix requerido:** Limpiar targets completamente al cambiar de modo o iniciar Classic

### 3.3 Layout y Responsiveness

**Contenedor principal:**
```typescript
<div className="relative w-full max-w-[420px] h-[calc(100vh-2rem)] max-h-[95vh] md:h-[85vh] md:max-h-[850px] ...">
```

**Problema en Classic Mode:**
- `max-h-[95vh]` y `md:max-h-[850px]` pueden ser muy altos para móviles
- En Classic mode, el header ocupa más espacio (más info: phase indicator, etc.)
- **No hay diferenciación de layout por modo**

**Bug identificado:** Frame muy largo en Classic
- **Causa:** Layout no está optimizado por modo
- **Fix requerido:** Ajustar `max-h` o layout específicamente para Classic en móviles

### 3.4 Sistema de Sonido

**Estado del sonido:**
```typescript
// types.ts - GameState
soundEnabled: boolean

// engine.ts - toggleSound
toggleSound(enabled?: boolean): void {
  if (enabled !== undefined) {
    this.state.soundEnabled = enabled;
  } else {
    this.state.soundEnabled = !this.state.soundEnabled;
  }
  this.notify();
}
```

**Persistencia:**
```typescript
// Home page (page.tsx)
const toggleSound = () => {
  const newState = !soundEnabled;
  setSoundEnabled(newState);
  localStorage.setItem('metroMinuteSoundEnabled', newState.toString());  // ← PERSISTE
};

// GameBoard.tsx
<button onClick={() => {
  const newState = !gameState.soundEnabled;
  engineRef.current?.toggleSound(newState);  // ← NO PERSISTE
}}>
```

**Bug identificado:** Botón de sonido no funcional
- **Síntoma:** El sonido se togglea en memoria pero no se persiste en localStorage
- **Causa:** `toggleSound()` del engine no guarda en localStorage
- **Fix requerido:** Agregar persistencia en `engine.toggleSound()` o en el onClick del botón

---

## 4. Especificaciones de Pantallas

### 4.1 Countdown Screen

**Propósito:** Mostrar cuenta regresiva 3-2-1-GO antes de cada challenge (Normal mode)

**Elementos:**
- Título del challenge (ej: "1: Basic", "2: Movement")
- Números 3 → 2 → 1 → "GO!"
- Duración: 3.5 segundos (3s countdown + 0.5s delay)

**Implementación:**
```typescript
const showCountdown = (challengeIndex: number) => {
  countdownIntervalRef.current = setInterval(() => {
    // 3 → 2 → 1 → "GO" → startChallenge()
  }, 1000);
};
```

**Protección contra glitches:**
- Se limpia el intervalo anterior antes de crear uno nuevo
- Ref: `countdownIntervalRef`

### 4.2 Game Screen

**Propósito:** Gameplay activo

**Elementos (Normal Mode):**
- Header: Time, Score, Combo, High Score, Sound button
- Challenge progress bar (arriba del área de juego)
- Targets (normales, golden, decoys)
- Phase indicator (cuando cambia la fase - Classic mode)
- Efectos visuales: particles, floating scores, ripples, flash

**Elementos (Classic Mode):**
- Header: Time, Score, Combo, High Score, Sound button
- **NO hay** progress bar
- **NO hay** decoys
- Phase indicator (cuando cambia la fase)
- Efectos visuales: particles, floating scores, ripples, flash

### 4.3 Game Over Screen

**Propósito:** Mostrar cuando se falla un challenge (Normal mode)

**Elementos:**
- Título: "GAME OVER" (rojo, con glow)
- Mensaje: "No completaste el reto"
- Score actual vs Score requerido
- Botones: RETRY, INICIO

**Layout:**
```typescript
<div className="flex flex-col items-center justify-center h-full p-4 text-center">
  {/* Contenido */}
</div>
```

**Bug identificado:** Pantalla descentrada
- **Causa posible:** Contenedor padre no tiene `h-full` o hay conflictos de flexbox
- **Fix requerido:** Revisar jerarquía de contenedores y asegurar que el padre tenga altura definida

### 4.4 Victory Screen

**Propósito:** Mostrar cuando se completan los 5 challenges (Normal mode)

**Elementos:**
- Título: "🏆 ¡VICTORIA!" + "¡COMPLETADO!"
- Estadísticas agregadas: Avg Accuracy, Avg Max Combo, Mejor Racha
- Botón: INICIO

### 4.5 Result Screen

**Propósito:** Mostrar resultados finales (Classic mode)

**Elementos:**
- Score final
- High Score
- Accuracy
- Max Combo
- Max Streak
- Indicador de nuevo récord
- Botones: RETRY, INICIO

---

## 5. Consideraciones para los Fixes

### 5.1 Pantallas Duplicadas de Inicio

**Archivos afectados:**
- `src/components/game/GameBoard.tsx` (useEffect auto-start)
- Posible: `src/app/game/page.tsx`

**Riesgo:** MEDIO
- Cambiar el flujo de auto-start puede afectar la experiencia de usuario
- Considerar si realmente hay duplicación o es el flujo esperado

**Pregunta clave:** ¿El bug es que aparece countdown dos veces al entrar, o después de Game Over?

### 5.2 Decoys Visibles en Classic Mode

**Archivos afectados:**
- `src/lib/game/engine.ts` (spawnDecoy, startClassicMode)
- `src/components/game/GameBoard.tsx` (setupMovementAndDecoys, cleanup)

**Riesgo:** BAJO
- Ya hay protecciones implementadas
- Fix probablemente es limpiar estado residual

**Solución:**
```typescript
// En startClassicMode o cleanup
this.targets.clear();  // ← Asegurar que no haya targets residuales
```

### 5.3 Frame Largo en Classic Mode

**Archivos afectados:**
- `src/components/game/GameBoard.tsx` (layout del contenedor)

**Riesgo:** BAJO
- Es un cambio de CSS/layout
- No afecta lógica de juego

**Solución:**
```typescript
// Agregar clase condicional por modo
<div className={`... ${mode === 'classic' ? 'max-h-[80vh] md:max-h-[700px]' : 'max-h-[95vh] md:max-h-[850px]'}`}>
```

### 5.4 Botón de Sonido No Funcional

**Archivos afectados:**
- `src/lib/game/engine.ts` (toggleSound)
- `src/components/game/GameBoard.tsx` (onClick del botón)

**Riesgo:** BAJO
- Cambio simple de persistencia

**Solución:**
```typescript
// Opción 1: En engine.ts
toggleSound(enabled?: boolean): void {
  if (enabled !== undefined) {
    this.state.soundEnabled = enabled;
  } else {
    this.state.soundEnabled = !this.state.soundEnabled;
  }
  localStorage.setItem('metroMinuteSoundEnabled', this.state.soundEnabled.toString());  // ← AGREGAR
  this.notify();
}

// Opción 2: En GameBoard.tsx onClick
onClick={() => {
  const newState = !gameState.soundEnabled;
  engineRef.current?.toggleSound(newState);
  localStorage.setItem('metroMinuteSoundEnabled', newState.toString());  // ← AGREGAR
}}
```

### 5.5 Pantalla Game Over Descentrada

**Archivos afectados:**
- `src/components/game/GameBoard.tsx` (renderGameOverScreen, contenedor padre)

**Riesgo:** BAJO
- Es un cambio de CSS/layout
- Requiere investigar la jerarquía de contenedores

**Solución:**
- Revisar que el contenedor padre tenga `h-full` o altura definida
- Verificar que no haya conflictos con `flex` o `grid`

---

## 6. Test Plan Post-Fix

### 6.1 Pantallas Duplicadas
1. Entrar a `/game?mode=normal`
2. Verificar que solo aparece UN countdown al inicio
3. Perder el challenge (Game Over)
4. Click en RETRY
5. Verificar que aparece countdown del mismo challenge
6. Completar el challenge
7. Verificar que aparece countdown del siguiente challenge

### 6.2 Decoys en Classic Mode
1. Jugar una partida en Normal mode (para generar estado)
2. Ir a Home y entrar a `/game?mode=classic`
3. Verificar que NO aparecen targets verdes (decoys) en ningún momento
4. Jugar toda la partida y verificar en todas las fases

### 6.3 Frame en Classic Mode
1. Entrar a `/game?mode=classic` en móvil
2. Verificar que el frame del juego cabe en la pantalla
3. Verificar que no hay scroll vertical
4. Verificar que todos los elementos son visibles

### 6.4 Botón de Sonido
1. Entrar al juego
2. Click en botón de sonido (🔊 → 🔇)
3. Recargar la página
4. Verificar que el sonido sigue desactivado (🔇)
5. Click en botón de sonido (🔇 → 🔊)
6. Recargar la página
7. Verificar que el sonido sigue activado (🔊)

### 6.5 Game Over Centrado
1. Jugar en Normal mode hasta Game Over
2. Verificar que la pantalla de Game Over está centrada verticalmente
3. Verificar que no hay scroll innecesario
4. Verificar en diferentes tamaños de pantalla (móvil, tablet, desktop)

---

## 7. Notas Adicionales

### 7.1 Referencias a Documentación Existente

- `docs/bug-survival-countdown-analysis.md` - Análisis de bugs de Survival y Countdown (ya fixeado)
- `docs/fix-survival-countdown-implementation.md` - Implementación de fixes de Survival y Countdown

### 7.2 Código Clave

**Auto-start en mount:**
```typescript
// GameBoard.tsx:110-113
useEffect(() => {
  startGame();
}, []);
```

**Protección de decoys en Classic:**
```typescript
// engine.ts:171
if (this.state.mode === 'classic') return null;

// GameBoard.tsx:462
if (mode === 'normal' && phaseConfig?.decoys && phaseConfig.decoys > 0) {
```

**Toggle de sonido:**
```typescript
// GameBoard.tsx:813-815
const newState = !gameState.soundEnabled;
engineRef.current?.toggleSound(newState);
```

---

## 8. Conclusión

Este documento establece la **línea base de arquitectura** antes de implementar los fixes. FullStack debe:

1. **Leer este documento completo** antes de tocar código
2. **Verificar el comportamiento actual** contra lo documentado aquí
3. **Implementar los fixes** siguiendo las especificaciones
4. **Ejecutar el test plan** para validar los cambios
5. **Actualizar este documento** si hay cambios en la arquitectura

**Prioridad:** Los fixes son de prioridad MEDIA-ALTA (afectan UX pero no rompen funcionalidad crítica).

**Dependencias:** Los fixes son independientes entre sí y pueden implementarse en cualquier orden.
