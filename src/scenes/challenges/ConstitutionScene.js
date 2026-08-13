/**
 * ConstitutionScene.js — Prueba de Constitución del Gremio (720×1280 HD Vertical)
 * Barra de tiempo horizontal debajo del medidor, transición de nivel protegida contra bucles.
 */

import * as Phaser from "phaser";
import {
  COLORS, FONTS, SCENES, TIMING, DEPTHS, CHALLENGES,
} from "../../utils/constants.js";
import { DialogBox } from "../../ui/DialogBox.js";
import { getVerdict } from "../../utils/helpers.js";

const FAIL_COMMENTS = [
  "Tu sistema inmunológico es un chiste.",
  "El veneno ni tuvo que esforzarse.",
  "Desmayado en 3 segundos. Récord del Gremio.",
  "Un moco tiene más resistencia biológica.",
  "Estómago de mantequilla. El Tribunal anota: rechazado.",
];

const OVERDOSE_COMMENTS = [
  "¡SOBREDOSIS! Exceso de presión pulmonar.",
  "¡Explosión arterial! Te pasaste machacando por arriba.",
  "Hiperventilación crítica. Tu cuerpo no soportó el exceso.",
];

const SUCCESS_COMMENTS = [
  "Inexplicablemente sigues respirando.",
  "Tus pulmones de acero ocultan un cerebro de corcho.",
  "Soportaste la toxina. El Tribunal está decepcionado.",
  "Lamentablemente, has sobrevivido.",
];

const SABOTAGE_ANNOUNCEMENTS = {
  3:  "Nivel 3. Fuga de gas neurotóxico verde.\nInhale profundamente. Es por el procedimiento.",
  5:  "Nivel 5. Calambre muscular inducido.\nSus brazos empezarán a temblar involuntariamente.",
  7:  "Nivel 7. Desplazamiento de la dosis segura.\nLa zona de equilibrio ya no está fija.",
  10: "Nivel 10. Sobredosis de toxina experimental.\nSuperarlo sería un insulto a la ciencia del Gremio.",
};

export class ConstitutionScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.CONSTITUTION });
  }

  init(data) {
    this._challenge     = data?.challenge ?? CHALLENGES.CONSTITUTION;
    this._sheetData     = data?.sheet ?? null;
    this._currentLevel  = 1;
    this._maxLevels     = 20;
    this._alive         = true;
    this._inCountdown   = true;
    this._score         = 0;
    this._gaugeVal      = 50; // 0 a 100
    this._holdTime      = 0;  // 0 a 1.8 segundos
    this._requiredHold  = 1.8;
    this._zoneT         = 0;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(0x0a1a0f);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // Fondo Sala de Alquimia
    const gfx = this.add.graphics().setDepth(DEPTHS.BG);
    gfx.fillStyle(0x051409, 1);
    gfx.fillRect(0, 0, W, H);
    gfx.fillStyle(0x13381b, 1);
    gfx.fillRect(0, 0, 30, H);
    gfx.fillRect(W - 30, 0, 30, H);

    // HUD superior
    this.add.rectangle(W / 2, 55, W - 60, 80, COLORS.UI_PANEL, 0.95)
      .setStrokeStyle(3, 0x2d6a4f).setDepth(DEPTHS.UI_BG);

    this.add.text(W / 2, 38, "SALA 02: CONSTITUCIÓN", {
      fontFamily: FONTS.PRIMARY, fontSize: "24px", color: "#4caf77", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this._levelText = this.add.text(W / 2, 74, "NIVEL 1 / 20", {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#f0e6d3", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(W / 2, 160, "MANTÉN la aguja en la ZONA VERDE\n¡No te pases por arriba ni por abajo!", {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#8abf9e", resolution: 2, align: "center", lineSpacing: 8,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // Medidor Vertical Principal Centrado
    const mX = W / 2;
    const mY = H / 2 - 30;
    const mW = 86;
    const mH = 420;

    this._mX = mX;
    this._mY = mY;
    this._mH = mH;

    this.add.rectangle(mX, mY, mW + 16, mH + 16, COLORS.BG_DARK, 1)
      .setStrokeStyle(4, 0x2d6a4f).setDepth(DEPTHS.UI_BG);

    this._gaugeBg = this.add.rectangle(mX, mY, mW, mH, 0x112215, 1)
      .setDepth(DEPTHS.UI_BG + 1);

    // Límites de Sobredosis y Colapso
    this.add.text(mX + mW / 2 + 15, mY - mH / 2 + 10, "◄ SOBREDOSIS", {
      fontFamily: FONTS.PRIMARY, fontSize: "12px", color: "#ff4444", resolution: 2,
    }).setOrigin(0, 0.5).setDepth(DEPTHS.UI);

    this.add.text(mX + mW / 2 + 15, mY + mH / 2 - 10, "◄ COLAPSO", {
      fontFamily: FONTS.PRIMARY, fontSize: "12px", color: "#ff4444", resolution: 2,
    }).setOrigin(0, 0.5).setDepth(DEPTHS.UI);

    // Zona Segura
    this._targetZone = this.add.rectangle(mX, mY, mW - 8, 120, 0x2d6a4f, 0.7)
      .setDepth(DEPTHS.UI);

    // Aguja
    this._needle = this.add.rectangle(mX, mY, mW - 4, 18, 0x4caf77, 1)
      .setDepth(DEPTHS.UI + 1);

    // ── Barra de Progreso del Tiempo en Zona (HORIZONTAL DEBAJO) ────────────
    const pX = W / 2;
    const pY = mY + mH / 2 + 45;
    const pW = 500;
    const pH = 26;

    this.add.text(pX, pY - 24, "ESTABILIDAD EN ZONA SEGUDA", {
      fontFamily: FONTS.PRIMARY, fontSize: "12px", color: "#4caf77", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.rectangle(pX, pY, pW + 8, pH + 8, COLORS.BG_DARK, 1)
      .setStrokeStyle(3, 0x2d6a4f).setDepth(DEPTHS.UI_BG);

    this.add.rectangle(pX, pY, pW, pH, 0x09170c, 1).setDepth(DEPTHS.UI_BG + 1);

    this._progressFill = this.add.rectangle(pX - pW / 2, pY, 0, pH - 4, 0x4caf77, 1)
      .setOrigin(0, 0.5).setDepth(DEPTHS.UI);

    // Hint Control
    const inputMode = this.registry.get("inputMode") ?? "keyboard";
    let hintText = "[ ESPACIO ]";
    if (inputMode === "mouse") hintText = "[ CLICK IZQUIERDO ]";
    else if (inputMode === "touch") hintText = "[ TOCA LA PANTALLA ]";

    this.add.text(W / 2, pY + 45, hintText, {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#5a5a8a", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // Telón Oscuro desde el primer frame de carga
    this._coverPanel = this.add.rectangle(W / 2, H / 2, W, H, 0x0a1a0f, 0.98)
      .setDepth(250)
      .setVisible(true);

    // Cuenta atrás gigante
    this._countdownText = this.add.text(W / 2, H / 2, "", {
      fontFamily: FONTS.PRIMARY, fontSize: "120px", color: "#4caf77", resolution: 2,
    }).setOrigin(0.5).setDepth(251).setVisible(false);

    // Diálogo Modal
    this._dialog = new DialogBox(this);

    this.input.keyboard?.on("keydown-SPACE", () => this._onTap());
    this.input.on("pointerdown", () => this._onTap());

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
    this._gaugeVal = 50;
    this._holdTime = 0;
    this._zoneT    = 0;
    this._targetZone.setY(this._mY);
    this._levelText.setText(`NIVEL  ${this._currentLevel} / 20`);
    this._inCountdown = true;
    this._progressFill.setSize(0, 22);

    this._coverPanel.setVisible(true);

    this._runCountdown(() => {
      this._coverPanel.setVisible(false);
      this._inCountdown = false;
      this._holdTime = 0;

      if (this._currentLevel >= 5) {
        this._triggerTremor();
      }
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
        .setColor(isYa ? "#4caf77" : "#d4a017")
        .setScale(1.3)
        .setVisible(true);

      this.tweens.add({
        targets: this._countdownText,
        scale: 1.0,
        duration: isYa ? 200 : 350,
        ease: "Quad.easeOut",
        onComplete: () => {
          i++;
          this.time.delayedCall(isYa ? 150 : 300, next);
        },
      });
    };
    next();
  }

  _triggerTremor() {
    if (!this._alive || this._inCountdown) return;
    this.cameras.main.shake(300, 0.008);
    this._gaugeVal = Phaser.Math.Clamp(this._gaugeVal + Phaser.Math.Between(-14, 14), 15, 85);
  }

  _onTap() {
    if (!this._alive || this._inCountdown || this._dialog.isVisible()) return;
    this._gaugeVal = Math.min(100, this._gaugeVal + 14);
  }

  update(time, delta) {
    if (!this._alive || this._inCountdown || this._dialog.isVisible()) return;

    const dt = delta / 1000;
    const level = this._currentLevel;

    // Empuje constante hacia abajo
    const decaySpeed = 20 + level * 2.2;
    this._gaugeVal -= decaySpeed * dt;

    // Sobredosis (>= 96) o Colapso (<= 4)
    if (this._gaugeVal >= 96) {
      this._failLevel("overdose");
      return;
    }
    if (this._gaugeVal <= 4) {
      this._failLevel("collapse");
      return;
    }

    const mH = this._mH;
    const minY = this._mY - mH / 2 + 10;
    const maxY = this._mY + mH / 2 - 10;
    const nY = maxY - (this._gaugeVal / 100) * (maxY - minY);

    this._needle.setY(nY);

    // Oscilación de la zona segura a partir de Nivel 7
    if (level >= 7) {
      this._zoneT += dt;
      const offset = Math.sin(this._zoneT * (1.2 + level * 0.15)) * (30 + level * 4);
      this._targetZone.setY(this._mY + offset);
    }

    // Comprobar si está en zona segura
    const tzTop = this._targetZone.y - this._targetZone.height / 2;
    const tzBot = this._targetZone.y + this._targetZone.height / 2;

    if (nY >= tzTop && nY <= tzBot) {
      this._holdTime += dt;
      if (this._holdTime >= this._requiredHold) {
        this._passLevel();
        return;
      }
    } else {
      this._holdTime = Math.max(0, this._holdTime - dt * 2.5);
    }

    // Actualizar barra de progreso HORIZONTAL de estabilidad
    const ratio = Math.min(1.0, Math.max(0, this._holdTime / this._requiredHold));
    const fillW = ratio * 496;
    this._progressFill.setSize(fillW, 22);
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
    this.cameras.main.flash(150, 76, 175, 119, true);
    this.time.delayedCall(250, () => this._beginLevel());
  }

  _failLevel(reason = "collapse") {
    this._alive = false;
    this._coverPanel.setVisible(true);

    let comment = Phaser.Math.RND.pick(FAIL_COMMENTS);
    if (reason === "overdose") {
      comment = Phaser.Math.RND.pick(OVERDOSE_COMMENTS);
    }

    this._dialog.show(`FIN DE LA PRUEBA\n\n${comment}\n\nPuntuación: ${this._score} / 20\n\n${getVerdict(this._score)}`, () => {
      this.scene.start(SCENES.GUILD_REPORT, { challenge: this._challenge, score: this._score, sheet: this._sheetData });
    }, "Examinador Rotval");
  }

  _endGame(perfect = false) {
    this._alive = false;
    this._coverPanel.setVisible(true);
    this._dialog.show(`¡RESISTENCIA SUPERADA!\n\nPuntuación: ${this._score} / 20\n\n${getVerdict(this._score)}`, () => {
      this.scene.start(SCENES.GUILD_REPORT, { challenge: this._challenge, score: this._score, sheet: this._sheetData });
    }, "Examinador Rotval");
  }
}
