# Metro Minute Hub - Documentación de Diseño

**Proyecto:** Metro Minute - Hub de Minijuegos Retro
**Fecha:** 2026-03-26
**Arquitecto:** Arquitecto
**Para:** Equipo de Desarrollo FullStack

---

## 📋 Resumen Ejecutivo

Transformar Metro Minute de un juego individual a un **hub de minijuegos** con estética retro/arcade. El juego actual de burbujas se renombra a **"Bubble"** y se convierte en el primer título del catálogo.

### Entregables

| Documento | Propósito | Audiencia |
|-----------|-----------|-----------|
| [arch-001-metro-minute-home.md](./arch-001-metro-minute-home.md) | Arquitectura general, decisiones de diseño | Tech Lead, FullStack |
| [api-001-component-specs.md](./api-001-component-specs.md) | Contratos detallados de componentes | FullStack Developer |
| [design-001-wireframes.md](./design-001-wireframes.md) | Wireframes, paleta de colores, referencias visuales | UI/UX, FullStack |
| [migration-001-home-transition.md](./migration-001-home-transition.md) | Plan de migración paso a paso | FullStack Developer |

---

## 🎯 Objetivos del Proyecto

### Primarios
1. ✅ Crear home retro que liste minijuegos
2. ✅ Renombrar juego actual a "Bubble"
3. ✅ Implementar navegación fluida
4. ✅ Mantener funcionalidad existente

### Secundarios
1. Estética retro/arcade consistente
2. Sistema extensible para futuros juegos
3. Performance optimizada
4. Accesibilidad

---

## 🏗️ Arquitectura de Alto Nivel

### Estructura de Rutas

```
ACTUAL:                      PROPUESTO:
/ → redirect /game           / → Home (Hub de juegos)
/game → Juego burbujas       /bubble → Juego Bubble
                             /games/bubble → Alias (opcional)
/leaderboard                 /leaderboard → Sin cambios
```

### Stack Tecnológico

| Componente | Tecnología | Estado |
|------------|------------|--------|
| Framework | Next.js 15 (App Router) | ✅ Existente |
| Styling | Tailwind CSS + shadcn/ui | ✅ Existente |
| Fuentes base | Geist Sans + Mono | ✅ Existente |
| Fuentes retro | Press Start 2P + VT323 | 🆕 Nuevo |

---

## 🎨 Sistema de Diseño Retro

### Paleta de Colores

#### Fondos
- **Retro Black:** `#000000` - Fondo base
- **Retro Dark:** `#0a0a0a` - Fondo principal
- **Retro Surface:** `#1a1a1a` - Cards, superficies

#### Acentos Neón
- **Neon Cyan:** `#00fff7` - Bubble, links activos
- **Neon Magenta:** `#ff00ff` - Memory, especiales
- **Neon Green:** `#39ff14` - Snake, éxito
- **Neon Yellow:** `#ffff00` - Warnings

#### Texto
- **Retro Text:** `#e0e0e0` - Texto principal
- **Retro Muted:** `#888888` - Texto secundario

### Tipografía

| Fuente | Uso | Tamaño típico |
|--------|-----|---------------|
| Press Start 2P | Logo, títulos arcade | 3xl - 5xl |
| VT323 | Descripciones, UI | base - lg |
| Geist Sans | Body, footer | sm - base |

---

## 🧩 Componentes Principales

### 1. GameCard
Tarjeta individual para cada minijuego

**Props clave:**
- `title`: Nombre del juego
- `icon`: Emoji o componente
- `description`: Descripción corta
- `href`: Ruta al juego
- `available`: Disponible o "coming soon"
- `accentColor`: Color neón personalizado

**Estados:**
- Normal: Borde gris
- Hover (disponible): Glow neón + elevación
- Hover (unavailable): Sin cambios

### 2. Header
Logo y navegación

**Elementos:**
- Logo "METRO MINUTE" con efecto hover
- Link a Leaderboard
- Sticky en scroll

### 3. RetroBackground
Fondo con efectos retro

**Efectos:**
- Grid de líneas estilo Tron
- Gradiente radial sutil
- Glow cyan en centro superior

### 4. GamesGrid
Contenedor de tarjetas

**Características:**
- Responsive: 1/2/3 columnas
- Animación de entrada escalonada
- Gap consistente

---

## 📱 Responsividad

| Dispositivo | Ancho | Columnas | Características |
|-------------|-------|----------|-----------------|
| Mobile | < 640px | 1 | Tarjetas full-width |
| Tablet | 640-1024px | 2 | Gap 24px |
| Desktop | > 1024px | 3 | Max-width 1280px |

---

## 🔄 Flujo de Usuario

```
┌─────────────┐
│   HOME (/)  │
│  Metro Hub  │
└──────┬──────┘
       │ click "Bubble"
       │
       ▼
┌─────────────┐
│  /bubble    │
│   Juego     │
└──────┬──────┘
       │ click "Back to Hub"
       │
       ▼
┌─────────────┐
│   HOME (/)  │
└─────────────┘
```

---

## 📁 Estructura de Archivos

### Archivos Nuevos a Crear

```
src/
├── types/
│   └── game.ts                      # Tipos TypeScript
├── lib/
│   └── games.ts                     # Configuración de juegos
├── components/
│   ├── home/
│   │   ├── GameCard.tsx             # Tarjeta de juego
│   │   ├── GamesGrid.tsx            # Grid de juegos
│   │   ├── Header.tsx               # Header con logo
│   │   ├── RetroBackground.tsx      # Fondo retro
│   │   ├── Footer.tsx               # Footer simple
│   │   └── index.ts                 # Barrel exports
│   └── game/
│       └── BackToHub.tsx            # Botón volver al hub
└── app/
    └── bubble/
        └── page.tsx                 # Juego renombrado
```

### Archivos a Modificar

```
src/
├── app/
│   ├── layout.tsx                   # Añadir fuentes retro
│   ├── page.tsx                     # Nueva home
│   └── globals.css                  # Colores y efectos retro
└── tailwind.config.ts               # Extender con tema retro
```

### Archivos a Eliminar/Mover

```
src/app/game/page.tsx               # Mover a bubble/page.tsx
```

---

## ✅ Checklist de Implementación

### Fase 1: Setup (30 min)
- [ ] Crear branch `feature/metro-minute-hub`
- [ ] Backup de archivos actuales
- [ ] Extender Tailwind config
- [ ] Actualizar globals.css
- [ ] Añadir fuentes en layout.tsx

### Fase 2: Tipos y Config (15 min)
- [ ] Crear `types/game.ts`
- [ ] Crear `lib/games.ts`

### Fase 3: Componentes (60 min)
- [ ] Crear `RetroBackground`
- [ ] Crear `Header`
- [ ] Crear `GameCard`
- [ ] Crear `GamesGrid`
- [ ] Crear `Footer`
- [ ] Crear `BackToHub`
- [ ] Crear barrel exports

### Fase 4: Páginas (50 min)
- [ ] Mover `/game` a `/bubble`
- [ ] Actualizar `bubble/page.tsx`
- [ ] Reescribir `page.tsx` (home)

### Fase 5: Testing (30 min)
- [ ] Build sin errores
- [ ] Test local funcional
- [ ] Verificar responsive
- [ ] Verificar navegación
- [ ] Verificar juego funciona

### Fase 6: Deploy (15 min)
- [ ] Commit y push
- [ ] Crear PR
- [ ] Review
- [ ] Merge
- [ ] Verificar en producción

---

## 🚀 Tiempo Estimado

| Fase | Tiempo |
|------|--------|
| Setup | 30 min |
| Tipos y Config | 15 min |
| Componentes | 60 min |
| Páginas | 50 min |
| Testing | 30 min |
| Deploy | 15 min |
| **TOTAL** | **3-4 horas** |

---

## 📖 Guía de Lectura Recomendada

### Para Tech Lead
1. Leer `arch-001-metro-minute-home.md` completo
2. Revisar `migration-001-home-transition.md` para estimar

### Para FullStack Developer
1. Leer `api-001-component-specs.md` (contratos detallados)
2. Seguir `migration-001-home-transition.md` paso a paso
3. Consultar `design-001-wireframes.md` para dudas visuales

### Para UI/UX
1. Revisar `design-001-wireframes.md`
2. Consultar paleta de colores y tipografía

---

## 🔗 Recursos

### URLs del Proyecto
- **Producción:** https://metrominute.vercel.app
- **Repo:** https://github.com/Rdecristobal/metrominute

### Referencias de Diseño
- Fuente Press Start 2P: https://fonts.google.com/specimen/Press+Start+2P
- Fuente VT323: https://fonts.google.com/specimen/VT323
- Inspiración: Tron, Arcade 80s, Cyberpunk

---

## 🎮 Futuros Juegos (Ejemplos)

Para añadir nuevos juegos en el futuro:

1. Añadir entrada en `lib/games.ts`:
```typescript
{
  id: 'snake',
  title: 'Snake',
  icon: '🐍',
  description: 'Classic snake game with a twist.',
  href: '/snake',
  available: false, // Cambiar a true cuando esté listo
  accentColor: 'var(--neon-green)',
  tags: ['arcade', 'classic'],
}
```

2. Crear ruta `/snake/page.tsx`
3. Implementar juego
4. Cambiar `available: true`

---

## ⚠️ Consideraciones Importantes

### No Romper
- ✅ Funcionalidad del juego actual
- ✅ Leaderboard existente
- ✅ URLs compartidas (implementar redirects si es necesario)

### Mantener
- ✅ Dark mode existente
- ✅ Performance actual
- ✅ Accesibilidad

### Priorizar
1. **Funcionalidad sobre estética** - Primero que funcione
2. **Mobile-first** - Asegurar responsive desde el inicio
3. **Simplicidad** - No over-engineer

---

## 📞 Soporte

Si hay dudas durante la implementación:
1. Revisar documentación detallada en los archivos `.md`
2. Consultar wireframes en `design-001`
3. Ver ejemplos de código en `api-001`

---

**Fin del documento de resumen**

*Este documento proporciona una visión general. Para detalles de implementación, consultar los documentos específicos.*
