# Guía de Compilación de Enemigos y Resolución de Errores de Tiled

## 1. ¿Por qué salía el error de Tiled en consola?

```text
Texture "dungeon_tiles_sheet" has no frame "1610612739"
Texture "dungeon_tiles_sheet" has no frame "3758096386"
```

### Explicación Técnica:
En el editor de mapas **Tiled**, cuando el diseñador **voltea un azulejo/tile** (horizontal o verticalmente), Tiled no cambia el ID base sino que añade **bits de estado (flags)** en los 3 bits más altos del número entero de 32 bits:
- **Bit 31 (`0x80000000`)**: Volteo Horizontal (H-Flip).
- **Bit 30 (`0x40000000`)**: Volteo Vertical (V-Flip).

Ejemplo: El azulejo número `3` con volteo vertical se convierte en `3 + 1073741824 = 1610612739`.

Al leer el mapa en Phaser sin limpiar esos bits, Phaser intentaba buscar el marco `"1610612739"` en el tileset (que sólo tiene marcos del `0` al `200`), produciendo la advertencia.

### Solución Aplicada en [`MapScene.js`](file:///Users/marcosfernandezsole/Documents/GitHub/pathetic-hero/src/scenes/MapScene.js#L385-L398):
Se aplica una máscara de bits (`rawGid & 0x1FFFFFFF`) para obtener el ID real limpio, y se aplica `setFlipX(true)` / `setFlipY(true)` en Phaser según corresponda.

---

## 2. Flujo Completo de Compilación de Enemigos

### Paso 1: Generación del Spritesheet en ChatGPT
Generas una imagen PNG que contenga todas las poses (por ejemplo `enemies/minotauro.png`).

### Paso 2: Recorte Automático con Python
Ejecutas en la consola:
```bash
npm run split:enemy enemies/minotauro.png
```
- Este script (`tools/split-spritesheet.py`) detecta cada personaje dentro de la imagen.
- **Alineación estándar al suelo**: Coloca la suela de las botas del monstruo en la coordenada Y inferior (`paste_y = target_size - c_h`), garantizando que `setOrigin(0.5, 1.0)` en Phaser lo sitúe directamente sobre la sombra del suelo sin parches ni ajustes individuales.
- Guarda todos los recortes numerados en `enemies/minotauro_raw/`.

### Paso 3: Selección y Renombrado
Copias o renombras los fotogramas deseados a la carpeta de producción `enemies/minotauro/`:
- `stand01.png`, `stand02.png` (Reposo)
- `attack01.png`, `attack02.png`, `attack03.png` (Ataque)
- `hurt01.png`, `hurt02.png` (Daño)
- `die01.png`, `die02.png` (Muerte)
- `map.png` (Icono cenital para el mapa de mazmorra)

### Paso 4: Generación del Manifiesto y Build de Producción
Al ejecutar:
```bash
npm run build
```
O de forma independiente:
```bash
npm run build:enemies
```
El script `tools/build-enemies.js`:
1. Analiza las carpetas dentro de `enemies/`.
2. Genera automáticamente `public/assets/enemies/manifest.json`.
3. Copia todas las imágenes a `public/assets/enemies/`.
4. Phaser registra las animaciones en `EnemyAnimationManager` de forma 100% dinámica.
