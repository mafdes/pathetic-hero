/**
 * ControlsScene.js — Selector / Guía de controles (720×1280 HD Vertical)
 */

import * as Phaser from "phaser";
import { COLORS, FONTS, SCENES, TIMING, DEPTHS } from "../utils/constants.js";
import { isTouchDevice } from "../utils/helpers.js";
import { INPUT_MODE } from "../systems/InputManager.js";

export class ControlsScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.CONTROLS });
  }

  init(data) {
    this._mode = data?.mode ?? "new";
  }

  create() {
    // En móviles/táctiles, omitir automáticamente
    if (isTouchDevice()) {
      this.registry.set("inputMode", INPUT_MODE.TOUCH);
      this._proceed();
      return;
    }

    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(COLORS.BG_DEEP);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // ── Título ───────────────────────────────────────────────────────────────
    this.add.text(W / 2, 180, "¿CÓMO LUCHAS?", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "36px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(W / 2, 240, "Controles unificados de escritorio", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "18px",
      color: "#6a4e8a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── Tarjeta Unificada: TECLADO + RATÓN ───────────────────────────────────
    this._createUnifiedCard(
      W / 2,
      560,
      580,
      440,
      "TECLADO + RATÓN",
      "⌨️ 🖱️",
      [
        "• MOVERSE: WASD / Flechas / Mantener Clic",
        "• NAVEGAR MAZMORRA: Clic directo en casilla",
        "• ACCIÓN EN PRUEBAS: Espacio o Clic Izquierdo",
        "• DIÁLOGOS: Enter / Espacio / Clic",
      ]
    );

    // ── Botón CONFIRMAR ──────────────────────────────────────────────────────
    const confirmBg = this.add.rectangle(W / 2, 980, 500, 90, COLORS.GOLD_DARK)
      .setStrokeStyle(4, COLORS.GOLD)
      .setInteractive({ useHandCursor: true })
      .setDepth(DEPTHS.UI);

    this.add.text(W / 2, 980, "ENTRAR AL GREMIO ►", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "24px",
      color: "#ffffff",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI + 1);

    confirmBg.on("pointerover", () => confirmBg.setFillStyle(COLORS.GOLD));
    confirmBg.on("pointerout",  () => confirmBg.setFillStyle(COLORS.GOLD_DARK));
    confirmBg.on("pointerdown", () => this._confirmSelection());

    // Atajos de teclado
    this.input.keyboard?.on("keydown-ENTER", () => this._confirmSelection());
    this.input.keyboard?.on("keydown-SPACE", () => this._confirmSelection());
  }

  _createUnifiedCard(x, y, w, h, title, iconStr, lines) {
    const bg = this.add.rectangle(x, y, w, h, 0x3d245c, 0.95)
      .setStrokeStyle(4, COLORS.GOLD)
      .setDepth(DEPTHS.UI);

    this.add.text(x, y - h / 2 + 50, iconStr, {
      fontSize: "48px",
    }).setOrigin(0.5).setDepth(DEPTHS.UI + 1);

    this.add.text(x, y - h / 2 + 110, title, {
      fontFamily: FONTS.PRIMARY,
      fontSize: "26px",
      color: "#f0c040",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI + 1);

    let lineY = y - 40;
    lines.forEach((line) => {
      this.add.text(x - w / 2 + 40, lineY, line, {
        fontFamily: FONTS.PRIMARY,
        fontSize: "15px",
        color: "#f0e6d3",
        resolution: 2,
        wordWrap: { width: w - 80 },
      }).setOrigin(0, 0.5).setDepth(DEPTHS.UI + 1);
      lineY += 55;
    });

    const badge = this.add.rectangle(x + w / 2 - 40, y - h / 2 + 40, 32, 32, COLORS.BG_DARK)
      .setStrokeStyle(2, COLORS.GOLD)
      .setDepth(DEPTHS.UI + 1);

    this.add.text(badge.x, badge.y, "✓", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "20px",
      color: "#4caf77",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI + 2);
  }

  _confirmSelection() {
    this.registry.set("inputMode", INPUT_MODE.KEYBOARD);
    this._proceed();
  }

  _proceed() {
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      this.scene.start(SCENES.GUILD_REPORT);
    });
  }
}
