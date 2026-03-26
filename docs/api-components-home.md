# Contrato de Componentes - Home Page Retro Arcade

**Proyecto:** Metro Minute  
**Versión:** 1.0.0  
**Fecha:** 2026-03-26  
**Autor:** Arquitecto

---

## Propósito

Este documento define los contratos formales de los componentes de la home page. Es la **fuente de verdad** para cualquier modificación o extensión del sistema.

---

## 1. Core Types

### 1.1 `Game` Interface

**Ubicación:** `src/types/game.ts`

```typescript
export interface Game {
  /**
   * Identificador único del juego
   * Usado para routing y key en React
   * @example "bubble", "space-invaders"
   */
  id: string;

  /**
   * Nombre display del juego
   * Se muestra en cards y títulos
   * @example "Bubble", "Space Invaders"
   */
  title: string;

  /**
   * Icono del juego
   * Puede ser emoji string o componente React
   * @example "🎯" o `Zap` de lucide-react
   */
  icon: string | React.ComponentType<{ className?: string }>;

  /**
   * Descripción corta del juego
   * Max recomendado: 80 caracteres
   * @example "Test your reflexes! Click targets before time runs out."
   */
  description: string;

  /**
   * Ruta al juego
   * Debe coincidir con la página en src/app/[href]/page.tsx
   * @example "/bubble"
   */
  href: string;

  /**
   * Si el juego está disponible para jugar
   * false = muestra "Coming Soon" y deshabilita navegación
   * @default true
   */
  available: boolean;

  /**
   * Color de acento para la card
   * Usar variables CSS definidas en globals.css
   * @example "var(--neon-cyan)"
   * @default "var(--neon-cyan)"
   */
  accentColor?: string;

  /**
   * Tags descriptivos para categorización
   * Usar tags consistentes entre juegos
   * @example ["reflex", "casual"]
   */
  tags?: string[];
}

export type NeonColor = 'cyan' | 'magenta' | 'yellow' | 'green';
```

---

## 2. Componentes de UI

### 2.1 `GamesGrid`

**Ubicación:** `src/components/home/GamesGrid.tsx`

```typescript
interface GamesGridProps {
  /**
   * Array de juegos a mostrar
   * Se renderiza una GameCard por cada juego
   */
  games: Game[];

  /**
   * Clases CSS adicionales
   * Se aplican al contenedor grid
   * @optional
   */
  className?: string;
}

/**
 * Grid responsive de tarjetas de juegos
 * 
 * Comportamiento:
 * - Mobile: 1 columna
 * - Tablet (sm): 2 columnas
 * - Desktop (lg): 3 columnas
 * - Gap: 1.5rem (gap-6)
 * - Animación escalonada: 100ms delay por card
 * 
 * @example
 * <GamesGrid games={GAMES} />
 */
export function GamesGrid({ games, className }: GamesGridProps): JSX.Element;
```

**Implementación:**

```typescript
export function GamesGrid({ games, className }: GamesGridProps) {
  return (
    <div className={`grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${className || ''}`}>
      {games.map((game, index) => (
        <div
          key={game.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <GameCard {...game} />
        </div>
      ))}
    </div>
  );
}
```

---

### 2.2 `GameCard`

**Ubicación:** `src/components/home/GameCard.tsx`

```typescript
interface GameCardProps extends Game {
  /**
   * Clases CSS adicionales
   * @optional
   */
  className?: string;
}

/**
 * Tarjeta individual de juego
 * 
 * Comportamiento:
 * - Si available=true: Link navegable con hover effects
 * - Si available=false: Card deshabilitada, sin navegación
 * 
 * Hover effects (available=true):
 * - Border: gray-800 → accentColor
 * - Box-shadow: none → neon glow
 * - Transform: translateY(-4px)
 * - Texto: retro-text → accentColor
 * 
 * @example
 * <GameCard
 *   id="bubble"
 *   title="Bubble"
 *   icon="🎯"
 *   description="Test your reflexes!"
 *   href="/bubble"
 *   available={true}
 *   accentColor="var(--neon-cyan)"
 *   tags={['reflex', 'casual']}
 * />
 */
export function GameCard(props: GameCardProps): JSX.Element;
```

**Estructura renderizada:**

```html
<article class="group relative">
  <a href="/bubble" class="block p-6 rounded-lg border-2 ...">
    <!-- Icon -->
    <div class="text-5xl mb-4">🎯</div>
    
    <!-- Title -->
    <h3 class="font-arcade text-sm mb-2 ...">Bubble</h3>
    
    <!-- Description -->
    <p class="font-terminal text-base ...">Test your reflexes!</p>
    
    <!-- Tags -->
    <div class="flex flex-wrap gap-2 mb-4">
      <span class="text-xs px-2 py-1 ...">reflex</span>
      <span class="text-xs px-2 py-1 ...">casual</span>
    </div>
    
    <!-- CTA -->
    <div class="flex items-center gap-2 ...">
      <span class="text-neon-cyan">PLAY</span>
      <ArrowRight class="w-4 h-4 text-neon-cyan" />
    </div>
  </a>
</article>
```

**Estados:**

| available | Comportamiento Visual |
|-----------|----------------------|
| `true` | Border hoverable, glow neón, cursor pointer, navega |
| `false` | Opacity 50%, cursor not-allowed, sin navegación |

---

### 2.3 `Header`

**Ubicación:** `src/components/home/Header.tsx`

```typescript
interface HeaderProps {
  /**
   * Mostrar navegación (Leaderboard link)
   * @default true
   */
  showNav?: boolean;

  /**
   * Clases CSS adicionales
   * @optional
   */
  className?: string;
}

/**
 * Header sticky con logo y navegación
 * 
 * Características:
 * - Posición: sticky top-0
 * - Background: retro-dark con backdrop-blur
 * - Border: bottom gray-800
 * - Height: 4rem (h-16)
 * 
 * @example
 * <Header showNav={true} />
 */
export function Header({ showNav = true, className }: HeaderProps): JSX.Element;
```

**Estructura:**

```html
<header class="sticky top-0 z-50 border-b border-gray-880 bg-retro-dark/80 backdrop-blur-sm">
  <div class="container mx-auto px-4 h-16 flex items-center justify-between">
    <!-- Logo -->
    <a href="/" class="flex items-center gap-3 group">
      <div class="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-magenta-500">
        <span>◉</span>
      </div>
      <div>
        <h1 class="font-arcade text-xs">METRO MINUTE</h1>
        <p class="text-xs text-retro-muted">Arcade Hub</p>
      </div>
    </a>
    
    <!-- Nav -->
    <nav class="flex items-center gap-6">
      <a href="/leaderboard">LEADERBOARD</a>
    </nav>
  </div>
</header>
```

---

### 2.4 `Footer`

**Ubicación:** `src/components/home/Footer.tsx`

```typescript
interface FooterProps {
  /**
   * Clases CSS adicionales
   * @optional
   */
  className?: string;
}

/**
 * Footer con créditos y links
 * 
 * @example
 * <Footer />
 */
export function Footer({ className }: FooterProps): JSX.Element;
```

---

### 2.5 `RetroBackground`

**Ubicación:** `src/components/home/RetroBackground.tsx`

```typescript
/**
 * Fondo animado con efectos retro
 * 
 * Características:
 * - Posición: absolute, full screen
 * - z-index: 0 (detrás del contenido)
 * - Efectos: grid, partículas, glow
 * 
 * @example
 * <main className="min-h-screen relative">
 *   <RetroBackground />
 *   <div className="relative z-10">Contenido</div>
 * </main>
 */
export function RetroBackground(): JSX.Element;
```

**Uso correcto:**

```typescript
<main className="min-h-screen relative">
  <RetroBackground /> {/* z-0 */}
  
  <div className="relative z-10"> {/* z-10 */}
    {/* Contenido encima del fondo */}
  </div>
</main>
```

---

## 3. Utilidades y Helpers

### 3.1 `src/lib/games.ts`

```typescript
import { Game } from '@/types/game';

/**
 * Catálogo de juegos disponibles
 * 
 * Modificar este array para agregar/quitar juegos
 * Los cambios se reflejan automáticamente en la home
 */
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

/**
 * Obtener juego por ID
 * 
 * @param id - ID del juego
 * @returns Game si existe, undefined si no
 * 
 * @example
 * const game = getGameById('bubble');
 * if (game) {
 *   console.log(game.title); // "Bubble"
 * }
 */
export function getGameById(id: string): Game | undefined {
  return GAMES.find(game => game.id === id);
}

/**
 * Obtener solo juegos disponibles
 * 
 * @returns Array de juegos con available=true
 * 
 * @example
 * const playableGames = getAvailableGames();
 * // [{id: 'bubble', ...}]
 */
export function getAvailableGames(): Game[] {
  return GAMES.filter(game => game.available);
}
```

---

## 4. Sistema de Diseño

### 4.1 Variables CSS

**Ubicación:** `src/app/globals.css`

```css
:root {
  /* Fondos */
  --retro-black: #000000;
  --retro-dark: #0a0a0a;
  --retro-surface: #1a1a1a;

  /* Texto */
  --retro-text: #e0e0e0;
  --retro-muted: #888888;

  /* Neones */
  --neon-cyan: #00fff7;
  --neon-magenta: #ff00ff;
  --neon-yellow: #ffff00;
  --neon-green: #39ff14;
}
```

### 4.2 Clases de Utilidad

```css
/* Fondos */
.bg-retro-dark { background-color: var(--retro-dark); }
.bg-retro-surface { background-color: var(--retro-surface); }

/* Texto */
.text-retro-text { color: var(--retro-text); }
.text-retro-muted { color: var(--retro-muted); }

/* Efectos neón */
.shadow-neon-cyan {
  box-shadow: 0 0 5px #00fff7, 0 0 10px #00fff7, 0 0 20px #00fff7;
}

.text-glow-cyan {
  text-shadow: 0 0 5px var(--neon-cyan), 0 0 10px var(--neon-cyan);
}
```

### 4.3 Fuentes

```css
font-family: 'Press Start 2P', cursive;  /* .font-arcade */
font-family: 'VT323', monospace;         /* .font-terminal */
```

---

## 5. Animaciones

### 5.1 Fade In Up

**Definición:**

```css
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

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out forwards;
  opacity: 0;
}
```

**Uso:**

```typescript
// En GamesGrid
<div
  className="animate-fade-in-up"
  style={{ animationDelay: `${index * 100}ms` }}
>
  <GameCard {...game} />
</div>
```

### 5.2 Hover Lift

```css
.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
}
```

---

## 6. Contrato de Routing

### 6.1 Estructura de Rutas

```
/                    → Home (src/app/page.tsx)
/bubble              → Juego Bubble (src/app/bubble/page.tsx)
/leaderboard         → Leaderboard (src/app/leaderboard/page.tsx)
/[game-id]           → Juego dinámico (src/app/[game-id]/page.tsx)
```

### 6.2 Convenciones

1. **Game ID** debe coincidir con carpeta en `src/app/`
   ```typescript
   // games.ts
   { id: 'space-invaders', href: '/space-invaders' }
   
   // File system
   src/app/space-invaders/page.tsx
   ```

2. **Rutas dinámicas** (futuro):
   ```typescript
   // src/app/[gameId]/page.tsx
   export default function GamePage({ params }: { params: { gameId: string } }) {
     const game = getGameById(params.gameId);
     // ...
   }
   ```

---

## 7. Contrato de Datos

### 7.1 Inmutabilidad

El array `GAMES` es **const**, pero los componentes lo leen sin modificarlo.

```typescript
// ✅ Correcto: Leer
const games = getAvailableGames();

// ❌ Incorrecto: Mutar
GAMES.push(newGame); // No hacer

// ✅ Correcto: Crear nuevo array
const updatedGames = [...GAMES, newGame];
```

### 7.2 Validación

TypeScript valida en compile-time, pero runtime validation es recomendada para datos externos:

```typescript
// Futuro: Validación con Zod
import { z } from 'zod';

const GameSchema = z.object({
  id: z.string(),
  title: z.string(),
  icon: z.union([z.string(), z.custom()]),
  description: z.string().max(100),
  href: z.string().startsWith('/'),
  available: z.boolean(),
  accentColor: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
```

---

## 8. Extensiones Futuras

### 8.1 Filtros por Tags

```typescript
// Nuevo helper
export function getGamesByTag(tag: string): Game[] {
  return GAMES.filter(game => game.tags?.includes(tag));
}

// Uso
const reflexGames = getGamesByTag('reflex');
```

### 8.2 Búsqueda

```typescript
export function searchGames(query: string): Game[] {
  const lowerQuery = query.toLowerCase();
  return GAMES.filter(game => 
    game.title.toLowerCase().includes(lowerQuery) ||
    game.description.toLowerCase().includes(lowerQuery) ||
    game.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}
```

### 8.3 Favoritos (localStorage)

```typescript
// Nuevo tipo
export interface GameWithFavorite extends Game {
  isFavorite: boolean;
}

// Hook personalizado
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  
  useEffect(() => {
    const stored = localStorage.getItem('favorites');
    if (stored) setFavorites(JSON.parse(stored));
  }, []);
  
  const toggleFavorite = (gameId: string) => {
    setFavorites(prev => {
      const updated = prev.includes(gameId)
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId];
      localStorage.setItem('favorites', JSON.stringify(updated));
      return updated;
    });
  };
  
  return { favorites, toggleFavorite };
}
```

---

## 9. Breaking Changes Policy

### 9.1 Interface `Game`

**CAMBIOS SEGUROS (non-breaking):**
- ✅ Agregar campos opcionales nuevos
- ✅ Agregar nuevos valores a enums
- ✅ Agregar nuevos helpers

**CAMBIOS PELIGROSOS (breaking):**
- ❌ Renombrar campos existentes
- ❌ Hacer opcional un campo requerido
- ❌ Cambiar tipos de campos
- ❌ Eliminar campos

### 9.2 Componentes

**CAMBIOS SEGUROS:**
- ✅ Agregar props opcionales nuevas
- ✅ Agregar nuevas variantes
- ✅ Mejorar estilos internos

**CAMBIOS PELIGROSOS:**
- ❌ Renombrar props existentes
- ❌ Cambiar comportamiento default
- ❌ Eliminar props

---

## 10. Testing Contract

### 10.1 Unit Tests (Recomendado)

```typescript
// __tests__/components/GameCard.test.tsx
import { render, screen } from '@testing-library/react';
import { GameCard } from '@/components/home/GameCard';

describe('GameCard', () => {
  const mockGame = {
    id: 'test',
    title: 'Test Game',
    icon: '🎮',
    description: 'Test description',
    href: '/test',
    available: true,
  };

  it('renders game title', () => {
    render(<GameCard {...mockGame} />);
    expect(screen.getByText('Test Game')).toBeInTheDocument();
  });

  it('disables navigation when available=false', () => {
    render(<GameCard {...mockGame} available={false} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '#');
    expect(link).toHaveClass('pointer-events-none');
  });
});
```

### 10.2 Integration Tests

```typescript
// __tests__/integration/home.test.tsx
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home Page', () => {
  it('renders all available games', () => {
    render(<Home />);
    const games = screen.getAllByRole('article');
    expect(games.length).toBeGreaterThan(0);
  });

  it('navigates to game on click', async () => {
    render(<Home />);
    const playButton = screen.getByText('PLAY');
    expect(playButton.closest('a')).toHaveAttribute('href', '/bubble');
  });
});
```

---

## 11. Documentación de API

### 11.1 JSDoc Comments

Todos los componentes y funciones deben tener JSDoc:

```typescript
/**
 * Grid responsive de tarjetas de juegos
 * 
 * @param games - Array de juegos a mostrar
 * @param className - Clases CSS adicionales (opcional)
 * @returns JSX.Element con grid de GameCards
 * 
 * @example
 * <GamesGrid games={GAMES} className="mt-8" />
 */
export function GamesGrid({ games, className }: GamesGridProps): JSX.Element {
  // ...
}
```

### 11.2 TypeDoc

Generar documentación automática:

```bash
npx typedoc --out docs/api src/types src/lib
```

---

## 12. Changelog

### v1.0.0 (2026-03-26)
- ✅ Home page implementada
- ✅ Componentes modulares creados
- ✅ Sistema de diseño retro definido
- ✅ Contratos de componentes documentados

---

**Documento técnico para:** Equipo de Desarrollo  
**Mantenido por:** Arquitecto  
**Última actualización:** 2026-03-26

**Este documento es la fuente de verdad para modificaciones de la home page.**
