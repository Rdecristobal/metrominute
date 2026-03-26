# Design-001: Wireframes y Referencias Visuales

**Fecha:** 2026-03-26
**Relacionado con:** arch-001-metro-minute-home.md, api-001-component-specs.md
**Propósito:** Guía visual para implementación

---

## 1. Layout General - Desktop

```
┌──────────────────────────────────────────────────────────────────────┐
│  HEADER (sticky)                                                     │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  ◉ METRO MINUTE                              [LEADERBOARD]    │  │
│  │     Arcade Hub                                                  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  HERO SECTION                                                         │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                                                                  │  │
│  │                    ╔═══════════════════╗                        │  │
│  │                    ║   METRO MINUTE   ║  (Press Start 2P)      │  │
│  │                    ╚═══════════════════╝                        │  │
│  │                                                                  │  │
│  │          Your daily dose of arcade games.                       │  │
│  │          Pick a game. Play. Beat your score.                    │  │
│  │                       (VT323)                                   │  │
│  │                                                                  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  GAMES GRID (3 columnas)                                             │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐     │
│  │                  │ │                  │ │                  │     │
│  │       🎯         │ │       🐍         │ │       🧠         │     │
│  │                  │ │                  │ │                  │     │
│  │     BUBBLE       │ │     SNAKE        │ │     MEMORY       │     │
│  │                  │ │                  │ │                  │     │
│  │  Test your       │ │  Classic snake   │ │  Match pairs     │     │
│  │  reflexes...     │ │  with a twist    │ │  and train...    │     │
│  │                  │ │                  │ │                  │     │
│  │  [reflex]        │ │  [arcade]        │ │  [puzzle]        │     │
│  │                  │ │                  │ │                  │     │
│  │  PLAY →          │ │  COMING SOON     │ │  COMING SOON     │     │
│  │                  │ │                  │ │                  │     │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘     │
│     (disponible)        (deshabilitado)      (deshabilitado)          │
│                                                                       │
│  TEASER                                                               │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │              More games coming soon...                          │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  FOOTER                                                               │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  © 2026 Metro Minute. Built with ❤️ and pixels.    [GitHub]   │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layout General - Mobile

```
┌────────────────────────┐
│  ◉ METRO MINUTE        │
└────────────────────────┘

┌────────────────────────┐
│                        │
│    METRO MINUTE        │
│                        │
│  Your daily dose of    │
│  arcade games.         │
│                        │
└────────────────────────┘

┌────────────────────────┐
│         🎯             │
│                        │
│       BUBBLE           │
│                        │
│  Test your reflexes    │
│  before time runs      │
│  out.                  │
│                        │
│  [reflex] [casual]     │
│                        │
│  PLAY →                │
└────────────────────────┘

┌────────────────────────┐
│         🐍             │
│                        │
│       SNAKE            │
│                        │
│  Classic snake game    │
│  with modern twist.    │
│                        │
│  [arcade]              │
│                        │
│  COMING SOON           │
└────────────────────────┘

┌────────────────────────┐
│  More games coming     │
│  soon...               │
└────────────────────────┘

┌────────────────────────┐
│  © 2026 Metro Minute   │
│  [GitHub]              │
└────────────────────────┘
```

---

## 3. GameCard - Estados

### Default
```
┌──────────────────────────┐
│                          │
│          🎯              │
│                          │
│        BUBBLE            │
│                          │
│   Test your reflexes     │
│   before time runs out   │
│                          │
│   [reflex] [casual]      │
│                          │
│   PLAY →                 │
│                          │
└──────────────────────────┘
  Borde: gray-800
  Fondo: retro-surface
```

### Hover (disponible)
```
┌──────────────────────────┐
│╔════════════════════════╗│
│║                        ║│
│║         🎯             ║│
│║                        ║│
│║       BUBBLE           ║│ ← Cyan glow
│║                        ║│
│║  Test your reflexes    ║│
│║  before time runs out  ║│
│║                        ║│
│║  [reflex] [casual]     ║│
│║                        ║│
│║  PLAY →                ║│
│║                        ║│
│╚════════════════════════╝│
└──────────────────────────┘
  Borde: neon-cyan
  Shadow: glow cyan
  Transform: translateY(-4px)
```

### Coming Soon
```
┌──────────────────────────┐
│                          │
│          🐍              │
│         (50% opacity)    │
│        SNAKE             │
│                          │
│   Classic snake game     │
│   with modern twist.     │
│                          │
│   [arcade]               │
│                          │
│   COMING SOON            │
│   (gray, sin flecha)     │
│                          │
└──────────────────────────┘
  Opacity: 0.5
  Cursor: not-allowed
  Sin hover effects
```

---

## 4. Paleta de Colores Visual

### Fondo y Superficies

```
┌─────────────────────────────────────┐
│ RETRO BLACK                         │
│ #000000                             │
│ ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■  │
│ Uso: Fondo base                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ RETRO DARK                          │
│ #0a0a0a                             │
│ ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■  │
│ Uso: Fondo principal                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ RETRO SURFACE                       │
│ #1a1a1a                             │
│ ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■  │
│ Uso: Cards, superficies             │
└─────────────────────────────────────┘
```

### Colores Neón (Acentos)

```
┌─────────────────────────────────────┐
│ NEON CYAN                           │
│ #00fff7                             │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│ Uso: Bubble, links activos          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ NEON MAGENTA                        │
│ #ff00ff                             │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│ Uso: Memory, acentos especiales     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ NEON GREEN                          │
│ #39ff14                             │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│ Uso: Snake, estados de éxito        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ NEON YELLOW                         │
│ #ffff00                             │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│ Uso: Warnings, highlights           │
└─────────────────────────────────────┘
```

### Texto

```
┌─────────────────────────────────────┐
│ RETRO TEXT                          │
│ #e0e0e0                             │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│ Uso: Títulos, texto principal       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ RETRO MUTED                         │
│ #888888                             │
│ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  │
│ Uso: Descripciones, secundario      │
└─────────────────────────────────────┘
```

---

## 5. Tipografía - Ejemplos

### Press Start 2P (Arcade)

```
╔════════════════════════════════════╗
║                                    ║
║  METRO MINUTE                      ║  ← 48px (text-5xl)
║  ████████ ███                      ║
║                                    ║
║  BUBBLE                            ║  ← 18px (text-lg)
║  ██████                            ║
║                                    ║
║  PLAY                              ║  ← 14px (text-sm)
║  ████                              ║
║                                    ║
╚════════════════════════════════════╝

Uso: Títulos principales, nombres de juegos, CTAs
```

### VT323 (Terminal)

```
┌──────────────────────────────────────┐
│                                      │
│  Your daily dose of arcade games.    │  ← 20px (text-lg)
│                                      │
│  Test your reflexes before time      │  ← 16px (text-base)
│  runs out.                           │
│                                      │
│  [LEADERBOARD]  [GITHUB]             │  ← 14px (text-sm)
│                                      │
│  More games coming soon...           │  ← 14px (text-sm)
│                                      │
└──────────────────────────────────────┘

Uso: Descripciones, navegación, texto secundario
```

### Geist Sans (Body)

```
┌──────────────────────────────────────┐
│                                      │
│  © 2026 Metro Minute.                │  ← 14px (text-sm)
│  Built with ❤️ and pixels.           │
│                                      │
└──────────────────────────────────────┘

Uso: Footer, texto legal, contenido general
```

---

## 6. Efectos Visuales

### Glow Neón (CSS)

```
Normal:
  TEXTO
   │
   └─ Sin glow

Con Glow:
   ╔════════╗
   ║ TEXTO  ║
   ╚════════╝
    │      │
    └──────┴─ Glow cyan扩散

text-shadow: 
  0 0 5px #00fff7,
  0 0 10px #00fff7,
  0 0 20px #00fff7;
```

### Pixel Border

```
┌───────────────────┐  ← Borde exterior (4px)
│ ╔═══════════════╗ │
│ ║               ║ │  ← Inset shadow clara
│ ║   CONTENIDO   ║ │
│ ║               ║ │  ← Inset shadow oscura
│ ╚═══════════════╝ │
└───────────────────┘

box-shadow:
  inset 4px 4px 0 rgba(255,255,255,0.1),
  inset -4px -4px 0 rgba(0,0,0,0.3);
```

### Scanlines (Opcional)

```
┌──────────────────────────┐
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ │
│                          │
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ │
│                          │
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ │
│                          │
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ │
└──────────────────────────┘

Líneas horizontales cada 2px
Opacidad: 10-15%
```

---

## 7. Fondo con Grid

```
┌────────────────────────────────────────────────────────┐
│ .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  │
│                                                        │
│ .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  │
│                                                        │
│ .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  │
│                                                        │
│ .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  │
│                                                        │
│ .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  │
│                                                        │
│ .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  │
└────────────────────────────────────────────────────────┘

Grid: 50px x 50px
Color: cyan con 10% opacidad
Fondo base: gradiente negro
Glow radial: cyan muy sutil en centro superior
```

---

## 8. Flujo de Navegación

```
┌─────────────┐
│   HOME (/)  │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌──────────────┐
│   /bubble   │   │ /leaderboard │
│  (Bubble)   │   │              │
└──────┬──────┘   └──────────────┘
       │
       │ [BACK TO HUB]
       │
       ▼
┌─────────────┐
│   HOME (/)  │
└─────────────┘
```

---

## 9. Referencias de Inspiración

### Estilo Visual
- **Arcade 80s:** Tron, neon, grid lines
- **Retro gaming:** Pixel art, limited color palette
- **Cyberpunk:** Neon lights, dark backgrounds
- **Terminal/CLI:** Monospace fonts, green/cyan text

### Ejemplos de Referencia
- **Pac-Man championship:** Neon sobre negro
- **Tron Legacy:** Grid lines + glow
- **Arcade cabinets:** Bold typography, high contrast

### Lo que EVITAR
- ❌ Gradientes coloridos modernos
- ❌ Sombras suaves realistas
- ❌ Bordes redondeados excesivos
- ❌ Animaciones complejas
- ❌ Colores pastel

---

## 10. Animaciones

### Fade In Up (Entrada de tarjetas)

```
Frame 0 (0ms):
  ┌──────────────┐
  │              │
  │   Tarjeta   │  opacity: 0
  │              │  translateY: 20px
  └──────────────┘

Frame 1 (250ms):
  ┌──────────────┐
  │              │
  │   Tarjeta   │  opacity: 0.5
  │              │  translateY: 10px
  └──────────────┘

Frame 2 (500ms):
  ┌──────────────┐
  │              │
  │   Tarjeta   │  opacity: 1
  │              │  translateY: 0
  └──────────────┘

Delay por tarjeta: 100ms (stagger effect)
```

### Hover Lift

```
Normal:
  ┌──────────────┐
  │              │
  │   Tarjeta   │
  │              │
  └──────────────┘

Hover:
                  ┌──────────────┐
                  │              │
                  │   Tarjeta   │  translateY: -4px
                  │              │  shadow: glow
                  └──────────────┘
```

---

## 11. Responsive Breakpoints

### Mobile (< 640px)
```
┌──────────────────────┐
│                      │
│  1 columna           │
│  Tarjeta full-width  │
│  Padding: 16px       │
│                      │
└──────────────────────┘
```

### Tablet (640px - 1024px)
```
┌───────────────────────────────────┐
│                                   │
│  2 columnas                       │
│  Gap: 24px                        │
│  Padding: 24px                    │
│                                   │
└───────────────────────────────────┘
```

### Desktop (> 1024px)
```
┌─────────────────────────────────────────────┐
│                                             │
│  3 columnas                                 │
│  Gap: 24px                                  │
│  Max-width: 1280px                          │
│  Padding: 32px                              │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 12. Iconos y Emojis

### Juegos Actuales/Futuros

| Juego | Emoji | Icono Lucide | Color Neón |
|-------|-------|--------------|------------|
| Bubble | 🎯 | Target | Cyan |
| Snake | 🐍 | (custom) | Green |
| Memory | 🧠 | Brain | Magenta |
| Tetris | 🧱 | Box | Yellow |
| Pong | 🏓 | Circle | Cyan |

### UI Icons

| Uso | Icono Lucide |
|-----|--------------|
| Play/Go | ArrowRight |
| Back | ArrowLeft |
| Leaderboard | Trophy |
| Settings | Settings |
| Close | X |

---

## 13. Espaciado

### Sistema de Espaciado (Tailwind)

```
Space 4  = 16px  → Gap pequeño, padding interno
Space 6  = 24px  → Gap entre tarjetas
Space 8  = 32px  → Padding de secciones
Space 12 = 48px  → Separación de bloques
Space 16 = 64px  → Hero spacing
```

### Aplicación

```
┌─────────────────────────────────────┐
│           padding: 32px             │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │      padding: 24px            │  │
│  │                               │  │
│  │   ┌─────────────────────┐     │  │
│  │   │ padding: 16px       │     │  │
│  │   │                     │     │  │
│  │   └─────────────────────┘     │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  gap: 24px (entre tarjetas)         │
│                                     │
└─────────────────────────────────────┘
```

---

**Fin del documento**
