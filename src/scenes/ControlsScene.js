/**
 * ControlsScene.js — Selector de controles (720×1280 HD Vertical)
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
    // En dispositivos táctiles/móviles, omitir pantalla de control y seleccionar TÁCTIL automáticamente
    if (isTouchDevice()) {
      this.registry.set("inputMode", INPUT_MODE.TOUCH);
      this._proceed();
      return;
    }

    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(COLORS.BG_DEEP);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // ── Título y Subtítulo ──────────────────────────────────────────────────
    this.add.text(W / 2, 220, "¿CÓMO JUEGAS?", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "36px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(W / 2, 280, "Selecciona tu método preferido", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "18px",
      color: "#6a4e8a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── Opción 1: TECLADO ────────────────────────────────────────────────────
    new PixelButton(
      this,
      W / 2,
      440,
      "TECLADO",
      () => this._selectMode(INPUT_MODE.KEYBOARD),
      { width: 580, height: 110, fontSize: "28px" }
    );

    this.add.text(W / 2, 525, "[ FLECHAS + ESPACIO / ENTER ]", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "14px",
      color: "#f0c040",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── Opción 2: RATÓN ──────────────────────────────────────────────────────
    new PixelButton(
      this,
      W / 2,
      680,
      "RATÓN",
      () => this._selectMode(INPUT_MODE.MOUSE),
      { width: 580, height: 110, fontSize: "28px" }
    );

    this.add.text(W / 2, 765, "[ CLICK IZQUIERDO ]", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "14px",
      color: "#f0c040",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── Nota aclaratoria ──────────────────────────────────────────────────────
    this.add.rectangle(W / 2, H - 120, W - 120, 60, COLORS.UI_PANEL, 0.8)
      .setStrokeStyle(2, COLORS.UI_BORDER)
      .setDepth(DEPTHS.UI_BG);

    this.add.text(W / 2, H - 120, "Móvil / Táctil: Automático al tocar", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "14px",
      color: "#6a4e8a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // Accesos por teclado
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
