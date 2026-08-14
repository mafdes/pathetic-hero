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
import { HeroSummaryScene } from "./scenes/HeroSummaryScene.js";
import { NameSelectionScene } from "./scenes/NameSelectionScene.js";
import { MapScene } from "./scenes/MapScene.js";
import { CombatScene } from "./scenes/CombatScene.js";

const BUILD_INFO = {
  version: "0.3.0",
  buildTime: new Date().toLocaleTimeString(),
  buildDate: new Date().toISOString().slice(0, 10),
};

console.log(
  `%c 🗡️ PATHETIC HERO v${BUILD_INFO.version} %c Build: ${BUILD_INFO.buildDate} ${BUILD_INFO.buildTime} %c`,
  "background: #1a0a2e; color: #f0c040; font-weight: bold; font-size: 13px; padding: 4px 8px; border-radius: 4px 0 0 4px;",
  "background: #d4a017; color: #1a0a2e; font-weight: bold; font-size: 13px; padding: 4px 8px; border-radius: 0 4px 4px 0;",
  "background: transparent;"
);

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
    HeroSummaryScene,
    NameSelectionScene,
    MapScene,
    CombatScene,
  ],
};

const game = new Phaser.Game(config);

if (import.meta.env?.DEV) {
  window.__PATHETIC_HERO__ = game;
}

export { game };
