# Arch-001: Metro Minute Home - Hub de Minijuegos

**Fecha:** 2026-03-26
**Estado:** Propuesto
**Autor:** Arquitecto
**Contexto:** Transformar Metro Minute de un juego individual a un hub de minijuegos retro

---

## 1. Visión General

Metro Minute pasa de ser un juego único a ser un **hub de minijuegos** con estética retro/arcade. El juego actual de burbujas se renombra a "Bubble" y se convierte en el primer título del catálogo.

### Principios de Diseño
- **Retro-first:** Estética arcade de los 80s/90s
- **Minimalista:** Solo lo esencial, sin fricciones
- **Accesible:** Un click para jugar
- **Extensible:** Fácil añadir nuevos juegos en el futuro

---

## 2. Arquitectura de Navegación

### Estructura de Rutas Actual vs Propuesta

```
ACTUAL:                      PROPUESTO:
/ → redirect /game           / → Home (Hub)
/game → Juego burbujas       /bubble → Juego Bubble
                             /games/bubble → Alias (opcional)
/leaderboard                 /leaderboard → Se mantiene
```

### Flujo de Usuario

```
┌─────────────────────────────────────────────────────┐
│  HOME (/)                                           │
│  ┌─────────────────────────────────────────────┐    │
│  │  METRO MINUTE (logo retro)                  │    │
│  │  "Your daily dose of arcade games"          │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────┐                                   │
│  │   BUBBLE     │ ── click ──→ /bubble              │
│  │   🎯         │                                   │
│  │   Test your  │                                   │
│  │   reflexes   │                                   │
│  └──────────────┘                                   │
│                                                      │
│  [More games coming soon...]                        │
└─────────────────────────────────────────────────────┘
```

---

## 3. Stack Tecnológico

### Ya Existente (Mantener)
- **Framework:** Next.js 15 con App Router
- **Estilos:** Tailwind CSS + shadcn/ui
- **Fuentes:** Geist Sans + Geist Mono (añadir fuente retro)

### Nuevo (Añadir)
- **Fuente retro:** `Press Start 2P` (Google Fonts) para títulos arcade
- **Fuente alternativa:** `VT323` para texto más legible estilo terminal

---

## 4. Sistema de Diseño Retro

### 4.1 Paleta de Colores

```css
/* Base (Negro puro arcade) */
--retro-black: #000000;
--retro-dark: #0a0a0a;
--retro-surface: #1a1a1a;

/* Acentos neón (estilo arcade) */
--neon-cyan: #00fff7;
--neon-magenta: #ff00ff;
--neon-yellow: #ffff00;
--neon-green: #39ff14;

/* Texto */
--retro-text: #e0e0e0;
--retro-muted: #888888;
```

### 4.2 Tipografía

| Uso | Fuente | Tamaño | Peso |
|-----|--------|--------|------|
| Logo/Títulos | Press Start 2P | 2xl - 4xl | 400 |
| Subtítulos | VT323 | lg - xl | 400 |
| Body | Geist Sans | base | 400 |
| Código/Scores | Geist Mono | sm | 400 |

### 4.3 Efectos Visuales Retro

#### Scanlines (Opcionales)
```css
.scanlines::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0,0,0,0.15),
    rgba(0,0,0,0.15) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
}
```

#### Glow Neón
```css
.neon-glow {
  text-shadow: 
    0 0 5px var(--neon-cyan),
    0 0 10px var(--neon-cyan),
    0 0 20px var(--neon-cyan);
}
```

#### Borde Pixelado
```css
.pixel-border {
  border: 4px solid;
  box-shadow: 
    inset -4px -4px 0 0 rgba(0,0,0,0.3),
    inset 4px 4px 0 0 rgba(255,255,255,0.1);
}
```

---

## 5. Componentes Necesarios

### 5.1 `components/home/GameCard.tsx`

**Propósito:** Tarjeta individual para cada minijuego

**Props:**
```typescript
interface GameCardProps {
  id: string;           // Identificador del juego (slug)
  title: string;        // Nombre del juego
  icon: React.ReactNode;  // Emoji o ícono
  description: string;  // Descripción corta
  href: string;         // Ruta al juego
  available: boolean;   // Si está disponible o "coming soon"
  accentColor?: string; // Color de acento (neón)
}
```

**Estructura:**
```
┌─────────────────────────┐
│  [ICON] 48x48           │
│                         │
│  TITLE                  │
│  Description text...    │
│                         │
│  [PLAY →]               │
└─────────────────────────┘
```

**Estados:**
- Normal: Borde sutil
- Hover: Glow neón + elevación
- Disabled (coming soon): Opacidad reducida, sin hover

---

### 5.2 `components/home/Header.tsx`

**Propósito:** Logo y navegación principal

**Props:**
```typescript
interface HeaderProps {
  showNav?: boolean;  // Mostrar enlaces adicionales
}
```

**Estructura:**
```
┌─────────────────────────────────────────────────┐
│  ◉ METRO MINUTE          [Leaderboard] [About] │
└─────────────────────────────────────────────────┘
```

**Elementos:**
- Logo con efecto neón
- Enlaces opcionales (Leaderboard, About)
- Animación de parpadeo sutil en el logo

---

### 5.3 `components/home/RetroBackground.tsx`

**Propósito:** Fondo con efectos retro

**Efectos incluidos:**
- Grid de líneas (estilo Tron)
- Gradiente radial sutil
- Opcional: estrellas animadas

**Implementación:**
```typescript
// CSS-in-JS o Tailwind
// Background con patrón de grid
// Posicionamiento fixed con z-index bajo
```

---

### 5.4 `components/home/GamesGrid.tsx`

**Propósito:** Contenedor de tarjetas de juegos

**Props:**
```typescript
interface GamesGridProps {
  games: GameCardProps[];
}
```

**Layout:**
- Grid responsive: 1 col mobile, 2 col tablet, 3 col desktop
- Gap consistente (4-6)
- Animación de entrada escalonada

---

## 6. Página Principal - Estructura

### `app/page.tsx` (Nuevo)

```tsx
// Estructura de la home
export default function Home() {
  return (
    <main className="min-h-screen relative">
      <RetroBackground />
      
      <div className="relative z-10">
        <Header />
        
        <section className="container mx-auto px-4 py-16">
          <HeroTitle />
          <GamesGrid games={GAMES} />
          <ComingSoonTeaser />
        </section>
        
        <Footer />
      </div>
    </main>
  );
}
```

### Datos de Juegos (Configuración)

```typescript
// lib/games.ts
export const GAMES: GameCardProps[] = [
  {
    id: 'bubble',
    title: 'Bubble',
    icon: '🎯', // O componente SVG
    description: 'Test your reflexes! Click the targets before time runs out.',
    href: '/bubble',
    available: true,
    accentColor: 'var(--neon-cyan)',
  },
  // Futuros juegos:
  // {
  //   id: 'snake',
  //   title: 'Snake',
  //   icon: '🐍',
  //   description: 'Classic snake game with a twist.',
  //   href: '/snake',
  //   available: false,
  //   accentColor: 'var(--neon-green)',
  // },
];
```

---

## 7. Migración del Juego Actual

### Cambios Necesarios

1. **Renombrar ruta `/game` → `/bubble`**
   - Mover `app/game/page.tsx` → `app/bubble/page.tsx`
   - Actualizar cualquier link interno

2. **Actualizar metadata**
   - Título específico para Bubble: "Bubble - Metro Minute"
   - Mantener branding Metro Minute

3. **Botón "Back to Hub"**
   - Añadir en `GameBoard` o layout del juego
   - Posición: esquina superior izquierda
   - Estilo: retro, discreto

---

## 8. Responsividad

### Breakpoints

| Dispositivo | Ancho | Columnas Grid | Tamaño Tarjeta |
|-------------|-------|---------------|----------------|
| Mobile | < 640px | 1 | Full width |
| Tablet | 640-1024px | 2 | 280px |
| Desktop | > 1024px | 3 | 300px |

### Adaptaciones Mobile
- Header simplificado (solo logo)
- Tarjetas full-width con padding generoso
- Touch-friendly: áreas de click grandes (min 48px)

---

## 9. Accesibilidad

- **Contraste:** Mínimo 4.5:1 para texto
- **Focus states:** Outline visible con color neón
- **Teclado:** Navegación completa por tab
- **Screen readers:** Alt text en iconos, roles ARIA

---

## 10. Performance

### Optimizaciones
- Fuentes: `font-display: swap` para Press Start 2P
- Imágenes: Usar Next.js Image si hay assets
- CSS: Efectos con CSS puro (no JS animations)
- Lazy loading: Solo para juegos "coming soon" si hay muchos

---

## 11. Futuras Extensiones

### Fácil añadir nuevos juegos:
1. Añadir entrada en `GAMES` array
2. Crear ruta `/nombre-juego/page.tsx`
3. Implementar componente del juego

### Posibles añadidos futuros:
- Categorías de juegos (reflexos, puzzle, arcade...)
- Filtros y búsqueda
- Puntuaciones por juego
- Logros/achievements

---

## 12. Checklist de Implementación

### Fase 1: Estructura Base
- [ ] Instalar fuente Press Start 2P
- [ ] Crear `lib/games.ts` con configuración
- [ ] Crear `components/home/GameCard.tsx`
- [ ] Crear `components/home/Header.tsx`
- [ ] Crear `components/home/GamesGrid.tsx`

### Fase 2: Estética Retro
- [ ] Configurar colores neón en Tailwind/globals.css
- [ ] Crear `components/home/RetroBackground.tsx`
- [ ] Añadir efectos CSS (glow, pixel border)
- [ ] Aplicar tipografía retro

### Fase 3: Página Home
- [ ] Reescribir `app/page.tsx` con nuevo diseño
- [ ] Testear responsividad
- [ ] Añadir animaciones de entrada

### Fase 4: Migración Juego
- [ ] Mover `/game` → `/bubble`
- [ ] Añadir botón "Back to Hub"
- [ ] Actualizar metadata
- [ ] Verificar que leaderboard funciona

### Fase 5: Polish
- [ ] Testear accesibilidad
- [ ] Optimizar performance
- [ ] Cross-browser testing
- [ ] Deploy a Vercel

---

## 13. Archivos a Crear/Modificar

### Nuevos
```
src/
├── lib/
│   └── games.ts                    # Configuración de juegos
├── components/
│   └── home/
│       ├── GameCard.tsx            # Tarjeta de juego
│       ├── GamesGrid.tsx           # Grid de juegos
│       ├── Header.tsx              # Header con logo
│       ├── RetroBackground.tsx     # Fondo retro
│       └── Footer.tsx              # Footer simple
└── app/
    └── bubble/
        └── page.tsx                # Juego renombrado
```

### Modificar
```
src/
├── app/
│   ├── layout.tsx                  # Añadir fuente Press Start 2P
│   ├── page.tsx                    # Nueva home
│   └── globals.css                 # Colores y efectos retro
└── tailwind.config.ts              # Extender con colores neón
```

### Eliminar
```
src/app/game/page.tsx               # Mover a bubble/page.tsx
```

---

## 14. Notas para FullStack

### Prioridades
1. **Funcionalidad sobre estética:** Primero que la home funcione, luego pulir efectos
2. **Mobile-first:** Asegurar que se vea bien en móvil antes que desktop
3. **Performance:** No excederse con animaciones, mantener < 3s carga

### Decisiones Técnicas Abiertas
- ¿Scanlines activados por defecto o solo en modo "hardcore"?
- ¿Animación de estrellas en fondo o demasiado?
- ¿Sonidos de UI (hover clicks) o silencioso?

### Testing Recomendado
- Chrome, Firefox, Safari (mobile y desktop)
- Lighthouse score > 90
- Test de accesibilidad con axe DevTools

---

**Fin del documento**
