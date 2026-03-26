# Arquitectura: Home Page Retro Arcade - Metro Minute

**Fecha:** 2026-03-26  
**Estado:** ✅ IMPLEMENTADO  
**Autor:** Arquitecto  
**Para:** FullStack Team

---

## 1. Resumen Ejecutivo

### Estado Actual
La home page de Metro Minute **YA ESTÁ IMPLEMENTADA Y FUNCIONAL** con todos los requisitos solicitados:

- ✅ Estilo visual negro, retro, arcade
- ✅ Listado de minijuegos disponibles (actualmente solo Bubble)
- ✅ Navegación funcional al juego Bubble
- ✅ Componentes modulares y reutilizables
- ✅ Sistema de diseño retro coherente

### Ubicación
- **Home Page:** `/src/app/page.tsx`
- **Ruta:** `/` (raíz del sitio)
- **Juego Bubble:** `/bubble` (ya existente)

---

## 2. Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 16.2.1 | Framework React con App Router |
| React | 19.0.0 | Librería de UI |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 3.4.19 | Estilos utility-first |
| Framer Motion | 12.38.0 | Animaciones fluidas |
| shadcn/ui | 4.1.0 | Componentes base |
| Lucide React | 0.577.0 | Iconos |

### Fonts (Google Fonts)
- **Arcade:** `Press Start 2P` - Títulos y CTAs
- **Terminal:** `VT323` - Texto descriptivo y UI

---

## 3. Arquitectura de Componentes

### 3.1 Estructura de Archivos

```
src/
├── app/
│   ├── page.tsx                 # Home page (landing)
│   ├── layout.tsx               # Layout raíz
│   ├── globals.css              # Estilos globales retro
│   └── bubble/
│       └── page.tsx             # Juego Bubble
│
├── components/
│   └── home/
│       ├── index.ts             # Barrel export
│       ├── Header.tsx           # Navegación superior
│       ├── Footer.tsx           # Pie de página
│       ├── GamesGrid.tsx        # Grid de juegos
│       ├── GameCard.tsx         # Card individual de juego
│       └── RetroBackground.tsx  # Fondo animado retro
│
├── lib/
│   └── games.ts                 # Catálogo de juegos
│
└── types/
    └── game.ts                  # Contratos TypeScript
```

### 3.2 Jerarquía de Componentes

```
Home (page.tsx)
├── RetroBackground
├── Header
│   └── Logo + Nav (Leaderboard)
├── Hero Section
│   ├── Título "METRO MINUTE"
│   └── Subtítulo descriptivo
├── GamesGrid
│   └── GameCard (por cada juego)
│       ├── Icon
│       ├── Title
│       ├── Description
│       ├── Tags
│       └── CTA "PLAY"
└── Footer
```

---

## 4. Contratos de Componentes

### 4.1 Tipo `Game` (Core)

```typescript
// src/types/game.ts

export interface Game {
  id: string;                    // Identificador único (ej: 'bubble')
  title: string;                 // Nombre del juego (ej: 'Bubble')
  icon: string | React.ComponentType<{ className?: string }>;
  description: string;           // Descripción corta
  href: string;                  // Ruta al juego (ej: '/bubble')
  available: boolean;            // Si está disponible o "coming soon"
  accentColor?: string;          // Color de acento CSS var (ej: 'var(--neon-cyan)')
  tags?: string[];               // Tags descriptivos (ej: ['reflex', 'casual'])
}

export type NeonColor = 'cyan' | 'magenta' | 'yellow' | 'green';
```

### 4.2 Componente `GamesGrid`

```typescript
// src/components/home/GamesGrid.tsx

interface GamesGridProps {
  games: Game[];        // Array de juegos a mostrar
  className?: string;   // Clases CSS adicionales
}

export function GamesGrid({ games, className }: GamesGridProps): JSX.Element;
```

**Responsabilidad:** Renderizar grid responsive de tarjetas de juegos con animación escalonada.

**Grid:**
- Mobile: 1 columna
- Tablet (sm): 2 columnas
- Desktop (lg): 3 columnas

### 4.3 Componente `GameCard`

```typescript
// src/components/home/GameCard.tsx

interface GameCardProps extends Game {
  className?: string;
}

export function GameCard({
  id,
  title,
  icon,
  description,
  href,
  available = true,
  accentColor = 'var(--neon-cyan)',
  tags,
  className
}: GameCardProps): JSX.Element;
```

**Comportamiento:**
- Si `available = true`: Link navegable con hover effects
- Si `available = false`: Card deshabilitada con opacity y pointer-events none

**Efectos hover (disponible):**
- Border cambia a neón cyan
- Box-shadow neón
- Translate Y (-4px)
- Texto cambia a cyan

### 4.4 Componente `Header`

```typescript
// src/components/home/Header.tsx

interface HeaderProps {
  showNav?: boolean;     // Mostrar navegación (default: true)
  className?: string;
}

export function Header({ showNav = true, className }: HeaderProps): JSX.Element;
```

**Estructura:**
- Logo con gradiente cyan → magenta
- Título "METRO MINUTE"
- Subtítulo "Arcade Hub"
- Nav: Link a Leaderboard

### 4.5 Componente `Footer`

```typescript
// src/components/home/Footer.tsx

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps): JSX.Element;
```

**Contenido:**
- Créditos
- Links legales (opcional)
- Año actual

### 4.6 Componente `RetroBackground`

```typescript
// src/components/home/RetroBackground.tsx

export function RetroBackground(): JSX.Element;
```

**Responsabilidad:** Fondo animado con efectos retro (grid, partículas, glow).

---

## 5. Sistema de Diseño Retro

### 5.1 Paleta de Colores

```css
/* Fondos */
--retro-black: #000000;
--retro-dark: #0a0a0a;
--retro-surface: #1a1a1a;

/* Texto */
--retro-text: #e0e0e0;
--retro-muted: #888888;

/* Neones (acento) */
--neon-cyan: #00fff7;
--neon-magenta: #ff00ff;
--neon-yellow: #ffff00;
--neon-green: #39ff14;
```

### 5.2 Tipografía

| Uso | Font | Tamaño Base | Weight |
|-----|------|-------------|--------|
| Títulos | Press Start 2P | 3xl - 5xl | 400 |
| UI/Descripciones | VT323 | base - xl | 400 |
| Tags | VT323 | xs | 400 |

### 5.3 Efectos Neón

```css
/* Box shadow neón */
.shadow-neon-cyan {
  box-shadow: 0 0 5px #00fff7, 0 0 10px #00fff7, 0 0 20px #00fff7;
}

/* Text glow */
.text-glow-cyan {
  text-shadow: 0 0 5px var(--neon-cyan), 0 0 10px var(--neon-cyan);
}
```

### 5.4 Animaciones

```css
/* Fade in con lift */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Delay escalonado para grid */
animation-delay: ${index * 100}ms;
```

---

## 6. Catálogo de Juegos

### 6.1 Estructura (`src/lib/games.ts`)

```typescript
import { Game } from '@/types/game';

export const GAMES: Game[] = [
  {
    id: 'bubble',
    title: 'Bubble',
    icon: '🎯',
    description: 'Test your reflexes! Click the targets before time runs out.',
    href: '/bubble',
    available: true,
    accentColor: 'var(--neon-cyan)',
    tags: ['reflex', 'casual'],
  },
];

export function getGameById(id: string): Game | undefined;
export function getAvailableGames(): Game[];
```

### 6.2 Cómo Agregar un Nuevo Juego

**Paso 1: Crear la página del juego**

```typescript
// src/app/nuevo-juego/page.tsx
export default function NuevoJuegoPage() {
  return <NuevoJuegoComponent />;
}
```

**Paso 2: Agregar al catálogo**

```typescript
// src/lib/games.ts
export const GAMES: Game[] = [
  {
    id: 'bubble',
    // ... existing
  },
  {
    id: 'nuevo-juego',
    title: 'Nuevo Juego',
    icon: '🎮', // Emoji o componente de Lucide
    description: 'Descripción corta del juego.',
    href: '/nuevo-juego',
    available: true, // false para "coming soon"
    accentColor: 'var(--neon-magenta)',
    tags: ['action', 'multiplayer'],
  },
];
```

**Paso 3: Verificar**
- La card aparecerá automáticamente en la home
- El grid se ajustará solo
- La animación escalonada se aplicará

---

## 7. Flujo de Navegación

```
Usuario entra a /
  ↓
Home page carga con:
  - RetroBackground (animado)
  - Header con logo
  - Hero con título
  - GamesGrid con GameCards
  - Footer
  ↓
Usuario hace click en "PLAY" de Bubble
  ↓
Next.js Link navega a /bubble
  ↓
Juego Bubble carga
```

---

## 8. Responsividad

### Breakpoints

| Tamaño | Columnas Grid | Título | Card Padding |
|--------|---------------|--------|--------------|
| Mobile (<640px) | 1 | text-3xl | p-6 |
| Tablet (sm) | 2 | text-4xl | p-6 |
| Desktop (lg) | 3 | text-5xl | p-6 |

### Layout
- Header: Sticky, backdrop-blur
- Main: Flex vertical, min-h-screen
- Footer: Bottom sticky si hay espacio

---

## 9. Instrucciones para FullStack

### 9.1 Checklist de Mantenimiento

- [ ] Verificar que nuevos juegos se agreguen a `GAMES` array
- [ ] Mantener consistencia de colores neón
- [ ] Probar responsividad en mobile/tablet/desktop
- [ ] Verificar animaciones escalonadas
- [ ] Validar que `available: false` deshabilite cards correctamente

### 9.2 Agregar Nuevos Juegos (Quick Guide)

1. **Crear página:** `src/app/[game-id]/page.tsx`
2. **Agregar a catálogo:** Editar `src/lib/games.ts`
3. **Testing:** Verificar que aparece en home y navega correctamente
4. **Documentar:** Actualizar README del juego

### 9.3 Modificar Estilos Retro

**Ubicación de estilos:**
- Tailwind config: `tailwind.config.ts` (colores, fonts, shadows)
- CSS custom: `src/app/globals.css` (clases .retro-*, .shadow-neon, etc.)

**NO modificar:**
- Variables CSS existentes sin actualizar referencias
- Sistema de colores neón (usar variables)

### 9.4 Testing Manual

**Casos de prueba:**
1. ✅ Home carga correctamente
2. ✅ Animaciones escalonadas funcionan
3. ✅ Hover en cards muestra efectos neón
4. ✅ Click en Bubble navega a `/bubble`
5. ✅ Header sticky funciona
6. ✅ Responsive en todos los tamaños
7. ✅ "Coming soon" aparece si `available: false`

---

## 10. Consideraciones Técnicas

### 10.1 Performance

- ✅ Componentes cliente ligeros
- ✅ Animaciones con CSS (GPU accelerated)
- ✅ Fuentes optimizadas (Google Fonts)
- ✅ Sin dependencias pesadas

### 10.2 Accesibilidad

- ✅ Contraste de colores adecuado
- ⚠️ Fuentes arcade pueden ser difíciles de leer en tamaños pequeños
- ⚠️ Considerar `aria-labels` para iconos solo visuales
- ⚠️ Navegación por teclado (verificar focus states)

### 10.3 SEO

- ✅ Next.js App Router (SSR por defecto)
- ⚠️ Agregar metadata en `layout.tsx`:
  ```typescript
  export const metadata: Metadata = {
    title: 'Metro Minute - Arcade Games Hub',
    description: 'Your daily dose of arcade games. Play quick games, beat your score.',
  };
  ```

---

## 11. Futuras Mejoras (Out of Scope)

- [ ] Filtrado de juegos por tags
- [ ] Búsqueda de juegos
- [ ] Categorías (reflex, puzzle, action, etc.)
- [ ] Favoritos (localStorage)
- [ ] Animación de transición entre home y juego
- [ ] Modo oscuro/claro toggle (actualmente solo oscuro)

---

## 12. Referencias

### Archivos Clave
- `src/app/page.tsx` - Home page
- `src/lib/games.ts` - Catálogo de juegos
- `src/types/game.ts` - Contratos TypeScript
- `src/components/home/*` - Componentes de UI
- `tailwind.config.ts` - Configuración de estilos
- `src/app/globals.css` - Estilos retro custom

### Dependencias
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [shadcn/ui](https://ui.shadcn.com/)

---

**FIN DEL DOCUMENTO**

---

## Notas para QA

### Validación Requerida

1. **Funcionalidad:**
   - [ ] Home carga sin errores
   - [ ] Navegación a Bubble funciona
   - [ ] Animaciones se ejecutan correctamente

2. **Visual:**
   - [ ] Estilo retro arcade coherente
   - [ ] Colores neón se ven correctos
   - [ ] Responsive en todos los dispositivos

3. **Performance:**
   - [ ] Carga rápida (<2s)
   - [ ] Animaciones fluidas (60fps)
   - [ ] Sin memory leaks

### Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Linting
npm run lint

# Ver en navegador
open http://localhost:3000
```

---

**Documento generado por:** Arquitecto  
**Revisado por:** Pendiente  
**Fecha última actualización:** 2026-03-26
