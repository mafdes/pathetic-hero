/**
 * main.js — Bootstrap de Phaser 4
 * Punto de entrada del juego. Configura el motor y registra todas las escenas.
 *
 * PHASER 4 NOTE: Se usa `import * as Phaser from 'phaser'` (wildcard)
 * ya que el default export cambió en Phaser 4.
 */

import * as Phaser from "phaser";
import { BASE_WIDTH, BASE_HEIGHT, SCENES } from "./utils/constants.js";
import { BootScene } from "./scenes/BootScene.js";
import { PreloadScene } from "./scenes/PreloadScene.js";
import { IntroScene } from "./scenes/IntroScene.js";
import { MainMenuScene } from "./scenes/MainMenuScene.js";
import { OptionsScene } from "./scenes/OptionsScene.js";
import { ControlsScene } from "./scenes/ControlsScene.js";
import { GuildReportScene } from "./scenes/GuildReportScene.js";
import { DexterityScene } from "./scenes/challenges/DexterityScene.js";

/** @type {Phaser.Types.Core.GameConfig} */
const config = {
  type: Phaser.AUTO,           // WebGL si disponible, Canvas como fallback
  width: BASE_WIDTH,           // 320px — resolución pixel art nativa
  height: BASE_HEIGHT,         // 180px
  backgroundColor: "#0d0613",
  parent: "game-container",
  pixelArt: true,              // Desactiva antialiasing para pixel art nítido
  antialias: false,
  roundPixels: true,           // Evita blurring en posiciones subpíxel
  scale: {
    mode: Phaser.Scale.FIT,    // Escala manteniendo relación de aspecto
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: import.meta.env?.DEV ?? false, // Hitboxes solo en desarrollo
    },
  },
  scene: [
    BootScene,
    PreloadScene,
    IntroScene,
    MainMenuScene,
    OptionsScene,
    ControlsScene,
    GuildReportScene,
    DexterityScene,
  ],
};

// Instancia global del juego (accesible en DevTools para depuración)
const game = new Phaser.Game(config);

// En desarrollo, exponer el juego en window para facilitar debugging
if (import.meta.env?.DEV) {
  window.__PATHETIC_HERO__ = game;
}

export { game };
