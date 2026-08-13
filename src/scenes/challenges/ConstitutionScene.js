/**
 * ConstitutionScene.js — Prueba de Constitución del Gremio (720×1280 HD Vertical)
 * Cámara de Ensayos Tóxicos con sabotajes del examinador y cuenta atrás con telón.
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
    this._zoneT         = 0;
    this._jitterTimer   = null;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(0x0a1a0f);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // Fondo Sala de Alquimia / Resistencia
    const gfx = this.add.graphics().setDepth(DEPTHS.BG);
    gfx.fillStyle(0x051409, 1);
    gfx.fillRect(0, 0, W, H);
    gfx.fillStyle(0x13381b, 1);
    gfx.fillRect(0, 0, 30, H);
    gfx.fillRect(W - 30, 0, 30, H);

    // HUD
    this.add.rectangle(W / 2, 55, W - 60, 80, COLORS.UI_PANEL, 0.95)
      .setStrokeStyle(3, 0x2d6a4f).setDepth(DEPTHS.UI_BG);

    this.add.text(W / 2, 38, "SALA 02: CONSTITUCIÓN", {
      fontFamily: FONTS.PRIMARY, fontSize: "24px", color: "#4caf77", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this._levelText = this.add.text(W / 2, 74, "NIVEL 1 / 20", {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#f0e6d3", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(W / 2, 175, "PULSA para mantener el nivel dentro\nde la zona segura de salud", {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#8abf9e", resolution: 2, align: "center", lineSpacing: 8,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // Medidor Vertical de Resistencia
    const mX = W / 2;
    const mY = H / 2 - 20;
    const mW = 76;
    const mH = 440;

    this._mX = mX;
    this._mY = mY;
    this._mH = mH;

    this.add.rectangle(mX, mY, mW + 16, mH + 16, COLORS.BG_DARK, 1)
      .setStrokeStyle(4, 0x2d6a4f).setDepth(DEPTHS.UI_BG);

    this._gaugeBg = this.add.rectangle(mX, mY, mW, mH, 0x112215, 1)
      .setDepth(DEPTHS.UI_BG + 1);

    // Zona Segura
    this._targetZone = this.add.rectangle(mX, mY, mW - 8, 120, 0x2d6a4f, 0.7)
      .setDepth(DEPTHS.UI);

    // Aguja / Nivel de Toxina
    this._needle = this.add.rectangle(mX, mY, mW - 4, 18, 0x4caf77, 1)
      .setDepth(DEPTHS.UI + 1);

    // Hint Control
    const inputMode = this.registry.get("inputMode") ?? "keyboard";
    let hintText = "[ ESPACIO ]";
    if (inputMode === "mouse") hintText = "[ CLICK IZQUIERDO ]";
    else if (inputMode === "touch") hintText = "[ TOCA LA PANTALLA ]";

    this.add.text(W / 2, mY + mH / 2 + 50, hintText, {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#5a5a8a", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // Telón Oscuro con Opacidad para Cuenta Atrás y Diálogos
    this._coverPanel = this.add.rectangle(W / 2, H / 2, W, H, 0x0a1a0f, 0.95)
      .setDepth(250).setVisible(false);

    // Cuenta atrás gigante (120px) en el centro
    this._countdownText = this.add.text(W / 2, H / 2, "", {
      fontFamily: FONTS.PRIMARY, fontSize: "120px", color: "#4caf77", resolution: 2,
    }).setOrigin(0.5).setDepth(251).setVisible(false);

    // Diálogo Modal del Examinador
    this._dialog = new DialogBox(this);

    this.input.keyboard?.on("keydown-SPACE", () => this._onTap());
    this.input.on("pointerdown", () => this._onTap());

    this.time.delayedCall(400, () => this._beginLevel());
  }

  _beginLevel() {
    const announcement = SABOTAGE_ANNOUNCEMENTS[this._currentLevel];
    if (announcement) {
      this._dialog.show(announcement, () => this._prepareLevel(), "Examinador Rotval");
    } else {
      this._prepareLevel();
    }
  }

  _prepareLevel() {
    if (!this._alive) return;
    this._gaugeVal = 50;
    this._zoneT = 0;
    this._targetZone.setY(this._mY);
    this._levelText.setText(`NIVEL  ${this._currentLevel} / 20`);
    this._inCountdown = true;

    this._runCountdown(() => {
      this._inCountdown = false;
      this._holdTime = 0;

      // Calambre muscular tremolo a partir de Nivel 5
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
          this.time.delayedCall(isYa ? 150 : 350, next);
        },
      });
    };
    next();
  }

  _triggerTremor() {
    if (!this._alive || this._inCountdown) return;
    // Temblor involuntario
    this.cameras.main.shake(300, 0.008);
    this._gaugeVal = Phaser.Math.Clamp(this._gaugeVal + Phaser.Math.Between(-15, 15), 10, 90);
  }

  _onTap() {
    if (!this._alive || this._inCountdown || this._dialog.isVisible()) return;
    this._gaugeVal = Math.min(100, this._gaugeVal + 16);
  }

  update(time, delta) {
    if (!this._alive || this._inCountdown || this._dialog.isVisible()) return;

    const dt = delta / 1000;
    const level = this._currentLevel;

    // Empuje constante de la toxina
    const decaySpeed = 22 + level * 2.5;
    this._gaugeVal = Math.max(0, this._gaugeVal - decaySpeed * dt);

    const mH = this._mH;
    const minY = this._mY - mH / 2 + 10;
    const maxY = this._mY + mH / 2 - 10;
    const nY = maxY - (this._gaugeVal / 100) * (maxY - minY);

    this._needle.setY(nY);

    // Sabotaje: Movimiento oscilante de la zona segura a partir de Nivel 7
    if (level >= 7) {
      this._zoneT += dt;
      const offset = Math.sin(this._zoneT * (1.5 + level * 0.2)) * (40 + level * 5);
      this._targetZone.setY(this._mY + offset);
    }

    // Comprobar si la aguja está en zona segura
    const tzTop = this._targetZone.y - this._targetZone.height / 2;
    const tzBot = this._targetZone.y + this._targetZone.height / 2;

    if (nY >= tzTop && nY <= tzBot) {
      this._holdTime = (this._holdTime || 0) + dt;
      if (this._holdTime >= 1.8) {
        this._passLevel();
      }
    } else {
      if (this._gaugeVal <= 2 || this._gaugeVal >= 98) {
        this._failLevel();
      }
    }
  }

  _passLevel() {
    this._score = this._currentLevel;
    if (this._currentLevel >= this._maxLevels) {
      this._endGame(true);
      return;
    }
    this._currentLevel++;
    this.cameras.main.flash(150, 76, 175, 119, true);
    this._beginLevel();
  }

  _failLevel() {
    this._alive = false;
    this._coverPanel.setVisible(true);
    const comment = Phaser.Math.RND.pick(FAIL_COMMENTS);
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
