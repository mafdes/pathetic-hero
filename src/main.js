/**
 * main.js — Bootstrap de Phaser 4
 * Punto de entrada del juego. Configura el motor y registra todas las escenas.
 */

import * as Phaser from "phaser";
import { BASE_WIDTH, BASE_HEIGHT } from "./utils/constants.js";
import { BootScene } from "./scenes/BootScene.js";
import { PreloadScene } from "./scenes/PreloadScene.js";
import { IntroScene } from "./scenes/IntroScene.js";
import { MainMenuScene } from "./scenes/MainMenuScene.js";
import { OptionsScene } from "./scenes/OptionsScene.js";
import { ControlsScene } from "./scenes/ControlsScene.js";
import { GuildReportScene } from "./scenes/GuildReportScene.js";
import { DexterityScene } from "./scenes/challenges/DexterityScene.js";
import { ConstitutionScene } from "./scenes/challenges/ConstitutionScene.js";
import { StrengthScene } from "./scenes/challenges/StrengthScene.js";
import { AgilityScene } from "./scenes/challenges/AgilityScene.js";
import { IntelligenceScene } from "./scenes/challenges/IntelligenceScene.js";
import { ClassSelectionScene } from "./scenes/ClassSelectionScene.js";

/** @type {Phaser.Types.Core.GameConfig} */
const config = {
  type: Phaser.AUTO,
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  backgroundColor: "#0d0613",
  parent: "game-container",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: import.meta.env?.DEV ?? false,
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
    ConstitutionScene,
    StrengthScene,
    AgilityScene,
    IntelligenceScene,
    ClassSelectionScene,
  ],
};

const game = new Phaser.Game(config);

if (import.meta.env?.DEV) {
  window.__PATHETIC_HERO__ = game;
}

export { game };
