# TANKS — Documento Funcional (Extraído del PDF)

## Proyecto: MetroMinute Hub → Juego "Tanks"
## Stack: Next.js + TypeScript + Canvas API + Tailwind
## Orientación: Landscape obligatorio (móvil horizontal)

---

## 1. Resumen del juego

Tanks es un juego de artillería por turnos en 2D. Se genera un terreno irregular aleatorio, se colocan tanques sobre él, y los jugadores se turnan para disparar proyectiles ajustando ángulo y potencia. Los proyectiles siguen trayectoria parabólica con gravedad y viento. Al impactar, explotan, deforman el terreno y destruyen tanques cercanos. Gana el último tanque en pie.

---

## 2. Pantallas y flujo de navegación

### 2.1 Pantalla: Menú principal

- Fondo: #0a0a0f con gradiente radial sutil rosa rgba(255,45,120,0.08) en el centro superior.
- Título "TANKS" grande, gradiente de texto #ff2d78 → #ff6b00 → #ffdd00, font-weight 900, font-family monospace.
- Subtítulo "ARTILLERY WARFARE" en #555, tracking 4px.
- Dos botones apilados verticalmente, ancho min(280px, 80vw):
  - "▶ VS AI" — borde #ff2d7844, texto #ff2d78.
  - "▶ LOCAL MULTIPLAYER" — borde #00e5ff44, texto #00e5ff.
- Texto de ayuda al pie: "Drag to aim · Swipe up/down for power · Tap FIRE to shoot" en #333, 10px.

Flujo:
```
MENÚ PRINCIPAL
├── VS AI → SETUP (elegir nº tanques) → PARTIDA → GAME OVER
└── LOCAL MULTIPLAYER → SETUP (elegir nº tanques) → PARTIDA → GAME OVER
    ├── REMATCH → PARTIDA
    └── MENÚ
```

### 2.2 Pantalla: Setup

- Título del modo seleccionado: "VS AI" en #ff2d78 o "LOCAL MULTIPLAYER" en #00e5ff.
- Texto "How many tanks?" en #666.
- Fila de botones numéricos: 2, 3, 4, 5, 6.
  - Seleccionado: fondo sólido del color del modo, texto negro.
  - No seleccionados: fondo #1a1a2e, texto #666.
- Botón "START BATTLE" con fondo del color del modo, texto negro, border-radius 8px.
- Link "← BACK" debajo, texto #444.

### 2.3 Pantalla: Partida (game screen)

Layout vertical dividido en tres franjas:

| Zona | Altura | Contenido |
|------|--------|-----------|
| HUD superior | 44px fija | Nombre del tanque activo (en su color), ángulo, potencia, botón FIRE |
| Canvas | Flex (ocupa todo el espacio restante) | Terreno, tanques, proyectiles, explosiones, indicador de viento |
| Barra de estado | 32px fija | Indicadores de todos los tanques (cuadradito de color + nombre, opacidad 0.25 si muerto) |

**HUD superior:**
- Fondo #0f0f18, borde inferior 1px solid #1a1a2e.
- Izquierda: nombre del tanque activo (su color, bold, 13px), "ANG {x}°" y "PWR {x}%" en #555, 11px.
- Derecha: botón "FIRE" solo visible si es turno de jugador humano. Fondo = color del tanque, texto negro, border-radius 6px.
- Si es turno de la IA: texto "AI thinking…" en #555 itálica.

**Barra de estado inferior:**
- Fondo #0f0f18, borde superior 1px solid #1a1a2e.
- Fila centrada de indicadores por cada tanque: cuadrado 8×8px del color del tanque + nombre en 9px.
- Tanque activo: box-shadow: 0 0 6px {color} y font-weight 700.
- Muertos: opacidad 0.25.

**Canvas — texto superpuesto:**
- Hint táctil en la parte inferior central: "Drag ← → to aim · Drag ↑ ↓ for power", solo visible durante turno de jugador humano. Color #333, 10px, pointer-events: none.

### 2.4 Pantalla: Game Over

- Fondo #0a0a0f con gradiente radial del color del ganador al 15% opacidad.
- Texto "{NOMBRE} WINS!" en el color del ganador, font-weight 900, 36px.
- Si no hay ganador: "DRAW!" en #ff2d78.
- Dos botones: "REMATCH" (color del ganador) y "MENU" (#666), mismo estilo que menú principal.

---

## 3. Generación de terreno

### 3.1 Algoritmo

- Array de puntos {x, y} generado por superposición de ondas sinusoidales.
- Segmentos: 60 puntos equidistantes.
- Línea base Y: height * 0.55.
- Phase aleatorio: Math.random() * Math.PI * 2.
- Ondas superpuestas (4 capas):

| Capa | Frecuencia | Amplitud |
|------|-----------|----------|
| Colinas grandes | 1.0 | height * 0.12 |
| Colinas medianas | 2.3 | height * 0.07 |
| Rugosidad fina | 5.1 | height * 0.03 |
| Ondulación lenta | 0.4 | height * 0.08 |

- Zonas llanas: 15% probabilidad, copia Y del punto anterior. Solo entre segmentos 3 y 57.
- Clamp: ningún punto por encima de height * 0.2 ni por debajo de height * 0.85.

### 3.2 Interpolación

Lineal entre los dos puntos que contienen X.

### 3.3 Ángulo del terreno

atan2(y(x+3) - y(x-3), 6)

### 3.4 Deformación por impacto

Puntos dentro del radio (35px) se desplazan hacia abajo: factor = (1 - distancia/radio), desplazamiento Y = factor * radio * 0.5.

---

## 4. Tanques

### 4.1 Dimensiones

| Elemento | Medida |
|----------|--------|
| Cuerpo | 30px ancho × 16px alto, border-radius [4,4,0,0] |
| Orugas | 34px × 8px debajo del cuerpo, border-radius 3, color #222 |
| Torreta | Semicírculo radio 9px sobre el cuerpo |
| Cañón | 5px ancho × 22px largo, sale del centro de la torreta |
| Boca del cañón | 7px × 5px en el extremo |

Colores (8): #ff2d78, #00e5ff, #ffdd00, #7cff00, #ff6b00, #b44dff, #ff4444, #00ffa3
Nombres: Alpha, Bravo, Charlie, Delta, Echo, Foxtrot, Golf, Hotel

### 4.2 Colocación inicial

- Margen lateral: 8% del ancho.
- Espaciado equitativo entre (nº tanques + 1) posiciones.
- Jitter aleatorio ±15% del espaciado.
- Izquierda: ángulo -60°. Derecha: -120°.
- Potencia inicial: 50%.

### 4.3 Indicador de tanque activo

- Rectángulo brillante con shadowBlur: 15.
- Flecha triangular apuntando hacia abajo encima del nombre.

### 4.4 Nombre visible

- Bold 10px Courier New monospace, color del tanque.
- Más arriba si está activo.

---

## 5. Sistema de disparo

### 5.1 Controles táctiles

- Arrastrar horizontal (← →): cambia ángulo. Sensibilidad: deltaX * 0.5 grados.
- Arrastrar vertical (↑ ↓): cambia potencia. Sensibilidad: -deltaY * 0.3.
- Tap botón FIRE: dispara.
- Ángulo: -175° a -5°. Potencia: 10% a 100%.
- Soportar touch + mouse.

### 5.2 Línea de trayectoria estimada

- Solo para jugadores humanos.
- setLineDash([3, 6]).
- 40 pasos de la trayectoria.
- Color: {color}44 (27% opacidad).

### 5.3 Física del proyectil

- Velocidad = potencia * 0.12.
- vx = cos(ángulo) * velocidad, vy = sin(ángulo) * velocidad.
- Cada frame: vx += viento * 0.002, vy += 0.15 (gravedad), x += vx, y += vy.
- Trail: array de últimas 50 posiciones.

### 5.4 Detección de impacto

Colisiona si:
- y >= terrainY(x)
- x < 0 o x > ancho del canvas
- y > alto del canvas + 50

Al colisionar:
1. Explosión en punto de impacto.
2. Deformar terreno.
3. Tanques dentro del radio (35px) mueren → segunda explosión en su posición.
4. Recalcular Y de tanques vivos.
5. Fase → "exploding".

---

## 6. Explosiones

- Posición (x, y), contador 0 a 45 frames.
- 20 partículas: dirección aleatoria, tamaño 1-4px, color rojo/naranja (r: 200-255, g: 0-150, b: 0), vida 0.5-1.0.
- Gradiente radial: blanco → naranja → rojo → transparente.
- Radio crece y decrece (sinusoidal). Opacidad decrece linealmente.
- Partículas se mueven hacia fuera con gravedad.
- Transición de turno cuando todas las explosiones terminan (frame >= 45).

---

## 7. Viento

- Inicial: random entre -1.0 y +1.0.
- Cada turno: viento += random(-0.25, +0.25), clampeado a [-2, +2].
- Efecto: vx += viento * 0.002 por frame.
- Visual: texto "WIND" en #888 + flecha horizontal proporcional a |viento| * 25px, color #88aaff.

---

## 8. IA (modo VS AI)

- Tanque 0 (Alpha) = humano. Resto = IA.
- Espera ~75 frames (~1.2s) para simular pensamiento.
- Elige objetivo aleatorio vivo (no él mismo).
- Calcula tiro:
  - Ángulo base: atan2(dy, dx) hacia objetivo.
  - Lobbing: resta 20°-35°.
  - Potencia: distancia * 0.18 + random(-7, +7), clamp [25, 95].
  - Compensación viento: resta viento * 8 al ángulo.
  - Imprecisión: ±6° ángulo, ±5 potencia.
  - Ángulo final clamp [-170, -10], potencia [15, 100].
- Tras 300ms adicionales, dispara automáticamente.
- HUD muestra "AI thinking…" sin botón FIRE. Sin línea de trayectoria.

---

## 9. Modo Local Multiplayer

- Todos los tanques son humanos.
- Jugadores se pasan el dispositivo por turnos.
- HUD muestra tanque activo y color. FIRE siempre visible.

---

## 10. Turnos y victoria

- Orden por id (0, 1, 2…), saltando muertos.
- Viento varía tras cada turno.
- Victoria: 1 tanque vivo → gana. 0 vivos → DRAW.

---

## 11. Renderizado del canvas

### Fondo (cielo)
Gradiente: #0a0a0f → #111122 → #1a1a2e

### Estrellas
60 estrellas pseudoaleatorias (seed fijo = 42), mitad superior, radio 0.3-1.8px, opacidad 0.3-0.8.

### Terreno
Relleno gradiente: #2d5016 → #3a6b1e → #4a3520 → #2a1a0a. Línea superficie: #5a8a2a, 2px.

### Proyectil
Círculo blanco 3px, shadowColor #ff8800, shadowBlur 10. Trail: 50 puntos rgba(255,200,50, alpha).

### Orden de dibujado (por frame)
1. Cielo (gradiente + estrellas)
2. Terreno (relleno + línea)
3. Tanques (todos, activo con indicador)
4. Línea de trayectoria estimada (solo turno humano)
5. Proyectil + trail
6. Explosiones
7. Indicador de viento
8. Contador de tanques restantes (esquina superior derecha, #666, 10px)

---

## 12. Canvas y responsividad

El canvas ocupa 100% del ancho y alto de su contenedor. ResizeObserver para ajustar dimensiones.
