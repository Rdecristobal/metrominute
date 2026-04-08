# Bugfix — Pantalla Negra al Rotar a Landscape en Tanks

**Fecha:** 2026-04-06
**Bug:** Pantalla negra al rotar el móvil de portrait a landscape al inicio del juego
**Estado:** ✅ Arreglado

---

## Problema

Cuando el usuario inicia el juego Tanks en modo portrait y luego rota el dispositivo a landscape, la pantalla se queda negra en lugar de mostrar el juego correctamente.

### Causa Raíz

El problema tenía dos componentes:

1. **El `useEffect` que fuerza el resize solo se ejecutaba durante 'playing' o 'exploding':**
   - Cuando el usuario estaba en 'menu' o 'setup' y rotaba a landscape, el canvas no se redimensionaba
   - Esto causaba dimensiones incorrectas al iniciar el juego

2. **Timing del overlay de rotación:**
   - El overlay "Rotate your device" desaparecía inmediatamente al rotar (porque `isPortrait` cambiaba a `false`)
   - El canvas se mostraba inmediatamente, pero podía tener dimensiones 0x0 si el layout aún no se había estabilizado
   - Esto resultaba en una pantalla negra hasta que el ResizeObserver actualizara las dimensiones

---

## Solución Implementada

### Cambio 1: Ampliar el alcance del efecto de resize

**Antes:**
```tsx
// Solo se activaba durante gameplay
if (!isPortrait && (screen === 'playing' || screen === 'exploding')) {
  // ... resize logic
}
```

**Después:**
```tsx
// Se activa para cualquier estado del juego
if (!isPortrait) {
  // ... resize logic
}
```

**Por qué:** Esto asegura que el canvas se redimensione correctamente sin importar en qué pantalla esté el usuario (menu, setup, playing, exploding).

---

### Cambio 2: Mejorar el mecanismo de reintento

**Antes:**
```tsx
// Un solo timeout con delay fijo de 100ms
const timeoutId = setTimeout(() => {
  const rect = container.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    canvas.width = rect.width;
    canvas.height = rect.height;
    // ...
  }
}, 100);
```

**Después:**
```tsx
// Múltiples intentos con requestAnimationFrame
let attempts = 0;
const maxAttempts = 10;

const tryResize = () => {
  if (attempts >= maxAttempts) return;
  attempts++;

  const rect = container.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    canvas.width = rect.width;
    canvas.height = rect.height;
    // ...
  } else {
    // Dimensions still 0, try again next frame
    requestAnimationFrame(tryResize);
  }
};

requestAnimationFrame(tryResize);
```

**Por qué:** Esto hace que el sistema de reintento sea más robusto, intentando hasta 10 veces con RAF para asegurar que las dimensiones se establezcan correctamente.

---

### Cambio 3: Agregar estado `canvasReady`

**Nuevo estado:**
```tsx
const [canvasReady, setCanvasReady] = useState(false);
```

**Actualizaciones en los puntos donde se establecen dimensiones:**

1. **En `updateCanvasDimensions`:**
   ```tsx
   if (rect.width > 0 && rect.height > 0) {
     canvas.width = rect.width;
     canvas.height = rect.height;
     // ...
     setCanvasReady(true);  // ← Nuevo
     return true;
   }
   setCanvasReady(false);  // ← Nuevo
   return false;
   ```

2. **En ResizeObserver:**
   ```tsx
   if (width > 0 && height > 0) {
     canvas.width = width;
     canvas.height = height;
     // ...
     setCanvasReady(true);  // ← Nuevo
   } else {
     setCanvasReady(false);  // ← Nuevo
   }
   ```

3. **En el efecto de rotación:**
   ```tsx
   if (rect.width > 0 && rect.height > 0) {
     canvas.width = rect.width;
     canvas.height = rect.height;
     // ...
     setCanvasReady(true);  // ← Nuevo
   } else {
     setCanvasReady(false);  // ← Nuevo
     requestAnimationFrame(tryResize);
   }
   ```

4. **Nuevo efecto para verificar readiness:**
   ```tsx
   useEffect(() => {
     if (screen === 'playing' || screen === 'exploding') {
       const canvas = canvasRef.current;
       if (canvas && canvas.width > 0 && canvas.height > 0) {
         setCanvasReady(true);
       }
     }
   }, [screen]);
   ```

**Por qué:** Este estado nos permite rastrear si el canvas tiene dimensiones válidas y mostrar un estado de carga apropiado.

---

### Cambio 4: Overlay de carga para prevenir pantalla negra

**Nuevo overlay:**
```tsx
// Show loading overlay if canvas is not ready during gameplay (prevents black screen after rotation)
if (!canvasReady && (screen === 'playing' || screen === 'exploding')) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-40">
      <div className="text-4xl mb-4">⏳</div>
      <h2 className="text-2xl font-bold mb-2 text-[#ff2d78]">Loading...</h2>
      <p className="text-gray-400">Please wait</p>
    </div>
  );
}
```

**Por qué:** Esto evita que el usuario vea una pantalla negra cuando el canvas aún no está listo. El overlay desaparece automáticamente cuando `canvasReady` se establece a `true`.

---

## Flujo de la Solución

### Escenario 1: Usuario en menu/setup y rota a landscape

1. Usuario está en 'menu' o 'setup' con el dispositivo en portrait
2. Usuario rota a landscape
3. `isPortrait` cambia de `true` a `false`
4. El `useEffect` de rotación se activa (independientemente del estado del juego)
5. Se intenta redimensionar el canvas múltiples veces con RAF
6. Cuando las dimensiones son válidas, `canvasReady` se establece a `true`
7. El canvas está listo para cuando el usuario inicia el juego

### Escenario 2: Usuario en gameplay (playing/exploding) y rota a landscape

1. Usuario está en 'playing' o 'exploding' con el dispositivo en portrait
2. Se muestra el overlay "Rotate your device"
3. Usuario rota a landscape
4. `isPortrait` cambia de `true` a `false`
5. El overlay de rotación desaparece inmediatamente
6. `canvasReady` es `false` (porque el layout aún no se ha estabilizado)
7. Se muestra el overlay "Loading..."
8. El `useEffect` de rotación se activa y hace múltiples intentos de resize
9. Cuando las dimensiones son válidas, `canvasReady` se establece a `true`
10. El overlay de "Loading..." desaparece y el juego se muestra correctamente

---

## Archivos Modificados

- `src/components/tanks/TanksGame.tsx` — Todos los cambios implementados

---

## Testing Recomendado

1. **Test en móvil real:**
   - Iniciar el juego en portrait
   - Rotar a landscape antes de iniciar la partida (en menu/setup)
   - Rotar a landscape durante el gameplay
   - Verificar que no hay pantalla negra en ningún caso

2. **Test en emulador móvil:**
   - Reproducir los mismos escenarios
   - Verificar que el comportamiento es consistente

3. **Test en desktop:**
   - Cambiar el tamaño de la ventana
   - Verificar que el canvas se redimensiona correctamente

---

## Notas Adicionales

- El fix es no-destructivo: no modifica el gameplay ni la lógica del juego
- Los overlays tienen diferentes z-index (50 para rotación, 40 para carga) para evitar conflictos
- El número máximo de intentos de resize es 10, lo que debería ser más que suficiente para cualquier dispositivo
- El game loop ya tenía lógica para saltar el renderizado si el canvas tiene dimensiones inválidas, lo que ayuda a prevenir errores

---

## Conclusión

El bug de pantalla negra al rotar el móvil ha sido arreglado mediante:
1. Ampliando el alcance del efecto de resize para todos los estados del juego
2. Mejorando el mecanismo de reintento con requestAnimationFrame
3. Agregando un estado para rastrear si el canvas está listo
4. Mostrando un overlay de carga mientras se prepara el canvas

Esta solución es robusta, no destructiva, y debería funcionar consistentemente en todos los dispositivos.
