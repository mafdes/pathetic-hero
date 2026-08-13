/**
 * BootScene.js — Primera escena que se ejecuta al arrancar el juego.
 * Carga únicamente los assets mínimos para mostrar la pantalla de carga:
 * la fuente pixel y el logo. El resto de assets se carga en PreloadScene.
 */

import * as Phaser from "phaser";
import { COLORS, SCENES } from "../utils/constants.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  preload() {
    // La fuente Press Start 2P se carga via <link> en index.html.
    // Aquí solo aseguramos que esté disponible antes de PreloadScene.
    // Phaser 4: usamos WebFontLoader o un pequeño trick con document.fonts.
  }

  create() {
    // Verificar que la fuente está lista antes de avanzar
    if (document.fonts) {
      document.fonts.ready.then(() => {
        this.scene.start(SCENES.PRELOAD);
      });
    } else {
      // Fallback: esperar 200ms y continuar
      this.time.delayedCall(200, () => {
        this.scene.start(SCENES.PRELOAD);
      });
    }
  }
}
