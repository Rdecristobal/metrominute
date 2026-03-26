# API-001: Especificaciones de Componentes - Metro Minute Home

**Fecha:** 2026-03-26
**Relacionado con:** arch-001-metro-minute-home.md
**Propósito:** Contratos detallados de componentes para implementación

---

## 1. Tipos Base

### `types/game.ts`

```typescript
export interface Game {
  id: string;
  title: string;
  icon: string | React.ComponentType<{ className?: string }>;
  description: string;
  href: string;
  available: boolean;
  accentColor?: string;
  tags?: string[];
}

export type NeonColor = 'cyan' | 'magenta' | 'yellow' | 'green';
```

---

## 2. GameCard Component

### Ubicación
`src/components/home/GameCard.tsx`

### Props Interface

```typescript
interface GameCardProps {
  // Requeridos
  id: string;
  title: string;
  icon: string | React.ComponentType<{ className?: string }>;
  description: string;
  href: string;
  
  // Opcionales
  available?: boolean;           // Default: true
  accentColor?: string;          // Default: var(--neon-cyan)
  tags?: string[];               // Ej: ['reflex', 'casual']
  className?: string;            // Para override de estilos
}
```

### Comportamiento

| Estado | Visual | Acción |
|--------|--------|--------|
| Default | Borde gris oscuro, sin glow | N/A |
| Hover (available) | Borde neón, glow sutil, elevación | Cursor pointer |
| Hover (unavailable) | Sin cambios | Cursor not-allowed |
| Focus | Outline neón accesible | Tab navigation |
| Active | Escala 0.98 | Click |

### Estructura JSX

```tsx
<article className="group relative">
  <Link 
    href={available ? href : '#'}
    className={cn(
      "block p-6 rounded-lg border-2 transition-all duration-300",
      "bg-retro-surface",
      available 
        ? "border-gray-800 hover:border-[var(--accent)] hover:shadow-neon" 
        : "border-gray-900 opacity-50 cursor-not-allowed"
    )}
  >
    {/* Icon */}
    <div className="text-5xl mb-4">
      {typeof icon === 'string' ? icon : <icon className="w-12 h-12" />}
    </div>
    
    {/* Title */}
    <h3 className="font-arcade text-lg mb-2 text-retro-text group-hover:text-[var(--accent)]">
      {title}
    </h3>
    
    {/* Description */}
    <p className="font-terminal text-sm text-retro-muted mb-4">
      {description}
    </p>
    
    {/* Tags (optional) */}
    {tags && (
      <div className="flex gap-2 mb-4">
        {tags.map(tag => (
          <span key={tag} className="text-xs px-2 py-1 bg-gray-800 rounded">
            {tag}
          </span>
        ))}
      </div>
    )}
    
    {/* CTA */}
    <div className="flex items-center gap-2 text-sm font-terminal">
      {available ? (
        <>
          <span>PLAY</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </>
      ) : (
        <span className="text-retro-muted">COMING SOON</span>
      )}
    </div>
  </Link>
</article>
```

### Dependencias
- `next/link`
- `lucide-react` (ArrowRight)
- `@/lib/utils` (cn helper)

### CSS Variables Usadas
- `--retro-surface` (#1a1a1a)
- `--retro-text` (#e0e0e0)
- `--retro-muted` (#888888)
- `--neon-{color}` (dinámico por accentColor)

---

## 3. Header Component

### Ubicación
`src/components/home/Header.tsx`

### Props Interface

```typescript
interface HeaderProps {
  showNav?: boolean;              // Default: true
  className?: string;
}
```

### Estructura JSX

```tsx
<header className="sticky top-0 z-50 border-b border-gray-800 bg-retro-dark/80 backdrop-blur-sm">
  <div className="container mx-auto px-4 h-16 flex items-center justify-between">
    {/* Logo */}
    <Link href="/" className="flex items-center gap-3 group">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-magenta-500 flex items-center justify-center">
        <span className="text-2xl">◉</span>
      </div>
      <div>
        <h1 className="font-arcade text-sm tracking-wider group-hover:text-neon-cyan transition-colors">
          METRO MINUTE
        </h1>
        <p className="text-xs text-retro-muted font-terminal">
          Arcade Hub
        </p>
      </div>
    </Link>
    
    {/* Navigation */}
    {showNav && (
      <nav className="flex items-center gap-6">
        <Link 
          href="/leaderboard"
          className="font-terminal text-sm text-retro-muted hover:text-retro-text transition-colors"
        >
          LEADERBOARD
        </Link>
      </nav>
    )}
  </div>
</header>
```

### Comportamiento
- **Sticky:** Se mantiene en top al hacer scroll
- **Logo click:** Vuelve a home
- **Hover logo:** Glow en texto

### Dependencias
- `next/link`

---

## 4. RetroBackground Component

### Ubicación
`src/components/home/RetroBackground.tsx`

### Props Interface

```typescript
interface RetroBackgroundProps {
  variant?: 'grid' | 'stars' | 'gradient';  // Default: 'grid'
  intensity?: 'low' | 'medium' | 'high';    // Default: 'medium'
  className?: string;
}
```

### Estructura JSX (Grid Variant)

```tsx
<div className="fixed inset-0 -z-10 overflow-hidden">
  {/* Base gradient */}
  <div className="absolute inset-0 bg-gradient-to-b from-retro-dark via-black to-retro-dark" />
  
  {/* Grid pattern */}
  <div 
    className="absolute inset-0 opacity-20"
    style={{
      backgroundImage: `
        linear-gradient(rgba(0,255,247,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,255,247,0.1) 1px, transparent 1px)
      `,
      backgroundSize: '50px 50px',
    }}
  />
  
  {/* Radial glow */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl" />
</div>
```

### Notas
- **Performance:** Usar CSS puro, evitar animaciones JS
- **Intensidad:** Controlar opacidad del grid/glow
- **z-index:** Debe estar detrás de todo (-z-10)

---

## 5. GamesGrid Component

### Ubicación
`src/components/home/GamesGrid.tsx`

### Props Interface

```typescript
interface GamesGridProps {
  games: Game[];
  className?: string;
}
```

### Estructura JSX

```tsx
<div className={cn(
  "grid gap-6",
  "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  className
)}>
  {games.map((game, index) => (
    <GameCard 
      key={game.id}
      {...game}
      className="animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
    />
  ))}
</div>
```

### Animación CSS

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
  opacity: 0; /* Start hidden */
}
```

### Dependencias
- `./GameCard`
- `@/lib/utils` (cn)

---

## 6. Footer Component

### Ubicación
`src/components/home/Footer.tsx`

### Props Interface

```typescript
interface FooterProps {
  className?: string;
}
```

### Estructura JSX

```tsx
<footer className="border-t border-gray-800 py-8 mt-16">
  <div className="container mx-auto px-4">
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-retro-muted">
      <p className="font-terminal">
        © 2026 Metro Minute. Built with ❤️ and pixels.
      </p>
      
      <div className="flex items-center gap-6">
        <Link 
          href="https://github.com/Rdecristobal/metrominute"
          target="_blank"
          className="hover:text-retro-text transition-colors"
        >
          GitHub
        </Link>
      </div>
    </div>
  </div>
</footer>
```

---

## 7. Configuración de Juegos

### Ubicación
`src/lib/games.ts`

### Contenido

```typescript
import { Game } from '@/types/game';
import { Target } from 'lucide-react';

export const GAMES: Game[] = [
  {
    id: 'bubble',
    title: 'Bubble',
    icon: '🎯', // O: Target component
    description: 'Test your reflexes! Click the targets before time runs out.',
    href: '/bubble',
    available: true,
    accentColor: 'var(--neon-cyan)',
    tags: ['reflex', 'casual'],
  },
  // Futuros juegos (ejemplos):
  // {
  //   id: 'snake',
  //   title: 'Snake',
  //   icon: '🐍',
  //   description: 'The classic snake game with modern controls.',
  //   href: '/snake',
  //   available: false,
  //   accentColor: 'var(--neon-green)',
  //   tags: ['arcade', 'classic'],
  // },
  // {
  //   id: 'memory',
  //   title: 'Memory',
  //   icon: '🧠',
  //   description: 'Match pairs and train your memory.',
  //   href: '/memory',
  //   available: false,
  //   accentColor: 'var(--neon-magenta)',
  //   tags: ['puzzle', 'casual'],
  // },
];

// Helper para obtener juego por ID
export function getGameById(id: string): Game | undefined {
  return GAMES.find(game => game.id === id);
}

// Helper para obtener solo juegos disponibles
export function getAvailableGames(): Game[] {
  return GAMES.filter(game => game.available);
}
```

---

## 8. Página Principal - Implementación

### Ubicación
`src/app/page.tsx`

### Código Completo

```tsx
import Header from '@/components/home/Header';
import GamesGrid from '@/components/home/GamesGrid';
import RetroBackground from '@/components/home/RetroBackground';
import Footer from '@/components/home/Footer';
import { GAMES } from '@/lib/games';

export default function Home() {
  return (
    <main className="min-h-screen relative">
      <RetroBackground />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        
        <section className="flex-1 container mx-auto px-4 py-16">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="font-arcade text-4xl md:text-5xl mb-4 text-retro-text">
              METRO MINUTE
            </h1>
            <p className="font-terminal text-lg text-retro-muted max-w-md mx-auto">
              Your daily dose of arcade games.
              <br />
              Pick a game. Play. Beat your score.
            </p>
          </div>
          
          {/* Games Grid */}
          <GamesGrid games={GAMES} />
          
          {/* Coming Soon Teaser */}
          <div className="text-center mt-16">
            <p className="font-terminal text-sm text-retro-muted">
              More games coming soon...
            </p>
          </div>
        </section>
        
        <Footer />
      </div>
    </main>
  );
}
```

---

## 9. Estilos Globales - Añadir

### Ubicación
`src/app/globals.css`

### Añadir al final:

```css
/* ============================================
   METRO MINUTE - RETRO THEME
   ============================================ */

/* Fuentes */
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');

/* Variables Retro */
:root {
  --retro-black: #000000;
  --retro-dark: #0a0a0a;
  --retro-surface: #1a1a1a;
  --retro-text: #e0e0e0;
  --retro-muted: #888888;
  
  --neon-cyan: #00fff7;
  --neon-magenta: #ff00ff;
  --neon-yellow: #ffff00;
  --neon-green: #39ff14;
}

/* Clases de fuente */
.font-arcade {
  font-family: 'Press Start 2P', cursive;
}

.font-terminal {
  font-family: 'VT323', monospace;
}

/* Colores de fondo retro */
.bg-retro-dark { background-color: var(--retro-dark); }
.bg-retro-surface { background-color: var(--retro-surface); }
.text-retro-text { color: var(--retro-text); }
.text-retro-muted { color: var(--retro-muted); }

/* Efecto neón glow */
.shadow-neon {
  box-shadow: 
    0 0 5px currentColor,
    0 0 10px currentColor,
    0 0 20px currentColor;
}

.text-glow-cyan {
  text-shadow: 
    0 0 5px var(--neon-cyan),
    0 0 10px var(--neon-cyan);
}

/* Borde pixelado */
.pixel-border {
  border: 4px solid;
  box-shadow: 
    inset -4px -4px 0 0 rgba(0,0,0,0.3),
    inset 4px 4px 0 0 rgba(255,255,255,0.1);
}

/* Scanlines (opcional) */
.scanlines::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0,0,0,0.1),
    rgba(0,0,0,0.1) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
}

/* Animación de entrada */
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

/* Hover lift effect */
.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
}
```

---

## 10. Tailwind Config - Extender

### Ubicación
`tailwind.config.ts`

### Añadir a `theme.extend`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  // ... existing config
  theme: {
    extend: {
      // ... existing extensions
      
      colors: {
        // ... existing colors
        
        // Retro colors
        'retro-black': '#000000',
        'retro-dark': '#0a0a0a',
        'retro-surface': '#1a1a1a',
        'retro-text': '#e0e0e0',
        'retro-muted': '#888888',
        
        // Neon colors
        'neon-cyan': '#00fff7',
        'neon-magenta': '#ff00ff',
        'neon-yellow': '#ffff00',
        'neon-green': '#39ff14',
      },
      
      fontFamily: {
        'arcade': ['"Press Start 2P"', 'cursive'],
        'terminal': ['VT323', 'monospace'],
      },
      
      boxShadow: {
        'neon-cyan': '0 0 5px #00fff7, 0 0 10px #00fff7, 0 0 20px #00fff7',
        'neon-magenta': '0 0 5px #ff00ff, 0 0 10px #ff00ff, 0 0 20px #ff00ff',
        'neon-green': '0 0 5px #39ff14, 0 0 10px #39ff14, 0 0 20px #39ff14',
      },
      
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
      },
      
      keyframes: {
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-neon': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  // ... rest of config
};

export default config;
```

---

## 11. Layout - Añadir Fuente

### Ubicación
`src/app/layout.tsx`

### Modificación:

```tsx
import { Geist, Geist_Mono } from "next/font/google";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Añadir fuentes retro
const pressStart2P = Press_Start_2P({
  variable: "--font-arcade",
  subsets: ["latin"],
  weight: "400",
});

const vt323 = VT323({
  variable: "--font-terminal",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Metro Minute - Arcade Hub",
  description: "Your daily dose of arcade games. Play retro-style minigames and beat your high scores!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} ${vt323.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-retro-dark">{children}</body>
    </html>
  );
}
```

---

## 12. Botón "Back to Hub" - Para Página del Juego

### Ubicación
`src/components/game/BackToHub.tsx`

### Componente:

```tsx
'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function BackToHub() {
  return (
    <Link
      href="/"
      className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 
                 bg-retro-surface/90 backdrop-blur-sm border border-gray-800 
                 rounded-lg font-terminal text-sm text-retro-muted
                 hover:text-retro-text hover:border-neon-cyan transition-all"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>BACK TO HUB</span>
    </Link>
  );
}
```

### Uso en `/bubble/page.tsx`:

```tsx
import { BackToHub } from '@/components/game/BackToHub';
import GameBoard from '@/components/game/GameBoard';

export default function BubblePage() {
  return (
    <>
      <BackToHub />
      <GameBoard />
    </>
  );
}
```

---

## 13. Testing Checklist

### Visual
- [ ] Fuentes cargan correctamente (Press Start 2P, VT323)
- [ ] Colores neón se ven en dark mode
- [ ] Grid de fondo visible pero no distractor
- [ ] Tarjetas con hover effect funcional
- [ ] Animaciones de entrada suaves

### Funcional
- [ ] Click en tarjeta lleva al juego correcto
- [ ] Juegos "coming soon" no son clickeables
- [ ] Logo lleva a home
- [ ] Back to Hub funciona desde juego
- [ ] Leaderboard link funciona

### Responsive
- [ ] Mobile: 1 columna, texto legible
- [ ] Tablet: 2 columnas
- [ ] Desktop: 3 columnas
- [ ] Header se adapta
- [ ] Footer no rompe layout

### Accesibilidad
- [ ] Tab navigation funciona
- [ ] Focus visible en todos los elementos
- [ ] Contraste de colores adecuado
- [ ] Alt text en iconos/imágenes

---

**Fin del documento**
