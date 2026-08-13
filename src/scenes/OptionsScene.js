/**
 * OptionsScene.js — Opciones (720×1280 HD Vertical)
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
    this.add.text(W / 2, 140, "OPCIONES", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "44px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.rectangle(W / 2, 190, W - 80, 3, COLORS.GOLD_DARK).setDepth(DEPTHS.UI);

    // Panel
    this.add.rectangle(W / 2, H / 2, 600, 420, COLORS.UI_PANEL, 0.9)
      .setStrokeStyle(3, COLORS.GOLD_DARK).setDepth(DEPTHS.UI_BG);

    this._addSliderRow("MUSICA",   W / 2, H / 2 - 100, 0.6);
    this._addSliderRow("EFECTOS",  W / 2, H / 2 + 30, 0.8);

    new PixelButton(this, W / 2, H - 160,
      "< VOLVER",
      () => this._goBack(),
      { width: 400, height: 76, fontSize: "22px" }
    );

    this.input.keyboard?.once("keydown-ESC", () => this._goBack());
    this.input.keyboard?.once("keydown-X",   () => this._goBack());
  }

  _addSliderRow(label, x, y, initialValue) {
    const barW = 280;
    const barH = 26;

    this.add.text(x, y - 32, label, {
      fontFamily: FONTS.PRIMARY,
      fontSize: "20px",
      color: "#f0e6d3",
      resolution: 2,
    }).setOrigin(0.5, 0.5).setDepth(DEPTHS.UI);

    this.add.rectangle(x, y + 20, barW, barH, COLORS.BG_STONE).setDepth(DEPTHS.UI);

    this.add.rectangle(
      x - barW / 2, y + 20,
      barW * initialValue, barH,
      COLORS.GOLD
    ).setOrigin(0, 0.5).setDepth(DEPTHS.UI);

    this.add.text(x + barW / 2 + 36, y + 20, `${Math.round(initialValue * 100)}%`, {
      fontFamily: FONTS.PRIMARY,
      fontSize: "18px",
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
