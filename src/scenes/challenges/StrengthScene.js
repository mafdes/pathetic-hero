/**
 * StrengthScene.js — Prueba de Fuerza del Gremio (720×1280 HD Vertical)
 * Sala retro pixel art: "La Forja del Levantamiento".
 */

import * as Phaser from "phaser";
import {
  COLORS, FONTS, SCENES, TIMING, DEPTHS, CHALLENGES,
} from "../../utils/constants.js";
import { DialogBox } from "../../ui/DialogBox.js";

const FAIL_COMMENTS = [
  "No has levantado ni la sospecha del Tribunal.",
  "Esa piedra pesaba 2 kilos. Eres patético.",
  "Machacar botones se te da peor que existir.",
  "El yunque ganó por goleada.",
];

export class StrengthScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.STRENGTH });
  }

  init(data) {
    this._challenge     = data?.challenge ?? CHALLENGES.STRENGTH;
    this._sheetData     = data?.sheet ?? null;
    this._currentLevel  = 1;
    this._maxLevels     = 20;
    this._alive         = true;
    this._inCountdown   = true;
    this._score         = 0;
    this._power         = 0;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(0x1a0d0a);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // Fondo Sala de Forja
    const gfx = this.add.graphics().setDepth(DEPTHS.BG);
    gfx.fillStyle(0x140705, 1);
    gfx.fillRect(0, 0, W, H);
    gfx.fillStyle(0x38130d, 1);
    gfx.fillRect(0, 0, 30, H);
    gfx.fillRect(W - 30, 0, 30, H);

    // HUD
    this.add.rectangle(W / 2, 55, W - 60, 80, COLORS.UI_PANEL, 0.95)
      .setStrokeStyle(3, 0xc42b1c).setDepth(DEPTHS.UI_BG);

    this.add.text(W / 2, 38, "SALA 03: FUERZA", {
      fontFamily: FONTS.PRIMARY, fontSize: "24px", color: "#ff4444", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this._levelText = this.add.text(W / 2, 74, "NIVEL 1 / 20", {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#f0e6d3", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(W / 2, 175, "MACHACA LA TECLA / CLICK\npara levantar la roca sagrada", {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#ff8888", resolution: 2, align: "center", lineSpacing: 8,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // Medidor de Potencia
    const mX = W / 2;
    const mY = H / 2;
    const mW = 90;
    const mH = 440;

    this.add.rectangle(mX, mY, mW + 16, mH + 16, COLORS.BG_DARK, 1)
      .setStrokeStyle(4, 0xc42b1c).setDepth(DEPTHS.UI_BG);

    this._barBg = this.add.rectangle(mX, mY, mW, mH, 0x240c09, 1).setDepth(DEPTHS.UI_BG + 1);

    // Relleno de potencia
    this._powerFill = this.add.rectangle(mX, mY + mH / 2, mW - 8, 0, 0xff4444, 1)
      .setOrigin(0.5, 1).setDepth(DEPTHS.UI);

    // Indicadores
    const inputMode = this.registry.get("inputMode") ?? "keyboard";
    let hintText = "[ MACHACA ESPACIO ]";
    if (inputMode === "mouse") hintText = "[ MACHACA CLICK ]";
    else if (inputMode === "touch") hintText = "[ MACHACA LA PANTALLA ]";

    this.add.text(W / 2, mY + mH / 2 + 50, hintText, {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#ff8888", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // Telón y Cuenta Atrás
    this._coverPanel = this.add.rectangle(W / 2, H / 2, W, H, 0x1a0d0a, 0.95)
      .setDepth(250).setVisible(false);

    this._countdownText = this.add.text(W / 2, H / 2, "", {
      fontFamily: FONTS.PRIMARY, fontSize: "120px", color: "#ff4444", resolution: 2,
    }).setOrigin(0.5).setDepth(251).setVisible(false);

    this._dialog = new DialogBox(this);

    this.input.keyboard?.on("keydown-SPACE", () => this._onMash());
    this.input.on("pointerdown", () => this._onMash());

    this.time.delayedCall(400, () => this._beginLevel());
  }

  _beginLevel() {
    if (!this._alive) return;
    this._power = 0;
    this._levelText.setText(`NIVEL  ${this._currentLevel} / 20`);
    this._inCountdown = true;
    this._coverPanel.setVisible(true);

    this._runCountdown(() => {
      this._coverPanel.setVisible(false);
      this._inCountdown = false;
      this._levelTime = 4.5;
    });
  }

  _runCountdown(onComplete) {
    const steps = ["3", "2", "1", "¡YA!"];
    let i = 0;
    const next = () => {
      if (!this._alive) return;
      if (i >= steps.length) {
        this._countdownText.setVisible(false);
        if (onComplete) onComplete();
        return;
      }
      this._countdownText.setText(steps[i]).setVisible(true);
      i++;
      this.time.delayedCall(300, next);
    };
    next();
  }

  _onMash() {
    if (!this._alive || this._inCountdown || this._dialog.isVisible()) return;
    this._power = Math.min(100, this._power + (9 - this._currentLevel * 0.3));
    if (this._power >= 100) {
      this._passLevel();
    }
  }

  update(time, delta) {
    if (!this._alive || this._inCountdown || this._dialog.isVisible()) return;

    const dt = delta / 1000;
    this._power = Math.max(0, this._power - (28 + this._currentLevel * 4) * dt);
    this._levelTime -= dt;

    const mH = 440;
    const fillH = (this._power / 100) * mH;
    this._powerFill.setSize(90 - 8, fillH);

    if (this._levelTime <= 0) {
      this._failLevel();
    }
  }

  _passLevel() {
    this._score = this._currentLevel;
    if (this._currentLevel >= this._maxLevels) {
      this._endGame(true);
      return;
    }
    this._currentLevel++;
    this.cameras.main.flash(150, 255, 68, 68, true);
    this._beginLevel();
  }

  _failLevel() {
    this._alive = false;
    this._coverPanel.setVisible(true);
    const comment = Phaser.Math.RND.pick(FAIL_COMMENTS);
    this._dialog.show(`FIN DE LA PRUEBA\n\n${comment}\n\nPuntuación: ${this._score} / 20`, () => {
      this.scene.start(SCENES.GUILD_REPORT, { challenge: this._challenge, score: this._score, sheet: this._sheetData });
    }, "Examinador Rotval");
  }

  _endGame(perfect = false) {
    this._alive = false;
    this._coverPanel.setVisible(true);
    this._dialog.show(`¡FUERZA TITÁNICA!\n\nPuntuación: ${this._score} / 20`, () => {
      this.scene.start(SCENES.GUILD_REPORT, { challenge: this._challenge, score: this._score, sheet: this._sheetData });
    }, "Examinador Rotval");
  }
}
