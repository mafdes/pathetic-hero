/**
 * StrengthScene.js — Prueba de Fuerza del Gremio (720×1280 HD Vertical)
 * MANTENER PRESIONADO (mecanismo original de presión sostenida con zonas de resistencia),
 * con anuncios del examinador, sabotajes y cuenta atrás con cadencia pausada.
 */

import * as Phaser from "phaser";
import {
  COLORS, FONTS, SCENES, TIMING, DEPTHS, CHALLENGES,
} from "../../utils/constants.js";
import { DialogBox } from "../../ui/DialogBox.js";
import { getVerdict } from "../../utils/helpers.js";

const FAIL_COMMENTS = [
  "No has levantado ni la sospecha del Tribunal.",
  "Esa piedra pesaba 2 kilos. Eres patético.",
  "La resistencia del peso destruyó tus débiles brazos.",
  "El yunque ganó por goleada.",
  "Soltaste el peso por pura cobardía muscular.",
];

const SUCCESS_COMMENTS = [
  "Fuerza bruta sin cerebro. Típico.",
  "Soportaste el peso. El Tribunal suspira decepcionado.",
  "Elevación aceptable. Tus músculos siguen siendo patéticos.",
];

const SABOTAGE_ANNOUNCEMENTS = {
  3:  "Nivel 3. Resistencia magnética variable.\nEl peso dará tirones bruscos hacia abajo.",
  5:  "Nivel 5. Grasa de cerdo en el agarre.\nLa barra resbalará si mantienes demasiada tensión.",
  7:  "Nivel 7. Oscilación de gravedad en la forja.\nEl medidor temblará salvajemente.",
  10: "Nivel 10. Peso del Gran Yunque Imperial.\nSolo un bárbaro de leyenda o un ingenuo lo intentaría.",
};

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
    this._power         = 0; // 0 a 100
    this._isPressing    = false;
    this._holdTimer     = 0;
    this._targetHold    = 2.0; // 2 segundos manteniendo arriba para ganar el nivel
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

    // HUD superior
    this.add.rectangle(W / 2, 55, W - 60, 80, COLORS.UI_PANEL, 0.95)
      .setStrokeStyle(3, 0xc42b1c).setDepth(DEPTHS.UI_BG);

    this.add.text(W / 2, 38, "SALA 03: FUERZA", {
      fontFamily: FONTS.PRIMARY, fontSize: "24px", color: "#ff4444", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this._levelText = this.add.text(W / 2, 74, "NIVEL 1 / 20", {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#f0e6d3", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(W / 2, 160, "MANTÉN PRESIONADO para empujar la roca\ny sostenerla en la zona superior rojas", {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#ff8888", resolution: 2, align: "center", lineSpacing: 8,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // Medidor Vertical de Fuerza
    const mX = W / 2;
    const mY = H / 2 - 30;
    const mW = 90;
    const mH = 400;

    this._mX = mX;
    this._mY = mY;
    this._mH = mH;

    this.add.rectangle(mX, mY, mW + 16, mH + 16, COLORS.BG_DARK, 1)
      .setStrokeStyle(4, 0xc42b1c).setDepth(DEPTHS.UI_BG);

    this._barBg = this.add.rectangle(mX, mY, mW, mH, 0x240c09, 1).setDepth(DEPTHS.UI_BG + 1);

    // Zona objetivo de victoria arriba (top 25% del medidor)
    this._topZone = this.add.rectangle(mX, mY - mH / 2 + 50, mW - 8, 100, 0x882222, 0.6)
      .setDepth(DEPTHS.UI);

    // Relleno de potencia que sube
    this._powerFill = this.add.rectangle(mX, mY + mH / 2, mW - 8, 0, 0xff4444, 1)
      .setOrigin(0.5, 1).setDepth(DEPTHS.UI);

    // Indicadores
    const inputMode = this.registry.get("inputMode") ?? "keyboard";
    let hintText = "[ MANTÉN PRESIONADO ESPACIO ]";
    if (inputMode === "mouse") hintText = "[ MANTÉN PRESIONADO CLICK ]";
    else if (inputMode === "touch") hintText = "[ MANTÉN PRESIONADA LA PANTALLA ]";

    this.add.text(W / 2, mY + mH / 2 + 50, hintText, {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#ff8888", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // Telón Oscuro desde frame 1
    this._coverPanel = this.add.rectangle(W / 2, H / 2, W, H, 0x1a0d0a, 0.98)
      .setDepth(250).setVisible(true);

    // Cuenta atrás gigante
    this._countdownText = this.add.text(W / 2, H / 2, "", {
      fontFamily: FONTS.PRIMARY, fontSize: "120px", color: "#ff4444", resolution: 2,
    }).setOrigin(0.5).setDepth(251).setVisible(false);

    this._dialog = new DialogBox(this);

    // Gestor de eventos Mantener Presionado
    this.input.keyboard?.on("keydown-SPACE", () => {
      if (this._dialog.isVisible()) { this._dialog.advance(); return; }
      this._isPressing = true;
    });
    this.input.keyboard?.on("keyup-SPACE", () => { this._isPressing = false; });

    this.input.on("pointerdown", () => {
      if (this._dialog.isVisible()) { this._dialog.advance(); return; }
      this._isPressing = true;
    });
    this.input.on("pointerup", () => { this._isPressing = false; });

    this.time.delayedCall(300, () => this._beginLevel());
  }

  _beginLevel() {
    const announcement = SABOTAGE_ANNOUNCEMENTS[this._currentLevel];
    if (announcement) {
      this._coverPanel.setVisible(true);
      this._dialog.show(announcement, () => this._prepareLevel(), "Examinador Rotval");
    } else {
      this._prepareLevel();
    }
  }

  _prepareLevel() {
    if (!this._alive) return;
    this._power = 0;
    this._holdTimer = 0;
    this._isPressing = false;
    this._levelText.setText(`NIVEL  ${this._currentLevel} / 20`);
    this._inCountdown = true;
    this._coverPanel.setVisible(true);

    this._runCountdown(() => {
      this._coverPanel.setVisible(false);
      this._inCountdown = false;
      this._levelTime = 6.0; // 6 segundos de tiempo límite total
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
      const text = steps[i];
      const isYa = text === "¡YA!";
      this._countdownText.setText(text)
        .setColor(isYa ? "#ff4444" : "#d4a017")
        .setScale(1.3)
        .setVisible(true);

      this.tweens.add({
        targets: this._countdownText,
        scale: 1.0,
        duration: isYa ? 200 : 350,
        ease: "Quad.easeOut",
        onComplete: () => {
          i++;
          this.time.delayedCall(isYa ? 150 : 350, next);
        },
      });
    };
    next();
  }

  update(time, delta) {
    if (!this._alive || this._inCountdown || this._dialog.isVisible()) return;

    const dt = delta / 1000;
    const level = this._currentLevel;

    // Resistencia del peso (caída)
    const gravityDrop = 35 + level * 3.5;
    // Potencia al mantener presionado
    const pushPower   = 65 + level * 2.0;

    if (this._isPressing) {
      this._power = Math.min(100, this._power + pushPower * dt);
    } else {
      this._power = Math.max(0, this._power - gravityDrop * dt);
    }

    // Sabotaje: Tirones bruscos a partir de Nivel 3
    if (level >= 3 && Phaser.Math.Between(0, 100) < 3) {
      this._power = Math.max(0, this._power - 8);
      this.cameras.main.shake(150, 0.005);
    }

    this._levelTime -= dt;

    const mH = this._mH;
    const fillH = (this._power / 100) * mH;
    this._powerFill.setSize(90 - 8, fillH);

    // Comprobar si está en la zona superior de victoria (>= 75%)
    if (this._power >= 75) {
      this._holdTimer += dt;
      if (this._holdTimer >= this._targetHold) {
        this._passLevel();
        return;
      }
    } else {
      this._holdTimer = Math.max(0, this._holdTimer - dt);
    }

    // Límite de tiempo agotado sin sostener el peso
    if (this._levelTime <= 0) {
      this._failLevel();
    }
  }

  _passLevel() {
    if (this._inCountdown || !this._alive) return;
    this._inCountdown = true;
    this._score = this._currentLevel;
    if (this._currentLevel >= this._maxLevels) {
      this._endGame(true);
      return;
    }
    this._currentLevel++;
    this.cameras.main.flash(150, 255, 68, 68, true);
    this.time.delayedCall(250, () => this._beginLevel());
  }

  _failLevel() {
    this._alive = false;
    this._coverPanel.setVisible(true);
    const comment = Phaser.Math.RND.pick(FAIL_COMMENTS);
    this._dialog.show(`FIN DE LA PRUEBA\n\n${comment}\n\nPuntuación: ${this._score} / 20\n\n${getVerdict(this._score)}`, () => {
      this._returnToReport(this._score);
    }, "Examinador Rotval");
  }

  _endGame(perfect = false) {
    this._alive = false;
    this._coverPanel.setVisible(true);
    const finalScore = this._score;
    this._dialog.show(`¡FUERZA TITÁNICA!\n\nPuntuación: ${finalScore} / 20\n\n${getVerdict(finalScore)}`, () => {
      this._returnToReport(finalScore);
    }, "Examinador Rotval");
  }

  _returnToReport(score) {
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      this.scene.start(SCENES.GUILD_REPORT, { challenge: this._challenge, score, sheet: this._sheetData });
    });
  }
}
