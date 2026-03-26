# Migration-001: Plan de Migración a Metro Minute Hub

**Fecha:** 2026-03-26
**Estado:** Listo para implementación
**Prerrequisitos:** Leer arch-001, api-001, design-001

---

## Resumen Ejecutivo

Este documento detalla los pasos exactos para transformar Metro Minute de un juego único a un hub de minijuegos, renombrando el juego actual a "Bubble" y creando la nueva home retro.

---

## Fase 1: Preparación del Entorno (30 min)

### 1.1 Crear Branch de Feature

```bash
cd ~/.openclaw/workspace-dyzink/metrominute
git checkout -b feature/metro-minute-hub
```

### 1.2 Instalar Dependencias de Fuentes

Las fuentes de Google se cargan dinámicamente en Next.js, no requiere instalación npm.

### 1.3 Backup de Archivos Actuales

```bash
# Crear backup de página actual
cp src/app/page.tsx src/app/page.tsx.backup
```

---

## Fase 2: Extender Sistema de Diseño (45 min)

### 2.1 Actualizar `src/app/globals.css`

**Añadir al final del archivo:**

```css
/* ============================================
   METRO MINUTE - RETRO THEME
   ============================================ */

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

/* Clases de utilidad retro */
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

### 2.2 Actualizar `tailwind.config.ts`

**Añadir a `theme.extend`:**

```typescript
colors: {
  // ... existing colors ...
  
  'retro-black': '#000000',
  'retro-dark': '#0a0a0a',
  'retro-surface': '#1a1a1a',
  'retro-text': '#e0e0e0',
  'retro-muted': '#888888',
  
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
},
```

### 2.3 Actualizar `src/app/layout.tsx`

**Modificar imports y className:**

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
  display: "swap",
});

const vt323 = VT323({
  variable: "--font-terminal",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Metro Minute - Arcade Hub",
  description: "Your daily dose of arcade games. Play retro-style minigames!",
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

## Fase 3: Crear Tipos y Configuración (15 min)

### 3.1 Crear `src/types/game.ts`

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

### 3.2 Crear `src/lib/games.ts`

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

export function getGameById(id: string): Game | undefined {
  return GAMES.find(game => game.id === id);
}

export function getAvailableGames(): Game[] {
  return GAMES.filter(game => game.available);
}
```

---

## Fase 4: Crear Componentes Home (60 min)

### 4.1 Crear `src/components/home/RetroBackground.tsx`

```tsx
interface RetroBackgroundProps {
  className?: string;
}

export function RetroBackground({ className }: RetroBackgroundProps) {
  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${className || ''}`}>
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
  );
}
```

### 4.2 Crear `src/components/home/Header.tsx`

```tsx
import Link from 'next/link';

interface HeaderProps {
  showNav?: boolean;
  className?: string;
}

export function Header({ showNav = true, className }: HeaderProps) {
  return (
    <header className={`sticky top-0 z-50 border-b border-gray-800 bg-retro-dark/80 backdrop-blur-sm ${className || ''}`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-magenta-500 flex items-center justify-center">
            <span className="text-2xl">◉</span>
          </div>
          <div>
            <h1 className="font-arcade text-xs tracking-wider group-hover:text-neon-cyan transition-colors">
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
  );
}
```

### 4.3 Crear `src/components/home/GameCard.tsx`

```tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Game } from '@/types/game';

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
}: GameCardProps) {
  const IconComponent = typeof icon === 'string' ? null : icon;
  
  return (
    <article className="group relative">
      <Link 
        href={available ? href : '#'}
        className={cn(
          "block p-6 rounded-lg border-2 transition-all duration-300",
          "bg-retro-surface",
          available 
            ? "border-gray-800 hover:border-neon-cyan hover:shadow-neon-cyan hover:-translate-y-1 cursor-pointer" 
            : "border-gray-900 opacity-50 cursor-not-allowed pointer-events-none"
        )}
        style={available ? { '--accent': accentColor } as React.CSSProperties : {}}
      >
        {/* Icon */}
        <div className="text-5xl mb-4">
          {IconComponent ? <IconComponent className="w-12 h-12" /> : icon}
        </div>
        
        {/* Title */}
        <h3 className="font-arcade text-sm mb-2 text-retro-text group-hover:text-neon-cyan transition-colors">
          {title}
        </h3>
        
        {/* Description */}
        <p className="font-terminal text-base text-retro-muted mb-4">
          {description}
        </p>
        
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map(tag => (
              <span 
                key={tag} 
                className="text-xs px-2 py-1 bg-gray-800 rounded font-terminal text-retro-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* CTA */}
        <div className="flex items-center gap-2 text-sm font-terminal">
          {available ? (
            <>
              <span className="text-neon-cyan">PLAY</span>
              <ArrowRight className="w-4 h-4 text-neon-cyan group-hover:translate-x-1 transition-transform" />
            </>
          ) : (
            <span className="text-retro-muted">COMING SOON</span>
          )}
        </div>
      </Link>
    </article>
  );
}
```

### 4.4 Crear `src/components/home/GamesGrid.tsx`

```tsx
import { Game } from '@/types/game';
import { GameCard } from './GameCard';
import { cn } from '@/lib/utils';

interface GamesGridProps {
  games: Game[];
  className?: string;
}

export function GamesGrid({ games, className }: GamesGridProps) {
  return (
    <div className={cn(
      "grid gap-6",
      "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      className
    )}>
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

### 4.5 Crear `src/components/home/Footer.tsx`

```tsx
import Link from 'next/link';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={`border-t border-gray-800 py-8 mt-16 ${className || ''}`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-retro-muted">
          <p className="font-terminal">
            © 2026 Metro Minute. Built with ❤️ and pixels.
          </p>
          
          <div className="flex items-center gap-6">
            <Link 
              href="https://github.com/Rdecristobal/metrominute"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-retro-text transition-colors font-terminal"
            >
              GITHUB
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

### 4.6 Crear index barrel export `src/components/home/index.ts`

```typescript
export { RetroBackground } from './RetroBackground';
export { Header } from './Header';
export { GameCard } from './GameCard';
export { GamesGrid } from './GamesGrid';
export { Footer } from './Footer';
```

---

## Fase 5: Migrar Juego Actual (20 min)

### 5.1 Mover `/game` a `/bubble`

```bash
# Crear directorio bubble
mkdir -p src/app/bubble

# Mover archivo
mv src/app/game/page.tsx src/app/bubble/page.tsx

# Eliminar directorio vacío
rmdir src/app/game
```

### 5.2 Crear `src/components/game/BackToHub.tsx`

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

### 5.3 Actualizar `src/app/bubble/page.tsx`

```tsx
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GameBoard from "@/components/game/GameBoard";
import { BackToHub } from "@/components/game/BackToHub";

function GameContent() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const mode = (modeParam as 'classic' | 'normal' | null);

  return (
    <>
      <BackToHub />
      <GameBoard mode={mode || undefined} />
    </>
  );
}

export default function BubblePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-retro-dark">
        <p className="font-terminal text-retro-muted">Loading...</p>
      </div>
    }>
      <GameContent />
    </Suspense>
  );
}
```

---

## Fase 6: Crear Nueva Home (30 min)

### 6.1 Reemplazar `src/app/page.tsx`

```tsx
import { Header, GamesGrid, RetroBackground, Footer } from '@/components/home';
import { GAMES } from '@/lib/games';

export default function Home() {
  return (
    <main className="min-h-screen relative">
      <RetroBackground />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        
        <section className="flex-1 container mx-auto px-4 py-16">
          {/* Hero */}
          <div className="text-center mb-16 animate-fade-in-up">
            <h1 className="font-arcade text-3xl md:text-4xl lg:text-5xl mb-4 text-retro-text tracking-wider">
              METRO MINUTE
            </h1>
            <p className="font-terminal text-lg md:text-xl text-retro-muted max-w-md mx-auto leading-relaxed">
              Your daily dose of arcade games.
              <br />
              Pick a game. Play. Beat your score.
            </p>
          </div>
          
          {/* Games Grid */}
          <GamesGrid games={GAMES} />
          
          {/* Coming Soon Teaser */}
          <div className="text-center mt-16">
            <p className="font-terminal text-sm text-retro-muted animate-pulse">
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

## Fase 7: Verificar y Testear (30 min)

### 7.1 Checklist de Verificación

```bash
# Compilar proyecto
npm run build

# Verificar errores
# Si hay errores, revisar imports y tipos
```

### 7.2 Test Local

```bash
# Iniciar servidor de desarrollo
npm run dev

# Abrir en navegador
# http://localhost:3000
```

### 7.3 Tests Funcionales

**Home Page (`/`)**
- [ ] Carga sin errores
- [ ] Fuentes Press Start 2P y VT323 cargan
- [ ] Fondo con grid visible
- [ ] Logo "METRO MINUTE" visible
- [ ] Tarjeta "Bubble" visible
- [ ] Hover en tarjeta funciona (glow + lift)
- [ ] Click en "Bubble" lleva a `/bubble`
- [ ] Link "Leaderboard" funciona
- [ ] Footer visible con link a GitHub

**Bubble Page (`/bubble`)**
- [ ] Carga sin errores
- [ ] Botón "BACK TO HUB" visible
- [ ] Click en "BACK TO HUB" lleva a `/`
- [ ] Juego funciona como antes

**Responsive**
- [ ] Mobile: 1 columna
- [ ] Tablet: 2 columnas
- [ ] Desktop: 3 columnas
- [ ] Header se adapta
- [ ] Texto legible en todos los tamaños

---

## Fase 8: Deploy (15 min)

### 8.1 Commit y Push

```bash
# Ver cambios
git status

# Añadir archivos
git add .

# Commit
git commit -m "feat: Transform Metro Minute into arcade hub with retro home

- Create new home page with retro/arcade aesthetic
- Rename /game to /bubble (Bubble game)
- Add Press Start 2P and VT323 fonts
- Add neon color palette and retro effects
- Create reusable components (GameCard, Header, etc.)
- Add 'Back to Hub' button in Bubble game
- Maintain backward compatibility with existing game"

# Push a branch
git push origin feature/metro-minute-hub
```

### 8.2 Crear PR en GitHub

```bash
# Usando gh CLI
gh pr create \
  --title "feat: Metro Minute Arcade Hub" \
  --body "Transforms Metro Minute into a retro arcade hub with multiple games support.

## Changes
- New home page with retro/arcade aesthetic
- Renamed /game to /bubble
- Added retro fonts and neon color scheme
- Created reusable components
- Added navigation between hub and games

## Testing
- [x] Local testing passed
- [x] Responsive design verified
- [x] All links working
- [x] Game functionality preserved

Closes #issue-number"
```

### 8.3 Merge y Deploy

Después de revisar el PR:
1. Merge a main
2. Vercel auto-deployará
3. Verificar en https://metrominute.vercel.app

---

## Rollback Plan

Si algo sale mal después del deploy:

```bash
# Revertir commit
git revert HEAD

# O volver al backup
git checkout main
git checkout src/app/page.tsx.backup src/app/page.tsx

# Force push si es necesario
git push origin main --force
```

---

## Notas Post-Migración

### Actualizaciones Necesarias en Otros Lugares

1. **README.md:** Actualizar descripción del proyecto
2. **Metadata:** Verificar SEO tags en layout.tsx
3. **Analytics:** Si hay tracking, verificar eventos
4. **Social cards:** Actualizar Open Graph images si existen

### Próximos Pasos (Futuro)

1. Añadir más juegos al catálogo
2. Implementar sistema de puntuaciones global
3. Añadir logros/achievements
4. Crear página "About" con créditos

---

**Tiempo Total Estimado:** 4-5 horas

**Orden de Implementación Recomendado:**
1. Fase 1-2: Setup y estilos base
2. Fase 3-4: Componentes
3. Fase 5-6: Páginas
4. Fase 7-8: Testing y deploy

---

**Fin del documento**
