/**
 * OptionsScene.js — Pantalla de opciones
 * Volumen de música, volumen de SFX, idioma (ES/EN).
 * Vuelve al menú con ESC o el botón VOLVER.
 */

import * as Phaser from "phaser";
import { COLORS, FONTS, SCENES, TIMING, DEPTHS } from "../utils/constants.js";
import { PixelButton } from "../ui/PixelButton.js";

export class OptionsScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.OPTIONS });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(COLORS.BG_DEEP);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // ── Título ────────────────────────────────────────────────────────────────
    this.add.text(W / 2, 20, "OPCIONES", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "8px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.rectangle(W / 2, 32, W - 16, 1, COLORS.GOLD_DARK)
      .setDepth(DEPTHS.UI);

    // ── Panel ─────────────────────────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2 + 10, 200, 100, COLORS.UI_PANEL, 0.9)
      .setStrokeStyle(1, COLORS.GOLD_DARK)
      .setDepth(DEPTHS.UI_BG);

    // ── Opciones de volumen (placeholder — se conectarán con AudioManager) ────
    this._addSliderRow("MUSICA", W / 2, H / 2 - 20, 0.6);
    this._addSliderRow("EFECTOS", W / 2, H / 2, 0.8);

    // ── Botón volver ──────────────────────────────────────────────────────────
    new PixelButton(
      this, W / 2, H / 2 + 44,
      "< VOLVER",
      () => this._goBack(),
      { width: 100, height: 14, fontSize: 6 }
    );

    this.input.keyboard?.once("keydown-ESC", () => this._goBack());
    this.input.keyboard?.once("keydown-X", () => this._goBack());
  }

  _addSliderRow(label, x, y, initialValue) {
    const barW = 80;
    const barH = 6;

    this.add.text(x - 54, y, label, {
      fontFamily: FONTS.PRIMARY,
      fontSize: "5px",
      color: "#f0e6d3",
      resolution: 2,
    }).setOrigin(0, 0.5).setDepth(DEPTHS.UI);

    // Fondo barra
    this.add.rectangle(x + 20, y, barW, barH, COLORS.BG_STONE)
      .setDepth(DEPTHS.UI);

    // Barra de valor
    const fill = this.add.rectangle(
      x + 20 - barW / 2,
      y,
      barW * initialValue,
      barH,
      COLORS.GOLD
    ).setOrigin(0, 0.5).setDepth(DEPTHS.UI);

    // Porcentaje
    this.add.text(x + 64, y, `${Math.round(initialValue * 100)}%`, {
      fontFamily: FONTS.PRIMARY,
      fontSize: "5px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0, 0.5).setDepth(DEPTHS.UI);
  }

  _goBack() {
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      this.scene.start(SCENES.MAIN_MENU);
    });
  }
}
