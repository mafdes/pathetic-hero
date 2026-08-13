# Pathetic Hero 🗡️

> *Un RPG satírico medieval donde el aspirante a héroe fracasa estrepitosamente en las pruebas de admisión del Gremio. Pixel art retro estilo SNES/Mega Drive.*

---

## Descripción

**Pathetic Hero** es un RPG satírico con estética pixel art retro (320×180, escala ×3) construido sobre **Phaser 4** + **Vite**. El jugador encarna a un aspirante que debe superar (o fracasar) las 5 pruebas de admisión del Gremio de Héroes para ser asignado a una clase épica... o ridícula.

Este proyecto es la evolución de [heroic-failure](../heroic-failure), el prototipo inicial en HTML/CSS vanilla.

---

## Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| [Phaser 4](https://phaser.io) | ^4.2.1 | Motor de juego (WebGL/Canvas) |
| [Vite](https://vitejs.dev) | ^5.4.0 | Bundler + dev server con HMR |
| [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) | — | Tipografía pixel art |

---

## Requisitos

- **Node.js** 18+ (recomendado 20 LTS)
- **npm** 9+

---

## Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (abre el navegador automáticamente en localhost:3000)
npm run dev

# O usar el script de lanzamiento:
./dev.sh
```

### Comandos disponibles

```bash
npm run dev      # Dev server con HMR en localhost:3000
npm run build    # Build de producción en /dist
npm run preview  # Previsualizar el build de producción
```

---

## Estructura del Proyecto

```
pathetic-hero/
├── index.html                   # Entry point HTML
├── vite.config.js               # Configuración de Vite
├── package.json
├── dev.sh                       # Script de lanzamiento local
├── public/
│   └── assets/
│       ├── images/              # Sprites, fondos, tilesets (placeholders IA)
│       ├── audio/               # Música 8-bit y SFX (por añadir)
│       └── fonts/               # Fuentes pixel adicionales
└── src/
    ├── main.js                  # Bootstrap Phaser 4
    ├── utils/
    │   ├── constants.js         # Paleta de colores, escenas, timing
    │   └── helpers.js           # Utilidades (nombres, veredictos, etc.)
    ├── systems/
    │   ├── CharacterSheet.js    # Ficha del personaje (atributos, clase)
    │   ├── InputManager.js      # Abstracción teclado/ratón/táctil
    │   ├── SaveManager.js       # Persistencia en localStorage
    │   └── AudioManager.js      # Control de música y SFX
    ├── ui/
    │   ├── DialogBox.js         # Cuadro de diálogo RPG con typewriter
    │   └── PixelButton.js       # Botón reutilizable con cursor ►
    └── scenes/
        ├── BootScene.js         # Espera carga de fuentes
        ├── PreloadScene.js      # Carga assets con barra de progreso
        ├── IntroScene.js        # Créditos typewriter (narrativa sarcástica)
        ├── MainMenuScene.js     # Menú principal
        ├── OptionsScene.js      # Configuración de audio
        ├── ControlsScene.js     # Selección de controles (auto en móvil)
        ├── GuildReportScene.js  # Expediente de admisión (5 pruebas)
        └── challenges/
            ├── DexterityScene.js    # ✅ IMPLEMENTADA — Barra de precisión
            ├── ConstitutionScene.js # 🔜 Medidor de pulso rítmico
            ├── StrengthScene.js     # 🔜 Carga y soltado
            ├── AgilityScene.js      # 🔜 Barriles cayendo (3 carriles)
            └── IntelligenceScene.js # 🔜 Archivista Corrupto (Simon Says)
```

---

## Las 5 Pruebas del Gremio

| Prueba | Mecánica | Estado |
|---|---|---|
| **Destreza** | Barra de precisión con zona dorada en movimiento | ✅ Implementada |
| **Constitución** | Medidor de pulso: pulsaciones rítmicas | 🔜 Próxima |
| **Fuerza** | Carga y soltado en zona exacta | 🔜 Próxima |
| **Agilidad** | Esquivar barriles en 3 carriles | 🔜 Próxima |
| **Inteligencia** | Simon Says con trampas (El Archivista Corrupto) | 🔜 Próxima |

---

## Controles

| Dispositivo | Navegación | Acción |
|---|---|---|
| **Teclado** | ↑↓ / WASD | Enter / Z / Espacio |
| **Ratón** | Hover | Click |
| **Táctil** | — | Tap (detección automática) |

---

## Roadmap

### V0.1 — Scaffolding + Destreza ✅
- Proyecto Vite + Phaser 4 configurado
- Intro, menú, opciones, selección de controles
- Expediente del Gremio con save/load
- Prueba de Destreza jugable (20 niveles)

### V0.2 — Las 5 Pruebas 🎯
- Constitución, Fuerza, Agilidad, Inteligencia
- Selección de clase (normal vs. absurda según puntuación)

### V0.3 — RPG 2D 🗺️
- Tilemap con mazmorra estilo Zelda (Arcade Physics)
- Movimiento 4 direcciones + colisiones
- Enemigos con pathfinding básico
- Diálogos satíricos y comprobaciones de atributos
- Cofres, llaves, combate directo

---

## Assets

Los fondos e imágenes actuales son **placeholders generados por IA**. Se irán sustituyendo por pixel art original. Las rutas están en `public/assets/images/`.

Fuentes recomendadas para assets adicionales:
- [OpenGameArt.org](https://opengameart.org) — Arte 2D RPG libre
- [Itch.io Fantasy Assets](https://itch.io/game-assets/free/tag-fantasy)

---

## Paleta de Colores

```
Fondo oscuro:    #0d0613   Dorado:         #d4a017
Fondo profundo:  #1a0a2e   Pergamino:      #c8a97a
Piedra:          #3d3d6b   Texto:          #f0e6d3
Verde éxito:     #2d6a4f   Rojo peligro:   #c42b1c
Púrpura mágico:  #7b2d8b
```

---

## Créditos

Basado en el prototipo [heroic-failure](../heroic-failure).

*El fracaso no es una pantalla de error; es la esencia del juego.*
