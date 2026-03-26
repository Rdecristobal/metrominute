# ADR-002: Metro Minute como Hub de Minijuegos Arcade

**Estado:** Aceptado
**Fecha:** 2026-03-26
**Decision makers:** Raul (Director of Applications)
**Contexto:** Transformación de juego único a plataforma de múltiples juegos

---

## Contexto

Metro Minute actualmente es un juego individual de reflejos (burbujas). Se plantea la necesidad de:
1. Expandir a múltiples minijuegos
2. Mantener una identidad de marca cohesiva
3. Facilitar la adición de futuros juegos
4. Crear una experiencia de usuario fluida

---

## Decisión

Transformar Metro Minute en un **hub de minijuegos con estética retro/arcade** donde:

1. **Home (`/`)** es el catálogo de juegos con diseño retro
2. **Cada juego tiene su propia ruta** (`/bubble`, `/snake`, etc.)
3. **Estética consistente**: Negro + neón + fuentes arcade
4. **Navegación simple**: Un click para jugar, un click para volver

---

## Alternativas Consideradas

### Opción A: Mantener juego único en raíz
**Pros:**
- Sin cambios de arquitectura
- URL más corta para el juego principal

**Contras:**
- No escala para múltiples juegos
- No hay espacio para catálogo
- Difícil añadir juegos futuros

**Decisión:** ❌ Descartada

### Opción B: Subdominio por juego (bubble.metrominute.app)
**Pros:**
- Aislamiento completo
- Fácil analytics por juego

**Contras:**
- Complejidad de infraestructura
- No hay discoverability entre juegos
- Over-engineering para el estado actual

**Decisión:** ❌ Descartada

### Opción C: Hub en raíz + rutas por juego (SELECCIONADA)
**Pros:**
- Escalable
- Discoverability natural
- Identidad de marca unificada
- Simple de implementar
- URLs claras y memorables

**Contras:**
- Requiere rediseño de home
- Un click extra para llegar al juego

**Decisión:** ✅ Aceptada

---

## Consecuencias

### Positivas
- **Escalabilidad:** Fácil añadir nuevos juegos
- **Branding:** Identidad retro/arcade distintiva
- **UX:** Catálogo claro de offerings
- **Marketing:** "Metro Minute" como marca de arcade hub
- **Técnico:** Arquitectura modular y extensible

### Negativas
- **Distancia al juego:** Un click más para jugar
- **Trabajo inicial:** Requiere rediseñar home
- **Complejidad:** Más componentes que mantener

### Neutras
- Requiere documentación para futuros desarrolladores
- Necesita guía de estilo para mantener consistencia

---

## Implementación

Ver documentos relacionados:
- [arch-001-metro-minute-home.md](./arch-001-metro-minute-home.md)
- [migration-001-home-transition.md](./migration-001-home-transition.md)

**Tiempo estimado:** 3-4 horas
**Riesgo:** Bajo (no afecta funcionalidad del juego existente)

---

## Criterios de Éxito

1. ✅ Home carga y muestra catálogo de juegos
2. ✅ Navegación fluida entre home y juegos
3. ✅ Juego actual funciona sin regresiones
4. ✅ Estética retro consistente
5. ✅ Fácil añadir nuevos juegos (proceso documentado)

---

## Revisiones Futuras

Revisar esta decisión cuando:
- Se añadan más de 5 juegos (¿necesita categorías?)
- Se requiera búsqueda/filtrado
- Se implemente sistema de usuarios
- Se considere monetización

---

## Notas

- El nombre "Bubble" para el juego actual es temporal y puede cambiarse
- La paleta de colores neón puede ajustarse según feedback
- Los efectos visuales (scanlines) pueden ser opcionales/configurables

---

**Referencias:**
- [arch-001-metro-minute-home.md](./arch-001-metro-minute-home.md) - Arquitectura detallada
- [api-001-component-specs.md](./api-001-component-specs.md) - Especificaciones de componentes
- [design-001-wireframes.md](./design-001-wireframes.md) - Wireframes y diseño visual
- [migration-001-home-transition.md](./migration-001-home-transition.md) - Plan de migración

---

**Fin del ADR**
