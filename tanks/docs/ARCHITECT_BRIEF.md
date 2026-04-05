# Tanks — Brief para Arquitecto

## Contexto

Tanks es un juego de artillería por turnos (tipo Scorched Earth/Worms) que se integra como tercer minijuego en MetroMinute Hub.

## Workspace

`~/.openclaw/workspace-dyzink/metrominute/` (proyecto Next.js existente)

## Juegos actuales

- `/bubble` → Bubbles (reflex game)
- `/futbol` → Football Stop (precision timing)
- Nuevo: `/tanks` → Tanks (artillery warfare)

## Documentos de referencia

- `tanks/docs/tanks-functional-spec.pdf` — Spec funcional completa (12 secciones)
- `tanks/docs/tanks-code-reference.pdf` — Código parcial de referencia (terrain, tanks, rendering, physics)
- `tanks/docs/tanks-spec-extracted.md` — Spec en texto plano (será creado)

## Lo que necesito que documentes

### 1. Arquitectura del juego

- Estructura de archivos dentro de `src/app/tanks/`
- Componentes React necesarios (screens, HUD, Canvas wrapper)
- Estado del juego (cómo se gestiona: useState, useReducer, zustand?)
- Game loop (requestAnimationFrame)
- Separación entre lógica de juego (pure functions) y rendering (Canvas API)

### 2. Integración en MetroMinute

- Ruta: `/tanks` en el router de Next.js
- Registro en `src/lib/games.ts` (añadir entry con icono 🎖️ o similar)
- Navegación desde el home → `/tanks`
- Landscape: estrategia para forzar/animar landscape en móvil
- Layout propio vs layout compartido

### 3. Contrato de componentes

Para cada pantalla del juego:
- **MenuScreen**: props, estado, qué renderiza
- **SetupScreen**: modo (AI vs Local), número de tanques
- **GameScreen**: el canvas + HUD + barra de estado
- **GameOverScreen**: ganador, rematch

### 4. Estructura del Canvas

- Cómo se gestiona el canvas responsivo
- Tamaño fijo vs dinámico
- Touch events → game state

### 5. Consideraciones técnicas

- TypeScript: tipos para Tank, Terrain, Projectile, Explosion, GameState
- Performance: evitar re-renders innecesarios del React tree
- El código de referencia usa Canvas API directamente — mantener ese enfoque
- Tailwind para las pantallas UI (menú, setup, game over)
- Canvas API para el gameplay

## Stack

- Next.js + TypeScript (ya en el proyecto)
- Canvas API (para el juego)
- Tailwind (para UI chrome)
- Sin librerías externas nuevas si es posible

## Nota importante

El código de referencia es una GUÍA, no un copiar-pegar. Tiene bugs (fillStyle truncado en estrellas, roundRect sin cerrar). FullStack debe implementar limpio basándose en la spec funcional.

## Entregable

Documento en `tanks/docs/ARCHITECTURE.md` con:
1. Estructura de archivos
2. Tipos TypeScript
3. Contrato de cada componente (props, estado, responsabilidades)
4. Flujo del game loop
5. Plan de integración en MetroMinute
