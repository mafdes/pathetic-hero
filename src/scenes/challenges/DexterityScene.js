/**
 * DexterityScene.js — Prueba de Destreza del Gremio
 *
 * Mecánica: Barra de precisión horizontal con indicador en movimiento constante.
 * Objetivo: Pulsa cuando el cursor cruce la zona dorada.
 * Dificultad: La zona dorada encoge, acelera y añade señuelos en niveles altos.
 *
 * Escala 0-20: cada nivel se evalúa una vez. La puntuación final es el nivel
 * máximo alcanzado antes de fallar (o 20 si completa todos).
 *
 * Al terminar, llama a GuildReportScene pasando { challenge, score }.
 */

import * as Phaser from "phaser";
import {
  COLORS, FONTS, SCENES, TIMING, DEPTHS, CHALLENGES,
} from "../../utils/constants.js";
import { DialogBox } from "../../ui/DialogBox.js";
import { getVerdict } from "../../utils/helpers.js";

// Comentarios sarcásticos del Examinador al fallar
const FAIL_COMMENTS = [
  "Impresionante. Incluso los ciegos lo hacen mejor.",
  "¿Estás seguro de que tienes manos?",
  "Eso no fue un intento. Eso fue un insulto.",
  "Mi abuela con artritis supera eso. Estaba muerta.",
  "El Tribunal anota: coordinación nula.",
];

// Comentarios al acertar
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
    this._challenge = data?.challenge ?? CHALLENGES.DEXTERITY;
    this._sheetData = data?.sheet ?? null;

    // Estado de la prueba
    this._currentLevel = 1;
    this._maxLevels = 20;
    this._alive = true;
    this._inputCooldown = false;
    this._score = 0;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(COLORS.BG_DEEP);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // ── HUD superior ──────────────────────────────────────────────────────────
    this.add.rectangle(W / 2, 8, W, 16, COLORS.UI_PANEL, 0.9)
      .setDepth(DEPTHS.UI_BG);

    this.add.text(8, 8, "PRUEBA: DESTREZA", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "5px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0, 0.5).setDepth(DEPTHS.UI);

    this._levelText = this.add.text(W - 8, 8, "NIVEL 1 / 20", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "5px",
      color: "#f0e6d3",
      resolution: 2,
    }).setOrigin(1, 0.5).setDepth(DEPTHS.UI);

    // ── Descripción ───────────────────────────────────────────────────────────
    this.add.text(W / 2, 28, "PULSA cuando el cursor cruce la zona dorada", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "4px",
      color: "#6a4e8a",
      resolution: 2,
      align: "center",
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── Área de la barra ──────────────────────────────────────────────────────
    const barY = H / 2;
    const barW = W - 40;
    const barH = 14;
    const barX = 20;

    // Marco de la barra
    this.add.rectangle(W / 2, barY, barW, barH, COLORS.BG_STONE, 1)
      .setStrokeStyle(1, COLORS.GOLD_DARK)
      .setDepth(DEPTHS.UI_BG);

    // Zona dorada (objetivo)
    this._goldZone = this.add.rectangle(W / 2, barY, 0, barH - 2, COLORS.GOLD, 0.5)
      .setDepth(DEPTHS.UI);

    // Señuelo izquierdo (aparece en niveles altos)
    this._decoyLeft = this.add.rectangle(0, barY, 0, barH - 2, COLORS.DANGER, 0.4)
      .setDepth(DEPTHS.UI)
      .setVisible(false);

    // Señuelo derecho
    this._decoyRight = this.add.rectangle(0, barY, 0, barH - 2, COLORS.DANGER, 0.4)
      .setDepth(DEPTHS.UI)
      .setVisible(false);

    // Indicador (cursor que se mueve)
    this._indicator = this.add.rectangle(barX, barY, 4, barH, COLORS.WHITE, 1)
      .setDepth(DEPTHS.UI);

    // Guardar referencias de la barra
    this._barX = barX;
    this._barW = barW;
    this._barY = barY;
    this._barH = barH;

    // ── Diálogo del Examinador ────────────────────────────────────────────────
    this._dialog = new DialogBox(this, {
      y: H - 50,
      height: 40,
      speaker: "Examinador Rotval",
    });

    // ── Input ─────────────────────────────────────────────────────────────────
    this.input.keyboard?.on("keydown-SPACE", () => this._onAction());
    this.input.keyboard?.on("keydown-Z", () => this._onAction());
    this.input.on("pointerdown", () => this._onAction());

    // ── Iniciar nivel 1 ───────────────────────────────────────────────────────
    this.time.delayedCall(300, () => this._startLevel());
  }

  _getLevelConfig(level) {
    // Cuanto mayor el nivel, más difícil:
    const t = (level - 1) / 19; // 0 en nivel 1, 1 en nivel 20

    const barW = this._barW;
    const goldWidth = Math.max(8, Math.round(barW * 0.22 - t * barW * 0.15)); // 22% → 7%
    const speed = 60 + t * 180; // px/s: 60 → 240
    const hasDecoys = level >= 8;
    const goldOffset = level >= 5
      ? Phaser.Math.Between(-Math.floor(barW * 0.2), Math.floor(barW * 0.2))
      : 0;

    return { goldWidth, speed, hasDecoys, goldOffset };
  }

  _startLevel() {
    if (!this._alive) return;

    const { goldWidth, speed, hasDecoys, goldOffset } = this._getLevelConfig(this._currentLevel);
    const cx = this.scale.width / 2;

    // Posicionar zona dorada
    const goldX = cx + goldOffset;
    this._goldZone.setX(goldX).setWidth(goldWidth);

    // Señuelos
    if (hasDecoys) {
      const decoyW = Math.max(6, goldWidth - 4);
      const decoyOffsetLeft = -this._barW * 0.3;
      const decoyOffsetRight = this._barW * 0.3;
      this._decoyLeft
        .setX(cx + decoyOffsetLeft)
        .setWidth(decoyW)
        .setVisible(true);
      this._decoyRight
        .setX(cx + decoyOffsetRight)
        .setWidth(decoyW)
        .setVisible(true);
    } else {
      this._decoyLeft.setVisible(false);
      this._decoyRight.setVisible(false);
    }

    // Reiniciar posición del cursor
    this._indicatorX = this._barX;
    this._indicatorDir = 1;
    this._speed = speed;
    this._inputCooldown = false;

    // Actualizar HUD
    this._levelText.setText(`NIVEL ${this._currentLevel} / 20`);
  }

  update(time, delta) {
    if (!this._alive || this._dialog.isVisible()) return;

    // Mover el indicador
    const dt = delta / 1000;
    this._indicatorX += this._speed * this._indicatorDir * dt;

    // Rebotar en los extremos
    if (this._indicatorX >= this._barX + this._barW - 2) {
      this._indicatorX = this._barX + this._barW - 2;
      this._indicatorDir = -1;
    } else if (this._indicatorX <= this._barX) {
      this._indicatorX = this._barX;
      this._indicatorDir = 1;
    }

    this._indicator.setX(this._indicatorX);
  }

  _onAction() {
    if (!this._alive || this._inputCooldown || this._dialog.isVisible()) return;
    this._inputCooldown = true;

    const hit = this._isInGoldZone();
    this._showFeedback(hit);
  }

  _isInGoldZone() {
    const ix = this._indicatorX;
    const gz = this._goldZone;
    const left = gz.x - gz.width / 2;
    const right = gz.x + gz.width / 2;
    return ix >= left && ix <= right;
  }

  _showFeedback(hit) {
    const comment = hit
      ? Phaser.Math.RND.pick(SUCCESS_COMMENTS)
      : Phaser.Math.RND.pick(FAIL_COMMENTS);

    // Flash de color
    const flashColor = hit ? COLORS.SUCCESS_BRIGHT : COLORS.DANGER_BRIGHT;
    this.cameras.main.flash(200, ...this._hexToRGB(flashColor), true);

    // Parpadeo del indicador
    this.tweens.add({
      targets: this._indicator,
      alpha: 0,
      duration: 80,
      yoyo: true,
      repeat: 2,
    });

    this._dialog.show(comment, () => {
      if (hit) {
        this._nextLevel();
      } else {
        this._endGame();
      }
    }, "Examinador Rotval");
  }

  _nextLevel() {
    this._score = this._currentLevel;

    if (this._currentLevel >= this._maxLevels) {
      // ¡Completado con puntuación perfecta!
      this._score = 20;
      this._endGame(true);
      return;
    }

    this._currentLevel++;

    // Transición entre niveles
    this.cameras.main.flash(150, 255, 255, 255, true);
    this.time.delayedCall(TIMING.COOLDOWN_AFTER_RESULT, () => {
      this._startLevel();
    });
  }

  _endGame(perfect = false) {
    this._alive = false;
    const finalScore = this._score;

    const endMsg = perfect
      ? `PERFECTO. ${finalScore}/20. El Tribunal desconfía.`
      : `FIN DE LA PRUEBA.\nPuntuacion: ${finalScore} / 20\n${getVerdict(finalScore)}`;

    this._dialog.show(endMsg, () => {
      this._returnToReport(finalScore);
    }, "Examinador Rotval");
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

  /** Convierte color hexadecimal 0xRRGGBB a array [r, g, b] (0-255) */
  _hexToRGB(hex) {
    return [
      (hex >> 16) & 0xff,
      (hex >> 8) & 0xff,
      hex & 0xff,
    ];
  }
}
