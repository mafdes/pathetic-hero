/**
 * OptionsScene.js — Opciones (960×540)
 */

import * as Phaser from "phaser";
import { COLORS, FONTS, FONT_SIZES, SCENES, TIMING, DEPTHS } from "../utils/constants.js";
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

    // Título
    this.add.text(W / 2, 60, "OPCIONES", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "40px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.rectangle(W / 2, 100, W - 80, 2, COLORS.GOLD_DARK).setDepth(DEPTHS.UI);

    // Panel
    this.add.rectangle(W / 2, H / 2 + 20, 520, 240, COLORS.UI_PANEL, 0.9)
      .setStrokeStyle(2, COLORS.GOLD_DARK).setDepth(DEPTHS.UI_BG);

    this._addSliderRow("MUSICA",   W / 2, H / 2 - 36, 0.6);
    this._addSliderRow("EFECTOS",  W / 2, H / 2 + 36, 0.8);

    new PixelButton(this, W / 2, H - 80,
      "< VOLVER",
      () => this._goBack(),
      { width: 240, height: 48, fontSize: FONT_SIZES.BODY }
    );

    this.input.keyboard?.once("keydown-ESC", () => this._goBack());
    this.input.keyboard?.once("keydown-X",   () => this._goBack());
  }

  _addSliderRow(label, x, y, initialValue) {
    const barW = 240;
    const barH = 18;

    this.add.text(x - 180, y, label, {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.BODY,
      color: "#f0e6d3",
      resolution: 2,
    }).setOrigin(0, 0.5).setDepth(DEPTHS.UI);

    this.add.rectangle(x + 60, y, barW, barH, COLORS.BG_STONE).setDepth(DEPTHS.UI);

    this.add.rectangle(
      x + 60 - barW / 2, y,
      barW * initialValue, barH,
      COLORS.GOLD
    ).setOrigin(0, 0.5).setDepth(DEPTHS.UI);

    this.add.text(x + 192, y, `${Math.round(initialValue * 100)}%`, {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.BODY,
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
