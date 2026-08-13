/**
 * BootScene.js — Primera escena que se ejecuta al arrancar el juego.
 * Carga y fuerza la descarga de la fuente pixel "Press Start 2P" en la memoria de Canvas 2D
 * antes de permitir avanzar a PreloadScene.
 */

import * as Phaser from "phaser";
import { SCENES } from "../utils/constants.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  create() {
    // Forzar la carga completa de la fuente web para que Canvas 2D no use la fuente fallback (Times/Arial)
    if (document.fonts && document.fonts.load) {
      Promise.all([
        document.fonts.load('16px "Press Start 2P"'),
        document.fonts.ready,
      ]).then(() => {
        // Pequeño retardo de 50ms para asegurar hidratación de la fuente en WebGL/Canvas
        this.time.delayedCall(50, () => {
          this.scene.start(SCENES.PRELOAD);
        });
      }).catch(() => {
        this.scene.start(SCENES.PRELOAD);
      });
    } else {
      this.time.delayedCall(300, () => {
        this.scene.start(SCENES.PRELOAD);
      });
    }
  }
}
