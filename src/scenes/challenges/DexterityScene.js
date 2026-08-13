/**
 * DexterityScene.js — Prueba de Destreza (960×540)
 */

import * as Phaser from "phaser";
import {
  COLORS, FONTS, FONT_SIZES, SCENES, TIMING, DEPTHS, CHALLENGES,
} from "../../utils/constants.js";
import { DialogBox } from "../../ui/DialogBox.js";
import { getVerdict } from "../../utils/helpers.js";

const FAIL_COMMENTS = [
  "Impresionante. Incluso los ciegos lo hacen mejor.",
  "¿Estás seguro de que tienes manos?",
  "Eso no fue un intento. Eso fue un insulto.",
  "Mi abuela con artritis supera eso. Estaba muerta.",
  "El Tribunal anota: coordinación nula.",
];

const SUCCESS_COMMENTS = [
  "Suerte de principiante. No se repetirá.",
  "Aceptable. Para un campesino.",
  "Hmmm. Quizás hay algo ahí. Probablemente no.",
  "El Tribunal toma nota. Con escepticismo.",
];

export class DexterityScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.DEXTERITY });
  }

  init(data) {
    this._challenge  = data?.challenge ?? CHALLENGES.DEXTERITY;
    this._sheetData  = data?.sheet ?? null;
    this._currentLevel = 1;
    this._maxLevels    = 20;
    this._alive        = true;
    this._inputCooldown = false;
    this._score        = 0;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(COLORS.BG_DEEP);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // ── HUD superior ──────────────────────────────────────────────────────────
    this.add.rectangle(W / 2, 28, W, 56, COLORS.UI_PANEL, 0.9).setDepth(DEPTHS.UI_BG);

    this.add.text(24, 28, "PRUEBA: DESTREZA", {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.BODY,
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0, 0.5).setDepth(DEPTHS.UI);

    this._levelText = this.add.text(W - 24, 28, "NIVEL  1 / 20", {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.BODY,
      color: "#f0e6d3",
      resolution: 2,
    }).setOrigin(1, 0.5).setDepth(DEPTHS.UI);

    // Instrucción
    this.add.text(W / 2, 80, "PULSA cuando el cursor cruce la zona dorada", {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.SMALL,
      color: "#6a4e8a",
      resolution: 2,
      align: "center",
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── Barra de precisión ────────────────────────────────────────────────────
    const barY = H / 2 - 20;
    const barW = W - 120;
    const barH = 42;
    const barX = 60;

    // Marco
    this.add.rectangle(W / 2, barY, barW, barH, COLORS.BG_STONE, 1)
      .setStrokeStyle(2, COLORS.GOLD_DARK).setDepth(DEPTHS.UI_BG);

    // Zona dorada
    this._goldZone = this.add.rectangle(W / 2, barY, 0, barH - 6, COLORS.GOLD, 0.55)
      .setDepth(DEPTHS.UI);

    // Señuelos (aparecen en niveles altos)
    this._decoyLeft  = this.add.rectangle(0, barY, 0, barH - 6, COLORS.DANGER, 0.45)
      .setDepth(DEPTHS.UI).setVisible(false);
    this._decoyRight = this.add.rectangle(0, barY, 0, barH - 6, COLORS.DANGER, 0.45)
      .setDepth(DEPTHS.UI).setVisible(false);

    // Indicador (cursor móvil)
    this._indicator = this.add.rectangle(barX, barY, 10, barH, COLORS.WHITE, 1)
      .setDepth(DEPTHS.UI);

    this._barX = barX;
    this._barW = barW;
    this._barY = barY;
    this._barH = barH;

    // Etiquetas de la barra
    this.add.text(barX - 10, barY, "◄", {
      fontFamily: FONTS.PRIMARY, fontSize: FONT_SIZES.SMALL, color: "#3d3d6b", resolution: 2,
    }).setOrigin(1, 0.5).setDepth(DEPTHS.UI);
    this.add.text(barX + barW + 10, barY, "►", {
      fontFamily: FONTS.PRIMARY, fontSize: FONT_SIZES.SMALL, color: "#3d3d6b", resolution: 2,
    }).setOrigin(0, 0.5).setDepth(DEPTHS.UI);

    // ── Hint de control ───────────────────────────────────────────────────────
    this.add.text(W / 2, barY + 52, "[ ESPACIO  /  Z  /  CLICK ]", {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.SMALL,
      color: "#5a5a8a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── Diálogo del Examinador ────────────────────────────────────────────────
    this._dialog = new DialogBox(this, {
      y: H - 160,
      height: 140,
      speaker: "Examinador Rotval",
    });

    // ── Input ─────────────────────────────────────────────────────────────────
    this.input.keyboard?.on("keydown-SPACE", () => this._onAction());
    this.input.keyboard?.on("keydown-Z",     () => this._onAction());
    this.input.on("pointerdown",             () => this._onAction());

    this.time.delayedCall(400, () => this._startLevel());
  }

  _getLevelConfig(level) {
    const t = (level - 1) / 19;
    const barW     = this._barW;
    const goldWidth = Math.max(24, Math.round(barW * 0.20 - t * barW * 0.14));
    const speed     = 180 + t * 540; // px/s: 180 → 720
    const hasDecoys = level >= 8;
    const goldOffset = level >= 5
      ? Phaser.Math.Between(-Math.floor(barW * 0.22), Math.floor(barW * 0.22))
      : 0;
    return { goldWidth, speed, hasDecoys, goldOffset };
  }

  _startLevel() {
    if (!this._alive) return;

    const { goldWidth, speed, hasDecoys, goldOffset } = this._getLevelConfig(this._currentLevel);
    const cx = this.scale.width / 2;

    this._goldZone.setX(cx + goldOffset).setWidth(goldWidth);

    if (hasDecoys) {
      const dw = Math.max(18, goldWidth - 8);
      this._decoyLeft .setX(cx - this._barW * 0.30).setWidth(dw).setVisible(true);
      this._decoyRight.setX(cx + this._barW * 0.30).setWidth(dw).setVisible(true);
    } else {
      this._decoyLeft.setVisible(false);
      this._decoyRight.setVisible(false);
    }

    this._indicatorX  = this._barX;
    this._indicatorDir = 1;
    this._speed        = speed;
    this._inputCooldown = false;
    this._levelText.setText(`NIVEL  ${this._currentLevel} / 20`);
  }

  update(time, delta) {
    if (!this._alive || this._dialog.isVisible()) return;

    const dt = delta / 1000;
    this._indicatorX += this._speed * this._indicatorDir * dt;

    if (this._indicatorX >= this._barX + this._barW - 5) {
      this._indicatorX  = this._barX + this._barW - 5;
      this._indicatorDir = -1;
    } else if (this._indicatorX <= this._barX) {
      this._indicatorX  = this._barX;
      this._indicatorDir = 1;
    }

    this._indicator.setX(this._indicatorX);
  }

  _onAction() {
    if (!this._alive || this._inputCooldown || this._dialog.isVisible()) return;
    this._inputCooldown = true;
    this._showFeedback(this._isInGoldZone());
  }

  _isInGoldZone() {
    const ix   = this._indicatorX;
    const gz   = this._goldZone;
    const left  = gz.x - gz.width / 2;
    const right = gz.x + gz.width / 2;
    return ix >= left && ix <= right;
  }

  _showFeedback(hit) {
    const comment = Phaser.Math.RND.pick(hit ? SUCCESS_COMMENTS : FAIL_COMMENTS);
    const flashHex = hit ? COLORS.SUCCESS_BRIGHT : COLORS.DANGER_BRIGHT;
    this.cameras.main.flash(200, ...this._hexToRGB(flashHex), true);

    this.tweens.add({
      targets: this._indicator,
      alpha: 0, duration: 80, yoyo: true, repeat: 2,
    });

    this._dialog.show(comment, () => {
      if (hit) this._nextLevel();
      else     this._endGame();
    }, "Examinador Rotval");
  }

  _nextLevel() {
    this._score = this._currentLevel;
    if (this._currentLevel >= this._maxLevels) { this._score = 20; this._endGame(true); return; }
    this._currentLevel++;
    this.cameras.main.flash(150, 255, 255, 255, true);
    this.time.delayedCall(TIMING.COOLDOWN_AFTER_RESULT, () => this._startLevel());
  }

  _endGame(perfect = false) {
    this._alive = false;
    const finalScore = this._score;
    const msg = perfect
      ? `PERFECTO. ${finalScore}/20.\nEl Tribunal desconfía profundamente.`
      : `FIN DE LA PRUEBA\n\nPuntuacion: ${finalScore} / 20\n${getVerdict(finalScore)}`;

    this._dialog.show(msg, () => this._returnToReport(finalScore), "Examinador Rotval");
  }

  _returnToReport(score) {
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      this.scene.start(SCENES.GUILD_REPORT, {
        challenge: this._challenge,
        score,
        sheet: this._sheetData,
      });
    });
  }

  _hexToRGB(hex) {
    return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
  }
}
