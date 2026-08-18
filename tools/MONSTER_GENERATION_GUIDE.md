# 🧟 Guía Definitiva para Generación de Monstruos y Prompts — Pathetic Hero

Esta guía documenta el estándar de animaciones, resoluciones, estructura de carpetas y el prompt maestro de ChatGPT ajustado para añadir nuevos monstruos a **Pathetic Hero**.

---

## 📁 Estructura de Archivos en `enemies/<nombre_monstruo>/`

Cada carpeta dentro de `enemies/` contiene los fotogramas PNG con fondo transparente (canal alfa):

```text
enemies/
  └── <nombre_monstruo>/
      ├── map.png           <-- Vista cenital Top-Down (para la mazmorra)
      ├── stand01.png       <-- Reposo (2 frames simples)
      ├── stand02.png
      ├── attack01.png      <-- Ataque físico (3 frames)
      ├── attack02.png
      ├── attack03.png
      ├── hurt01.png        <-- Recibir daño (1-2 frames cortos)
      ├── hurt02.png
      ├── dodge01.png       <-- Esquivar (2 frames)
      ├── dodge02.png
      ├── taunt01.png       <-- Burlarse / Risa Satírica (3 frames cómicos)
      ├── taunt02.png
      ├── taunt03.png
      ├── die01.png         <-- Muerte (3 frames)
      ├── die02.png
      └── die03.png
```

Al ejecutar `npm run build:enemies`, el script `tools/build-enemies.js` detectará automáticamente todos los fotogramas y la vista de mapa y actualizará `public/assets/enemies/manifest.json`.

---

## 🛠️ Herramienta de Selección Fácil: `npm run organize:enemy`

Cuando tengas la imagen devuelta por ChatGPT (ej: `enemies/minotauro.png`):

1. **Recortar cuadros automáticos**:
   ```bash
   npm run split:enemy enemies/minotauro.png
   ```
   Esto guardará los cuadros recortados y alineados en `enemies/minotauro_raw/`.

2. **Organizar con vista previa interactiva**:
   ```bash
   npm run organize:enemy minotauro
   ```
   - Este comando **genera un archivo `_PREVIEW.png` numerado** dentro de `enemies/minotauro_raw/`.
   - Abre `_PREVIEW.png` en tu visor de imágenes para ver el número de cada cuadro.
   - El script te preguntará por consola qué números usar para cada pose:
     - `STAND`: (ej: 1,2)
     - `ATTACK`: (ej: 3,4,5)
     - `HURT`: (ej: 8,9)
     - `DIE`: (ej: 15,16)
     - `MAP`: (ej: 1)

3. **También puedes pasarlos directamente en un solo comando**:
   ```bash
   python3 tools/organize-enemy.py minotauro --stand 1,2 --attack 3,4,5 --hurt 8,9 --die 15,16 --map 1
   ```

---

## 📐 Resoluciones Recomendadas

- **Vista Cenital (Mapa)**: `64×64 px` (transparente).
- **Vista Lateral (Combate)**: `256×256 px` por frame (Pixel Art HD para pantallas Retina/Móviles).

---

## 🤖 Prompt Maestro para ChatGPT (Optimizado)

Copia y pega este prompt sustituyendo la descripción del monstruo:

```text
Genera una hoja de sprites (sprite sheet) en Pixel Art HD con fondo TRANSPARENTE REAL (PNG con alfa, sin fondo, sin suelo ni sombras).
El personaje es un "<DESCRIPCIÓN DEL MONSTRUO, ej: Goblin verde medieval con armadura de cuero raída y garrote de madera>".
Estilo: RPG retro 16-bit nítido, de tono cómico y satírico.

ÁNGULO Y ORIENTACIÓN OBLIGATORIA:
- Perspectiva 3/4 FRONTAL orientada hacia la IZQUIERDA (debe vérsele bien la cara, la cara de pánico/risa y los detalles del cuerpo, NO de perfil estricto ni de espaldas).

Genera la SECUENCIA DE FOTOGRAMAS organizada en 7 filas horizontales bien separadas:

Fila 0 - Vista Cenital / Top-Down para Mapa (1 fotograma - 64x64):
- Frame 1: Personaje visto desde arriba (perspectiva superior 3/4) para caminar por el mapa de mazmorra.

Fila 1 - Reposo / Stand (SOLO 2 fotogramas):
- Frame 1: De pie en postura de combate.
- Frame 2: Leve flexión de rodillas respirando (animación muy simple).

Fila 2 - Ataque (3 fotogramas):
- Frame 1: Carga el arma hacia atrás.
- Frame 2: Embestida y golpe violento hacia la izquierda.
- Frame 3: Recuperación del impacto.

Fila 3 - Recibir Daño / Hurt (CORTA - SOLO 2 fotogramas):
- Frame 1: Reacción de impacto (cabeza hacia atrás y cara de dolor).
- Frame 2: Recuperando el equilibrio.

Fila 4 - Esquiva / Dodge (2 fotogramas):
- Frame 1: Salto ágil hacia atrás esquivando.
- Frame 2: Caída suave de vuelta a su sitio.

Fila 5 - Burlarse / Taunt (CÓMICA Y DESTACADA - 3 fotogramas):
- Frame 1: Risa a carcajadas señalándose la barriga mirando hacia el jugador.
- Frame 2: Sacando la lengua o haciendo mueca burlesca.
- Frame 3: Baile de victoria corto o palmadita en el trasero.

Fila 6 - Muerte / Die (3 fotogramas):
- Frame 1: Tropiezo perdiendo el garrote/arma.
- Frame 2: Caída de rodillas.
- Frame 3: Tendido en el suelo boca arriba con los ojos en X.
```
