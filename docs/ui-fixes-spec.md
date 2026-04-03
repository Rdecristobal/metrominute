# UI Fixes Specification - Metro Minute

**Fecha:** 2026-03-27  
**Autor:** Arquitecto  
**Para:** FullStack (implementación)  
**Estado:** Listo para implementación en nuevas pantallas

---

## Executive Summary

Este documento especifica los patrones de UI que deben aplicarse **globalmente** en Metro Minute. Los fixes descritos ya están implementados en las 3 pantallas existentes (home, bubble, leaderboard). El objetivo es que **cualquier pantalla nueva** (ej: "Crear cuenta", "Perfil", "Settings") siga el mismo patrón desde el día uno.

---

## Problema 1: UI Inconsistente Entre Pantallas

### Estado Actual

✅ **RESUELTO** en las 3 páginas existentes:
- `/` (Home)
- `/bubble` (Game)
- `/leaderboard` (Leaderboard)

⚠️ **PENDIENTE** para futuras pantallas:
- Pantallas de autenticación (crear cuenta, login)
- Pantallas de usuario (perfil, settings)
- Cualquier nueva página que se agregue

### Patrón de Estilos Global

#### Estructura Obligatoria para TODA Página

```tsx
// ❌ INCORRECTO - No usar estilos shadcn/ui estándar
<main className="min-h-screen bg-zinc-50 dark:bg-black">
  <div className="container mx-auto p-4">
    {/* contenido */}
  </div>
</main>

// ✅ CORRECTO - Estructura retro consistente
import { RetroBackground } from '@/components/home';

export default function NuevaPagina() {
  return (
    <main className="min-h-screen relative">
      <RetroBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header (opcional) */}
        <header className="sticky top-0 z-50 border-b border-gray-800 bg-retro-dark/80 backdrop-blur-sm">
          {/* contenido del header */}
        </header>

        {/* Contenido principal */}
        <section className="flex-1 container mx-auto px-4 py-16">
          {/* contenido de la página */}
        </section>

        {/* Footer (opcional) */}
      </div>
    </main>
  );
}
```

#### Sistema de Colores Retro

| Uso | Clase Tailwind | Valor Hex | Cuándo Usar |
|-----|---------------|-----------|-------------|
| Fondo principal | `bg-retro-dark` | `#0a0a0a` | Background de página |
| Fondo de superficie | `bg-retro-surface` | `#1a1a1a` | Cards, modales, paneles |
| Texto principal | `text-retro-text` | `#e0e0e0` | Títulos, texto importante |
| Texto secundario | `text-retro-muted` | `#888888` | Subtítulos, descripciones |
| Borde estándar | `border-gray-800` | - | Dividers, borders sutiles |

#### Sistema Tipográfico

| Tipo | Clase | Fuente | Uso |
|------|-------|--------|-----|
| Arcade | `font-arcade` | Press Start 2P | Títulos principales, logos |
| Terminal | `font-terminal` | VT323 | Texto de UI, descripciones |

**Reglas:**
- Un solo `font-arcade` por página (título principal)
- `font-terminal` para todo el texto de UI
- NO usar las fuentes Geist estándar (geistSans, geistMono) en contenido visible

#### Colores de Acento (Neón)

| Color | Clase | Uso |
|-------|-------|-----|
| Cyan | `text-neon-cyan` | Acentos interactivos, links activos |
| Magenta | `text-neon-magenta` | Errores, advertencias |
| Yellow | `text-neon-yellow` | Highlights, scores |
| Green | `text-neon-green` | Success, victorias |

**Ejemplo de botón con neón:**
```tsx
<button className="font-terminal text-neon-cyan hover:text-white transition-colors">
  START GAME
</button>
```

### Solución para "Crear Cuenta" y Futuras Pantallas

#### Archivo: `src/app/auth/signup/page.tsx` (ejemplo)

```tsx
import { RetroBackground } from '@/components/home';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  return (
    <main className="min-h-screen relative">
      <RetroBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header consistente */}
        <header className="sticky top-0 z-50 border-b border-gray-800 bg-retro-dark/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 h-16 flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-retro-surface h-10 px-4 py-2 font-terminal text-retro-muted hover:text-retro-text"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              BACK
            </Link>
            <h1 className="font-arcade text-xl tracking-wider text-retro-text">
              CREATE ACCOUNT
            </h1>
          </div>
        </header>

        {/* Formulario */}
        <section className="flex-1 container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            {/* Título con animación */}
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="font-arcade text-2xl mb-4 text-retro-text tracking-wider">
                JOIN THE GAME
              </h2>
              <p className="font-terminal text-lg text-retro-muted leading-relaxed">
                Create your account to save scores and compete.
              </p>
            </div>

            {/* Formulario con estilos retro */}
            <form className="space-y-6">
              <div>
                <label className="block font-terminal text-sm text-retro-muted mb-2">
                  USERNAME
                </label>
                <input
                  type="text"
                  className="w-full bg-retro-surface border border-gray-800 rounded-md px-4 py-3 font-terminal text-retro-text placeholder:text-retro-muted/50 focus:border-neon-cyan focus:outline-none transition-colors"
                  placeholder="Enter username..."
                />
              </div>

              <div>
                <label className="block font-terminal text-sm text-retro-muted mb-2">
                  EMAIL
                </label>
                <input
                  type="email"
                  className="w-full bg-retro-surface border border-gray-800 rounded-md px-4 py-3 font-terminal text-retro-text placeholder:text-retro-muted/50 focus:border-neon-cyan focus:outline-none transition-colors"
                  placeholder="Enter email..."
                />
              </div>

              <div>
                <label className="block font-terminal text-sm text-retro-muted mb-2">
                  PASSWORD
                </label>
                <input
                  type="password"
                  className="w-full bg-retro-surface border border-gray-800 rounded-md px-4 py-3 font-terminal text-retro-text placeholder:text-retro-muted/50 focus:border-neon-cyan focus:outline-none transition-colors"
                  placeholder="Enter password..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-retro-surface border border-neon-cyan text-neon-cyan font-terminal text-lg py-3 rounded-md hover:bg-neon-cyan hover:text-retro-dark transition-all shadow-neon-cyan"
              >
                CREATE ACCOUNT
              </button>
            </form>

            {/* Link secundario */}
            <p className="text-center mt-8 font-terminal text-retro-muted">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-neon-cyan hover:underline">
                LOG IN
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
```

### Checklist para Nuevas Pantallas

Antes de hacer PR de una nueva pantalla, verificar:

- [ ] Estructura HTML con `<main>`, `<RetroBackground />`, y wrapper con `relative z-10`
- [ ] Fondo: `bg-retro-dark` (NO `bg-zinc-50`, `bg-black`, etc.)
- [ ] Título principal: `font-arcade` + `text-retro-text` + `tracking-wider`
- [ ] Texto de UI: `font-terminal` + `text-retro-muted` o `text-retro-text`
- [ ] Inputs/Selects: `bg-retro-surface` + `border-gray-800` + `font-terminal`
- [ ] Botones primarios: borde neón + hover que invierte colores
- [ ] Animación de entrada: `animate-fade-in-up` en contenedores principales
- [ ] Header con back button consistente (si aplica)

---

## Problema 2: Barra de Estado Visible en Móvil

### Estado Actual

✅ **RESUELTO** mediante configuración PWA

### Solución Implementada

La app Metro Minute es una **PWA (Progressive Web App)**, no una app nativa. La barra de estado se oculta cuando el usuario instala la app en su dispositivo.

#### Cómo Funciona

1. **Usuario accede desde navegador móvil** → Barra de estado VISIBLE (comportamiento normal del navegador)

2. **Usuario instala como PWA** → Barra de estado OCULTA (modo standalone)

#### Archivos de Configuración

##### `public/manifest.json`

```json
{
  "name": "Metro Minute",
  "short_name": "Metro Minute",
  "display": "standalone",
  "display_override": ["standalone", "fullscreen"],
  "orientation": "portrait",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a"
}
```

**Campos clave:**
- `display: "standalone"` → Oculta barra de direcciones y UI del navegador
- `display_override: ["standalone", "fullscreen"]` → Intenta fullscreen primero
- `theme_color: "#0a0a0a"` → Color de la barra de estado en transiciones

##### `src/app/layout.tsx`

```tsx
export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Metro Minute",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};
```

**Campos clave:**
- `appleWebApp.statusBarStyle: "black-translucent"` → Barra transparente en iOS
- `viewportFit: "cover"` → Contenido llega hasta el borde superior
- `userScalable: false` → Previene zoom accidental

##### `src/app/globals.css`

```css
/* Mobile optimization */
html, body {
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
}

/* Touch optimization */
* {
  touch-action: manipulation;
}
```

### Flujo de Instalación PWA

#### iOS (iPhone/iPad)

1. Abrir Metro Minute en Safari
2. Tap botón "Share" (cuadrado con flecha arriba)
3. Scroll down → "Add to Home Screen"
4. Tap "Add" en la esquina superior derecha
5. **Resultado:** App se abre en modo standalone SIN barra de estado

#### Android

1. Abrir Metro Minute en Chrome
2. Tap menú (tres puntos) → "Install app" o "Add to Home Screen"
3. Confirmar instalación
4. **Resultado:** App se abre en modo standalone SIN barra de estado

### Limitaciones Conocidas

1. **NO es posible ocultar la status bar en el navegador móvil directamente**
   - Es una restricción de seguridad de iOS/Android
   - Solo se oculta en modo PWA instalado

2. **En navegadores desktop**
   - La status bar nunca se oculta (no aplica)
   - El contenido es responsive

3. **Safe Area Insets en iOS**
   - Con `viewportFit: "cover"`, el contenido puede quedar detrás del notch
   - Solución: usar `env(safe-area-inset-top)` en CSS si es necesario

### Alternativa: Capacitor/React Native (NO RECOMENDADO)

Si en el futuro se requiere una **app nativa real** (App Store / Play Store), se podría migrar a:

- **Capacitor:** Wrapper nativo de la PWA actual
- **React Native + Expo:** Reescritura completa

**Pero esto NO es necesario para el caso de uso actual.** La PWA cumple el objetivo de modo inmersivo.

---

## Especificación de Implementación

### Para Pantallas Nuevas

#### Archivos a Crear/Modificar

| Acción | Archivo | Descripción |
|--------|---------|-------------|
| CREAR | `src/app/[nueva-ruta]/page.tsx` | Nueva página siguiendo el patrón |
| CREAR | `src/components/[feature]/` | Componentes específicos si es necesario |
| NO MODIFICAR | `public/manifest.json` | Ya está configurado |
| NO MODIFICAR | `src/app/layout.tsx` | Ya está configurado |
| NO MODIFICAR | `src/app/globals.css` | Ya tiene estilos retro |

#### Estructura de Directorios Sugerida

```
src/app/
├── page.tsx              # Home (✅ ya tiene patrón)
├── bubble/page.tsx       # Game (✅ ya tiene patrón)
├── leaderboard/page.tsx  # Leaderboard (✅ ya tiene patrón)
├── auth/
│   ├── signup/page.tsx   # NUEVO: Crear cuenta
│   ├── login/page.tsx    # NUEVO: Login
│   └── forgot-password/page.tsx  # NUEVO: Recuperar password
├── profile/
│   └── page.tsx          # NUEVO: Perfil de usuario
└── settings/
    └── page.tsx          # NUEVO: Configuración
```

### Testing de UI Consistente

#### Checklist Visual

1. **Fondo:**
   - [ ] Grid pattern visible (lÍneas cyan sutiles)
   - [ ] Radial glow en la parte superior
   - [ ] Degradado de negro a retro-dark

2. **Tipografía:**
   - [ ] Título principal en `font-arcade`
   - [ ] Texto de UI en `font-terminal`
   - [ ] Tamaños responsivos (text-xl md:text-2xl)

3. **Colores:**
   - [ ] Fondo oscuro consistente
   - [ ] Texto legible (contraste adecuado)
   - [ ] Acentos neón solo en elementos interactivos

4. **Interacciones:**
   - [ ] Hover states con transiciones suaves
   - [ ] Focus states con borde neón
   - [ ] Animación de entrada en carga de página

#### Testing Móvil

1. **En navegador móvil:**
   - [ ] No bounce en scroll
   - [ ] No zoom accidental
   - [ ] Touch responsive

2. **Como PWA instalada:**
   - [ ] Barra de estado OCULTA
   - [ ] Pantalla completa
   - [ ] Icono correcto en home screen
   - [ ] Splash screen con theme color

---

## Decisiones de Diseño

### Por qué PWA en lugar de App Nativa

| Factor | PWA | App Nativa |
|--------|-----|------------|
| **Desarrollo** | Un solo codebase (Next.js) | Dos codebases (iOS + Android) |
| **Distribución** | URL directa | App Store review process |
| **Updates** | Instantáneos | Días de review |
| **Costo** | $0 | $99/año (Apple) + $25 (Google) |
| **Status Bar** | Oculta en standalone | Oculta por defecto |
| **Performance** | Buena para juegos simples | Mejor para juegos 3D |

**Decisión:** Metro Minute es un hub de juegos arcade simples. No requiere las capacidades de una app nativa. PWA es suficiente y más mantenible.

### Por qué RetroBackground como Componente

**Alternativa considerada:** CSS global en `body`

**Razón de rechazo:**
- El fondo retro tiene capas (gradiente + grid + glow)
- Requiere z-index negativo
- Más fácil de mantener como componente reutilizable

**Beneficio actual:**
- Un solo punto de cambio si se modifica el fondo
- Consistencia garantizada al importar el componente

### Por qué Fuentes Google Fonts

**Alternativa considerada:** Fuentes locales

**Razón de elección:**
- Press Start 2P y VT323 son fuentes pixel art optimizadas
- Google Fonts las sirve con optimización automática
- No aumenta el bundle size del proyecto

---

## Referencias

### Archivos de Referencia (Implementación Actual)

- **Home:** `src/app/page.tsx` → Patrón base
- **Leaderboard:** `src/app/leaderboard/page.tsx` → Header + contenido
- **Bubble:** `src/app/bubble/page.tsx` → Layout mínimo
- **RetroBackground:** `src/components/home/RetroBackground.tsx` → Fondo
- **Tailwind Config:** `tailwind.config.ts` → Colores y fuentes
- **Global CSS:** `src/app/globals.css` → Estilos base

### Documentación Externa

- [Next.js PWA Docs](https://nextjs.org/docs/app/building-your-application/configuring/progressive-web-apps)
- [MDN: PWA Display Modes](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display)
- [Apple Human Interface Guidelines: Status Bars](https://developer.apple.com/design/human-interface-guidelines/status-bars)

---

## Próximos Pasos (Para FullStack)

1. **Crear pantalla de "Crear cuenta"** siguiendo el patrón de `leaderboard/page.tsx`
2. **Crear pantalla de "Login"** con el mismo patrón
3. **Verificar** que los inputs tienen estilos retro (no shadcn/ui estándar)
4. **Testear en móvil** como PWA instalada
5. **Documentar** cualquier ajuste necesario en este spec

---

**Fin del Documento**
