/**
 * ControlsScene.js — Selector de controles (960×540)
 */

import * as Phaser from "phaser";
import { COLORS, FONTS, FONT_SIZES, SCENES, TIMING, DEPTHS } from "../utils/constants.js";
import { isTouchDevice } from "../utils/helpers.js";
import { INPUT_MODE } from "../systems/InputManager.js";
import { PixelButton } from "../ui/PixelButton.js";

export class ControlsScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.CONTROLS });
  }

  init(data) {
    this._mode = data?.mode ?? "new";
  }

  create() {
    if (isTouchDevice()) {
      this.registry.set("inputMode", INPUT_MODE.TOUCH);
      this._proceed();
      return;
    }

    const W = this.scale.width;
    const H = this.scale.height;
    this.cameras.main.setBackgroundColor(COLORS.BG_DEEP);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // Panel central
    this.add.rectangle(W / 2, H / 2, 520, 320, COLORS.UI_PANEL, 0.95)
      .setStrokeStyle(2, COLORS.GOLD_DARK).setDepth(DEPTHS.UI_BG);

    this.add.text(W / 2, H / 2 - 120, "¿CÓMO COMBATES?", {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.HEADING,
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(W / 2, H / 2 - 76, "Elige tu método de entrada", {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.SMALL,
      color: "#6a4e8a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    new PixelButton(this, W / 2, H / 2 - 20,
      "TECLADO  [ Flechas + Z ]",
      () => this._selectMode(INPUT_MODE.KEYBOARD),
      { width: 400, height: 52, fontSize: FONT_SIZES.BODY }
    );

    new PixelButton(this, W / 2, H / 2 + 56,
      "RATON  [ Click ]",
      () => this._selectMode(INPUT_MODE.MOUSE),
      { width: 400, height: 52, fontSize: FONT_SIZES.BODY }
    );

    this.add.text(W / 2, H / 2 + 126, "En movil: controles tactiles automaticos", {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.TINY,
      color: "#5a5a8a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.input.keyboard?.once("keydown-K", () => this._selectMode(INPUT_MODE.KEYBOARD));
    this.input.keyboard?.once("keydown-M", () => this._selectMode(INPUT_MODE.MOUSE));
  }

  _selectMode(mode) {
    this.registry.set("inputMode", mode);
    this._proceed();
  }

  _proceed() {
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      this.scene.start(SCENES.GUILD_REPORT);
    });
  }
}
