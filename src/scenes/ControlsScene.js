/**
 * ControlsScene.js — Selector visual de controles (720×1280 HD Vertical)
 */

import * as Phaser from "phaser";
import { COLORS, FONTS, SCENES, TIMING, DEPTHS } from "../utils/constants.js";
import { isTouchDevice } from "../utils/helpers.js";
import { INPUT_MODE } from "../systems/InputManager.js";

export class ControlsScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.CONTROLS });
    this._selectedMode = INPUT_MODE.KEYBOARD;
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
    this.add.text(W / 2, 160, "¿CÓMO LUCHAS?", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "36px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(W / 2, 220, "Elige tu dispositivo de entrada", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "18px",
      color: "#6a4e8a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── Tarjeta 1: TECLADO ───────────────────────────────────────────────────
    this._cardKeyboard = this._createControlCard(
      W / 2,
      420,
      560,
      220,
      "TECLADO",
      "⌨️",
      "[ FLECHAS + ESPACIO ]",
      INPUT_MODE.KEYBOARD
    );

    // ── Tarjeta 2: RATÓN ─────────────────────────────────────────────────────
    this._cardMouse = this._createControlCard(
      W / 2,
      700,
      560,
      220,
      "RATÓN",
      "🖱️",
      "[ CLICK IZQUIERDO ]",
      INPUT_MODE.MOUSE
    );

    // ── Botón CONFIRMAR ──────────────────────────────────────────────────────
    const confirmBg = this.add.rectangle(W / 2, 980, 500, 90, COLORS.GOLD_DARK)
      .setStrokeStyle(4, COLORS.GOLD)
      .setInteractive({ useHandCursor: true })
      .setDepth(DEPTHS.UI);

    const confirmTxt = this.add.text(W / 2, 980, "ENTRAR AL GREMIO ►", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "24px",
      color: "#ffffff",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI + 1);

    confirmBg.on("pointerover", () => confirmBg.setFillStyle(COLORS.GOLD));
    confirmBg.on("pointerout",  () => confirmBg.setFillStyle(COLORS.GOLD_DARK));
    confirmBg.on("pointerdown", () => this._confirmSelection());

    this._updateCardVisuals();

    // Atajos de teclado
    this.input.keyboard?.on("keydown-UP", () => {
      this._selectedMode = INPUT_MODE.KEYBOARD;
      this._updateCardVisuals();
    });
    this.input.keyboard?.on("keydown-DOWN", () => {
      this._selectedMode = INPUT_MODE.MOUSE;
      this._updateCardVisuals();
    });
    this.input.keyboard?.on("keydown-ENTER", () => this._confirmSelection());
    this.input.keyboard?.on("keydown-SPACE", () => this._confirmSelection());
  }

  _createControlCard(x, y, w, h, title, iconStr, subtext, mode) {
    const bg = this.add.rectangle(x, y, w, h, COLORS.UI_PANEL, 0.95)
      .setStrokeStyle(4, COLORS.UI_BORDER)
      .setInteractive({ useHandCursor: true })
      .setDepth(DEPTHS.UI);

    const icon = this.add.text(x - w / 2 + 70, y, iconStr, {
      fontSize: "56px",
    }).setOrigin(0.5).setDepth(DEPTHS.UI + 1);

    const titleTxt = this.add.text(x + 20, y - 30, title, {
      fontFamily: FONTS.PRIMARY,
      fontSize: "28px",
      color: "#f0e6d3",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI + 1);

    const subTxt = this.add.text(x + 20, y + 25, subtext, {
      fontFamily: FONTS.PRIMARY,
      fontSize: "16px",
      color: "#6a4e8a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI + 1);

    const badge = this.add.rectangle(x + w / 2 - 40, y - h / 2 + 40, 28, 28, COLORS.BG_DARK)
      .setStrokeStyle(2, COLORS.GOLD_DARK)
      .setDepth(DEPTHS.UI + 1);

    const check = this.add.text(badge.x, badge.y, "✓", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "18px",
      color: "#4caf77",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI + 2).setVisible(false);

    bg.on("pointerdown", () => {
      this._selectedMode = mode;
      this._updateCardVisuals();
    });

    return { bg, titleTxt, subTxt, badge, check, mode };
  }

  _updateCardVisuals() {
    [this._cardKeyboard, this._cardMouse].forEach((card) => {
      const isSel = card.mode === this._selectedMode;
      card.bg.setStrokeStyle(4, isSel ? COLORS.GOLD : COLORS.UI_BORDER);
      card.bg.setFillStyle(isSel ? 0x3d245c : COLORS.UI_PANEL);
      card.titleTxt.setColor(isSel ? "#f0c040" : "#8a7a9a");
      card.subTxt.setColor(isSel ? "#f0e6d3" : "#5a4a6a");
      card.badge.setStrokeStyle(2, isSel ? COLORS.GOLD : COLORS.UI_BORDER);
      card.check.setVisible(isSel);
    });
  }

  _confirmSelection() {
    this.registry.set("inputMode", this._selectedMode);
    this._proceed();
  }

  _proceed() {
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      this.scene.start(SCENES.GUILD_REPORT);
    });
  }
}
