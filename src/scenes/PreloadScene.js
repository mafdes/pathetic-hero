/**
 * PreloadScene.js — Carga de assets con barra de progreso pixel art (960×540)
 */

import * as Phaser from "phaser";
import { COLORS, FONTS, FONT_SIZES, BASE_WIDTH, BASE_HEIGHT, SCENES } from "../utils/constants.js";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.PRELOAD });
  }

  preload() {
    this._buildLoadingUI();

    // ── Imágenes ──────────────────────────────────────────────────────────────
    // this.load.image("bg_intro", "assets/images/bg_intro.png");
    // this.load.image("bg_menu",  "assets/images/bg_menu.png");

    // ── Audio ─────────────────────────────────────────────────────────────────
    // this.load.audio("music_menu", ["assets/audio/menu.ogg"]);
    // this.load.audio("sfx_confirm", ["assets/audio/confirm.ogg"]);
  }

  create() {
    this.scene.start(SCENES.INTRO);
  }

  _buildLoadingUI() {
    const cx = BASE_WIDTH / 2;
    const cy = BASE_HEIGHT / 2;
    const barW = 480;
    const barH = 24;

    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);

    this.add.text(cx, cy - 60, "CARGANDO...", {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.HEADING,
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5);

    // Marco
    this.add.rectangle(cx, cy, barW + 8, barH + 8)
      .setStrokeStyle(2, COLORS.GOLD_DARK)
      .setFillStyle(COLORS.BG_DEEP);

    // Barra
    const bar = this.add.rectangle(
      cx - barW / 2, cy - barH / 2,
      0, barH, COLORS.GOLD
    ).setOrigin(0, 0);

    // Porcentaje
    const pctText = this.add.text(cx, cy + 36, "0%", {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.BODY,
      color: "#f0e6d3",
      resolution: 2,
    }).setOrigin(0.5);

    this.load.on("progress", (value) => {
      bar.width = barW * value;
      pctText.setText(`${Math.round(value * 100)}%`);
    });
  }
}
