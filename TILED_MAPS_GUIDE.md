# 🗺️ Guía Definitiva de Mapas de Tiled — Pathetic Hero 🗡️

Documento de referencia para la creación y edición de los **8 niveles de mazmorra** en Tiled para *Pathetic Hero*.

---

## 📌 1. Visión General y Mapa de Niveles (8 Plantas)

El juego utiliza **Phaser 4** con cámara **autocentrada en el personaje** (`this.cameras.main.startFollow`), lo que permite mapas de cualquier tamaño.

| Nivel | Nombre / Bioma | Archivo TMX | Archivo JSON Exportado | Estado |
|---|---|---|---|---|
| **Nivel 1** | Planta B1 — Sala de Iniciación | `tiled/nivel1.tmx` | `public/assets/maps/nivel1.json` | ✅ Creado y Jugable |
| **Nivel 2** | Planta B2 — Archivos de la Cripta | `tiled/nivel2.tmx` | `public/assets/maps/nivel2.json` | 🛠️ Listo para Diseñar |
| **Nivel 3** | Planta B3 — Pasillos Oscuros | `tiled/nivel3.tmx` | `public/assets/maps/nivel3.json` | 🛠️ Listo para Diseñar |
| **Nivel 4** | Planta B4 — Catacumbas de los Héroes | `tiled/nivel4.tmx` | `public/assets/maps/nivel4.json` | 🛠️ Listo para Diseñar |
| **Nivel 5** | Planta B5 — Laboratorio Abandonado | `tiled/nivel5.tmx` | `public/assets/maps/nivel5.json` | 🛠️ Listo para Diseñar |
| **Nivel 6** | Planta B6 — Prisión del Gremio | `tiled/nivel6.tmx` | `public/assets/maps/nivel6.json` | 🛠️ Listo para Diseñar |
| **Nivel 7** | Planta B7 — Ala Prohibida Arcana | `tiled/nivel7.tmx` | `public/assets/maps/nivel7.json` | 🛠️ Listo para Diseñar |
| **Nivel 8** | Planta B8 — Gran Mazmorra del Tribunal | `tiled/nivel8.tmx` | `public/assets/maps/nivel8.json` | 🛠️ Listo para Diseñar |

---

## 🎨 2. Regla del Tileset Unificado de 4 Filas (`dungeon_tiles.png`)

* **Ubicación:** [`public/assets/tilesets/dungeon_tiles.png`](public/assets/tilesets/dungeon_tiles.png)
* **Dimensiones Totales:** `256 × 128` px (8 columnas × 4 filas = **32 casillas de 32x32 px**).
* **Visualizador Interactivo:** Abre [`tileset-viewer.html`](tileset-viewer.html) en tu navegador.

### Regla de Colisión Súper Simple:
* ⛔ **FILAS 1 Y 2 (GIDs 1 al 16): PAREDES Y OBSTÁCULOS (NO-PASO)**
  * Cualquier tile pintado en estas dos filas **bloquea el paso del héroe automáticamente**.
  * Incluye: Muros de ladrillo, antorchas, grietas, techos, columnas, estatuas, barriles, cajas, verjas, musgo, muros arcanos y lava.
* ✅ **FILAS 3 Y 4 (GIDs 17 al 32): SUELOS Y CAMINOS (SÍ-PASO)**
  * Cualquier tile pintado en estas dos filas **es camino libre transitable**.
  * Incluye: Suelo de piedra púrpura principal, cripta azul, runas grabadas, alfombra roja, tablas de madera, marfil claro, musgo, escaleras, agua estática, ceniza y hielo.

---

## 📋 3. CHEAT SHEET DE OBJETOS INTERACTIVOS (Capa `Objetos`)

En Tiled, crea una capa de objetos llamada **`Objetos`** o **`Encuentros y cosas`**. Añade **rectángulos de 32 × 32 px** con las siguientes propiedades:

| Tipo (`Type` / `Class`) | Nombre (`Name`) | Propiedades personalizadas | Comportamiento en Juego |
|---|---|---|---|
| **`PlayerSpawn`** | `Jugador` | *(ninguna)* | Punto donde aparece el héroe al entrar al nivel. |
| **`ItemKey`** | `LLave` | *(ninguna)* | Muestra el sprite de llave de Jan Schneider. Otorga +1 Llave al inventario. |
| **`Door`** | `Puerta Salida` | *(ninguna)* | Puerta bloqueada. Requiere consumible de 1 Llave para abrirse. |
| **`Chest`** | `Cofre` | *(ninguna)* | **Cofre Inteligente (Jan Schneider):** Botín dinámico. Si te falta Vida ➔ Poción (+5 PV). Si te falta Maná ➔ Elixir (+5 PM). Si estás lleno o al azar ➔ **+20 EXP**. |
| **`Trap`** | `Trampa` | *(ninguna)* | Trampa de cepo. Prueba de Destreza (si fallas, sufres -3 PV). |
| **`Stairs`** | `Escaleras Salida` | *(ninguna)* | Completa la planta de la mazmorra y **descansas recuperando el 100% de PV y PM**. |

---

### ⚔️ Configuración de Enemigos (`Encounter`)

Para crear peleas, coloca un objeto de tipo **`Encounter`** con las siguientes propiedades personalizadas:

#### 1. Enemigo Único:
* **`Type`:** `Encounter`
* **`Name`:** Nombre descriptivo (ej. `Goblin Explorador`)
* **Propiedad personalizada (String):**
  * `enemy = "goblin"` ➔ Goblin Explorador (`10 HP`, `15 EXP`)
  * `enemy = "mago_novato"` ➔ Mago Novato (`8 HP`, `20 EXP`, débil a Físico)
  * `enemy = "trasgo"` ➔ Trasgo Archivero (`14 HP`, `25 EXP`, débil a Hielo/Rayo)
  * `enemy = "goblin_alpha"` ➔ Jefe Goblin Alfa (`22 HP`, `50 EXP`)

#### 2. Encuentro Múltiple (2 o 3 Monstruos en Secuencia):
* **`Type`:** `Encounter`
* **Propiedades personalizadas:**
  * `enemies = "goblin,mago_novato"` (string separado por comas)
  * `count = 2` (entero)
* *El juego mostrará un indicador con insignia roja (`x2` / `x3`) sobre el sprite en la mazmorra.*

---

## 🔄 4. Flujo de Trabajo en Tiled

1. **Abrir Tiled:** Abre cualquier nivel en `tiled/nivel1.tmx` hasta `tiled/nivel8.tmx`.
2. **Pintar:** 
   * Usa las **Filas 1-2** para Muros (No-Paso).
   * Usa las **Filas 3-4** para Suelos (Sí-Paso).
3. **Colocar Objetos:** Añade tus rectángulos de `Jugador`, `ItemKey`, `Door`, `Chest`, `Trap`, `Encounter` y `Stairs`.
4. **Guardar (`Cmd + S`):** Tiled guardará el archivo `.tmx` y **exportará automáticamente el `.json` a `public/assets/maps/`**.
