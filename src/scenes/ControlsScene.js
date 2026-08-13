/**
 * ControlsScene.js — Selector de esquema de controles
 *
 * En móvil: detecta automáticamente y pasa directamente al siguiente paso.
 * En escritorio: muestra opciones TECLADO / RATÓN.
 * Guarda la elección en el registry de Phaser para que todas las escenas accedan.
 */

import * as Phaser from "phaser";
import { COLORS, FONTS, SCENES, TIMING, DEPTHS } from "../utils/constants.js";
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
    // Si es móvil, forzar touch y saltar directamente
    if (isTouchDevice()) {
      this.registry.set("inputMode", INPUT_MODE.TOUCH);
      this._proceed();
      return;
    }

    const W = this.scale.width;
    const H = this.scale.height;
    this.cameras.main.setBackgroundColor(COLORS.BG_DEEP);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // ── Panel central ─────────────────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, 200, 120, COLORS.UI_PANEL, 0.95)
      .setStrokeStyle(1, COLORS.GOLD_DARK)
      .setDepth(DEPTHS.UI_BG);

    this.add.text(W / 2, H / 2 - 44, "¿CÓMO COMBATES?", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "6px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(W / 2, H / 2 - 30, "Elige tu método de entrada", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "4px",
      color: "#6a4e8a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── Botones ───────────────────────────────────────────────────────────────
    new PixelButton(
      this, W / 2, H / 2 - 4,
      "TECLADO",
      () => this._selectMode(INPUT_MODE.KEYBOARD),
      { width: 120, height: 16, fontSize: 6 }
    );

    new PixelButton(
      this, W / 2, H / 2 + 18,
      "RATON",
      () => this._selectMode(INPUT_MODE.MOUSE),
      { width: 120, height: 16, fontSize: 6 }
    );

    // Descripción teclado
    this.add.text(W / 2, H / 2 + 36, "Flechas + Z/Enter = confirmar", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "4px",
      color: "#5a5a8a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── Input teclado (K = teclado, M = ratón) ────────────────────────────────
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
