# Implementación: Fix Survival + Countdown

**Para:** FullStack Developer  
**De:** Arquitecto  
**Fecha:** 2026-03-23  
**Prioridad:** CRÍTICO - Bloquea gameplay

---

## Resumen Ejecutivo

El bug tiene **2 causas raíz**:
1. **Race condition:** Dos flujos de transición (click vs tick) compiten
2. **Interval leak:** El countdown no limpia su intervalo anterior

**Solución:** Unificar transiciones al tick + limpiar intervalos.

---

## Cambios Requeridos

### 1. types.ts - Agregar campos a GameState

```typescript
// En src/lib/game/types.ts
export interface GameState {
  // ... existing fields (mode, score, highScore, combo, etc.)
  
  // NUEVOS CAMPOS:
  challengeCompleted: boolean;  // Flag: challenge completado por score (no por tiempo)
  isTransitioning: boolean;     // Flag: transición en progreso
}
```

---

### 2. engine.ts - Modificaciones

#### 2.1 Actualizar getInitialState

```typescript
private getInitialState(mode: GameMode, highScore: number, soundEnabled: boolean): GameState {
  return {
    // ... existing fields
    challengeCompleted: false,  // ← NUEVO
    isTransitioning: false,     // ← NUEVO
  };
}
```

#### 2.2 Modificar handleNormalTargetClick

**ELIMINAR** la lógica que retorna `newChallenge`. En su lugar, marcar flag:

```typescript
private handleNormalTargetClick(isGolden: boolean, x: number, y: number): { success: boolean; points: number; shouldSpawnMore: boolean; newChallenge?: number } {
  const points = isGolden ? 50 * this.state.multiplier : 10 * this.state.multiplier;
  this.state.score += points;

  this.state.combo++;
  this.state.multiplier = Math.min(Math.floor(this.state.combo / 5) + 1, 5);

  // === CAMBIO AQUÍ ===
  // Check if challenge is complete - SOLO MARCAR FLAG, NO disparar transición
  const challenge = CHALLENGES[this.state.currentChallenge];
  const isSurvival = challenge?.isSurvival || false;
  
  if (!isSurvival && this.state.mode === 'normal' && this.state.score >= this.state.currentChallengeScoreRequired) {
    this.state.challengeCompleted = true;
  }
  // === FIN CAMBIO ===

  if (this.state.multiplier > this.state.maxMultiplier) {
    this.state.maxMultiplier = this.state.multiplier;
  }

  this.state.correctClicks++;
  this.state.currentStreak++;
  if (this.state.currentStreak > this.state.maxStreak) {
    this.state.maxStreak = this.state.currentStreak;
  }
  this.state.totalClicks++;

  this.notify();
  
  // === CAMBIO: NO retornar newChallenge ===
  return { success: true, points, shouldSpawnMore: true };
}
```

#### 2.3 Modificar normalTick

Agregar detección por flag `challengeCompleted`:

```typescript
private normalTick(): { challengeEnded?: boolean; victory?: boolean; gameOver?: boolean } {
  // === NUEVO: Guarda contra transiciones múltiples ===
  if (this.state.isTransitioning) {
    return {};
  }
  
  const challenge = CHALLENGES[this.state.currentChallenge];

  if (challenge?.isSurvival) {
    this.state.survivalTime--;
    this.state.score -= (challenge.scoreDecrement || 10);

    if (this.state.score <= 0 || this.state.survivalTime <= 0) {
      const isVictory = this.state.survivalTime <= 0 && this.state.score > 0;
      this.endChallenge(isVictory);
      
      if (isVictory) {
        return { challengeEnded: true, victory: true };
      }
      return { challengeEnded: true, gameOver: true };
    }
  } else {
    this.state.timeLeft--;

    // === CAMBIO: Detectar fin por TIEMPO o por SCORE ===
    if (this.state.timeLeft <= 0 || this.state.challengeCompleted) {
      const victory = this.checkVictory();
      this.endChallenge(victory);
      const gameOver = !victory;
      return { challengeEnded: true, victory, gameOver };
    }
  }

  this.notify();
  return {};
}
```

#### 2.4 Modificar endChallenge

```typescript
private endChallenge(isVictory: boolean = false): void {
  // === NUEVO: Marcar transición en progreso ===
  this.state.isTransitioning = true;
  
  this.state.isPlaying = false;
  this.state.isGameOver = true;

  const accuracy = this.state.totalClicks > 0 ? Math.round((this.state.correctClicks / this.state.totalClicks) * 100) : 0;

  this.state.totalAccuracySum += accuracy;
  this.state.maxComboSum += this.state.maxMultiplier;
  if (this.state.maxStreak > this.state.maxStreakMax) {
    this.state.maxStreakMax = this.state.maxStreak;
  }

  // Incrementar challengesCompleted si pasó el challenge
  if (isVictory) {
    this.state.challengesCompleted++;
  }

  this.notify();
}
```

#### 2.5 Modificar startChallenge

```typescript
startChallenge(challengeIndex: number): void {
  const challenge = CHALLENGES[challengeIndex];
  this.state.currentChallenge = challengeIndex;
  this.state.currentChallengeScoreRequired = challenge.scoreRequired;
  this.state.currentChallengeGolden = challenge.golden;

  // === NUEVO: Resetear flags de transición ===
  this.state.challengeCompleted = false;
  this.state.isTransitioning = false;

  if (challenge.isSurvival) {
    this.state.score = 100;
    this.state.survivalTime = challenge.survivalTime || 30;
  } else {
    this.state.score = 0;
  }

  // ... rest of existing code
}
```

---

### 3. GameBoard.tsx - Modificaciones

#### 3.1 Agregar ref para countdown interval

```typescript
// Al inicio del componente, con los otros refs:
const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
```

#### 3.2 Modificar cleanup

```typescript
const cleanup = () => {
  if (gameLoopRef.current) clearInterval(gameLoopRef.current);
  if (movementIntervalRef.current) clearInterval(movementIntervalRef.current);
  if (decoyIntervalRef.current) clearInterval(decoyIntervalRef.current);
  if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);  // ← NUEVO
  
  gameLoopRef.current = null;
  movementIntervalRef.current = null;
  decoyIntervalRef.current = null;
  countdownIntervalRef.current = null;  // ← NUEVO
};
```

#### 3.3 ELIMINAR transición por click en handleTargetClick

**ELIMINAR** este bloque completo (aprox. líneas 264-268):

```typescript
// === ELIMINAR ESTO ===
if (result.newChallenge !== undefined) {
  setTimeout(() => {
    handleChallengeComplete(result.newChallenge!);
  }, 300);
}
// === FIN ELIMINAR ===
```

#### 3.4 Modificar showCountdown

```typescript
const showCountdown = (challengeIndex: number) => {
  // === NUEVO: Limpiar intervalo del countdown anterior ===
  if (countdownIntervalRef.current) {
    clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = null;
  }
  
  cleanup();
  engineRef.current?.clearTargets();
  setTargets([]);
  setParticles([]);
  setFloatingScores([]);
  setRipples([]);
  
  const challenge = CHALLENGES[challengeIndex];
  setCountdownTitle(challenge.name);
  setCountdown(3);
  setScreen('countdown');

  // === CAMBIO: Guardar referencia del intervalo ===
  countdownIntervalRef.current = setInterval(() => {
    setCountdown(prev => {
      if (prev === null) return null;
      if (prev > 1) {
        playSound('hit', gameState.soundEnabled);
        return prev - 1;
      } else if (prev === 1) {
        playSound('golden', gameState.soundEnabled);
        return 0;
      } else {
        clearInterval(countdownIntervalRef.current!);
        countdownIntervalRef.current = null;
        setTimeout(() => {
          startChallenge(challengeIndex);
        }, 500);
        return null;
      }
    });
  }, 1000);
};
```

---

## Resumen de Archivos Modificados

| Archivo | Cambios | Líneas afectadas (aprox) |
|---------|---------|-------------------------|
| `src/lib/game/types.ts` | Agregar 2 campos a GameState | +2 |
| `src/lib/game/engine.ts` | Modificar 5 métodos | ~30 |
| `src/components/game/GameBoard.tsx` | Agregar ref, modificar 2 funciones, eliminar bloque | ~15 |

---

## Test Plan

### Pre-requisitos
- Tener el juego corriendo en modo normal

### Test 1: Completar por Score
1. Jugar hasta CHIMAX
2. Alcanzar 1000 puntos **antes** de que se acabe el tiempo
3. **Verificar:** Countdown muestra "5: SURVIVAL"
4. **Verificar:** Survival se juega correctamente

### Test 2: Completar por Tiempo
1. Jugar hasta CHIMAX
2. Esperar a que se acabe el tiempo (tener >= 1000 puntos)
3. **Verificar:** Countdown muestra "5: SURVIVAL"
4. **Verificar:** Survival se juega correctamente

### Test 3: Completar Survival
1. Completar los 5 challenges
2. **Verificar:** Aparece pantalla de Victoria
3. **Verificar:** Estadísticas correctas

### Test 4: Countdown limpio
1. Completar challenges rápidamente
2. **Verificar:** Números 3-2-1 aparecen secuencialmente
3. **Verificar:** No hay solapamientos

### Test 5: Game Over
1. Perder en cualquier challenge (no alcanzar score)
2. **Verificar:** Aparece pantalla de Game Over
3. **Verificar:** Retry funciona correctamente

---

## Rollback Plan

Si algo falla, revertir a commit `2bf865b`:

```bash
git revert HEAD --no-edit
```

O manualmente:
```bash
git checkout 2bf865b -- src/lib/game/types.ts src/lib/game/engine.ts src/components/game/GameBoard.tsx
```

---

## Notas Adicionales

1. **NO cambiar** la lógica de `handleChallengeComplete` - esa función está bien
2. **NO cambiar** la lógica de `checkVictory` - esa función está bien
3. El flujo ahora es: **Click marca flag → Tick detecta → Tick dispara transición**
4. Esto elimina la race condition porque solo hay UN punto de entrada para transiciones

---

## Estimación

- **Tiempo de implementación:** 30-45 minutos
- **Tiempo de testing:** 15-20 minutos
- **Total:** ~1 hora

**Prioridad:** Hacer INMEDIATAMENTE después de leer este documento.
