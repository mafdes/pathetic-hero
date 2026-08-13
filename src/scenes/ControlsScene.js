/**
 * ControlsScene.js — Selector de controles (540×960 Vertical)
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

    // Panel central vertical
    this.add.rectangle(W / 2, H / 2, 460, 420, COLORS.UI_PANEL, 0.95)
      .setStrokeStyle(2, COLORS.GOLD_DARK).setDepth(DEPTHS.UI_BG);

    this.add.text(W / 2, H / 2 - 150, "¿CÓMO COMBATES?", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "20px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(W / 2, H / 2 - 100, "Elige tu método de entrada", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "12px",
      color: "#6a4e8a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    new PixelButton(this, W / 2, H / 2 - 20,
      "TECLADO  [ Flechas + Z ]",
      () => this._selectMode(INPUT_MODE.KEYBOARD),
      { width: 380, height: 56, fontSize: "14px" }
    );

    new PixelButton(this, W / 2, H / 2 + 60,
      "RATON  [ Click ]",
      () => this._selectMode(INPUT_MODE.MOUSE),
      { width: 380, height: 56, fontSize: "14px" }
    );

    this.add.text(W / 2, H / 2 + 150, "En móvil: táctil automático", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "11px",
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
