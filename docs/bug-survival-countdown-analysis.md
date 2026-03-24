# Análisis de Causa Raíz: Survival no se activa + Countdown Glitch

**Fecha:** 2026-03-23  
**Autor:** Arquitecto  
**Repo:** Metro Minute  
**Prioridad:** CRÍTICO

---

## 1. Problemas Reportados

### 1.1 Survival no se activa
- **Síntoma:** Después de completar CHIMAX (challenge 4), el juego vuelve a Movement en lugar de ir a Survival
- **Flujo esperado:** Basic → Movement → Decoys → CHIMAX → **SURVIVAL** → Victory
- **Flujo actual:** Basic → Movement → Decoys → CHIMAX → **Movement** (BUG)

### 1.2 Countdown glitchea
- **Síntoma:** Los números 3-2-1 se solapan, aparecen múltiples veces durante la transición
- **Impacto:** Experiencia de usuario confusa, posible causa de problemas de estado

---

## 2. Análisis del Código

### 2.1 Estructura de Challenges (engine.ts)

```typescript
export const CHALLENGES: Challenge[] = [
  { name: '1: Basic', ... },        // Índice 0
  { name: '2: Movement', ... },     // Índice 1
  { name: '3: Decoys', ... },       // Índice 2
  { name: '4: CHIMAX', ... },       // Índice 3
  { name: '5: SURVIVAL', ... }      // Índice 4
];
```

### 2.2 Flujo de Transición Actual

#### Cuando se completa por CLICK (alcanzando score):

```typescript
// handleTargetClick (GameBoard.tsx)
if (result.newChallenge !== undefined) {
  setTimeout(() => {
    handleChallengeComplete(result.newChallenge!);  // ← newChallenge = currentChallenge + 1
  }, 300);
}

// handleNormalTargetClick (engine.ts)
if (!isSurvival && this.state.mode === 'normal' && this.state.score >= this.state.currentChallengeScoreRequired) {
  newChallenge = this.state.currentChallenge + 1;
}
```

#### Cuando se completa por TIEMPO (tick):

```typescript
// startGameLoop → tick() → normalTick()
if (result.victory) {
  if (engineState.challengesCompleted >= CHALLENGES.length) {
    handleVictory();
  } else {
    handleChallengeComplete(engineState.challengesCompleted);  // ← Usa CONTADOR
  }
}
```

---

## 3. Causa Raíz Identificada

### 3.1 BUG CRÍTICO: Doble transición

**El problema está en la RACE CONDITION entre el click y el tick:**

1. **Jugador completa CHIMAX con un click** (alcanza 1000 pts)
   - `handleNormalTargetClick` retorna `newChallenge = 4`
   - Se programa `setTimeout(() => handleChallengeComplete(4), 300)`

2. **El game loop sigue corriendo durante esos 300ms**
   - El tiempo sigue decrementando
   - Si `timeLeft` llega a 0 ANTES de que se ejecute el setTimeout...

3. **El tick también dispara una transición:**
   ```typescript
   // normalTick detecta timeLeft <= 0
   const victory = this.checkVictory();
   this.endChallenge(victory);
   return { challengeEnded: true, victory, gameOver };
   ```

4. **En startGameLoop se ejecuta:**
   ```typescript
   if (result.victory) {
     handleChallengeComplete(engineState.challengesCompleted);  // ← ¿Cuánto vale?
   }
   ```

**PROBLEMA:** En el flujo por click, NADIE incrementó `challengesCompleted`. Solo `endChallenge()` lo hace. Pero el click bypassó `endChallenge()`.

**RESULTADO:** 
- `engineState.challengesCompleted` todavía es 3 (o menos)
- Se llama a `handleChallengeComplete(3)` = **CHIMAX otra vez** o incorrecto

### 3.2 BUG COUNTDOWN: Intervalos acumulados

```typescript
const showCountdown = (challengeIndex: number) => {
  cleanup();  // ← Limpia gameLoop, movement, decoys
  
  // PERO NO limpia el intervalo del COUNTDOWN anterior
  const interval = setInterval(() => { ... }, 1000);
};
```

**Problema:** Si hay una transición rápida (por la race condition del bug 1), se pueden acumular intervalos de countdown.

---

## 4. Diagnóstico de los Fixes Previos

### Bug 7 (76196e7) - "índice de challenge incorrecto"
- **Qué hizo:** Cambió `gameState.currentChallenge + 1` por `engineState.challengesCompleted`
- **Problema:** No consideró que por click, `challengesCompleted` no se incrementa
- **Resultado:** Inverso del problema original

### Bug 11 (82ff6a3) - "Survival no iba a Victory"
- **Qué hizo:** Pasar `isVictory` explícitamente a `endChallenge()`
- **Problema:** Solo arregló el flujo por tick, no consideró el flujo por click
- **Resultado:** El problema persiste porque hay DOS flujos de transición

---

## 5. Solución Técnica

### 5.1 UNIFICAR FLUJO DE TRANSICIÓN

**Principio:** Solo el TICK debe disparar transiciones de challenge. El click solo debe marcar que el challenge está completo.

#### En engine.ts - Agregar flag de challenge completado:

```typescript
// En GameState (types.ts)
interface GameState {
  // ... existing fields
  challengeCompleted: boolean;  // ← NUEVO: flag para indicar que el challenge se completó por score
}

// En handleNormalTargetClick (engine.ts)
private handleNormalTargetClick(isGolden: boolean, x: number, y: number): { ... } {
  // ... existing code
  
  // Check if challenge is complete - PERO NO disparar transición
  const challenge = CHALLENGES[this.state.currentChallenge];
  const isSurvival = challenge?.isSurvival || false;
  
  if (!isSurvival && this.state.mode === 'normal' && this.state.score >= this.state.currentChallengeScoreRequired) {
    // MARCAR como completado, pero NO retornar newChallenge
    this.state.challengeCompleted = true;
  }
  
  // ... rest of code
  return { success: true, points, shouldSpawnMore: true };  // ← SIN newChallenge
}

// En normalTick (engine.ts)
private normalTick(): { challengeEnded?: boolean; victory?: boolean; gameOver?: boolean } {
  const challenge = CHALLENGES[this.state.currentChallenge];

  if (challenge?.isSurvival) {
    // ... existing survival code
  } else {
    this.state.timeLeft--;

    // Detectar fin de challenge: POR TIEMPO o POR SCORE
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

// En startChallenge (engine.ts)
startChallenge(challengeIndex: number): void {
  // ... existing code
  this.state.challengeCompleted = false;  // ← RESET flag
  // ... rest of code
}
```

#### En GameBoard.tsx - Eliminar transición por click:

```typescript
// En handleTargetClick - ELIMINAR este bloque:
// if (result.newChallenge !== undefined) {
//   setTimeout(() => {
//     handleChallengeComplete(result.newChallenge!);
//   }, 300);
// }

// El flujo ahora es:
// Click → marca challengeCompleted=true → tick detecta → dispara transición
```

### 5.2 FIX COUNTDOWN - Guardar referencia del intervalo

```typescript
// Agregar ref para el intervalo del countdown
const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

const showCountdown = (challengeIndex: number) => {
  // Limpiar intervalo del countdown anterior
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

// En cleanup, también limpiar countdown
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

### 5.3 FIX ADICIONAL: Protección contra transiciones múltiples

```typescript
// En engine.ts - Agregar flag de transición
interface GameState {
  // ... existing
  isTransitioning: boolean;  // ← NUEVO
}

// En normalTick, agregar guarda:
private normalTick(): { ... } {
  if (this.state.isTransitioning) {
    return {};  // ← No procesar si ya hay transición en curso
  }
  
  // ... rest of code
}

// En endChallenge:
private endChallenge(isVictory: boolean = false): void {
  this.state.isTransitioning = true;  // ← MARCAR
  // ... existing code
}

// En startChallenge:
startChallenge(challengeIndex: number): void {
  this.state.isTransitioning = false;  // ← RESET
  // ... existing code
}
```

---

## 6. Resumen de Cambios

### 6.1 engine.ts
1. Agregar `challengeCompleted: boolean` a GameState
2. Agregar `isTransitioning: boolean` a GameState
3. Modificar `handleNormalTargetClick`: NO retornar `newChallenge`, solo marcar flag
4. Modificar `normalTick`: Detectar fin por `timeLeft <= 0` OR `challengeCompleted`
5. Modificar `startChallenge`: Resetear flags
6. Modificar `endChallenge`: Setear `isTransitioning = true`

### 6.2 GameBoard.tsx
1. Agregar `countdownIntervalRef` useRef
2. Eliminar bloque que llama `handleChallengeComplete` desde `handleTargetClick`
3. Modificar `showCountdown`: Limpiar intervalo anterior, guardar ref
4. Modificar `cleanup`: Incluir limpieza de countdown interval

### 6.3 types.ts
1. Agregar campos nuevos a GameState

---

## 7. Verificación Post-Fix

### Test Case 1: Completar CHIMAX por score (click)
1. Jugar hasta CHIMAX
2. Alcanzar 1000 puntos con un click
3. **Esperado:** Countdown muestra "5: SURVIVAL"
4. **Verificar:** `engineState.currentChallenge === 4`

### Test Case 2: Completar CHIMAX por tiempo
1. Jugar hasta CHIMAX
2. Dejar que el tiempo se agote (con score >= 1000)
3. **Esperado:** Countdown muestra "5: SURVIVAL"
4. **Verificar:** Transición correcta

### Test Case 3: Completar Survival
1. Completar Survival exitosamente
2. **Esperado:** Pantalla de Victoria
3. **Verificar:** `challengesCompleted === 5`

### Test Case 4: Countdown no glitchea
1. Completar múltiples challenges seguidos
2. **Esperado:** Countdown muestra 3-2-1-GO sin solapamientos
3. **Verificar:** Solo un intervalo activo a la vez

---

## 8. Riesgos y Consideraciones

### 8.1 Compatibilidad
- Los cambios son internos al engine y GameBoard
- No afectan la API pública ni la experiencia de usuario final
- **Riesgo:** BAJO

### 8.2 Performance
- Agregar flags tiene overhead negligible
- Limpiar intervalos mejora uso de memoria
- **Riesgo:** BAJO (incluso mejora)

### 8.3 Testing
- Requiere testing manual de flujos de transición
- Considerar agregar tests unitarios para `normalTick`
- **Esfuerzo:** MEDIO

---

## 9. Conclusión

El problema de Survival no es un bug simple, sino un **defecto de diseño** en el flujo de transiciones:

1. **Dos caminos de transición** (click vs tick) causan race conditions
2. **Estado inconsistente** entre engine y React durante transiciones
3. **Limpieza incompleta** de intervalos causa glitches visuales

La solución propuesta **unifica el flujo de transición** para que solo el tick dispare cambios de challenge, eliminando la race condition y simplificando la lógica.

**Recomendación:** Implementar todos los cambios juntos, ya que están interconectados. Testing exhaustivo post-implementación es mandatorio.
