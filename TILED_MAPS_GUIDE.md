# 🗺️ Guía y Documentación de Mapas de Tiled — Pathetic Hero 🗡️

Este documento resume la arquitectura, la configuración de Tiled, el catálogo de assets y el flujo de trabajo para la creación de los **8 niveles de mazmorra** del juego.

---

## 📌 1. Visión General y Plan de Progresión (8 Niveles)

El juego utiliza **Phaser 4** con cámara **autocentrada en el personaje** (`this.cameras.main.startFollow`), lo que permite que los mapas crezcan progresivamente manteniendo el rendimiento y la fluidez.

| Nivel | Nombre / Bioma | Tamaño (Tiles) | Estado |
|---|---|---|---|
| **Nivel 1** | Planta B1 — Sala de Iniciación | **15 × 15** | ✅ Creado y Jugable |
| **Nivel 2** | Planta B2 — Archivos de la Cripta | **18 × 18** | 🔜 Próximo |
| **Nivel 3** | Planta B3 — Pasillos Oscuros | **22 × 22** | 📅 Planificado |
| **Nivel 4** | Planta B4 — Catacumbas de los Héroes | **25 × 25** | 📅 Planificado |
| **Nivel 5** | Planta B5 — Laboratorio Abandonado | **30 × 20** | 📅 Planificado |
| **Nivel 6** | Planta B6 — Prisión del Gremio | **35 × 25** | 📅 Planificado |
| **Nivel 7** | Planta B7 — Ala Prohibida Arcana | **40 × 30** | 📅 Planificado |
| **Nivel 8** | Planta B8 — Gran Mazmorra del Tribunal (Final) | **50 × 35** | 📅 Planificado |

---

## 🎨 2. Especificación del Tileset (`dungeon_tiles.png`)

* **Ubicación:** [`public/assets/tilesets/dungeon_tiles.png`](file:///Users/marcosfernandezsole/Documents/GitHub/pathetic-hero/public/assets/tilesets/dungeon_tiles.png)
* **Dimensiones Totales:** `256 × 256` px
* **Rejilla:** `8 × 8` casillas de **32 × 32 px** (Margen: `0`, Espaciado: `0`).
* **Visualizador Interactivo:** Abre [`tileset-viewer.html`](file:///Users/marcosfernandezsole/Documents/GitHub/pathetic-hero/tileset-viewer.html) en el navegador para inspeccionar cada casilla.

### Catálogo de GIDs (Índices de casillas en Tiled):
* **Suelos (TileLayer `Terreno`):**
  * `GID 1`: Vacío / Oscuridad (Fondo)
  * `GID 2`: Suelo de piedra púrpura estándar
  * `GID 3`: Suelo de piedra azul/cripta
  * `GID 4`: Suelo con grabado de runa
  * `GID 5`: Suelo agrietado
  * `GID 20`: Agua / Estanque
  * `GID 21`: Alfombra roja real
* **Paredes / Muros (TileLayer `Terreno` - Colisión Física):**
  * `GID 6`: Techo / Parte superior plana de muro
  * `GID 7`: Frente de pared de ladrillos
  * `GID 8`: Pared de ladrillos con antorcha de fuego
  * `GID 19`: Columna / Pilar de piedra
  * `GID 22`: Barril de madera
  * `GID 23`: Caja de madera

---

## 🛠️ 3. Reglas de Capas en Tiled

Para mantener el proyecto hiper-limpio, usamos una separación clara entre terreno estático y objetos dinámicos:

### Capa 1: `Terreno` (Tile Layer - Pincel de texturas)
* Aquí dibujas **solo** los bloques arquitectónicos estáticos: suelos, variaciones de baldosas, muros de piedra y antorchas.

### Capa 2: `Objetos` / `Encuentros y cosas` (Object Group - Rectángulos)
Aquí se colocan todos los rectángulos de **32 × 32 px** con sus tipos y nombres:

| Objeto / Tipo (`Type / Class`) | Nombre (`Name`) | Propiedades adicionales | Función en Phaser |
|---|---|---|---|
| `PlayerSpawn` / `Jugador` | `Jugador` | — | Posición de aparición del héroe al iniciar el mapa. |
| `Encounter` | Nombre del enemigo | `enemy` (string) = `"goblin"`, `"mago_novato"`, `"trasgo"`, `"goblin_alpha"` | Dispara el combate RPG contra enemigos. |
| `ItemKey` | `Llave` | — | Llave recogible que va al inventario y desaparece. |
| `Door` | `Puerta` | — | Puerta bloqueada que consume 1 llave para abrirse. |
| `Chest` | `Cofre` | — | Cofre con poción de salud (+5 PV). |
| `Trap` | `Trampa` | — | Trampa de cepo (Prueba de Destreza / -3 PV). |
| `Fountain` | `Fuente` | — | Fuente bendita que restaura +3 PV. |
| `Rune` | `Runa` | — | Runa mágica de prueba de Sabiduría. |
| `Stairs` | `Escaleras Salida` | — | Escaleras de meta que completan el nivel. |

---

## 📁 4. Estructura de Archivos del Proyecto

```
pathetic-hero/
├── tileset-viewer.html            # Visualizador gráfico interactivo del tileset
├── TILED_MAPS_GUIDE.md            # Esta documentación
├── tiled/
│   ├── dungeon_tiles.tsx          # Definición de Tileset en Tiled
│   ├── nivel1.tmx                 # Archivo editable de Tiled para el Nivel 1
│   └── nivel1.json                # Exportación JSON del Nivel 1
├── public/
│   └── assets/
│       ├── tilesets/
│       │   └── dungeon_tiles.png  # Spritesheet PNG 256x256 px (32x32 tiles)
│       └── maps/
│           └── nivel1.json        # Mapa cargado dinámicamente por Phaser
└── src/
    ├── scenes/
    │   ├── PreloadScene.js        # Carga el spritesheet y el mapa JSON
    │   └── MapScene.js            # Renderizado de mapa, niebla, objetos y cámara
    └── data/
        └── levels.js              # Catálogo de enemigos y stats de niveles
```

---

## 🔄 5. Flujo de Trabajo para Crear Nuevos Niveles (ej: Nivel 2)

1. **Abrir Tiled:** Crear nuevo mapa con orientación *Ortogonal*, *32x32 px* de tile, y dimensiones según el plan (ej. Nivel 2 = `18 x 18` tiles).
2. **Asignar Tileset:** Cargar `dungeon_tiles.png` (Tile width: 32, Tile height: 32).
3. **Pintar Terreno:** Usar la capa `Terreno` para suelos y muros.
4. **Poner Objetos:** Usar la capa `Objetos` para colocar `PlayerSpawn`, `Encounter`, `ItemKey`, `Door`, `Chest` y `Stairs`.
5. **Guardar y Exportar:**
   * Guardar en `tiled/nivel2.tmx` (`Cmd + S`).
   * Exportar JSON a `public/assets/maps/nivel2.json` (`Archivo -> Exportar como...`).
