# Task: Fix de 5 Bugs en Metro Minute

**Para:** FullStack Developer  
**De:** Arquitecto  
**Fecha:** 2026-03-24  
**Prioridad:** MEDIA-ALTA  
**Tiempo estimado:** 2-3 horas

---

## Prerequisitos

**LEER ANTES DE EMPEZAR:**
- `docs/arch-game-modes-and-screens.md` - Arquitectura completa del sistema

---

## Bugs a Corregir

### Bug 1: Pantallas Duplicadas de Inicio

**Síntoma:** Aparece una pantalla de countdown al entrar, y otra después de Game Over

**Investigar primero:**
1. ¿El bug es que aparece countdown DOS veces al entrar al juego?
2. ¿O es que después de Game Over, RETRY muestra countdown cuando no debería?

**Causa probable:**
- `useEffect` con `startGame()` en mount (GameBoard.tsx:110-113)
- Flujo de estados puede tener duplicación

**Fix:**
1. Investigar el flujo exacto reproduciendo el bug
2. Si es al entrar: revisar si hay doble render o doble llamada a `startGame()`
3. Si es después de Game Over: revisar si RETRY debería saltarse countdown

**Archivos:**
- `src/components/game/GameBoard.tsx`
- `src/app/game/page.tsx` (posible)

---

### Bug 2: Decoys Visibles en Classic Mode

**Síntoma:** Targets verdes (decoys) aparecen en Classic Mode

**Causa:** Estado residual de partidas anteriores en Normal mode

**Fix:**
```typescript
// engine.ts - En startClassicMode()
private startClassicMode(): void {
  // AGREGAR AL INICIO:
  this.targets.clear();  // ← Limpiar targets residuales
  
  // ... resto del código existente
}
```

**Archivos:**
- `src/lib/game/engine.ts` (método `startClassicMode`)

**Verificación:**
- Jugar Normal mode → ir a Home → entrar a Classic mode
- Verificar que NO hay targets verdes

---

### Bug 3: Frame del Juego Muy Largo en Classic Mode

**Síntoma:** El contenedor del juego es muy alto y no cabe en móvil

**Causa:** Layout no diferenciado por modo

**Fix:**
```typescript
// GameBoard.tsx - Línea ~785
<div className={`relative w-full max-w-[420px] h-[calc(100vh-2rem)] overflow-hidden rounded-lg shadow-2xl bg-gradient-to-b from-zinc-900/50 to-black/50 border border-zinc-800 ${
  mode === 'classic' 
    ? 'max-h-[80vh] md:max-h-[700px]'  // ← Classic: más compacto
    : 'max-h-[95vh] md:h-[85vh] md:max-h-[850px]'  // ← Normal: actual
}`}>
```

**Archivos:**
- `src/components/game/GameBoard.tsx` (contenedor principal)

**Verificación:**
- Entrar a Classic mode en móvil
- Verificar que no hay scroll vertical
- Verificar que todos los elementos son visibles

---

### Bug 4: Botón de Sonido No Funcional

**Síntoma:** El toggle de sonido no persiste entre recargas

**Causa:** `engine.toggleSound()` no guarda en localStorage

**Fix - Opción 1 (recomendada):**
```typescript
// engine.ts - Método toggleSound()
toggleSound(enabled?: boolean): void {
  if (enabled !== undefined) {
    this.state.soundEnabled = enabled;
  } else {
    this.state.soundEnabled = !this.state.soundEnabled;
  }
  
  // AGREGAR:
  if (typeof window !== 'undefined') {
    localStorage.setItem('metroMinuteSoundEnabled', this.state.soundEnabled.toString());
  }
  
  this.notify();
}
```

**Fix - Opción 2 (alternativa):**
```typescript
// GameBoard.tsx - onClick del botón de sonido
onClick={() => {
  const newState = !gameState.soundEnabled;
  engineRef.current?.toggleSound(newState);
  // AGREGAR:
  localStorage.setItem('metroMinuteSoundEnabled', newState.toString());
}}
```

**Archivos:**
- `src/lib/game/engine.ts` (Opción 1)
- `src/components/game/GameBoard.tsx` (Opción 2)

**Verificación:**
1. Toggle sonido (ON → OFF)
2. Recargar página
3. Verificar que sigue OFF
4. Toggle sonido (OFF → ON)
5. Recargar página
6. Verificar que sigue ON

---

### Bug 5: Pantalla Game Over Descentrada

**Síntoma:** La pantalla de Game Over no está centrada verticalmente

**Investigar:**
1. Revisar jerarquía de contenedores padres
2. Verificar que el padre tiene altura definida
3. Verificar que no hay conflictos de flexbox

**Causa probable:**
- Contenedor padre no tiene `h-full` o altura definida
- Conflicto entre `flex` del padre y `flex` del Game Over screen

**Fix potencial:**
```typescript
// GameBoard.tsx - Contenedor padre (línea ~785)
<div className="... h-[calc(100vh-2rem)] ...">  // ← Verificar que tiene altura
  
  {/* Game Over Screen */}
  {screen === 'gameover' && (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      {/* ... */}
    </div>
  )}
</div>
```

**Archivos:**
- `src/components/game/GameBoard.tsx` (contenedor padre y/o renderGameOverScreen)

**Verificación:**
- Perder en un challenge (Game Over)
- Verificar que está centrado verticalmente
- Verificar en móvil, tablet y desktop

---

## Test Plan General

### Antes de Empezar
1. Hacer pull del repo
2. Instalar dependencias: `npm install`
3. Correr el juego: `npm run dev`
4. Reproducir cada bug individualmente

### Durante el Fix
1. Crear rama: `git checkout -b fix/ui-bugs-march-24`
2. Hacer commits atómicos por cada bug
3. Testear después de cada fix

### Después de Todos los Fixes
1. Correr test plan completo (ver `arch-game-modes-and-screens.md` sección 6)
2. Verificar que no se rompieron otras funcionalidades
3. Probar en móvil (Chrome DevTools o dispositivo real)
4. Hacer push de la rama
5. Crear PR con descripción de cambios

---

## Orden Sugerido de Implementación

1. **Bug 2** (Decoys en Classic) - Más simple, 5 min
2. **Bug 3** (Frame largo) - Simple, 10 min
3. **Bug 4** (Sonido) - Simple, 10 min
4. **Bug 5** (Game Over centrado) - Medio, 20-30 min (requiere investigación)
5. **Bug 1** (Pantallas duplicadas) - Complejo, 30-60 min (requiere investigación profunda)

**Total estimado:** 2-3 horas incluyendo testing

---

## Notas Importantes

1. **NO cambiar** la lógica de challenges o phases sin consultar
2. **NO agregar** nuevas dependencias
3. **Mantener** la estructura de código existente
4. **Documentar** cualquier cambio arquitectónico en `arch-game-modes-and-screens.md`
5. **Testear** en móvil obligatoriamente

---

## Rollback Plan

Si algo sale mal:
```bash
git checkout main -- src/
```

O revertir commits individuales:
```bash
git revert <commit-hash>
```

---

## Contacto

Si hay dudas sobre la arquitectura o el comportamiento esperado:
- Consultar `docs/arch-game-modes-and-screens.md`
- O pedir aclaración a Arquitecto antes de implementar

**¡Suerte! 🚀**
